/**
 * ============================================================
 * DRESDEN TACTICAL SYSTEM v140.0 [FINAL SECURE CORE + UI FIX]
 * STATUS: ANTI-HIJACK + ZERO-TRUST CRYPTO + DYNAMIC BWE
 * FIX: DOM SAFE SMS MODAL, APK MODALS, UI STYLING, SELF-CALL BLOCK
 * ============================================================
 */

"use strict";

let currentLang = 'ua';
try { currentLang = localStorage.getItem('dresden_lang') || 'ua'; } catch(e) {}

// 🔥 ПОВЕРНУТО ВСІ КЛЮЧІ ПЕРЕКЛАДУ
const DICT = {
    'ua': {
        online: "В МЕРЕЖІ", offline: "🔴 ОФЛАЙН", offline_err: "❌ ОФЛАЙН", ready: "ГОТОВО", busy: "📵 ЗАЙНЯТО", 
        secure_link: "✅ ЗАХИЩЕНО", timeout: "❌ ЧАС ВИЙШОВ", mic_error: "❌ ПОМИЛКА МІКРОФОНА", data_mode: "РЕЖИМ ДАНИХ", 
        sms_queued: "⏳ SMS В ЧЕРЗІ...", sms_delivered: "✅ SMS ДОСТАВЛЕНО", sms_read: "SMS ПРОЧИТАНО", 
        gps_search: "🛰 ПОШУК GPS...", no_gps: "❌ НЕМАЄ GPS", sync: "⏳ СИНХРОНІЗАЦІЯ...", failed: "❌ ПОМИЛКА", 
        dialing: "📡 ДЗВІНОК...", error: "❌ ПОМИЛКА", transfer: "ПЕРЕДАЧА", sending: "ВІДПРАВКА", receiving: "ОТРИМАННЯ", 
        app_locked: "ЗАБЛОКОВАНО", waiting_peer: "⏳ ЧЕКАЄМО АБОНЕНТА...", keygen_active: "ГЕНЕРАЦІЯ КЛЮЧА...", 
        keygen_fail: "ПОМИЛКА КЛЮЧА", enc_active: "ШИФРУВАННЯ АКТИВНЕ", 
        btn_lock: "БЛОК", btn_speaker: "🔊 ДИНАМІК", btn_earpiece: "📞 ДО ВУХА", btn_video_on: "🎥 ВІДЕО: УВІМК", 
        btn_chat_only: "🖂 ТІЛЬКИ ЧАТ", btn_audio_only: "📞 ТІЛЬКИ АУДІО", btn_mute_on: "🎤 УВІМК", btn_mute_muted: "🎤 ВИМК", 
        btn_tactical: "🎭 ТАКТИЧНИЙ", btn_normal: "🎭 НОРМАЛЬНИЙ", btn_stealth_on: "🛰 СТЕЛС: УВІМК", btn_stealth_off: "🛰 СТЕЛС: ВИМК", 
        push_inc_call: "ВХІДНИЙ ВИКЛИК", push_from: "Від", push_new_msg: "Нове повідомлення", push_sms_from: "SMS від", 
        mode_audio: "📞 АУДІО", mode_video: "🎥 ВІДЕО", mode_data: "🖂 ТІЛЬКИ ЧАТ", 
        ui_pass: "Пароль доступу", ui_start: "УВІЙТИ", ui_target: "Номер абонента", ui_call: "ДЗВІНОК", ui_sms_btn: "ВІДПРАВИТИ SMS", 
        ui_msg_inp: "Повідомлення...", ui_send: "НАДІСЛАТИ", ui_accept: "ПРИЙНЯТИ", ui_decline: "ВІДХИЛИТИ", ui_hang: "ЗАВЕРШИТИ", 
        ui_photo: "ФОТО", ui_geo: "ГЕО", ui_burn: "ЗНИЩИТИ", ui_pre_sms: "Текст SMS (Офлайн)...", ui_read_sms: "✉️ ВХІДНІ", 
        ui_burn_next: "ЗНИЩИТИ Й ДАЛІ", ui_burn_sms: "ЗНИЩИТИ SMS", pass_short: "ПАРОЛЬ < 8 СИМВОЛІВ!",
        ui_lbl_target: "🎯 ІДЕНТИФІКАТОР ЦІЛІ", ui_lbl_msg: "✉️ ПАКЕТ ДАНИХ (SMS)", ui_inc_link: "ВХІДНИЙ ЗВ'ЯЗОК"
    },
    'en': {
        online: "ONLINE", offline: "🔴 OFFLINE", offline_err: "❌ OFFLINE", ready: "READY", busy: "📵 BUSY", 
        secure_link: "✅ SECURE LINK", timeout: "❌ TIMEOUT", mic_error: "❌ MIC ERROR", data_mode: "DATA MODE", 
        sms_queued: "⏳ SMS QUEUED...", sms_delivered: "✅ SMS DELIVERED", sms_read: "SMS READ", 
        gps_search: "🛰 GPS SEARCH...", no_gps: "❌ NO GPS", sync: "⏳ SYNC...", failed: "❌ FAILED", 
        dialing: "📡 DIALING...", error: "❌ ERROR", transfer: "TRANSFER", sending: "SENDING", receiving: "RECEIVING", 
        app_locked: "APP LOCKED", waiting_peer: "⏳ WAITING PEER...", keygen_active: "KEYGEN ACTIVE...", 
        keygen_fail: "KEYGEN FAIL", enc_active: "ENCRYPTION ACTIVE", 
        btn_lock: "LOCK", btn_speaker: "🔊 SPEAKER", btn_earpiece: "📞 EARPIECE", btn_video_on: "🎥 VIDEO: ON", 
        btn_chat_only: "🖂 CHAT ONLY", btn_audio_only: "📞 AUDIO ONLY", btn_mute_on: "🎤 ON", btn_mute_muted: "🎤 MUTED", 
        btn_tactical: "🎭 TACTICAL", btn_normal: "🎭 NORMAL", btn_stealth_on: "🛰 STEALTH: ON", btn_stealth_off: "🛰 STEALTH: OFF", 
        push_inc_call: "INCOMING CALL", push_from: "From", push_new_msg: "New message", push_sms_from: "SMS from", 
        mode_audio: "📞 AUDIO", mode_video: "🎥 VIDEO", mode_data: "🖂 CHAT ONLY", 
        ui_pass: "Passcode", ui_start: "START", ui_target: "Target Number", ui_call: "CALL", ui_sms_btn: "SEND SMS", 
        ui_msg_inp: "Message...", ui_send: "SEND", ui_accept: "ACCEPT", ui_decline: "DECLINE", ui_hang: "HANG UP", 
        ui_photo: "PHOTO", ui_geo: "GEO", ui_burn: "BURN", ui_pre_sms: "SMS Text (Offline)...", ui_read_sms: "✉️ INBOX", 
        ui_burn_next: "BURN & NEXT", ui_burn_sms: "BURN SMS", pass_short: "PASSCODE < 8 CHARS!",
        ui_lbl_target: "🎯 TARGET IDENTIFIER", ui_lbl_msg: "✉️ DATA PACKET (SMS)", ui_inc_link: "INCOMING LINK"
    }
};

