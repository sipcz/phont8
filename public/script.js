// DRESDEN TACTICAL v27.1 – script.js

let pass = "";
let ws = null;
let pc = null;
let dc = null;
let stream = null;
let remoteNum = null;

let cryptoKey = null;
let iceQueue = [];
let pendingOffer = null;

let isBusy = false;
let callId = null;
let callTimeout = null;
let reconnectAttempts = 0;
let watchdogInterval = null;
let lastIceStateChange = null;

let isMuted = false;

let incomingFile = { name: "", chunks: [], total: 0, received: 0 };
let incomingImg = { name: "", mime: "", chunks: [], size: 0, received: 0 };

const ringtone = new Audio("ringtone.mp3");
ringtone.loop = true;

const servers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
            urls: ["turn:openrelay.metered.ca:443?transport=tcp"],
            username: "openrelayproject",
            credential: "openrelayproject"
        }
    ],
    iceCandidatePoolSize: 20,
    bundlePolicy: "max-bundle",
    iceTransportPolicy: "all"
};

function setStatus(text, color) {
    const st = document.getElementById("status");
    if (!st) return;
    st.textContent = text;
    if (color) st.style.color = color;
}

function resetCallState() {
    if (callTimeout) { clearTimeout(callTimeout); callTimeout = null; }
    if (watchdogInterval) { clearInterval(watchdogInterval); watchdogInterval = null; }

    if (pc) {
        try { pc.close(); } catch {}
        pc = null;
    }

    if (stream) {
        try { stream.getTracks().forEach(t => t.stop()); } catch {}
        stream = null;
    }

    dc = null;
    iceQueue = [];
    pendingOffer = null;
    reconnectAttempts = 0;
    callId = null;
    remoteNum = null;
    isBusy = false;
    lastIceStateChange = null;
    isMuted = false;

    const audio = document.getElementById("audio");
    if (audio) audio.srcObject = null;

    const remoteIdDisplay = document.getElementById("remoteIdDisplay");
    if (remoteIdDisplay) remoteIdDisplay.textContent = "...";

    const activeCallUI = document.getElementById("activeCallUI");
    const dialerUI = document.getElementById("dialerUI");
    const vizContainer = document.getElementById("vizContainer");
    const fileProgress = document.getElementById("fileProgress");
    const progBar = document.getElementById("progBar");

    if (activeCallUI) activeCallUI.classList.add("hidden");
    if (dialerUI) dialerUI.classList.remove("hidden");
    if (vizContainer) vizContainer.classList.add("hidden");
    if (fileProgress) fileProgress.classList.add("hidden");
    if (progBar) progBar.style.width = "0%";

    const muteBtn = document.getElementById("muteBtn");
    if (muteBtn) muteBtn.textContent = "🎙 MIC: ON";

    const incomingUI = document.getElementById("incomingUI");
    if (incomingUI) incomingUI.classList.add("hidden");

    ringtone.pause();
    setStatus("READY", "#39FF14");
}

function forceHangup() {
    if (ws && remoteNum) {
        try {
            ws.send(JSON.stringify({ type: "hangup", to: remoteNum }));
        } catch {}
    }
    resetCallState();
}

async function getK() {
    if (cryptoKey) return cryptoKey;
    const enc = new TextEncoder();
    const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
    cryptoKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: enc.encode("DRESDEN_V27.1_SALT"), iterations: 100000, hash: "SHA-256" },
        base,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
    return cryptoKey;
}

async function encrypt(d) {
    const k = await getK();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const c = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        k,
        new TextEncoder().encode(JSON.stringify(d))
    );
    return { iv: Array.from(iv), data: Array.from(new Uint8Array(c)) };
}

async function decrypt(ed) {
    try {
        const k = await getK();
        const d = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(ed.iv) },
            k,
            new Uint8Array(ed.data)
        );
        return JSON.parse(new TextDecoder().decode(d));
    } catch (e) {
        console.warn("[CRYPTO] decrypt failed", e);
        return null;
    }
}

