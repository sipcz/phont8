import express from "express";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const server = app.listen(process.env.PORT || 3000, () => console.log("🚀 DRESDEN BASE ONLINE"));

const wss = new WebSocketServer({ server });
const clients = new Map();

function broadcastUserCount() {
    const msg = JSON.stringify({ type: "user_count", count: clients.size });
    wss.clients.forEach(c => { if (c.readyState === 1) c.send(msg); });
}

wss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.on("pong", () => ws.isAlive = true);

    ws.on("message", (raw) => {
        try {
            const data = JSON.parse(raw);
            if (data.type === "register") {
                let num = data.number || String(Math.floor(100000 + Math.random() * 900000));
                
                // Видаляємо фантомні підключення з тим самим ID
                if (clients.has(num)) {
                    const oldWs = clients.get(num);
                    if (oldWs !== ws) {
                        oldWs.number = null; 
                        oldWs.terminate(); 
                        clients.delete(num);
                    }
                }

                ws.number = num;
                clients.set(num, ws);
                ws.send(JSON.stringify({ type: "your_number", number: num }));
                broadcastUserCount();
                return;
            }

            const target = clients.get(data.to);
            if (!target || target.readyState !== 1) {
                if (data.type === "call" || data.type === "offer") {
                    ws.send(JSON.stringify({ type: "peer_offline", target: data.to }));
                }
                return;
            }
            target.send(JSON.stringify({ ...data, from: ws.number }));
        } catch (e) {}
    });

    ws.on("close", () => {
        if (ws.number) { clients.delete(ws.number); broadcastUserCount(); }
    });
});

// Watchdog: очищення мертвих сокетів кожні 30 сек
setInterval(() => {
    wss.clients.forEach(ws => {
        if (!ws.isAlive) {
            if (ws.number) clients.delete(ws.number);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);
