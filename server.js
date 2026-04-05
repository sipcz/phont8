const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const helmet = require('helmet');
const path = require('path');

const app = express();

// ФІКС БЕЗПЕКИ: Вимикаємо CSP, щоб він не блокував WebRTC
app.use(helmet({ contentSecurityPolicy: false }));

// ФІКС ПАПКИ: Кажемо серверу шукати всі файли у папці "public"
app.use(express.static(path.join(__dirname, 'public')));

// БРОНЕБІЙНИЙ РОУТИНГ: Примусово віддаємо index.html з папки "public"
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = http.createServer(app);

// Ліміт на розмір повідомлення: 50 КБ
const wss = new WebSocket.Server({ server, maxPayload: 50 * 1024 });

const clients = new Map();

// 🔥 ФІКС 1: Механізм Heartbeat для вбивства "Зомбі-з'єднань"
const heartbeatInterval = setInterval(function ping() {
    clients.forEach(function each(clientData, userNum) {
        if (clientData.isAlive === false) {
            // Клієнт не відповів на минулий пінг, вважаємо його "мертвим"
            clients.delete(userNum);
            broadcastUserCount();
            return clientData.ws.terminate(); 
        }
        clientData.isAlive = false;
        clientData.ws.ping(); // Відправляємо стандартний WebSockets Ping
    });
}, 20000); // Перевірка кожні 20 секунд

wss.on('connection', (ws, req) => {
    let userNum = null;
    let msgCount = 0;

    // Анти-Спам
    const rateLimit = setInterval(() => { msgCount = 0; }, 1000);

    // Ініціалізація статусу життя для нового з'єднання
    ws.isAlive = true;
    ws.on('pong', () => {
        // Клієнт відповів на ping сервера
        if (userNum && clients.has(userNum)) {
            clients.get(userNum).isAlive = true;
        }
    });

    ws.on('message', (message) => {
        msgCount++;
        if (msgCount > 25) { ws.close(1008, "Rate Limit Exceeded"); return; }

        // Будь-яке повідомлення означає, що клієнт живий
        if (userNum && clients.has(userNum)) {
            clients.get(userNum).isAlive = true;
        }

        try {
            // Безпечне читання даних
            const data = JSON.parse(message.toString());
            
            if (data.type === 'register') {
                if (data.number && data.number !== "null") {
                    userNum = data.number;
                } else {
                    userNum = Math.floor(10000 + Math.random() * 90000).toString();
                }
                // Зберігаємо не просто ws, а об'єкт з isAlive
                clients.set(userNum, { ws: ws, isAlive: true });
                ws.send(JSON.stringify({ type: 'your_number', number: userNum }));
                broadcastUserCount();
            } else if (data.type === 'ping') {
                // Keep-alive від клієнта (додаткова страховка)
            } else if (data.to) {
                const targetData = clients.get(data.to);
                if (targetData && targetData.ws.readyState === WebSocket.OPEN) {
                    data.from = userNum;
                    targetData.ws.send(JSON.stringify(data));
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

wss.on('close', function close() {
    clearInterval(heartbeatInterval);
});

function broadcastUserCount() {
    const count = clients.size;
    clients.forEach(clientData => {
        if (clientData.ws.readyState === WebSocket.OPEN) {
            clientData.ws.send(JSON.stringify({ type: 'user_count', count }));
        }
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`DRESDEN Server running on port ${PORT}`));