function initWS() {
    if (ws) {
        try { ws.close(); } catch {}
    }

    ws = new WebSocket("wss://phone-ob0c.onrender.com");

    const lostLinkUI = document.getElementById("lostLinkUI");

    const pinger = setInterval(() => {
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: "ping" }));
        }
    }, 12000);

    ws.onopen = () => {
        const myId = localStorage.getItem("my_id");
        ws.send(JSON.stringify({ type: "register", number: myId }));
        if (lostLinkUI) lostLinkUI.classList.add("hidden");
    };

    ws.onclose = () => {
        clearInterval(pinger);
        setStatus("LINK LOST", "#ff3b30");
        if (lostLinkUI) lostLinkUI.classList.remove("hidden");
        setTimeout(() => {
            initWS();
        }, 3000);
    };

    ws.onmessage = async (e) => {
        let d = JSON.parse(e.data);

        if (d.type === "user_count") {
            const uc = document.getElementById("userCount");
            if (uc) uc.textContent = d.count;
            return;
        }

        if (d.type === "your_number") {
            localStorage.setItem("my_id", d.number);
            const myNum = document.getElementById("myNum");
            if (myNum) myNum.textContent = d.number;
            return;
        }

        if (d.payload) {
            const r = await decrypt(d.payload);
            if (r) d = { ...d, ...r };
        }

        switch (d.type) {
            case "call": {
                if (isBusy) {
                    ws.send(JSON.stringify({
                        type: "busy",
                        to: d.from,
                        forCall: d.callId
                    }));
                    return;
                }
                callId = d.callId;
                remoteNum = d.from;
                isBusy = true;

                const callerId = document.getElementById("callerId");
                const incomingPaging = document.getElementById("incomingPaging");
                const incomingUI = document.getElementById("incomingUI");

                if (callerId) callerId.textContent = d.from || "...";
                if (incomingPaging) incomingPaging.textContent = d.msg || "";
                if (incomingUI) incomingUI.classList.remove("hidden");

                ringtone.play().catch(() => {});
                setStatus("INCOMING", "#FFD60A");
                break;
            }

            case "busy": {
                if (callId === d.forCall) {
                    alert("Абонент зайнятий");
                    resetCallState();
                }
                break;
            }

            case "offer": {
                pendingOffer = d.offer;
                break;
            }

            case "answer": {
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(d.answer));
                    for (const c of iceQueue) {
                        try { await pc.addIceCandidate(c); } catch {}
                    }
                    iceQueue = [];
                }
                break;
            }

            case "ice": {
                const cand = new RTCIceCandidate(d.cand);
                if (pc && pc.remoteDescription) {
                    pc.addIceCandidate(cand).catch(() => {});
                } else {
                    iceQueue.push(cand);
                }
                break;
            }

            case "hangup": {
                resetCallState();
                break;
            }
        }
    };
}

async function startHardware() {
    isBusy = true;

    stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
    });

    pc = new RTCPeerConnection(servers);
    lastIceStateChange = Date.now();

    pc.oniceconnectionstatechange = () => {
        const s = pc.iceConnectionState;
        lastIceStateChange = Date.now();
        setStatus(s.toUpperCase(), s === "connected" || s === "completed" ? "#39FF14" : "#FFD60A");

        if (s === "connected" || s === "completed") {
            reconnectAttempts = 0;
            if (callTimeout) {
                clearTimeout(callTimeout);
                callTimeout = null;
            }
        } else if (s === "disconnected" || s === "failed") {
            setStatus("LINK ISSUE", "#ff3b30");
            if (reconnectAttempts < 3) {
                reconnectAttempts++;
                try { pc.restartIce(); } catch (e) {}
            } else {
                resetCallState();
            }
        }
    };

    pc.onicecandidate = async (e) => {
        if (e.candidate && ws && ws.readyState === 1 && remoteNum) {
            ws.send(JSON.stringify({
                type: "ice",
                to: remoteNum,
                payload: await encrypt({ cand: e.candidate })
            }));
        }
    };

    pc.ontrack = (e) => {
        const audio = document.getElementById("audio");
        if (audio) {
            audio.srcObject = e.streams[0];
            audio.play().catch(() => {
                document.addEventListener("click", () => audio.play(), { once: true });
            });
        }
        startViz(e.streams[0], "remoteViz");
    };

    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    startViz(stream, "localViz");

    watchdogInterval = setInterval(() => {
        if (!pc) return;
        const s = pc.iceConnectionState;
        if (!s || s === "closed") return;

        const now = Date.now();
        const diff = now - (lastIceStateChange || now);

        if ((s === "new" || s === "checking" || s === "disconnected" || s === "failed") && diff > 25000) {
            resetCallState();
        }
    }, 5000);
}