function t(key) { return DICT[currentLang][key] || key; }

function applyLangToUI() {
    const tr = (id, key, isPlaceholder = false) => { const el = document.getElementById(id); if (el) { if (isPlaceholder) el.placeholder = t(key); else el.textContent = t(key); } };
    tr('passInput', 'ui_pass', true); tr('startBtn', 'ui_start'); tr('targetNum', 'ui_target', true); tr('callBtn', 'ui_call'); tr('smsBtn', 'ui_sms_btn'); tr('msgInput', 'ui_msg_inp', true); tr('sendBtn', 'ui_send'); tr('acceptBtn', 'ui_accept'); tr('declineBtn', 'ui_decline'); tr('hangBtn', 'ui_hang'); tr('photoBtn', 'ui_photo'); tr('geoBtn', 'ui_geo'); tr('burnBtn', 'ui_burn'); tr('preCallMsg', 'ui_pre_sms', true);
    
    const incTitle = document.querySelector('#incomingUI h2'); if (incTitle) incTitle.textContent = t('ui_inc_link');

    const vBtn = document.getElementById("videoModeBtn"); if(vBtn) { if (mediaMode === 'video') vBtn.textContent = t('btn_video_on'); else if (mediaMode === 'data') vBtn.textContent = t('btn_chat_only'); else vBtn.textContent = t('btn_audio_only'); }
    const muteBtn = document.getElementById("muteBtn"); if(muteBtn) muteBtn.textContent = isMuted ? t('btn_mute_muted') : t('btn_mute_on');
    const scrBtn = document.getElementById("scrambleBtn"); if(scrBtn) scrBtn.textContent = isScrambled ? t('btn_tactical') : t('btn_normal');
    const relBtn = document.getElementById("relayToggle"); if(relBtn) relBtn.textContent = isRelayMode ? t('btn_stealth_on') : t('btn_stealth_off');
    const spkBtn = document.getElementById("speakerBtn"); if (spkBtn) spkBtn.textContent = isEarpieceMode ? t('btn_earpiece') : t('btn_speaker');
    const lockBtn = document.getElementById("lockBtn"); if (lockBtn) lockBtn.innerHTML = "🔒 " + t('btn_lock');
    const langBtn = document.getElementById("langBtn"); if (langBtn) langBtn.innerHTML = currentLang === 'ua' ? "🌍 ENG" : "🌍 УКР";
    const statusEl = document.getElementById("status"); if (statusEl && statusEl.textContent.includes("READY") || statusEl.textContent.includes("ГОТОВО")) statusEl.textContent = t('ready');
}

const DURESS_KEY = "1234567890"; const CRYPTO_SALT = "DRESDEN_V56_ETERNAL_STABILITY"; const PBKDF2_ITERATIONS = 500000; const MAX_IMAGE_DIMENSION = 1600;
const stunPool = [ "stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun.cloudflare.com:3478", "stun:global.stun.twilio.com:3478", "stun:stun.relay.metered.ca:80" ];
const turnPool = [
    { urls: "turn:free.expressturn.com:3478", username: "000000002090663353", credential: "VSl5ppuDRv7VUw9hCD7UZRfjyZU=" },
    { urls: "turns:global.relay.metered.ca:443?transport=tcp", username: "47cb64adbdb8e06d4a9f49e4", credential: "dBogKCNAumjDBInn" }
];

let ws = null, pc = null, dc = null, stream = null, remoteNum = null, cryptoKey = null;
let iceQueue = [], pendingOffer = null, isBusy = false, isMuted = false, isRelayMode = false;
let callSeconds = 0, callTimerInterval = null, wsPingInterval = null, connectionTimeout = null, handshakeInterval = null;
let mediaMode = 'audio', isSystemInitialized = false, isEarpieceMode = false;
let localIceQueue = [], iceFlushTimer = null, gatheredRelay = false; 
let smsInbox = [], currentSms = null, sendQueue = [], isProcessingQueue = false;
let incomingFile = { name: "", chunks: [], total: 0, received: 0, type: "" };
let audioCtx = null, micSource = null, distortionNode = null, isScrambled = false;
const ringtone = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg"); 
ringtone.loop = true;

let deviceToken = localStorage.getItem('dresden_device_token');
if (!deviceToken) {
    deviceToken = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).substr(2));
    localStorage.setItem('dresden_device_token', deviceToken);
}

let pendingSmsList = [];
try { pendingSmsList = JSON.parse(localStorage.getItem('dresden_sms_queue') || '[]'); } catch(e) { localStorage.removeItem('dresden_sms_queue'); }
let smsQueueInterval = null; let audioLockInterval = null;

const SystemIntel = {
    os: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream ? 'ios' : 'android',
    networkType: '4g',
    updateNet() { 
        if (navigator.connection) { 
            const oldNet = this.networkType;
            this.networkType = navigator.connection.effectiveType || '4g'; 
            if (oldNet !== this.networkType) this.applyDynamicConstraints();
        } 
        this.updateUI(); 
    },
    init() { 
        if (navigator.connection) { this.updateNet(); navigator.connection.addEventListener('change', () => this.updateNet()); setInterval(() => this.updateNet(), 3000); } 
        else { this.networkType = 'secure'; this.updateUI(); } 
    },
    updateUI() { 
        let badge = document.getElementById('netBadge'); 
        if (!badge) { 
            badge = document.createElement('span'); 
            badge.id = 'netBadge'; 
            const statusEl = document.getElementById('status'); 
            if (statusEl) statusEl.parentNode.insertBefore(badge, statusEl); 
        } 
        if (badge) { 
            badge.textContent = this.networkType.toUpperCase(); 
            badge.style.background = (this.networkType.includes('2g')) ? '#ff3b30' : (this.networkType.includes('3g') ? '#FFD60A' : '#00BFFF'); 
            badge.style.borderColor = badge.style.background; 
            badge.style.color = '#000'; 
        }
    },
    getVideoConstraints() { 
        if (this.networkType.includes('2g') || this.networkType.includes('3g')) return { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15 } }; 
        return { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } }; 
    },
    async applyDynamicConstraints() {
        if (!stream || mediaMode !== 'video') return;
        const track = stream.getVideoTracks()[0];
        if (track) { try { await track.applyConstraints(this.getVideoConstraints()); } catch(e){} }
    },
    getCallTimeout() { return (this.networkType.includes('2g')) ? 25000 : 15000; }
};

