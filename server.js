const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const helmet = require('helmet');

const app = express();

// ФІКС БЕЗПЕКИ: Вимикаємо CSP в Helmet, щоб він не блокував наш інтерфейс та WebRTC
app.use(helmet({ contentSecurityPolicy: false }));

// ФІКС "Cannot GET /": Кажемо серверу віддавати файли index.html та script.js
app.use(express.static(__dirname));

const server = http.createServer(app);
// Ліміт на розмір повідомлення: 50 КБ (Захист від переповнення пам'яті)
const wss = new WebSocket.Server({ server, maxPayload: 50 * 1024 });

const clients = new Map();

wss.on('connection', (ws, req) => {
    let userNum = null;
    let msgCount = 0;

    // Анти-Спам: Обнулення лічильника щосекунди
    const rateLimit = setInterval(() => { msgCount = 0; }, 1000);

    ws.on('message', (message) => {
        msgCount++;
        // Якщо більше 25 пакетів на секунду - обриваємо з'єднання (Захист від DDoS)
        if (msgCount > 25) { ws.close(1008, "Rate Limit Exceeded"); return; }

        try {
            const data = JSON.parse(message);
            
            if (data.type === 'register') {
                userNum = data.number || Math.floor(10000 + Math.random() * 90000).toString();
                clients.set(userNum, ws);
                ws.send(JSON.stringify({ type: 'your_number', number: userNum }));
                broadcastUserCount();
            } else if (data.type === 'ping') {
                // Keep-alive для підтримки з'єднання
            } else if (data.to) {
                const targetWs = clients.get(data.to);
                if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                    data.from = userNum;
                    targetWs.send(JSON.stringify(data));
                } else if (data.type !== 'ice_batch' && data.type !== 'ping' && data.type !== 'heartbeat') {
                    // Якщо абонент не в мережі
                    ws.send(JSON.stringify({ type: 'peer_offline', to: data.to }));
                }
            }
        } catch (e) {
            // Ігноруємо невалідний JSON
        }
    });

    ws.on('close', () => {
        clearInterval(rateLimit);
        if (userNum) {
            clients.delete(userNum);
            broadcastUserCount();
        }
    });
});

function broadcastUserCount() {
    const count = clients.size;
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'user_count', count }));
        }
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`DRESDEN Server running on port ${PORT}`));