async function handleFileMessage(d) {
    if (d.type === "file_start") {
        incomingFile = { name: d.name, chunks: [], total: d.total, received: 0 };
        const fileProgress = document.getElementById("fileProgress");
        const progBar = document.getElementById("progBar");
        if (fileProgress) fileProgress.classList.remove("hidden");
        if (progBar) progBar.style.width = "0%";
        return;
    }

    if (d.type === "file_chunk") {
        const chunk = new Uint8Array(d.chunk);
        incomingFile.chunks.push(chunk);
        incomingFile.received += chunk.length;

        const fileProgress = document.getElementById("fileProgress");
        const progBar = document.getElementById("progBar");
        if (fileProgress && progBar && incomingFile.total > 0) {
            const p = Math.min(100, Math.floor((incomingFile.received / incomingFile.total) * 100));
            progBar.style.width = p + "%";
        }
        return;
    }

    if (d.type === "file_end") {
        const blob = new Blob(incomingFile.chunks);
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = incomingFile.name || "file";
        a.click();

        appendMsg("📄 File received: " + (incomingFile.name || "file"), "peer");

        incomingFile = { name: "", chunks: [], total: 0, received: 0 };

        const fileProgress = document.getElementById("fileProgress");
        const progBar = document.getElementById("progBar");
        if (fileProgress) fileProgress.classList.add("hidden");
        if (progBar) progBar.style.width = "0%";
    }
}

async function sendFile(f) {
    if (!dc || dc.readyState !== "open") return;

    const chunkSize = 16 * 1024;
    const reader = new FileReader();

    reader.onload = async () => {
        const buffer = reader.result;
        const total = buffer.byteLength;

        dc.send(JSON.stringify(await encrypt({ type: "file_start", name: f.name, total })));

        for (let offset = 0; offset < total; offset += chunkSize) {
            const chunk = buffer.slice(offset, offset + chunkSize);
            dc.send(JSON.stringify(await encrypt({
                type: "file_chunk",
                chunk: Array.from(new Uint8Array(chunk))
            })));
        }

        dc.send(JSON.stringify(await encrypt({ type: "file_end" })));
        appendMsg("📄 File sent: " + f.name, "self");
    };

    reader.readAsArrayBuffer(f);
}

async function sendImage(file) {
    if (!dc || dc.readyState !== "open") return;

    const reader = new FileReader();

    reader.onload = async () => {
        const arrayBuffer = reader.result;
        const bytes = Array.from(new Uint8Array(arrayBuffer));

        dc.send(JSON.stringify(await encrypt({
            type: "img_start",
            name: file.name,
            mime: file.type,
            size: bytes.length
        })));

        const chunkSize = 16 * 1024;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, i + chunkSize);
            dc.send(JSON.stringify(await encrypt({
                type: "img_chunk",
                chunk
            })));
        }

        dc.send(JSON.stringify(await encrypt({ type: "img_end" })));

        const previewReader = new FileReader();
        previewReader.onload = () => {
            appendImage(previewReader.result, "self");
        };
        previewReader.readAsDataURL(file);
    };

    reader.readAsArrayBuffer(file);
}

async function handleImageMessage(d) {
    if (d.type === "img_start") {
        incomingImg = { name: d.name, mime: d.mime, chunks: [], size: d.size, received: 0 };
        const fileProgress = document.getElementById("fileProgress");
        const progBar = document.getElementById("progBar");
        if (fileProgress) fileProgress.classList.remove("hidden");
        if (progBar) progBar.style.width = "0%";
        return;
    }

    if (d.type === "img_chunk") {
        const chunk = new Uint8Array(d.chunk);
        incomingImg.chunks.push(chunk);
        incomingImg.received += chunk.length;

        const fileProgress = document.getElementById("fileProgress");
        const progBar = document.getElementById("progBar");
        if (fileProgress && progBar && incomingImg.size > 0) {
            const p = Math.min(100, Math.floor((incomingImg.received / incomingImg.size) * 100));
            progBar.style.width = p + "%";
        }
        return;
    }

    if (d.type === "img_end") {
        const blob = new Blob(incomingImg.chunks, { type: incomingImg.mime });
        const url = URL.createObjectURL(blob);

        appendImage(url, "peer");

        incomingImg = { name: "", mime: "", chunks: [], size: 0, received: 0 };

        const fileProgress = document.getElementById("fileProgress");
        const progBar = document.getElementById("progBar");
        if (fileProgress) fileProgress.classList.add("hidden");
        if (progBar) progBar.style.width = "0%";
    }
}

