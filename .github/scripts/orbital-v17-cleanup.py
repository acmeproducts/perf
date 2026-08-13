from pathlib import Path
import re

CACHE_PATTERN = re.compile(r"\n        const ExploreThumbnailCache = \{.*?\n        \};\n\n        async function sortFileByDirection", re.S)

CACHE_REPLACEMENT = r'''
        const SharedThumbnailService = {
            dbName: `${APP_IDENTITY.storagePrefix}:shared-thumbnails:v2`, storeName: 'thumbnails', maxEntries: 420,
            objectUrls: new Map(), inFlight: new Map(), dbPromise: null, persistQueue: [], persistActive: 0, maxPersistWorkers: 2,
            metrics: { cacheHit:0, cacheMiss:0, providerFetch:0, directPaint:0, recovery:0, refetch:0, firstThumbnailAt:0, surfaces:{} },
            key(file) { return `${state.providerType || 'unknown'}::${state.currentFolder?.id || 'none'}::${file?.id || 'missing'}`; },
            source(file) { return Utils.getPreferredImageUrl(file) || file?.thumbnailLink || file?.downloadUrl || ''; },
            mark(surface, event) {
                const bucket = this.metrics.surfaces[surface] || (this.metrics.surfaces[surface] = { requested:0, loaded:0, errors:0 });
                bucket[event] = (bucket[event] || 0) + 1;
                if (event === 'loaded' && !this.metrics.firstThumbnailAt) this.metrics.firstThumbnailAt = performance.now();
            },
            snapshot() { return JSON.parse(JSON.stringify(this.metrics)); },
            open() {
                if (!('indexedDB' in window)) return Promise.resolve(null);
                if (!this.dbPromise) this.dbPromise = new Promise(resolve => {
                    const request = indexedDB.open(this.dbName, 1);
                    request.onupgradeneeded = () => {
                        const store = request.result.createObjectStore(this.storeName, { keyPath: 'key' });
                        store.createIndex('used', 'used');
                    };
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => resolve(null);
                });
                return this.dbPromise;
            },
            request(db, mode, action) {
                return new Promise(resolve => {
                    const transaction = db.transaction(this.storeName, mode);
                    const request = action(transaction.objectStore(this.storeName));
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => resolve(null);
                });
            },
            async refreshFile(file) {
                if (!file?.id || state.providerType !== 'googledrive' || typeof state.provider?.fetchFilesByIds !== 'function') return false;
                try {
                    const refreshed = await state.provider.fetchFilesByIds(state.currentFolder?.id, [file.id], { signal: state.activeRequests?.signal });
                    const fresh = refreshed?.find(item => item.id === file.id) || refreshed?.[0];
                    if (!fresh) return false;
                    Object.assign(file, fresh);
                    this.metrics.recovery += 1;
                    return true;
                } catch (_) { return false; }
            },
            queuePersist(file) {
                if (!file?.id) return;
                const key = this.key(file);
                if (this.inFlight.has(key) || this.persistQueue.some(item => item.key === key)) return;
                this.persistQueue.push({ file, key });
                this.drainPersistQueue();
            },
            drainPersistQueue() {
                while (this.persistActive < this.maxPersistWorkers && this.persistQueue.length) {
                    const job = this.persistQueue.shift();
                    this.persistActive += 1;
                    const run = async () => {
                        try { await this.persist(job.file, job.key); } catch (_) {}
                        finally { this.persistActive -= 1; this.drainPersistQueue(); }
                    };
                    if ('requestIdleCallback' in window) requestIdleCallback(() => run(), { timeout: 1800 });
                    else setTimeout(run, 250);
                }
            },
            async persist(file, key = this.key(file)) {
                let pending = this.inFlight.get(key);
                if (!pending) {
                    pending = (async () => {
                        const db = await this.open();
                        let record = db && await this.request(db, 'readonly', store => store.get(key));
                        if (record?.blob) { this.metrics.cacheHit += 1; record.used = Date.now(); this.request(db, 'readwrite', store => store.put(record)); return record.blob; }
                        this.metrics.cacheMiss += 1;
                        const url = this.source(file);
                        if (!url) return null;
                        this.metrics.providerFetch += 1;
                        const response = await fetch(url, { credentials: 'same-origin' });
                        if (!response.ok) return null;
                        record = { key, blob: await response.blob(), used: Date.now(), fileId:file.id };
                        if (db) this.request(db, 'readwrite', store => store.put(record)).then(() => this.evict(db));
                        return record.blob;
                    })();
                    this.inFlight.set(key, pending);
                    pending.finally(() => { if (this.inFlight.get(key) === pending) this.inFlight.delete(key); });
                }
                const blob = await pending;
                if (!blob) return null;
                let value = this.objectUrls.get(key);
                if (!value) { value = { src: URL.createObjectURL(blob), used: Date.now() }; this.objectUrls.set(key, value); }
                return value.src;
            },
            async load(img, file, isValid = () => true, surface = 'unknown') {
                if (!img || !file?.id || !isValid()) return;
                const key = this.key(file);
                img.dataset.thumbnailKey = key;
                this.mark(surface, 'requested');
                const existing = this.objectUrls.get(key);
                if (existing) {
                    this.metrics.cacheHit += 1; existing.used = Date.now();
                    if (isValid() && img.isConnected) img.src = existing.src;
                    return;
                }
                let recovered = false;
                const assignDirect = () => {
                    const url = this.source(file);
                    if (!url || !isValid() || !img.isConnected || img.dataset.thumbnailKey !== key) return false;
                    this.metrics.directPaint += 1;
                    img.src = url;
                    return true;
                };
                img.onload = () => this.mark(surface, 'loaded');
                img.onerror = async () => {
                    this.mark(surface, 'errors');
                    if (recovered || img.dataset.thumbnailKey !== key || !isValid() || !img.isConnected) return;
                    recovered = true;
                    if (await this.refreshFile(file)) { this.metrics.refetch += 1; assignDirect(); return; }
                    const cached = await this.persist(file, key);
                    if (cached && isValid() && img.isConnected && img.dataset.thumbnailKey === key) img.src = cached;
                };
                assignDirect();
                this.queuePersist(file);
            },
            async evict(db) {
                const records = await this.request(db, 'readonly', store => store.getAll());
                if (!records || records.length <= this.maxEntries) return;
                const expired = records.sort((a,b) => a.used - b.used).slice(0, records.length - this.maxEntries);
                expired.forEach(record => { this.request(db, 'readwrite', store => store.delete(record.key)); const value=this.objectUrls.get(record.key); if(value){URL.revokeObjectURL(value.src);this.objectUrls.delete(record.key);} });
            },
            releaseUnused(activeKeys) {
                this.objectUrls.forEach((value, key) => { if (!activeKeys.has(key)) { URL.revokeObjectURL(value.src); this.objectUrls.delete(key); } });
            }
        };

        async function sortFileByDirection'''