function sendPush(title, message) {
    try {
        if (window.AndroidAudio && typeof window.AndroidAudio.showNotification === 'function') {
            window.AndroidAudio.showNotification(title, message);
        } else if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
            new Notification(title, { body: message });
        }
    } catch(e) {}
}

function setStatus(text, color) { const el = document.getElementById("status"); if (el) { el.textContent = text; el.style.color = color || "#39FF14"; } }
function vibrate(p) { if (navigator.vibrate) navigator.vibrate(p); }
function buf2b64(buf) { const bytes = new Uint8Array(buf.buffer || buf); let s = ''; for (let i = 0; i < bytes.byteLength; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 8192, bytes.byteLength))); return window.btoa(s); }
function b642buf(b64) { const s = window.atob(b64); const bytes = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i); return bytes.buffer; }

async function deriveSessionKey(p) {
    if (p === DURESS_KEY) { localStorage.clear(); sessionStorage.clear(); window.location.replace("https://google.com"); return; }
    setStatus(t('keygen_active'), "#FFD60A");
    try { 
        if (!crypto || !crypto.subtle) throw new Error("NO_HTTPS");
        const enc = new TextEncoder(); 
        const mat = await crypto.subtle.importKey("raw", enc.encode(p), "PBKDF2", false, ["deriveKey"]); 
        cryptoKey = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode(CRYPTO_SALT), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" }, mat, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]); 
        isSystemInitialized = true; 
        SystemIntel.init(); 
        injectSpeakerButton(); 
        setStatus(t('enc_active')); 
    } catch (e) { 
        setStatus(t('keygen_fail'), "red"); 
        alert("🛡️ ПОМИЛКА БЕЗПЕКИ: Браузер заблокував шифрування! Відкрийте сайт через HTTPS.");
    }
}

async function encrypt(payload) { if (!cryptoKey) return null; const iv = crypto.getRandomValues(new Uint8Array(12)); const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, new TextEncoder().encode(JSON.stringify(payload))); return { iv: buf2b64(iv), data: buf2b64(enc) }; }
async function decrypt(cont) { try { const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(b642buf(cont.iv)) }, cryptoKey, b642buf(cont.data)); return JSON.parse(new TextDecoder().decode(dec)); } catch (e) { return null; } }
function sendWS(obj) { if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)); }

async function flushSmsQueue() {
    if (!isSystemInitialized || pendingSmsList.length === 0 || !ws || ws.readyState !== WebSocket.OPEN) return;
    try { 
        for (let i = 0; i < pendingSmsList.length; i++) {
            const s = pendingSmsList[i];
            sendWS({ type: "sms", to: s.to, payload: await encrypt({ type: "sms", txt: s.txt, smsId: s.id }) });
        }
    } catch(e) {}
}

function initWS() {
    if (!isSystemInitialized || (ws && ws.readyState < 2)) return;
    ws = new WebSocket("wss://phont8.onrender.com");
    ws.onopen = () => { 
        sendWS({ type: "register", number: localStorage.getItem("my_id"), token: deviceToken }); 
        setStatus(t('online'), "#39FF14"); 
        if(wsPingInterval) clearInterval(wsPingInterval); wsPingInterval = setInterval(() => { sendWS({ type: "ping" }); }, 15000); 
        if(smsQueueInterval) clearInterval(smsQueueInterval); smsQueueInterval = setInterval(flushSmsQueue, 30000); 
        flushSmsQueue(); 
    };
    ws.onclose = () => { setStatus(t('offline'), "red"); if (isBusy || pc) resetToDialer(); setTimeout(initWS, 3000); };
    ws.onmessage = async (e) => {
        let d;
        try { d = JSON.parse(e.data); } catch(err) { return; }
        
        if (d.type === "your_number") { localStorage.setItem("my_id", d.number); document.getElementById("myNum").textContent = d.number; return; }
        if (d.type === "user_count") { const uc = document.getElementById("userCount"); if (uc) uc.textContent = d.count; return; }
        
        if (d.type === "error" && d.msg === "HIJACK_BLOCKED") {
            alert("⚠️ ПОМИЛКА: Цей номер використовується іншим пристроєм.");
            localStorage.removeItem("my_id");
            return;
        }
        
        if (d.type === "peer_offline") { 
            if (d.to && remoteNum && d.to !== remoteNum) return;
            if (isBusy || pc || remoteNum) { setStatus(t('offline_err'), "red"); setTimeout(resetToDialer, 2500); } 
            else { setStatus(t('waiting_peer'), "var(--warn)"); setTimeout(() => { if (ws && ws.readyState === WebSocket.OPEN) setStatus(t('online'), "#39FF14"); }, 3000); }
            return; 
        }
        
        if (d.type === "busy") { setStatus(t('busy'), "var(--warn)"); setTimeout(resetToDialer, 3000); return; }
        if (d.payload) { const r = await decrypt(d.payload); if (r) d = { ...d, ...r }; else return; }
        switch (d.type) {
            case "call":
                if (isBusy) { sendWS({ type: "busy", to: d.from }); return; }
                isBusy = true; remoteNum = d.from; document.getElementById("callerId").textContent = d.from;
                let modeText = t('mode_audio'); if (d.mode === 'video') modeText = t('mode_video'); else if (d.mode === 'data') modeText = t('mode_data');
                const incMsg = document.getElementById("incomingPaging"); if (incMsg) { incMsg.textContent = `[${modeText}]` + (d.msg ? ` | MSG: ${d.msg}` : ""); incMsg.style.color = (d.mode === 'data') ? "#00BFFF" : "#FFD60A"; }
                document.getElementById("incomingUI").style.display = "flex";
                document.getElementById("incomingUI").classList.remove("hidden");
                
                if (document.visibilityState === 'hidden') sendPush(t('push_inc_call'), `${t('push_from')}: ${d.from} (${modeText})`);
                if (d.mode === 'data') { vibrate([100, 50, 100]); } else { vibrate([500, 100, 500]); ringtone.play().catch(()=>{}); } break;
            case "offer": 
                pendingOffer = d.offer; 
                if (pc && pc.signalingState !== "closed") {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(d.offer));
                        const ans = await pc.createAnswer();
                        await pc.setLocalDescription(ans);
                        sendWS({ type: "answer", to: remoteNum, payload: await encrypt({ answer: pc.localDescription }) });
                    } catch(e) {}
                }
                break;
            case "answer": 
                if (pc && pc.signalingState === "have-local-offer") { try { await pc.setRemoteDescription(new RTCSessionDescription(d.answer)); iceQueue.forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)).catch(()=>{})); iceQueue = []; } catch(err){} } break;
            case "ice_batch": 
                if (d.cands) { d.cands.forEach(c => { if (pc && pc.remoteDescription) { pc.addIceCandidate(new RTCIceCandidate(c)).catch(()=>{}); } else { iceQueue.push(c); } }); } break;
            case "hangup": resetToDialer(); break;
            
            case "sms": 
                smsInbox.push({ txt: d.txt, from: d.from }); 
                const rBtn = document.getElementById("readSmsBtn"); 
                if(rBtn) { rBtn.classList.remove("hidden"); rBtn.style.display = "flex"; rBtn.textContent = `${t('ui_read_sms')} (${smsInbox.length})`; } 
                
                if (document.visibilityState === 'hidden') sendPush(`${t('push_sms_from')} ${d.from}`, d.txt);
                vibrate(200); 
                if (d.smsId) sendWS({ type: "sms_ack", to: d.from, payload: await encrypt({ type: "sms_ack", smsId: d.smsId }) }); break;
            
            case "sms_ack":
                pendingSmsList = pendingSmsList.filter(s => s.id !== d.smsId); localStorage.setItem('dresden_sms_queue', JSON.stringify(pendingSmsList));
                setStatus(t('sms_delivered'), "#39FF14"); setTimeout(flushSmsQueue, 1000); break;
            case "sms_read_report": setStatus(t('sms_read'), "#39FF14"); setTimeout(() => setStatus(t('online'), "#39FF14"), 4000); break;
        }
    };
}