function setupDC(channel) {
    dc = channel;

    dc.onopen = () => {
        const dialerUI = document.getElementById("dialerUI");
        const activeCallUI = document.getElementById("activeCallUI");
        const vizContainer = document.getElementById("vizContainer");

        if (dialerUI) dialerUI.classList.add("hidden");
        if (activeCallUI) activeCallUI.classList.remove("hidden");
        if (vizContainer) vizContainer.classList.remove("hidden");

        setStatus("CONNECTED", "#39FF14");
    };

    dc.onmessage = async (e) => {
        let parsed;
        try {
            parsed = JSON.parse(e.data);
        } catch {
            return;
        }
        const d = await decrypt(parsed);
        if (!d) return;

        if (d.type === "msg") appendMsg(d.txt, "peer");
        if (d.type.startsWith("file_")) handleFileMessage(d);
        if (d.type.startsWith("img_")) handleImageMessage(d);
    };

    dc.onclose = () => {
        if (pc && pc.connectionState === "connected") {
            const newDC = pc.createDataChannel("secureData");
            setupDC(newDC);
        }
    };
}

function startViz(s, id) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        ctx.createMediaStreamSource(s).connect(analyser);
        analyser.fftSize = 32;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const canv = document.getElementById(id);
        if (!canv) return;
        const cctx = canv.getContext("2d");

        function draw() {
            if (!pc || pc.iceConnectionState === "closed") return;
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(data);
            cctx.clearRect(0, 0, canv.width, canv.height);
            data.forEach((v, i) => {
                cctx.fillStyle = "#39FF14";
                cctx.fillRect(i * 10, canv.height - v / 5, 6, v / 5);
            });
        }

        document.addEventListener("click", () => ctx.resume(), { once: true });
        draw();
    } catch (e) {}
}

function toggleMute() {
    if (!stream) return;
    isMuted = !isMuted;
    stream.getAudioTracks().forEach(t => t.enabled = !isMuted);

    const muteBtn = document.getElementById("muteBtn");
    if (muteBtn) muteBtn.textContent = isMuted ? "🎙 MIC: OFF" : "🎙 MIC: ON";
}

async function recoverConnection() {
    if (!pc) return;

    if (pc.iceConnectionState !== "failed" && pc.iceConnectionState !== "closed") {
        try {
            pc.restartIce();
        } catch (e) {
            console.warn("[NET] restartIce failed", e);
        }
    }

    if (!dc || dc.readyState !== "open") {
        const newDC = pc.createDataChannel("secureData");
        setupDC(newDC);
    }

    if (pc.iceConnectionState === "failed") {
        try {
            const offer = await pc.createOffer({ iceRestart: true });
            await pc.setLocalDescription(offer);
            if (ws && ws.readyState === 1 && remoteNum) {
                ws.send(JSON.stringify({
                    type: "offer",
                    to: remoteNum,
                    payload: await encrypt({ offer })
                }));
            }
        } catch (e) {
            console.warn("[NET] renegotiation failed", e);
        }
    }
}

function initNetworkWatcher() {
    if (navigator.connection) {
        navigator.connection.addEventListener("change", () => {
            recoverConnection();
        });
    }

    window.addEventListener("online", () => {
        recoverConnection();
    });

    window.addEventListener("offline", () => {
        console.log("[NET] offline");
    });

    setInterval(() => {
        if (!ws || ws.readyState !== 1) {
            initWS();
        }
    }, 5000);
}

function initDragAndDrop() {
    const zone = document.getElementById("chatMessages");
    if (!zone) return;

    zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("drag-over");
    });

    zone.addEventListener("dragleave", () => {
        zone.classList.remove("drag-over");
    });

    zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("drag-over");

        const file = e.dataTransfer.files[0];
        if (!file) return;

        if (file.type.startsWith("image/")) {
            sendImage(file);
        } else {
            sendFile(file);
        }
    });
}

function appendMsg(t, cls) {
    const d = document.createElement("div");
    d.className = `msg ${cls}`;
    d.textContent = t;
    const chat = document.getElementById("chatMessages");
    if (chat) {
        chat.appendChild(d);
        chat.scrollTop = chat.scrollHeight;
    }
}

