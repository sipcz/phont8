const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const helmet = require('helmet');
const path = require('path');

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, maxPayload: 50 * 1024 });

const clients = new Map();
const ipLimits = new Map(); // Карта для захисту від DoS
const MAX_CONNS_PER_IP = 5;

const heartbeatInterval = setInterval(function ping() {
    clients.forEach(function each(clientData, userNum) {
        if (clientData.isAlive === false) {
            clients.delete(userNum);
            broadcastUserCount();
            return clientData.ws.terminate(); 
        }
        clientData.isAlive = false;
        clientData.ws.ping(); 
    });
}, 20000); 

wss.on('connection', (ws, req) => {
    let userNum = null;
    let msgCount = 0;
    
    // Отримуємо IP (враховуючи проксі Render)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // ANTI-DOS: Обмеження кількості з'єднань з одного IP
    const currentConns = ipLimits.get(ip) || 0;
    if (currentConns >= MAX_CONNS_PER_IP) {
        ws.close(1008, "DoS Protection: Too many connections");
        return;
    }
    ipLimits.set(ip, currentConns + 1);

    const rateLimit = setInterval(() => { msgCount = 0; }, 1000);
    ws.isAlive = true;
    
    ws.on('pong', () => {
        if (userNum && clients.has(userNum)) clients.get(userNum).isAlive = true;
    });

    ws.on('message', (message) => {
        msgCount++;
        if (msgCount > 25) { ws.close(1008, "Rate Limit Exceeded"); return; }
        if (userNum && clients.has(userNum)) clients.get(userNum).isAlive = true;

        try {
            const data = JSON.parse(message.toString());
            
            if (data.type === 'register') {
                const deviceToken = data.token; // Отримуємо секретний токен клієнта
                
                if (data.number && data.number !== "null") {
                    // ANTI-HIJACK: Перевірка, чи не намагається хтось вкрасти номер
                    if (clients.has(data.number) && clients.get(data.number).token !== deviceToken) {
                        ws.send(JSON.stringify({ type: 'error', msg: 'HIJACK_BLOCKED' }));
                        ws.close(1008, "ID already in use by another device");
                        return;
                    }
                    userNum = data.number;
                } else {
                    userNum = Math.floor(10000 + Math.random() * 90000).toString();
                }
                
                // Зберігаємо ws, статус та токен
                clients.set(userNum, { ws: ws, isAlive: true, token: deviceToken });
                ws.send(JSON.stringify({ type: 'your_number', number: userNum }));
                broadcastUserCount();
                
            } else if (data.type === 'ping') {
                // Keep-alive
            } else if (data.to) {
                const targetData = clients.get(data.to);
                if (targetData && targetData.ws.readyState === WebSocket.OPEN) {
                    data.from = userNum;
                    targetData.ws.send(JSON.stringify(data));
                } else if (data.type !== 'ice_batch' && data.type !== 'ping' && data.type !== 'heartbeat') {
                    ws.send(JSON.stringify({ type: 'peer_offline', to: data.to }));
                }
            }
        } catch (e) {}
    });

    ws.on('close', () => {
        clearInterval(rateLimit);
        // Звільняємо ліміт IP
        const count = ipLimits.get(ip) || 1;
        if (count <= 1) ipLimits.delete(ip);
        else ipLimits.set(ip, count - 1);

        if (userNum) {
            // Видаляємо лише якщо це той самий клієнт (щоб хакер не міг закрити чужу сесію)
            if (clients.has(userNum) && clients.get(userNum).ws === ws) {
                clients.delete(userNum);
                broadcastUserCount();
            }
        }
    });
});

wss.on('close', () => clearInterval(heartbeatInterval));

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