async function initPC(relay = false) {
    isBusy = true; gatheredRelay = false; 
    let iceConfig = [];
    if (relay) { iceConfig = turnPool; } else { const shuffledStun = [...stunPool].sort(() => 0.5 - Math.random()).slice(0, 3); iceConfig = [{ urls: shuffledStun }, ...turnPool]; }
    const policy = relay ? 'relay' : 'all';
    pc = new RTCPeerConnection({ iceServers: iceConfig, iceTransportPolicy: policy, bundlePolicy: 'max-bundle', iceCandidatePoolSize: 10, rtcpMuxPolicy: "require" });

    if (connectionTimeout) clearTimeout(connectionTimeout); const dynTimeout = SystemIntel.getCallTimeout();
    connectionTimeout = setTimeout(() => { if (pc && pc.iceConnectionState !== "connected") { setStatus(t('timeout'), "red"); if (remoteNum) sendWS({ type: "hangup", to: remoteNum }); resetToDialer(); } }, dynTimeout); 
    
    pc.onicecandidate = (e) => { 
        if (e.candidate && remoteNum) {
            if (e.candidate.candidate.includes('typ relay')) gatheredRelay = true;
            localIceQueue.push(e.candidate);
            if (!iceFlushTimer) { const batchTime = SystemIntel.networkType.includes('2g') ? 1500 : 300; iceFlushTimer = setTimeout(async () => { const cands = [...localIceQueue]; localIceQueue = []; iceFlushTimer = null; sendWS({ type: "ice_batch", to: remoteNum, payload: await encrypt({ cands }) }); }, batchTime); }
        }
    };
    
    pc.oniceconnectionstatechange = async () => {
        if (pc.iceConnectionState === "connected") { 
            setStatus(t('secure_link'), "#39FF14"); 
            if (connectionTimeout) clearTimeout(connectionTimeout); 
            if (!callTimerInterval) startCallTimer(); 
            try { if (mediaMode === 'audio' && window.AndroidAudio && typeof window.AndroidAudio.setProximityEnabled === 'function') { window.AndroidAudio.setProximityEnabled(true); } } catch(e) {}
        } else if (pc.iceConnectionState === "disconnected") {
            setStatus("⏳ РЕКОНЕКТ...", "#FFD60A");
            if (connectionTimeout) clearTimeout(connectionTimeout);
            connectionTimeout = setTimeout(() => {
                if (pc && pc.iceConnectionState !== "connected") resetToDialer();
            }, 15000);
        } else if (pc.iceConnectionState === "failed") { 
            setStatus("📡 ICE RESTART...", "#FFD60A");
            try {
                if (pc && remoteNum) {
                    const off = await pc.createOffer({ iceRestart: true });
                    await pc.setLocalDescription(off);
                    sendWS({ type: "offer", to: remoteNum, payload: await encrypt({ offer: pc.localDescription }) });
                }
            } catch(e) { resetToDialer(); }
        } else if (pc.iceConnectionState === "closed") {
            resetToDialer();
        }
    };
    
    pc.ontrack = (e) => { const el = e.track.kind === 'video' ? document.getElementById("remoteVideo") : document.getElementById("audio"); if (el) { el.srcObject = e.streams[0]; el.style.display = "block"; el.classList.remove("hidden"); el.play().catch(()=>{}); if (isEarpieceMode) applyAudioHack(); } };
    
    try { 
        if (mediaMode !== 'data') { const dynConstraints = SystemIntel.getVideoConstraints(); stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: mediaMode === 'video' ? dynConstraints : false });
            if (mediaMode === 'video') { const lv = document.getElementById("localVideo"); lv.srcObject = stream; lv.style.display = "block"; lv.classList.remove("hidden"); } stream.getTracks().forEach(t => pc.addTrack(t, stream)); 
        } else { const lv = document.getElementById("localVideo"); if(lv) lv.style.display = "none"; const rv = document.getElementById("remoteVideo"); if(rv) rv.style.display = "none"; setStatus(t('data_mode'), "#00BFFF"); }
    } catch (e) { setStatus(t('mic_error'), "red"); }
}

