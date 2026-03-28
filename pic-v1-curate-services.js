// ===== pic-v1-curate-services.js =====
// VisualCueManager, HapticFeedbackManager, MetadataExtractor

class VisualCueManager {
    constructor() { this.currentIntensity = localStorage.getItem(APP_STORAGE_KEYS.visualIntensity) || 'medium'; this.applyIntensity(this.currentIntensity); }
    setIntensity(level) { this.currentIntensity = level; this.applyIntensity(level); localStorage.setItem(APP_STORAGE_KEYS.visualIntensity, level); document.querySelectorAll('.intensity-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.level === level); }); }
    applyIntensity(level) { const s = { low: { glow: 0.3, ripple: 1000, extra: false }, medium: { glow: 0.6, ripple: 1500, extra: false }, high: { glow: 1.0, ripple: 2000, extra: true } }; const c = s[level]; document.documentElement.style.setProperty('--glow', c.glow); document.documentElement.style.setProperty('--ripple', `${c.ripple}ms`); if (c.extra) document.body.classList.add('high-intensity-mode'); else document.body.classList.remove('high-intensity-mode'); }
}

class HapticFeedbackManager {
    constructor() { this.isEnabled = localStorage.getItem(APP_STORAGE_KEYS.hapticEnabled) !== 'false'; this.isSupported = 'vibrate' in navigator; const cb = document.getElementById('haptic-enabled'); if (cb) cb.checked = this.isEnabled; }
    setEnabled(enabled) { this.isEnabled = enabled; localStorage.setItem(APP_STORAGE_KEYS.hapticEnabled, enabled); }
    triggerFeedback(type) { if (!this.isEnabled || !this.isSupported) return; const p = { swipe: [20,40], pillTap: [35], buttonPress: [25], error: [100,50,100] }; const pat = p[type]; if (pat && navigator.vibrate) navigator.vibrate(pat); }
}

class MetadataExtractor {
    constructor() { this.abortController = null; this.requestId = 0; this.pendingRequests = new Map(); this.worker = this.createWorker(); }
    createWorker() {
        const workerSource = `
            const extract = (buffer) => {
                if (!buffer) return {};
                const metadata = {};
                const view = new DataView(buffer);
                if (buffer.byteLength < 8) return {};
                let pos = 8;
                while (pos < buffer.byteLength - 12) {
                    const chunkLength = view.getUint32(pos, false); pos += 4;
                    let chunkType = '';
                    for (let i = 0; i < 4; i++) chunkType += String.fromCharCode(view.getUint8(pos + i));
                    pos += 4;
                    if (chunkType === 'tEXt') {
                        let keyword = '', value = '', nullFound = false;
                        for (let i = 0; i < chunkLength; i++) { const byte = view.getUint8(pos + i); if (!nullFound) { if (byte === 0) nullFound = true; else keyword += String.fromCharCode(byte); } else { value += String.fromCharCode(byte); } }
                        metadata[keyword] = value;
                    } else if (chunkType === 'IHDR') { metadata._dimensions = { width: view.getUint32(pos, false), height: view.getUint32(pos + 4, false) }; }
                    else if (chunkType === 'IEND') break;
                    pos += chunkLength + 4;
                    if (chunkLength > buffer.byteLength || pos > buffer.byteLength) break;
                }
                return metadata;
            };
            self.onmessage = (event) => { const { id, buffer } = event.data || {}; try { self.postMessage({ id, metadata: extract(buffer) }); } catch(e) { self.postMessage({ id, error: e?.message || 'Worker parsing error' }); } };
        `;
        const worker = new Worker(URL.createObjectURL(new Blob([workerSource], { type: 'application/javascript' })));
        worker.onmessage = (event) => { const { id, metadata, error } = event.data || {}; const p = this.pendingRequests.get(id); if (!p) return; this.pendingRequests.delete(id); if (error) p.reject(new Error(error)); else p.resolve(metadata || {}); };
        worker.onerror = (error) => { this.pendingRequests.forEach(({ reject }) => reject(error)); this.pendingRequests.clear(); };
        return worker;
    }
    async parseInWorker(buffer) { if (!this.worker) return this.extract(buffer); return new Promise((resolve, reject) => { const id = ++this.requestId; this.pendingRequests.set(id, { resolve, reject }); try { this.worker.postMessage({ id, buffer }, [buffer]); } catch(e) { this.pendingRequests.delete(id); reject(e); } }); }
    abort() { if (this.abortController) { this.abortController.abort(); this.abortController = null; } }
    async extract(buffer) {
        if (!buffer) return {};
        const metadata = {}; const view = new DataView(buffer);
        if (buffer.byteLength < 8) return {};
        let pos = 8;
        try { while (pos < buffer.byteLength - 12) { const chunkLength = view.getUint32(pos, false); pos += 4; let chunkType = ''; for (let i = 0; i < 4; i++) chunkType += String.fromCharCode(view.getUint8(pos + i)); pos += 4; if (chunkType === 'tEXt') { let keyword = '', value = '', nullFound = false; for (let i = 0; i < chunkLength; i++) { const byte = view.getUint8(pos + i); if (!nullFound) { if (byte === 0) nullFound = true; else keyword += String.fromCharCode(byte); } else value += String.fromCharCode(byte); } metadata[keyword] = value; } else if (chunkType === 'IHDR') { metadata._dimensions = { width: view.getUint32(pos, false), height: view.getUint32(pos + 4, false) }; } else if (chunkType === 'IEND') break; pos += chunkLength + 4; if (chunkLength > buffer.byteLength || pos > buffer.byteLength) break; } } catch(e) {}
        return metadata;
    }
    async fetchMetadata(file, isForExport = false) {
        if (file.mimeType !== 'image/png') { if (!isForExport) file.metadataStatus = 'loaded'; return { error: 'Not a PNG file' }; }
        try {
            this.abortController = new AbortController();
            let response; const reqOpts = {}; if (state.activeRequests) reqOpts.signal = state.activeRequests.signal;
            if (state.providerType === 'googledrive') { response = await state.provider.makeApiCall(`/files/${file.id}?alt=media`, { headers: { 'Range': 'bytes=0-65535' }, ...reqOpts }, false); }
            else { const token = await state.provider.getAccessToken(); response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/content`, { headers: { 'Authorization': `Bearer ${token}`, 'Range': 'bytes=0-65535' }, ...reqOpts }); }
            if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
            return await this.parseInWorker(await response.arrayBuffer());
        } catch(e) { if (e.name === 'AbortError') return { error: 'Operation cancelled' }; return { error: e.message }; }
    }
}