def patch_text(text:str)->str:
    out, n = CACHE_PATTERN.subn(CACHE_REPLACEMENT, text, count=1)
    if n != 1:
        raise RuntimeError(f'cache block matches={n}')
    replacements = {
        "ExploreThumbnailCache.load(img, Utils.getPreferredImageUrl(file) || file.thumbnailLink || file.downloadUrl || '', () => !this.elements.root.hidden && img.isConnected);":
        "SharedThumbnailService.load(img, file, () => !this.elements.root.hidden && img.isConnected, 'table');",
        "ExploreThumbnailCache.releaseUnused(new Set());":
        "SharedThumbnailService.releaseUnused(new Set());",
        "ExploreThumbnailCache.releaseUnused(new Set(this.files.map(file => Utils.getPreferredImageUrl(file) || file.thumbnailLink || file.downloadUrl || '')));":
        "SharedThumbnailService.releaseUnused(new Set(this.files.map(file => SharedThumbnailService.key(file))));",
        "ExploreThumbnailCache.load(img, Utils.getPreferredImageUrl(file) || file.thumbnailLink || file.downloadUrl || '', () => generation === this.loadGeneration && !this.elements.root.hidden && img.isConnected);":
        "SharedThumbnailService.load(img, file, () => generation === this.loadGeneration && !this.elements.root.hidden && img.isConnected, 'explore');",
    }
    for old,new in replacements.items():
        c=out.count(old)
        if c!=1: raise RuntimeError(f'expected one callsite, got {c}: {old[:40]}')
        out=out.replace(old,new,1)
    return out

if __name__=='__main__':
    p=Path(__import__('sys').argv[1])
    p.write_text(patch_text(p.read_text()), encoding='utf-8')