function setupDC(channel) {
    dc = channel; 
    dc.onopen = () => { 
        setStatus(t('secure_link'), "#39FF14"); 
        document.getElementById("dialerUI").style.display = "none";
        document.getElementById("dialerUI").classList.add("hidden");
        document.getElementById("activeCallUI").style.display = "flex";
        document.getElementById("activeCallUI").classList.remove("hidden");
        document.getElementById("remoteIdDisplay").textContent = remoteNum; 
        if (window.dcHeartbeat) clearInterval(window.dcHeartbeat); window.dcHeartbeat = setInterval(async () => { if (dc && dc.readyState === "open") { dc.send(JSON.stringify(await encrypt({ type: "heartbeat" }))); } }, 5000);
    };
    dc.onmessage = async (e) => {
        const r = await decrypt(JSON.parse(e.data)); if (!r) return; if (r.type === "heartbeat") return;
        if (r.type === "msg") { appendMsg(r.txt, "peer", r.isGeo); if (document.visibilityState === 'hidden') sendPush(t('push_new_msg'), r.txt); } 
        if (r.type === "burn") { document.getElementById("chatMessages").innerHTML = ""; vibrate(50); } 
        if (r.type.startsWith("file_")) handleIncomingData(r);
    };
    dc.onclose = () => { resetToDialer(); };
    dc.onerror = () => { resetToDialer(); };
}

function injectSpeakerButton() {
    const controls = document.querySelector(".call-controls"); if (!controls) return;
    if (!document.getElementById("speakerBtn")) {
        const btn = document.createElement("button"); btn.id = "speakerBtn"; btn.className = "btn-sub"; btn.textContent = t('btn_speaker'); 
        btn.onclick = async () => { isEarpieceMode = !isEarpieceMode; btn.textContent = isEarpieceMode ? t('btn_earpiece') : t('btn_speaker'); btn.style.color = isEarpieceMode ? "#00BFFF" : "#39FF14"; btn.style.borderColor = isEarpieceMode ? "#00BFFF" : "#333"; await applyAudioHack(); }; 
        const hangBtn = document.getElementById("hangBtn"); if (hangBtn) controls.insertBefore(btn, hangBtn); else controls.appendChild(btn);
    }
}

async function applyAudioHack() {
    try {
        if (audioLockInterval) { clearInterval(audioLockInterval); audioLockInterval = null; }
        if (window.AndroidAudio && typeof window.AndroidAudio.setSpeakerphoneOn === 'function') { window.AndroidAudio.setSpeakerphoneOn(!isEarpieceMode); if (isEarpieceMode) { audioLockInterval = setInterval(() => { try { window.AndroidAudio.setSpeakerphoneOn(false); } catch(e){} }, 1500); } return; }
        const audioEl = document.getElementById("audio"); if (!audioEl || !audioEl.srcObject) return;
        if (typeof audioEl.setSinkId !== 'undefined') { try { const devs = await navigator.mediaDevices.enumerateDevices(); const outs = devs.filter(d => d.kind === 'audiooutput'); const target = isEarpieceMode ? outs.find(d => d.label.toLowerCase().includes('earpiece')) : outs.find(d => d.label.toLowerCase().includes('speaker')); if (target) await audioEl.setSinkId(target.deviceId); } catch(e) {} } 
        else if (SystemIntel.os === 'ios') { const tracks = audioEl.srcObject.getAudioTracks(); if (tracks.length > 0) { tracks[0].enabled = false; new Audio().play().catch(()=>{}); setTimeout(() => tracks[0].enabled = true, 300); } }
    } catch(e) {}
}

function updateProgress(percent, text) { const pCont = document.getElementById("fileProgress"), pBar = document.getElementById("progBar"); if (!pCont || !pBar) return; if (percent < 0) { pCont.classList.add("hidden"); pCont.style.display = "none"; return; } pCont.classList.remove("hidden"); pCont.style.display = "block"; document.getElementById("progText").textContent = text || t('transfer'); pBar.style.width = percent + "%"; document.getElementById("filePercent").textContent = Math.floor(percent) + "%"; }

async function actualSendData(blob, name, type) { 
    try {
        if (!dc || dc.readyState !== "open") throw new Error("DataChannel Closed"); 
        const buf = await blob.arrayBuffer(), total = buf.byteLength; const chunkSz = SystemIntel.networkType.includes('2g') ? 4096 : 16384; 
        dc.send(JSON.stringify(await encrypt({ type: "file_start", name, total, fileType: type }))); 
        let offset = 0; updateProgress(0, t('sending')); 
        while (offset < total) { 
            if (!dc || dc.readyState !== "open") throw new Error("DataChannel Closed"); 
            if (dc.bufferedAmount > 65536) { await new Promise(r => setTimeout(r, 40)); continue; } 
            const chunk = buf.slice(offset, offset + chunkSz); dc.send(JSON.stringify(await encrypt({ type: "file_chunk", chunk: buf2b64(chunk) }))); 
            offset += chunkSz; updateProgress(Math.min((offset / total) * 100, 100), t('sending')); await new Promise(r => setTimeout(r, 5)); 
        } 
        dc.send(JSON.stringify(await encrypt({ type: "file_end", fileType: type }))); setTimeout(() => updateProgress(-1), 1000); 
        if (type === "img") appendImage(URL.createObjectURL(blob), "self"); 
    } catch (e) { updateProgress(-1); throw e; }
}

function handleIncomingData(payload) { 
    if (payload.type === "file_start") { incomingFile = { chunks: [], total: payload.total, type: payload.fileType, name: payload.name, received: 0 }; updateProgress(0, t('receiving')); return; } 
    if (payload.type === "file_chunk") { const chunk = new Uint8Array(b642buf(payload.chunk)); incomingFile.chunks.push(chunk); incomingFile.received += chunk.byteLength; updateProgress(Math.min((incomingFile.received / incomingFile.total) * 100, 100), t('receiving')); return; } 
    if (payload.type === "file_end") { 
        setTimeout(() => updateProgress(-1), 1000); 
        const final = new Blob(incomingFile.chunks, { type: incomingFile.type === "img" ? "image/jpeg" : "application/octet-stream" }); 
        const url = URL.createObjectURL(final); 
        
        if (incomingFile.type === "img") {
            appendImage(url, "peer"); 
        } else { 
            const finalFile = new File([final], incomingFile.name || "secure_file", { type: final.type });
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [finalFile] })) {
                navigator.share({
                    files: [finalFile],
                    title: incomingFile.name,
                    text: 'Отримано захищений файл'
                }).catch(e => console.log("Share canceled", e));
            } else {
                const a = document.createElement("a"); a.href = url; a.download = incomingFile.name || "file"; a.click(); 
            }
        } 
    } 
}