function appendImage(url, cls) {
    const d = document.createElement("div");
    d.className = `msg ${cls}`;

    const img = document.createElement("img");
    img.src = url;
    img.style.maxWidth = "200px";
    img.style.borderRadius = "6px";

    d.appendChild(img);
    const chat = document.getElementById("chatMessages");
    if (chat) {
        chat.appendChild(d);
        chat.scrollTop = chat.scrollHeight;
    }
}

// UI BINDINGS

document.getElementById("startBtn").onclick = () => {
    pass = document.getElementById("passInput").value.trim();
    if (pass.length < 4) {
        alert("KEY TOO SHORT");
        return;
    }

    const loginScreen = document.getElementById("loginScreen");
    const mainApp = document.getElementById("mainApp");
    if (loginScreen) loginScreen.classList.add("hidden");
    if (mainApp) mainApp.classList.remove("hidden");

    setStatus("READY", "#39FF14");

    initWS();
    initNetworkWatcher();
    initDragAndDrop();
};

document.getElementById("callBtn").onclick = async () => {
    const tNum = document.getElementById("targetNum").value.trim();
    if (!tNum) return;

    const myNum = localStorage.getItem("my_id");

    if (tNum === myNum) {
        alert("Ви не можете дзвонити самому собі — ЗАНЯТО");
        return;
    }

    if (isBusy) {
        alert("Ви вже говорите — ЗАНЯТО");
        return;
    }

    callId = Math.random().toString(36).substring(7);
    remoteNum = tNum;

    const remoteIdDisplay = document.getElementById("remoteIdDisplay");
    if (remoteIdDisplay) remoteIdDisplay.textContent = tNum;

    callTimeout = setTimeout(() => {
        if (!pc || (pc.iceConnectionState !== "connected" && pc.iceConnectionState !== "completed")) {
            alert("Немає відповіді");
            resetCallState();
        }
    }, 30000);

    const msg = document.getElementById("preCallMsg").value;

    ws.send(JSON.stringify({
        type: "call",
        to: remoteNum,
        payload: await encrypt({
            type: "call",
            msg,
            callId
        })
    }));

    await startHardware();

    const channel = pc.createDataChannel("secureData");
    setupDC(channel);

    setTimeout(async () => {
        if (!pc) return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ws.send(JSON.stringify({
            type: "offer",
            to: remoteNum,
            payload: await encrypt({ offer })
        }));
    }, 1500);
};

document.getElementById("acceptBtn").onclick = async () => {
    ringtone.pause();
    const incomingUI = document.getElementById("incomingUI");
    if (incomingUI) incomingUI.classList.add("hidden");

    const remoteIdDisplay = document.getElementById("remoteIdDisplay");
    if (remoteIdDisplay) remoteIdDisplay.textContent = remoteNum || "...";

    await startHardware();

    pc.ondatachannel = (e) => setupDC(e.channel);

    if (pendingOffer) {
        await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));
        pendingOffer = null;

        for (const c of iceQueue) {
            try { await pc.addIceCandidate(c); } catch {}
        }
        iceQueue = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({
            type: "answer",
            to: remoteNum,
            payload: await encrypt({ answer })
        }));
    }
};

document.getElementById("declineBtn").onclick = () => {
    ringtone.pause();
    const incomingUI = document.getElementById("incomingUI");
    if (incomingUI) incomingUI.classList.add("hidden");

    if (ws && remoteNum && callId) {
        ws.send(JSON.stringify({
            type: "busy",
            to: remoteNum,
            forCall: callId
        }));
    }
    resetCallState();
};

document.getElementById("hangBtn").onclick = () => {
    forceHangup();
};

document.getElementById("sendBtn").onclick = async () => {
    const input = document.getElementById("msgInput");
    if (!input) return;
    const txt = input.value.trim();
    if (!txt || !dc || dc.readyState !== "open") return;

    dc.send(JSON.stringify(await encrypt({ type: "msg", txt })));
    appendMsg(txt, "self");
    input.value = "";
};

document.getElementById("msgInput").addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById("sendBtn").click();
    }
});

const muteBtn = document.getElementById("muteBtn");
if (muteBtn) muteBtn.onclick = toggleMute;

const photoBtn = document.getElementById("photoBtn");
const fileInp = document.getElementById("fileInp");

if (photoBtn && fileInp) {
    photoBtn.onclick = () => {
        fileInp.click();
    };

    fileInp.onchange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        if (f.type.startsWith("image/")) {
            sendImage(f);
        } else {
            sendFile(f);
        }
        fileInp.value = "";
    };
}
