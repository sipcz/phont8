const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const helmet = require('helmet');
const path = require('path');

const app = express();

// ФІКС БЕЗПЕКИ: Вимикаємо CSP, щоб він не блокував WebRTC
app.use(helmet({ contentSecurityPolicy: false }));

// 🔥 ФІКС ПАПКИ: Кажемо серверу шукати всі файли (script.js, CSS) у папці "public"
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 БРОНЕБІЙНИЙ РОУТИНГ: Примусово віддаємо index.html з папки "public"
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = http.createServer(app);

// Ліміт на розмір повідомлення: 50 КБ
const wss = new WebSocket.Server({ server, maxPayload: 50 * 1024 });

const clients = new Map();

wss.on('connection', (ws, req) => {
    let userNum = null;
    let msgCount = 0;

    // Анти-Спам
    const rateLimit = setInterval(() => { msgCount = 0; }, 1000);

    ws.on('message', (message) => {
        msgCount++;
        if (msgCount > 25) { ws.close(1008, "Rate Limit Exceeded"); return; }

        try {
            // Безпечне читання даних
            const data = JSON.parse(message.toString());
            
            if (data.type === 'register') {
                // Захист від глюків з "null"
                if (data.number && data.number !== "null") {
                    userNum = data.number;
                } else {
                    userNum = Math.floor(10000 + Math.random() * 90000).toString();
                }
                clients.set(userNum, ws);
                ws.send(JSON.stringify({ type: 'your_number', number: userNum }));
                broadcastUserCount();
            } else if (data.type === 'ping') {
                // Keep-alive (підтримка з'єднання)
            } else if (data.to) {
                const targetWs = clients.get(data.to);
                if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                    data.from = userNum;
                    targetWs.send(JSON.stringify(data));
                } else if (data.type !== 'ice_batch' && data.type !== 'ping' && data.type !== 'heartbeat') {
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