async function processQueue() { if (sendQueue.length === 0) { isProcessingQueue = false; return; } isProcessingQueue = true; const item = sendQueue.shift(); try { await actualSendData(item.blob, item.name, item.type); } catch (e) { console.warn("Aborted"); } processQueue(); }
async function toggleScrambler() { if (!stream || !pc) return; isScrambled = !isScrambled; const btn = document.getElementById("scrambleBtn"); if (!audioCtx) audioCtx = new AudioContext(); if (isScrambled) { btn.style.color = "red"; btn.textContent = t('btn_tactical'); micSource = audioCtx.createMediaStreamSource(stream); distortionNode = audioCtx.createBiquadFilter(); distortionNode.type = "lowpass"; distortionNode.frequency.value = 650; const dest = audioCtx.createMediaStreamDestination(); micSource.connect(distortionNode); distortionNode.connect(dest); const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio'); if(sender) sender.replaceTrack(dest.stream.getAudioTracks()[0]); } else { btn.style.color = "#39FF14"; btn.textContent = t('btn_normal'); const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio'); if(sender) sender.replaceTrack(stream.getAudioTracks()[0]); } }
function toggleMute() { if (!stream) return; isMuted = !isMuted; stream.getAudioTracks().forEach(track => track.enabled = !isMuted); const btn = document.getElementById("muteBtn"); btn.style.color = isMuted ? "red" : "#39FF14"; btn.textContent = isMuted ? t('btn_mute_muted') : t('btn_mute_on'); }

document.addEventListener("DOMContentLoaded", () => {
    applyLangToUI(); 
    
    document.addEventListener("visibilitychange", () => { 
        if (document.visibilityState === 'visible' && isSystemInitialized) {
            if (!ws || ws.readyState !== WebSocket.OPEN) initWS();
            else flushSmsQueue(); 
        }
    });
    
    const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };

    window.addEventListener("beforeunload", () => {
        if (remoteNum && ws && ws.readyState === WebSocket.OPEN) { ws.send(JSON.stringify({ type: "hangup", to: remoteNum })); }
    });

    const topBarContainer = document.getElementById('topButtons');
    if (topBarContainer && !document.getElementById("langBtn")) {
        const langBtn = document.createElement("button"); langBtn.id = "langBtn";
        langBtn.style.cssText = "background: transparent; color: #00BFFF; border: 1px solid #00BFFF; border-radius: 3px; font-size: 10px; padding: 4px 8px; cursor: pointer; font-weight: bold; font-family: monospace;";
        langBtn.innerHTML = currentLang === 'ua' ? "🌍 ENG" : "🌍 УКР";
        langBtn.onclick = () => { currentLang = currentLang === 'ua' ? 'en' : 'ua'; localStorage.setItem('dresden_lang', currentLang); applyLangToUI(); };
        topBarContainer.appendChild(langBtn);
    }

    window.addEventListener('popstate', (e) => {
        const activeUI = document.getElementById("activeCallUI");
        const incomingUI = document.getElementById("incomingUI");
        if (isBusy || pc || (activeUI && activeUI.style.display === "flex") || (incomingUI && incomingUI.style.display === "flex")) { 
            history.pushState(null, null, location.href); 
            if (remoteNum) sendWS({ type: "hangup", to: remoteNum }); 
            resetToDialer(); 
        } 
        else if (isSystemInitialized) { 
            document.getElementById("mainApp").style.display = "none";
            document.getElementById("mainApp").classList.add("hidden");
            document.getElementById("loginScreen").style.display = "flex";
            document.getElementById("loginScreen").classList.remove("hidden");
            
            isSystemInitialized = false; 
            if (ws) { ws.onclose = null; ws.close(); ws = null; } 
            if (wsPingInterval) { clearInterval(wsPingInterval); wsPingInterval = null; } 
            if (smsQueueInterval) { clearInterval(smsQueueInterval); smsQueueInterval = null; }
            if (audioLockInterval) { clearInterval(audioLockInterval); audioLockInterval = null; }
            cryptoKey = null; setStatus(t('app_locked'), "#FFD60A"); 
            
            const lb = document.getElementById("lockBtn"); if (lb) lb.remove();
        }
    });

    bind("startBtn", async () => { 
        const v = document.getElementById("passInput").value; 
        if (v.length < 8) {
            const inp = document.getElementById("passInput"); inp.style.borderColor = "red"; inp.style.color = "red"; inp.value = ""; inp.placeholder = t('pass_short');
            setTimeout(() => { inp.style.borderColor = "#39FF14"; inp.style.color = "#39FF14"; inp.placeholder = "Пароль доступу"; }, 2000); return;
        }

        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("loginScreen").classList.add("hidden");
        document.getElementById("mainApp").style.display = "flex";
        document.getElementById("mainApp").classList.remove("hidden");

        try { if (typeof Notification !== 'undefined' && Notification.permission !== "granted" && Notification.permission !== "denied") { Notification.requestPermission().catch(()=>{}); } } catch(e) {}
        
        history.pushState(null, null, location.href); await deriveSessionKey(v); initWS(); 
        
        if (document.getElementById('topButtons') && !document.getElementById("lockBtn")) { 
            const lockBtn = document.createElement("button"); lockBtn.id = "lockBtn"; 
            lockBtn.innerHTML = "🔒 " + t('btn_lock'); 
            lockBtn.style.cssText = "background: transparent; color: #FFD60A; border: 1px solid #FFD60A; border-radius: 3px; font-size: 10px; padding: 4px 8px; cursor: pointer; font-weight: bold; font-family: monospace;"; 
            lockBtn.onclick = () => history.back(); 
            document.getElementById('topButtons').appendChild(lockBtn); 
        }
    });

    bind("videoModeBtn", () => { if (mediaMode === 'audio') mediaMode = 'video'; else if (mediaMode === 'video') mediaMode = 'data'; else mediaMode = 'audio'; vibrate(30); const btn = document.getElementById("videoModeBtn"); if (mediaMode === 'video') { btn.textContent = t('btn_video_on'); btn.style.color = "#39FF14"; btn.style.borderColor = "#39FF14"; } else if (mediaMode === 'data') { btn.textContent = t('btn_chat_only'); btn.style.color = "#00BFFF"; btn.style.borderColor = "#00BFFF"; } else { btn.textContent = t('btn_audio_only'); btn.style.color = "#FFD60A"; btn.style.borderColor = "#333"; } });
    bind("hangBtn", () => { if (remoteNum) sendWS({ type: "hangup", to: remoteNum }); resetToDialer(); }); bind("declineBtn", () => { if (remoteNum) sendWS({ type: "hangup", to: remoteNum }); resetToDialer(); });
    
    // 🔥 ФІКС: Блокування дзвінка самому собі
    bind("callBtn", async () => {
        const target = document.getElementById("targetNum").value.trim();
        const myId = localStorage.getItem("my_id");
        if (target === myId) {
            setStatus(t('busy'), "#FFD60A");
            setTimeout(resetToDialer, 2000);
            return;
        }
        initiateLink();
    });
    
    bind("smsBtn", async () => { 
        const tgt = document.getElementById("targetNum").value.trim(), txt = document.getElementById("preCallMsg").value.trim(); if (!tgt || !txt) return; 
        const smsId = Date.now().toString(36) + Math.random().toString(36).substr(2); pendingSmsList.push({ id: smsId, to: tgt, txt: txt }); localStorage.setItem('dresden_sms_queue', JSON.stringify(pendingSmsList));
        flushSmsQueue(); document.getElementById("preCallMsg").value = ""; setStatus(t('sms_queued'), "var(--warn)"); vibrate(30); 
    });
    
    const processNextSms = () => { 
        const smsUi = document.getElementById("smsOverlay");
        const sc = document.getElementById("smsContent");
        const rBtn = document.getElementById("readSmsBtn");
        const bb = document.getElementById("burnSmsBtn");

        if (!smsInbox || smsInbox.length === 0) { 
            if(smsUi) { smsUi.style.display = "none"; smsUi.classList.add("hidden"); }
            if(sc) sc.innerHTML = ""; 
            currentSms = null; 
            if(rBtn) { rBtn.style.display = "none"; rBtn.classList.add("hidden"); }
            return; 
        } 
        
        currentSms = smsInbox.shift(); 
        
        if(smsUi) { smsUi.style.display = "flex"; smsUi.classList.remove("hidden"); }
        
        if(sc) {
            sc.innerHTML = ""; 
            
            const senderSpan = document.createElement("span");
            senderSpan.className = "sms-sender-id";
            senderSpan.textContent = "[ВІДПРАВНИК: " + (currentSms.from || "НЕВІДОМО") + "]";
            
            const textSpan = document.createElement("span");
            textSpan.style.whiteSpace = "pre-wrap";
            textSpan.textContent = currentSms.txt || " ";
            
            sc.appendChild(senderSpan);
            sc.appendChild(textSpan);
            sc.style.display = "block"; 
        }
        
        if(rBtn) { rBtn.style.display = "none"; rBtn.classList.add("hidden"); }
        if(bb) { 
            bb.classList.remove("hidden"); 
            bb.textContent = smsInbox.length > 0 ? (t('ui_burn_next') + " (" + smsInbox.length + ")") : t('ui_burn_sms'); 
        } 
        
        if (currentSms && currentSms.from) { 
            encrypt({ type: "sms_read_report" }).then(enc => {
                sendWS({ type: "sms_read_report", to: currentSms.from, payload: enc });
            }).catch(e => {});
        } 
    };

    bind("readSmsBtn", processNextSms); bind("burnSmsBtn", processNextSms);
    bind("geoBtn", () => { if (!dc) return; setStatus(t('gps_search'), "#FFD60A"); navigator.geolocation.getCurrentPosition(async (p) => { const url = `https://www.google.com/maps?q=${p.coords.latitude},${p.coords.longitude}`; dc.send(JSON.stringify(await encrypt({ type: "msg", txt: url, isGeo: true }))); appendMsg(url, "self", true); setStatus(t('secure_link'), "#39FF14"); }, () => setStatus(t('no_gps'), "red"), { enableHighAccuracy: true }); });
    bind("burnBtn", async () => { document.getElementById("chatMessages").innerHTML = ""; vibrate([50, 50, 50]); if (dc && dc.readyState === "open") dc.send(JSON.stringify(await encrypt({ type: "burn" }))); });
    
    bind("acceptBtn", async () => { 
        ringtone.pause(); 
        document.getElementById("incomingUI").style.display = "none";
        document.getElementById("incomingUI").classList.add("hidden");
        setStatus(t('sync'), "#FFD60A"); 
        try { 
            let wait = 0; const dynWait = SystemIntel.getCallTimeout(); while (!pendingOffer && wait < dynWait) { await new Promise(r => setTimeout(r, 500)); wait += 500; } 
            if (!pendingOffer) throw new Error("TIMEOUT"); 
            if (!pendingOffer.sdp.includes("m=audio") && !pendingOffer.sdp.includes("m=video")) mediaMode = 'data'; else if (pendingOffer.sdp.includes("m=video")) mediaMode = 'video'; else mediaMode = 'audio'; 
            await initPC(isRelayMode); pc.ondatachannel = (e) => setupDC(e.channel); await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer)); 
            iceQueue.forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)).catch(()=>{})); iceQueue = [];
            const ans = await pc.createAnswer(); await pc.setLocalDescription(ans); sendWS({ type: "answer", to: remoteNum, payload: await encrypt({ answer: ans }) }); 
            handshakeInterval = setInterval(async () => { if (!ws || ws.readyState !== WebSocket.OPEN) { clearInterval(handshakeInterval); handshakeInterval = null; resetToDialer(); return; } if (pc && pc.iceConnectionState === "connected") { clearInterval(handshakeInterval); handshakeInterval = null; return; } if (pc && pc.localDescription) sendWS({ type: "answer", to: remoteNum, payload: await encrypt({ answer: pc.localDescription }) }); }, 3000); 
        } catch (e) { setStatus(t('failed'), "red"); setTimeout(resetToDialer, 3000); } 
    });
    
    bind("sendBtn", async () => { const mi = document.getElementById("msgInput"); if(!mi.value || !dc) return; dc.send(JSON.stringify(await encrypt({ type: "msg", txt: mi.value }))); appendMsg(mi.value, "self"); mi.value = ""; }); bind("photoBtn", () => document.getElementById("fileInp").click());
    const fi = document.getElementById("fileInp"); if(fi) fi.onchange = (e) => { Array.from(e.target.files).forEach(f => { const r = new FileReader(); r.onload = (ev) => { if (f.type.startsWith("image/")) { const img = new Image(); img.onload = () => { const cv = document.createElement("canvas"), ctx = cv.getContext("2d"); let w = img.width, h = img.height; if (w > MAX_IMAGE_DIMENSION) { h *= MAX_IMAGE_DIMENSION/w; w = MAX_IMAGE_DIMENSION; } cv.width = w; cv.height = h; ctx.drawImage(img, 0, 0, w, h); cv.toBlob(b => { sendQueue.push({ blob: b, name: "img.jpg", type: "img" }); if (!isProcessingQueue) processQueue(); }, "image/jpeg", 0.75); }; img.src = ev.target.result; } else { sendQueue.push({ blob: f, name: f.name, type: "file" }); if (!isProcessingQueue) processQueue(); } }; if (f.type.startsWith("image/")) r.readAsDataURL(f); else r.readAsArrayBuffer(f); }); };
    bind("muteBtn", toggleMute); bind("scrambleBtn", toggleScrambler); bind("relayToggle", () => { isRelayMode = !isRelayMode; const rt = document.getElementById("relayToggle"); rt.textContent = isRelayMode ? t('btn_stealth_on') : t('btn_stealth_off'); rt.style.color = isRelayMode ? "#39FF14" : "#ccc"; rt.style.borderColor = isRelayMode ? "#39FF14" : "#333"; });
});

async function initiateLink() { remoteNum = document.getElementById("targetNum").value.trim(); if (!remoteNum) return; setStatus(t('dialing'), "var(--warn)"); sendWS({ type: "call", to: remoteNum, payload: await encrypt({ type: "call", mode: mediaMode }) }); try { await initPC(isRelayMode); dc = pc.createDataChannel("secureData", { ordered: true }); setupDC(dc); const off = await pc.createOffer(); await pc.setLocalDescription(off); sendWS({ type: "offer", to: remoteNum, payload: await encrypt({ offer: off }) }); handshakeInterval = setInterval(async () => { if (!ws || ws.readyState !== WebSocket.OPEN) { clearInterval(handshakeInterval); handshakeInterval = null; resetToDialer(); return; } if (pc && pc.iceConnectionState === "connected") { clearInterval(handshakeInterval); handshakeInterval = null; return; } if (pc && pc.localDescription) sendWS({ type: "offer", to: remoteNum, payload: await encrypt({ offer: pc.localDescription }) }); }, 3000); } catch (e) { setStatus(t('error'), "red"); resetToDialer(); } }

function resetToDialer() {
    isBusy = false; isEarpieceMode = false; ringtone.pause(); ringtone.currentTime = 0; const sBtn = document.getElementById("speakerBtn"); if (sBtn) { sBtn.textContent = t('btn_speaker'); sBtn.style.color = "#39FF14"; sBtn.style.borderColor = "#333"; }
    sendQueue = []; isProcessingQueue = false; incomingFile = { name: "", chunks: [], total: 0, received: 0, type: "" };
    if (audioLockInterval) { clearInterval(audioLockInterval); audioLockInterval = null; }
    try { if (window.AndroidAudio && typeof window.AndroidAudio.setProximityEnabled === 'function') { window.AndroidAudio.setProximityEnabled(false); } if (window.AndroidAudio && typeof window.AndroidAudio.setSpeakerphoneOn === 'function') { window.AndroidAudio.setSpeakerphoneOn(true); } } catch(e) {}
    if (callTimerInterval) clearInterval(callTimerInterval); if (handshakeInterval) { clearInterval(handshakeInterval); handshakeInterval = null; } if (window.dcHeartbeat) { clearInterval(window.dcHeartbeat); window.dcHeartbeat = null; }
    updateProgress(-1); if (pc) pc.close(); if (stream) stream.getTracks().forEach(track => track.stop()); pc = null; dc = null; stream = null; remoteNum = null; pendingOffer = null; iceQueue = []; localIceQueue = [];
    
    document.getElementById("activeCallUI").style.display = "none";
    document.getElementById("activeCallUI").classList.add("hidden");
    document.getElementById("incomingUI").style.display = "none";
    document.getElementById("incomingUI").classList.add("hidden");
    document.getElementById("dialerUI").style.display = "flex";
    document.getElementById("dialerUI").classList.remove("hidden");
    
    document.getElementById("remoteVideo").style.display = "none"; document.getElementById("localVideo").style.display = "none";
    const chatBox = document.getElementById("chatMessages"); if (chatBox) chatBox.innerHTML = ""; const msgInp = document.getElementById("msgInput"); if (msgInp) msgInp.value = "";
    if (ws && ws.readyState === WebSocket.OPEN) { setStatus(t('online'), "#39FF14"); } else { setStatus(t('ready'), "#FFD60A"); }
}

function appendMsg(t, cls, isGeo = false) { const chat = document.getElementById("chatMessages"); if(!chat) return; const d = document.createElement("div"); d.className = `msg ${cls}`; if (isGeo || t.includes("maps?q=")) { const link = t.match(/https?:\/\/[^\s]+/)?.[0] || t; d.classList.add("geo-msg"); d.innerHTML = `📍 <a href="${link}" target="_blank" style="color:inherit;text-decoration:none;font-weight:bold;">TACTICAL GEOTAG</a>`; } else { d.textContent = t; } chat.appendChild(d); chat.scrollTop = chat.scrollHeight; }

function showImageViewer(url) {
    let viewer = document.getElementById('imageViewerModal');
    if (!viewer) {
        viewer = document.createElement('div');
        viewer.id = 'imageViewerModal';
        viewer.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.98); z-index:99999; display:flex; flex-direction:column; justify-content:center; align-items:center;";
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = "⬅ НАЗАД";
        closeBtn.className = "tactical-btn secondary-btn"; 
        closeBtn.style.cssText = "position:absolute; top:40px; left:20px; padding:10px 20px; z-index:100000;";
        closeBtn.onclick = () => viewer.style.display = 'none';
        
        const img = document.createElement('img');
        img.id = 'viewerImg';
        img.style.cssText = "max-width:95%; max-height:80%; object-fit:contain; border:1px solid #39FF14; border-radius:8px;";
        
        viewer.appendChild(closeBtn);
        viewer.appendChild(img);
        document.body.appendChild(viewer);
    }
    document.getElementById('viewerImg').src = url;
    viewer.style.display = 'flex';
}

function appendImage(url, cls) { 
    const chat = document.getElementById("chatMessages"); if(!chat) return; 
    const d = document.createElement("div"); d.className = `msg ${cls} img-msg`; 
    const img = new Image(); img.src = url; img.style.maxWidth = "200px"; img.style.borderRadius = "8px"; 
    img.onclick = () => showImageViewer(url); 
    d.appendChild(img); chat.appendChild(d); chat.scrollTop = chat.scrollHeight; 
}

function startCallTimer() { let s = 0; callTimerInterval = setInterval(() => { s++; const m = String(Math.floor(s/60)).padStart(2,"0"), sec = String(s%60).padStart(2,"0"); const el = document.getElementById("callTimer"); if(el) el.textContent = `${m}:${sec}`; }, 1000); }
