// ===== pic-v1-curate-engine.js =====
// App, Core, Grid — extracted verbatim from ui-v1.html

const App = {
    selectProvider(type) {
        state.providerType = type;
        const isGoogle = type === 'googledrive';
        state.provider = isGoogle ? new GoogleDriveProvider() : new OneDriveProvider();
        state.syncManager?.setProviderContext({ provider: state.provider, providerType: state.providerType });
        state.folderSyncCoordinator?.setProviderContext({ provider: state.provider, providerType: state.providerType });
        if (state.provider.isAuthenticated) { Utils.showScreen('folder-screen'); Folders.load(); }
        else {
            Utils.elements.authTitle.textContent = isGoogle ? 'Google Drive' : 'OneDrive';
            Utils.elements.authSubtitle.textContent = `Connect to ${isGoogle ? 'Google Drive' : 'OneDrive'}`;
            Utils.elements.gdriveSecretContainer.classList.toggle('hidden', !isGoogle);
            Utils.elements.authButton.textContent = `Connect ${isGoogle ? 'Drive' : 'OneDrive'}`;
            Utils.elements.authStatus.textContent = isGoogle ? 'Enter your client secret to continue' : 'Click to sign in with your Microsoft account';
            Utils.elements.authStatus.className = 'status info';
            Utils.showScreen('auth-screen');
        }
    },
    async authenticateCurrentUser() {
        const isGoogle = state.providerType === 'googledrive'; const provider = state.provider;
        const { authButton, authStatus, gdriveClientSecret } = Utils.elements;
        authButton.disabled = true; authButton.textContent = 'Connecting...';
        authStatus.textContent = `Connecting to ${isGoogle ? 'Google Drive' : 'OneDrive'}...`; authStatus.className = 'status info';
        try {
            let success;
            if (isGoogle) { const cs = gdriveClientSecret.value.trim(); if (!cs) throw new Error('Please enter client secret'); success = await provider.authenticate(cs); }
            else { success = await provider.authenticate(); }
            if (success) { state.provider = provider; authStatus.textContent = `Connected to ${isGoogle ? 'Google Drive' : 'OneDrive'}!`; authStatus.className = 'status success'; if (isGoogle) gdriveClientSecret.value = ''; setTimeout(() => { Utils.showScreen('folder-screen'); Folders.load(); }, 1000); }
        } catch(e) { authStatus.textContent = `Authentication failed: ${e.message}`; authStatus.className = 'status error'; }
        finally { authButton.disabled = false; authButton.textContent = `Connect ${isGoogle ? 'Drive' : 'OneDrive'}`; }
    },
    async backToProviderSelection() {
        if (state.syncManager) { await state.syncManager.flush({ reason: 'provider-screen' }); await state.syncManager.stop(); state.syncManager.setProviderContext({ provider: null, providerType: null }); }
        state.folderSyncCoordinator?.setProviderContext({ provider: null, providerType: null });
        state.provider = null; state.providerType = null; state.navigationToken = Symbol('navigation'); Utils.showScreen('provider-screen');
    },
    async initializeWithProvider(providerType, folderId, folderName, providerInstance) {
        try {
            state.providerType = providerType; state.provider = providerInstance;
            state.currentFolder.id = folderId; state.currentFolder.name = folderName;
            state.activeRequests = new AbortController();
            const navigationToken = Symbol('navigation'); state.navigationToken = navigationToken;
            const loaded = await this.loadImages({ navigationToken });
            if (loaded) { this.switchToCommonUI(); if (state.syncManager) { state.syncManager.setProviderContext({ provider: state.provider, providerType: state.providerType }); state.syncManager.start(); } state.folderSyncCoordinator?.setProviderContext({ provider: state.provider, providerType: state.providerType }); }
        } catch(e) { Utils.showToast(`Initialization failed: ${e.message}`, 'error', true); this.returnToFolderSelection(); }
        finally { if (state.provider) state.provider.onProgressCallback = null; }
    },
    async loadImages(options = {}) {
        const folderId = state.currentFolder.id; if (!folderId) return false;
        const navigationToken = options.navigationToken || state.navigationToken || Symbol('navigation');
        if (!options.navigationToken && !state.navigationToken) state.navigationToken = navigationToken;
        if (!this.isNavigationActive(navigationToken)) return false;
        const sessionKey = `${state.providerType || 'unknown'}::${folderId}`;
        const cachedFiles = await state.dbManager.getFolderCache(folderId) || [];
        if (!this.isNavigationActive(navigationToken)) return false;
        const isFirstSessionVisit = !state.sessionVisitedFolders.has(sessionKey);
        const coordinator = state.folderSyncCoordinator; let preparation = null;
        try {
            if (coordinator) { preparation = await coordinator.prepareFolder(folderId, { forceFullResync: Boolean(options.forceFullResync) }); if (!this.isNavigationActive(navigationToken)) return false; }
            const shouldFullSync = Boolean(preparation?.mode === 'full' || cachedFiles.length === 0 || isFirstSessionVisit || options.forceFullResync);
            const canUseCache = !shouldFullSync && (preparation?.mode === 'cache' || !coordinator);
            if (!canUseCache) {
                if (cachedFiles.length > 0 && !options.forceFullResync) {
                    state.imageFiles = cachedFiles;
                    const remaining = await this.prepareFolderForFirstPaint(state.imageFiles, { navigationToken });
                    if (!this.isNavigationActive(navigationToken)) return false;
                    Utils.showScreen('app-container'); Core.initializeStacks(); Core.initializeImageDisplay();
                    state.sessionVisitedFolders.add(sessionKey);
                    if (remaining.length > 0) Utils.defer(() => this.processAllMetadata(remaining, false, { navigationToken }), { priority: 'background', timeout: 220 });
                    Utils.defer(() => this.refreshFolderInBackground(), { priority: 'high', timeout: 40 });
                    return state.imageFiles.length > 0;
                }
                const synced = await this.syncFolderFromCloud(cachedFiles, sessionKey, { preparation, navigationToken });
                return synced !== false;
            }
            state.imageFiles = cachedFiles;
            const remaining = await this.prepareFolderForFirstPaint(state.imageFiles, { navigationToken });
            if (!this.isNavigationActive(navigationToken)) return false;
            Utils.showScreen('app-container'); Core.initializeStacks(); Core.initializeImageDisplay();
            state.sessionVisitedFolders.add(sessionKey);
            if (remaining.length > 0) Utils.defer(() => this.processAllMetadata(remaining, false, { navigationToken }), { priority: 'background', timeout: 220 });
            return state.imageFiles.length > 0;
        } catch(e) { if (e?.name !== 'AbortError') Utils.showToast(`Error loading images: ${e.message}`, 'error', true); await this.returnToFolderSelection(); return false; }
    },
    async prepareFolderForFirstPaint(files, options = {}) { const { navigationToken = null, criticalCount = 18 } = options; if (!Array.isArray(files) || files.length === 0) return []; const critical = files.slice(0, Math.max(1, criticalCount)); await this.processAllMetadata(critical, true, { navigationToken }); return files.slice(critical.length); },
    mergeCloudWithCache(cloudFiles, cachedFiles) {
        const cachedMap = new Map(cachedFiles.map(f => [f.id, f])); const merged = []; const newIds = []; const updatedIds = []; const removedIds = [];
        const normalize = (v) => { if (v === null || v === undefined) return null; if (Array.isArray(v)) return v.map(i => normalize(i)); if (typeof v === 'object') { const n = {}; Object.keys(v).sort().forEach(k => { n[k] = normalize(v[k]); }); return n; } return v; };
        const hasDiffs = (cached = {}, cloud = {}) => { const pf = ['name','size','mimeType','createdTime','modifiedTime','thumbnailLink','webContentLink','webViewLink','downloadUrl','md5Checksum','checksum','width','height']; for (const f of pf) { if ((cached?.[f] ?? null) !== (cloud?.[f] ?? null)) return true; } const sf = ['appProperties','shortcutDetails','parents','imageMediaMetadata','videoMediaMetadata','thumbnails']; for (const f of sf) { if (JSON.stringify(normalize(cached?.[f])) !== JSON.stringify(normalize(cloud?.[f]))) return true; } return false; };
        for (const cf of cloudFiles) { const cached = cachedMap.get(cf.id); if (!cached) { merged.push({ ...cf }); newIds.push(cf.id); } else { const mf = { ...cached, ...cf }; if (hasDiffs(cached, cf)) updatedIds.push(cf.id); merged.push(mf); cachedMap.delete(cf.id); } }
        for (const rid of cachedMap.keys()) removedIds.push(rid);
        return { mergedFiles: merged, newIds, updatedIds, removedIds, hasChanges: newIds.length > 0 || updatedIds.length > 0 || removedIds.length > 0 };
    },
    async syncFolderFromCloud(cachedFiles, sessionKey, options = {}) {
        const folderId = state.currentFolder.id; const hadCached = cachedFiles.length > 0;
        const coordinator = state.folderSyncCoordinator; const preparation = options.preparation || null;
        const navigationToken = options.navigationToken || state.navigationToken;
        if (!this.isNavigationActive(navigationToken)) return false;
        Utils.showScreen('loading-screen'); Utils.updateLoadingProgress(0, hadCached ? cachedFiles.length : 0, hadCached ? 'Syncing with cloud...' : 'Fetching from cloud...');
        if (state.provider) state.provider.onProgressCallback = (p) => { const n = typeof p === 'number' ? { current: p } : (p || {}); Utils.updateLoadingProgress(Number(n.current||0), Number(n.total||0), n.message || (hadCached ? 'Syncing with cloud...' : 'Fetching from cloud...')); };
        try {
            const result = await state.provider.getFilesAndMetadata(folderId);
            if (!this.isNavigationActive(navigationToken)) return false;
            const cloudFiles = result.files || [];
            const { mergedFiles, newIds, updatedIds, removedIds, hasChanges } = this.mergeCloudWithCache(cloudFiles, cachedFiles);
            if (mergedFiles.length === 0) {
                await state.dbManager.saveFolderCache(folderId, []); state.imageFiles = [];
                if (!this.isNavigationActive(navigationToken)) return false;
                state.sessionVisitedFolders.add(sessionKey || `${state.providerType||'unknown'}::${folderId}`);
                this.switchToCommonUI(); Core.initializeStacks(); Core.showEmptyState(); Core.updateStackCounts();
                Utils.showToast('No images found in this folder', 'info', true); return true;
            }
            for (const uid of updatedIds) { const uf = mergedFiles.find(f => f.id === uid); if (uf) await state.dbManager.saveMetadata(uid, uf, { folderId, providerType: state.providerType }); }
            if (removedIds.length > 0) await Promise.all(removedIds.map(id => state.dbManager.deleteMetadata(id)));
            state.imageFiles = mergedFiles;
            const remaining = await this.prepareFolderForFirstPaint(state.imageFiles, { navigationToken });
            if (!this.isNavigationActive(navigationToken)) return false;
            if (hasChanges || !hadCached) state.dbManager.scheduleFolderCacheSave(folderId, state.imageFiles, { priority: hadCached ? 'normal' : 'high' });
            state.sessionVisitedFolders.add(sessionKey || `${state.providerType||'unknown'}::${folderId}`);
            this.switchToCommonUI(); Core.initializeStacks(); Core.initializeImageDisplay();
            if (remaining.length > 0) Utils.defer(() => this.processAllMetadata(remaining, false, { navigationToken }), { priority: 'background', timeout: 220 });
            if (hadCached && hasChanges) { const ds = []; if (newIds.length) ds.push(`${newIds.length} new`); if (updatedIds.length) ds.push(`${updatedIds.length} updated`); if (removedIds.length) ds.push(`${removedIds.length} removed`); Utils.showToast(`Folder updated (${ds.join(', ')})`, 'info'); }
        } catch(e) { if (e.name !== 'AbortError') Utils.showToast(`Error loading images: ${e.message}`, 'error', true); this.returnToFolderSelection(); }
    },
    async refreshFolderInBackground() {
        try {
            const navigationToken = state.navigationToken; const folderId = state.currentFolder.id;
            const cachedFiles = await state.dbManager.getFolderCache(folderId) || [];
            const result = await state.provider.getFilesAndMetadata(folderId);
            const { mergedFiles, updatedIds, removedIds, hasChanges } = this.mergeCloudWithCache(result.files || [], cachedFiles);
            if (!hasChanges) return;
            for (const uid of updatedIds) { const uf = mergedFiles.find(f => f.id === uid); if (uf) await state.dbManager.saveMetadata(uid, uf, { folderId, providerType: state.providerType }); }
            if (removedIds.length > 0) await Promise.all(removedIds.map(id => state.dbManager.deleteMetadata(id)));
            await this.processAllMetadata(mergedFiles, false, { navigationToken });
            if (!this.isNavigationActive(navigationToken)) return;
            await state.dbManager.saveFolderCache(folderId, mergedFiles);
            state.imageFiles = mergedFiles; Core.initializeStacks(); Core.updateStackCounts();
            if (state.imageFiles.length > 0) Core.displayCurrentImage(); else Core.showEmptyState();
            Utils.showToast('Folder updated in background', 'info');
        } catch(e) { console.warn('Background refresh failed:', e.message); }
    },
    async processAllMetadata(files, isFirstLoad = false, options = {}) {
        const { navigationToken = null } = options;
        if (isFirstLoad) Utils.updateLoadingProgress(0, files.length, 'Processing files...');
        for (let i = 0; i < files.length; i++) {
            if (navigationToken && !this.isNavigationActive(navigationToken)) return;
            const file = files[i];
            try { const metadata = await state.dbManager.getMetadata(file.id); if (metadata) Object.assign(file, metadata); else { const dm = this.generateDefaultMetadata(file, { index: i, total: files.length }); Object.assign(file, dm); await state.dbManager.saveMetadata(file.id, dm, { folderId: state.currentFolder.id, providerType: state.providerType }); } } catch(e) { console.error(`Failed to process metadata for ${file.name}:`, e); }
            if (isFirstLoad) Utils.updateLoadingProgress(i + 1, files.length);
        }
        if (!navigationToken || this.isNavigationActive(navigationToken)) this.extractMetadataInBackground(files.filter(f => f.mimeType === 'image/png'));
    },
    generateDefaultMetadata(file, context = {}) {
        const bm = { stack: 'in', tags: [], qualityRating: 0, contentRating: 0, notes: '', stackSequence: 0, favorite: false, extractedMetadata: {}, metadataStatus: 'pending' };
        if (state.providerType === 'googledrive' && file.appProperties) { bm.stack = file.appProperties.slideboxStack || 'in'; bm.tags = file.appProperties.slideboxTags ? file.appProperties.slideboxTags.split(',').map(t => t.trim()) : []; bm.qualityRating = parseInt(file.appProperties.qualityRating) || 0; bm.contentRating = parseInt(file.appProperties.contentRating) || 0; bm.notes = file.appProperties.notes || ''; bm.stackSequence = parseInt(file.appProperties.stackSequence) || 0; bm.favorite = file.appProperties.favorite === 'true'; }
        const ns = Number(bm.stackSequence); if (!Number.isFinite(ns) || ns === 0) { const ts = Date.parse(file.modifiedTime || file.createdTime || 0); let fb = Number.isNaN(ts) ? Date.now() : ts; bm.stackSequence = fb - (typeof context.index === 'number' ? context.index : 0); }
        return bm;
    },
    switchToCommonUI() { Utils.showScreen('app-container'); this.persistLastPickedFolder(); },
    persistLastPickedFolder() {
        if (!state.currentFolder?.id || !state.providerType) return;
        const files = Array.isArray(state.imageFiles) ? state.imageFiles : []; const fileCount = files.length;
        let latestTimestamp = null;
        for (const f of files) { const c = f?.modifiedTime || f?.createdTime || null; if (!c) continue; const p = Date.parse(c); if (!Number.isNaN(p) && (latestTimestamp == null || p > latestTimestamp)) latestTimestamp = p; }
        if (latestTimestamp == null) latestTimestamp = Date.now();
        const payload = { providerType: state.providerType, folderId: state.currentFolder.id, folderName: state.currentFolder.name || '', fileCount, lastUpdated: new Date(latestTimestamp).toISOString(), sourceModifiedTime: new Date(latestTimestamp).toISOString(), scanCompletedAt: new Date().toISOString() };
        state.lastPickedFolder = payload;
        try { localStorage.setItem(APP_STORAGE_KEYS.lastFolder, JSON.stringify(payload)); } catch(e) {}
        Folders.updateCachedFolderStats(state.providerType, state.currentFolder.id, { imageCount: fileCount, fileCount, modifiedTime: payload.lastUpdated, sourceModifiedTime: payload.sourceModifiedTime, scanCompletedAt: payload.scanCompletedAt });
        if (state.dbManager) state.dbManager.saveFolderState({ providerType: state.providerType, folderId: state.currentFolder.id, imageCount: fileCount, fileCount, lastUpdated: payload.lastUpdated, sourceModifiedTime: payload.sourceModifiedTime, scanCompletedAt: payload.scanCompletedAt }).catch(e => {});
        Folders.updateLastFolderBanner();
    },
    isNavigationActive(token = null) { if (state.isReturningToFolders) return false; if (state.activeRequests?.signal?.aborted) return false; if (token && token !== state.navigationToken) return false; return true; },
    async returnToFolderSelection() {
        if (state.isReturningToFolders) return;
        state.isReturningToFolders = true; state.navigationToken = Symbol('navigation');
        const { backButton, backButtonSpinner, emptyState } = Utils.elements;
        if (backButton) backButton.disabled = true; if (backButtonSpinner) backButtonSpinner.style.display = 'inline-block'; if (emptyState) emptyState.classList.add('hidden');
        Utils.showScreen('folder-screen');
        try { if (state.syncManager) await state.syncManager.flush({ reason: 'folder-switch' }); state.activeRequests?.abort(); state.activeRequests = new AbortController(); this.resetViewState({ skipEmptyState: true }); await Folders.load(); }
        catch(e) { Utils.showToast(`Error returning to folders: ${e.message}`, 'error', true); Utils.showScreen('folder-screen'); }
        finally { if (backButton) backButton.disabled = false; if (backButtonSpinner) backButtonSpinner.style.display = 'none'; state.isReturningToFolders = false; }
    },
    resetViewState(options = {}) {
        const { skipEmptyState = false } = options;
        state.imageFiles = []; state.stacks = { in: [], out: [], priority: [], trash: [] }; state.currentStack = 'in'; state.currentStackPosition = 0; Core.updateStackCounts();
        const { centerImage, emptyState, detailsButton } = Utils.elements;
        if (centerImage) { centerImage.style.opacity = '0'; centerImage.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; if (skipEmptyState) centerImage.alt = 'Select a folder to start'; requestAnimationFrame(() => { centerImage.style.opacity = '1'; }); }
        if (!skipEmptyState) Core.showEmptyState(); if (emptyState) emptyState.classList.add('hidden'); if (detailsButton) detailsButton.style.display = 'none';
    },
    async updateUserMetadata(fileId, updates, options = {}) {
        const { skipDebounce = false, operationType = 'metadata:update', origin = 'ui', awaitLocalPersistence = false, skipProviderSync = false, providerSilent = false } = options;
        try {
            const file = state.imageFiles.find(f => f.id === fileId); if (!file) return;
            const timestamp = Date.now(); Object.assign(file, updates, { localUpdatedAt: timestamp });
            const ms = state.dbManager.scheduleMetadataSave(file.id, { ...file }, { folderId: state.currentFolder.id, providerType: state.providerType }, { priority: skipDebounce ? 'high' : 'normal' });
            const fcs = state.dbManager.scheduleFolderCacheSave(state.currentFolder.id, state.imageFiles, { priority: skipDebounce ? 'high' : 'normal' });
            if (awaitLocalPersistence) await Promise.all([ms, fcs]);
            if (state.syncManager && !skipProviderSync) {
                const change = { fileId, updates, operationType, origin, localUpdatedAt: timestamp, folderId: state.currentFolder.id, providerType: state.providerType, metadataSnapshot: { name: file.name, stack: file.stack, stackSequence: file.stackSequence, folderId: state.currentFolder.id } };
                const qo = { debounce: !skipDebounce }; if (skipDebounce || providerSilent) { qo.fireAndForget = true; qo.onImmediateFailure = (e) => { if (!providerSilent) Utils.showToast(`Immediate sync failed: ${e?.message}`, 'error', true); }; }
                const qp = state.syncManager.queueLocalChange(change, qo);
                if (!skipDebounce && !providerSilent && qp && typeof qp.then === 'function') await qp;
            }
        } catch(e) { Utils.showToast(`Failed to update metadata: ${e.message}`, 'error', true); }
    },
    async deleteFile(fileId, options = {}) {
        const { source = 'ui', originStack = null, name = null } = options;
        const fileIndex = state.imageFiles.findIndex(f => f.id === fileId); let file = null; let stackRemoval = null;
        if (fileIndex > -1) { const removed = state.imageFiles.splice(fileIndex, 1); file = removed?.[0] || null; if (file?.stack && state.stacks[file.stack]) { const si = state.stacks[file.stack].findIndex(f => f.id === fileId); if (si > -1) { stackRemoval = { name: file.stack, index: si }; state.stacks[file.stack].splice(si, 1); } } }
        const persistState = async () => { await state.dbManager.scheduleFolderCacheSave(state.currentFolder.id, state.imageFiles, { priority: 'high' }); };
        const restoreState = async (reason) => { if (!file) return false; if (fileIndex > -1) state.imageFiles.splice(fileIndex, 0, file); else state.imageFiles.push(file); if (stackRemoval && state.stacks[stackRemoval.name]) state.stacks[stackRemoval.name].splice(stackRemoval.index, 0, file); else if (file.stack && state.stacks[file.stack] && !stackRemoval) state.stacks[file.stack].push(file); await persistState(); return true; };
        await persistState();
        const provider = state.provider;
        if (!provider || typeof provider.deleteFile !== 'function') { await restoreState('missing provider'); Utils.showToast('Provider recycle bin unavailable.', 'error', true); return false; }
        try { await provider.deleteFile(fileId); return true; } catch(e) { await restoreState('provider failure'); Utils.showToast(`Failed to move to recycle bin: ${e.message}`, 'error', true); return false; }
    },
    async resetCurrentFolder() {
        const folderId = state.currentFolder?.id; if (!folderId) { Utils.showToast('No folder selected', 'error'); return; }
        try { const cf = await state.dbManager.getFolderCache(folderId) || []; await state.dbManager.clearFolderData({ providerType: state.providerType, folderId }, cf.map(f => f.id)); await state.folderSyncCoordinator?.markRequiresFullResync(folderId, 'user-reset'); state.sessionVisitedFolders.delete(`${state.providerType||'unknown'}::${folderId}`); Utils.showToast('Folder cache cleared. Resyncing...', 'info'); const nt = Symbol('navigation'); state.navigationToken = nt; await this.loadImages({ forceFullResync: true, navigationToken: nt }); }
        catch(e) { Utils.showToast(`Reset failed: ${e.message}`, 'error', true); }
    },
    async extractMetadataInBackground(pngFiles) { const BS = 5; for (let i = 0; i < pngFiles.length; i += BS) { if (state.activeRequests.signal.aborted) return; await Promise.allSettled(pngFiles.slice(i, i+BS).map(f => (f.metadataStatus === 'pending' || f.metadataStatus === 'queued') ? this.processFileMetadata(f) : Promise.resolve())); } },
    async processFileMetadata(file) {
        if (['loaded','loading','error'].includes(file.metadataStatus)) return;
        file.metadataStatus = 'loading';
        try { const metadata = await state.metadataExtractor.fetchMetadata(file); let fm = { ...file }; if (metadata.error) { fm.metadataStatus = 'error'; fm.extractedMetadata = { 'Error': metadata.error }; } else { fm.metadataStatus = 'loaded'; fm.extractedMetadata = metadata; } state.dbManager.scheduleMetadataSave(file.id, fm, { folderId: state.currentFolder.id, providerType: state.providerType }); Object.assign(file, fm); }
        catch(e) { if (e.name === 'AbortError') return; file.metadataStatus = 'error'; file.extractedMetadata = { 'Error': e.message }; state.dbManager.scheduleMetadataSave(file.id, file, { folderId: state.currentFolder.id, providerType: state.providerType }); }
    }
};

const Core = {
    initializeStacks() { STACKS.forEach(s => { state.stacks[s] = []; }); state.imageFiles.forEach(f => { const s = f.stack || 'in'; if (STACKS.includes(s)) state.stacks[s].push(f); else state.stacks.in.push(f); }); STACKS.forEach(s => { state.stacks[s] = this.sortFiles(state.stacks[s]); }); this.updateStackCounts(); },
    sortFiles(files) { return [...files].sort((a,b) => { const sa = a.stackSequence || 0; const sb = b.stackSequence || 0; if (sb !== sa) return sb - sa; return (a.name||'').localeCompare(b.name||''); }); },
    updateStackCounts() { STACKS.forEach(s => { const c = state.stacks[s] ? state.stacks[s].length : 0; const pill = document.getElementById(`pill-${s}`); if (pill) { pill.textContent = c > 999 ? ':)' : c; pill.classList.toggle('visible', c > 0); } }); },
    initializeImageDisplay() { if (state.imageFiles.length === 0) { this.showEmptyState(); return; } state.currentStackPosition = 0; state.currentStack = 'in'; this.displayTopImageFromStack('in'); this.updateActiveProxTab(); this.updateStackCounts(); },
    async displayTopImageFromStack(stackName) { try { const stack = state.stacks[stackName]; if (!stack || stack.length === 0) { this.showEmptyState(); return; } Utils.elements.emptyState.classList.add('hidden'); state.currentStack = stackName; state.currentStackPosition = 0; await this.displayCurrentImage(); this.updateActiveProxTab(); } catch(e) { Utils.showToast(`Error displaying stack: ${e.message}`, 'error', true); } },
    async displayCurrentImage() {
        const csa = state.stacks[state.currentStack]; if (!csa || csa.length === 0) { this.showEmptyState(); return; }
        if (state.currentStackPosition >= csa.length) state.currentStackPosition = csa.length - 1;
        if (state.currentStackPosition < 0) state.currentStackPosition = 0;
        const cf = csa[state.currentStackPosition]; if (!cf) { this.showEmptyState(); return; }
        try {
            Utils.elements.detailsButton.style.display = 'flex'; Utils.elements.emptyState.classList.add('hidden');
            this.updateImageCounters(); this.updateFavoriteButton();
            await Utils.setImageSrc(Utils.elements.centerImage, cf);
            state.currentScale = 1; state.panOffset = { x: 0, y: 0 }; this.applyTransform();
            if (cf.metadataStatus === 'pending') { cf.metadataStatus = 'queued'; Utils.defer(() => { if (cf.metadataStatus === 'pending' || cf.metadataStatus === 'queued') App.processFileMetadata(cf); }, { priority: 'background', timeout: 300 }); }
        } catch(e) { Utils.showToast(`Error loading image: ${e.message}`, 'error', true); }
    },
    updateImageCounters() { const stack = state.stacks[state.currentStack]; const total = stack ? stack.length : 0; const current = total > 0 ? state.currentStackPosition + 1 : 0; const text = total > 0 ? `Item ${current} / ${total}` : 'No items'; if (Utils.elements.normalImageCount) { Utils.elements.normalImageCount.textContent = text; } if (Utils.elements.focusImageCount) { Utils.elements.focusImageCount.textContent = text; } if (Utils.elements.focusStackName) { Utils.elements.focusStackName.textContent = STACK_NAMES[state.currentStack] || state.currentStack; } },
    updateFavoriteButton() { const cf = state.stacks[state.currentStack]?.[state.currentStackPosition]; if (!cf) { if (Utils.elements.focusFavoriteBtn) { Utils.elements.focusFavoriteBtn.classList.remove('favorited'); Utils.elements.focusFavoriteBtn.setAttribute('aria-pressed', 'false'); } return; } const isFav = Utils.isFavorite(cf); if (Utils.elements.focusFavoriteBtn) { Utils.elements.focusFavoriteBtn.classList.toggle('favorited', isFav); Utils.elements.focusFavoriteBtn.setAttribute('aria-pressed', isFav ? 'true' : 'false'); } },
    applyTransform() { Utils.elements.centerImage.style.transform = `scale(${state.currentScale}) translate(${state.panOffset.x}px, ${state.panOffset.y}px)`; },
    updateActiveProxTab() { STACKS.forEach(s => { const p = document.getElementById(`pill-${s}`); if (p) p.classList.remove('active'); }); const cp = document.getElementById(`pill-${state.currentStack}`); if (cp) cp.classList.add('active'); },
    async moveToStack(targetStack, options = {}) {
        const { source = 'ui:direct' } = options;
        if (state.isImageTransitioning) return; const csa = state.stacks[state.currentStack]; if (!csa || csa.length === 0) return; const ci = csa[state.currentStackPosition]; if (!ci) return;
        try {
            state.isImageTransitioning = true; const origStack = state.currentStack; const movedId = ci.id;
            if (targetStack === origStack) { const others = csa.filter(img => img.id !== ci.id); const minSeq = others.length > 0 ? Math.min(...others.map(i => i.stackSequence||0)) : Date.now(); const newSeq = minSeq - 1; const [item] = csa.splice(state.currentStackPosition, 1); item.stackSequence = newSeq; csa.push(item); App.updateUserMetadata(ci.id, { stackSequence: newSeq }, { skipDebounce: true, operationType: 'stack:resequence', providerSilent: true }).catch(e => {}); }
            else { const newSeq = Date.now(); const [item] = csa.splice(state.currentStackPosition, 1); item.stack = targetStack; item.stackSequence = newSeq; state.stacks[targetStack].unshift(item); state.stacks[targetStack] = this.sortFiles(state.stacks[targetStack]); App.updateUserMetadata(ci.id, { stack: targetStack, stackSequence: newSeq }, { skipDebounce: true, operationType: 'stack:move', providerSilent: true }).catch(e => {}); }
            this.updateStackCounts(); this.updateActiveProxTab(); await this.displayCurrentImage();
            if (targetStack === origStack) Grid.syncWithStack(origStack, { preselectFirst: true });
            else { Grid.syncWithStack(origStack, { removedIds: [movedId], preselectFirst: true }); Grid.syncWithStack(targetStack, { preselectFirst: false }); }
        } catch(e) { Utils.showToast(`Error moving image: ${e.message}`, 'error', true); } finally { state.isImageTransitioning = false; }
    },
    async deleteCurrentImage(options = {}) {
        const { exitFocusIfEmpty = true, source = 'ui:direct' } = options;
        if (state.isImageTransitioning) return; const csn = state.currentStack; const csa = state.stacks[csn]; if (!csa || csa.length === 0) return;
        const prevPos = state.currentStackPosition; const cf = csa[prevPos]; if (!cf) return;
        state.isImageTransitioning = true; const fileId = cf.id; const origStack = cf.stack || csn;
        try {
            const deleteReq = App.deleteFile(fileId, { source, originStack: origStack, name: cf.name });
            this.updateStackCounts();
            const updated = state.stacks[csn] || [];
            if (updated.length === 0) { state.currentStackPosition = 0; if (state.isFocusMode && exitFocusIfEmpty) Gestures.toggleFocusMode(); this.showEmptyState(); }
            else { let ni = prevPos; if (ni >= updated.length) ni = updated.length - 1; if (ni < 0) ni = 0; state.currentStackPosition = ni; await this.displayCurrentImage(); }
            const moved = await deleteReq;
            if (!moved) { await this.displayCurrentImage(); return; }
            Utils.showToast('Moved to provider recycle bin.', 'info', true);
            Grid.syncWithStack(origStack, { removedIds: [fileId], preselectFirst: false });
        } catch(e) { Utils.showToast(`Failed to delete ${cf.name}`, 'error', true); } finally { state.isImageTransitioning = false; }
    },
    showEmptyState() {
        state.currentImageLoadId = null; Utils.elements.centerImage.style.opacity = '0'; Utils.elements.detailsButton.style.display = 'none'; this.updateImageCounters();
        const skip = state.isReturningToFolders;
        setTimeout(() => { Utils.elements.centerImage.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; Utils.elements.centerImage.alt = 'No images in this stack'; if (skip) Utils.elements.emptyState.classList.add('hidden'); else { Utils.elements.emptyState.classList.remove('hidden'); UI.updateEmptyStateButtons(); } Utils.elements.centerImage.style.opacity = '1'; }, 200);
    }
};

const Grid = {
    open(stack) { this.clearDragState(); Utils.showModal('grid-modal'); Utils.elements.gridTitle.textContent = STACK_NAMES[stack] || stack; state.grid.stack = stack; state.grid.isDirty = false; state.grid.skipReorderOnClose = false; state.grid.dragSession = createDefaultGridDragSession(); state.grid.isDragging = false; const v = Utils.elements.gridSize.value; Utils.elements.gridContainer.style.gridTemplateColumns = `repeat(${v}, 1fr)`; state.grid.selected = []; state.grid.filtered = []; Utils.elements.gridContainer.innerHTML = ''; this.initializeLazyLoad(stack); this.updateSelectionUI(); Core.updateStackCounts(); },
    async close() { this.clearDragState(); try { if (state.grid.isDirty && !state.grid.skipReorderOnClose) await this.reorderStackOnClose(); Utils.hideModal('grid-modal'); this.resetSearch(); this.destroyLazyLoad(); const si = state.grid.selected; if (si.length === 1) { const idx = state.stacks[state.currentStack].findIndex(f => f.id === si[0]); if (idx !== -1) state.currentStackPosition = idx; } await Core.displayCurrentImage(); state.grid.stack = null; state.grid.selected = []; state.grid.skipReorderOnClose = false; } catch(e) { Utils.showToast(`Error closing grid: ${e.message}`, 'error', true); state.grid.skipReorderOnClose = false; } },
    handleIntersection(entries) { if (entries[0].isIntersecting) this.renderBatch(); },
    initializeLazyLoad(stack, filesOverride = null) { const ls = state.grid.lazyLoadState; const sf = state.stacks[stack] || []; ls.allFiles = Array.isArray(filesOverride) ? filesOverride : (state.grid.filtered.length > 0 ? state.grid.filtered : sf); ls.renderedCount = 0; Utils.elements.selectAllBtn.textContent = ls.allFiles.length; this.renderBatch(); if (ls.observer) ls.observer.disconnect(); ls.observer = new IntersectionObserver(this.handleIntersection.bind(this), { root: Utils.elements.gridContent, rootMargin: '400px' }); const sentinel = document.getElementById('grid-sentinel'); if (sentinel) ls.observer.observe(sentinel); },
    destroyLazyLoad() { const ls = state.grid.lazyLoadState; if (ls.observer) { ls.observer.disconnect(); ls.observer = null; } ls.allFiles = []; ls.renderedCount = 0; },
    renderBatch() {
        const ls = state.grid.lazyLoadState; const container = Utils.elements.gridContainer;
        const files = ls.allFiles.slice(ls.renderedCount, ls.renderedCount + ls.batchSize);
        const oldSentinel = document.getElementById('grid-sentinel'); if (oldSentinel && ls.observer) { ls.observer.unobserve(oldSentinel); oldSentinel.remove(); }
        const selectedIds = new Set(state.grid.selected); const fragment = document.createDocumentFragment();
        files.forEach(file => {
            const div = document.createElement('div'); div.className = 'grid-item'; div.dataset.fileId = file.id;
            if (selectedIds.has(file.id)) div.classList.add('selected');
            const img = document.createElement('img'); img.className = 'grid-image'; img.alt = file.name || 'Image'; img.loading = 'lazy';
            img.onload = () => img.classList.add('loaded');
            img.onerror = () => { img.src = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27150%27 height=%27150%27%3E%3Crect width=%27150%27 height=%27150%27 fill=%27%23E5E7EB%27/%3E%3C/svg%3E'; img.classList.add('loaded'); };
            img.src = Utils.getPreferredImageUrl(file);
            div.addEventListener('click', e => this.toggleSelection(e, file.id));
            div.appendChild(img); div.appendChild(this.createDragHandle(div, file.id)); fragment.appendChild(div);
        });
        container.appendChild(fragment); ls.renderedCount += files.length;
        if (ls.renderedCount < ls.allFiles.length) { const sentinel = document.createElement('div'); sentinel.id = 'grid-sentinel'; container.appendChild(sentinel); if (ls.observer) ls.observer.observe(sentinel); }
    },
    createDragHandle(gridItem, fileId) { const h = document.createElement('button'); h.type = 'button'; h.className = 'grid-drag-handle'; h.textContent = '\u2807'; h.setAttribute('aria-label', 'Drag to reorder'); h.addEventListener('pointerdown', e => { e.stopPropagation(); this.startDrag(e, fileId, gridItem); }); h.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); }); return h; },
    startDrag(event, fileId, gridItem) { if (state.grid.isDragging || !state.grid.stack) return; if (event.pointerType === 'mouse' && event.button !== 0) return; if (!state.grid.selected.includes(fileId)) { this.deselectAll(); state.grid.selected = [fileId]; gridItem.classList.add('selected'); this.updateSelectionUI(); } const selectedIds = state.grid.selected.length > 0 ? [...state.grid.selected] : [fileId]; const draggedElements = []; const ss = new Set(selectedIds); Utils.elements.gridContainer?.querySelectorAll('.grid-item').forEach(t => { if (ss.has(t.dataset.fileId)) { t.classList.add('dragging'); draggedElements.push(t); } }); if (draggedElements.length === 0) { gridItem.classList.add('dragging'); draggedElements.push(gridItem); } document.body.style.userSelect = 'none'; state.grid.isDragging = true; state.grid.dragSession = { ...createDefaultGridDragSession(), active: true, pointerId: event.pointerId ?? null, selectedIds, dragElements: draggedElements }; this._dragMoveHandler = this.handlePointerMove.bind(this); this._dragEndHandler = this.handlePointerRelease.bind(this); window.addEventListener('pointermove', this._dragMoveHandler, { passive: false }); window.addEventListener('pointerup', this._dragEndHandler); window.addEventListener('pointercancel', this._dragEndHandler); if (event.cancelable) event.preventDefault(); },
    handlePointerMove(event) { const s = state.grid.dragSession; if (!s.active) return; if (s.pointerId !== null && event.pointerId !== s.pointerId) return; if (event.cancelable) event.preventDefault(); const el = document.elementFromPoint(event.clientX, event.clientY); const tile = el ? el.closest('.grid-item') : null; this.setDropTarget(tile && tile.id !== 'grid-sentinel' ? tile : null); },
    async handlePointerRelease(event) { const s = state.grid.dragSession; if (!s.active) return; if (s.pointerId !== null && event.pointerId !== s.pointerId) return; this.detachDragListeners(); if (event.type === 'pointercancel') { this.clearDragState(); return; } if (event.cancelable) event.preventDefault(); if (!s.dropTarget) { this.clearDragState(); return; } const dtid = s.dropTarget.dataset.fileId; if (!dtid || s.selectedIds.includes(dtid)) { this.clearDragState(); return; } const ls = state.grid.lazyLoadState || {}; const af = Array.isArray(ls.allFiles) ? ls.allFiles : []; let ti = af.findIndex(f => f.id === dtid); if (ti === -1) ti = af.length; try { await this.applyReorder(s.selectedIds, ti); } catch(e) { Utils.showToast(`Error reordering: ${e.message}`, 'error', true); } finally { this.clearDragState(); } },
    async applyReorder(selectedIds, targetIndex) {
        if (!Array.isArray(selectedIds) || selectedIds.length === 0) return; const sn = state.grid.stack; if (!sn) return; const sa = state.stacks[sn]; if (!Array.isArray(sa) || sa.length === 0) return;
        const ls = state.grid.lazyLoadState || {}; const af = (Array.isArray(ls.allFiles) && ls.allFiles.length > 0) ? ls.allFiles : sa;
        const ss = new Set(selectedIds); const moving = []; const remaining = []; sa.forEach(f => { if (ss.has(f.id)) moving.push(f); else remaining.push(f); });
        if (moving.length === 0) return;
        const ci = Math.max(0, Math.min(Number.isFinite(targetIndex) ? targetIndex : 0, af.length));
        let ii = remaining.length; if (ci < af.length) { let count = 0; for (let i = 0; i < ci; i++) { if (af[i] && !ss.has(af[i].id)) count++; } ii = Math.min(count, remaining.length); }
        const newOrder = [...remaining.slice(0,ii), ...moving, ...remaining.slice(ii)];
        let hasChanges = sa.length !== newOrder.length; if (!hasChanges) { for (let i = 0; i < sa.length; i++) if (sa[i].id !== newOrder[i].id) { hasChanges = true; break; } }
        if (!hasChanges) { state.grid.isDirty = false; state.grid.skipReorderOnClose = true; return; }
        const timestamp = Date.now(); const uq = []; newOrder.forEach((f,idx) => { const ns = timestamp - idx; if (f.stackSequence !== ns) uq.push({ fileId: f.id, newSequence: ns }); f.stackSequence = ns; });
        state.stacks[sn] = newOrder;
        if (state.grid.filtered.length > 0) { const fids = new Set(state.grid.filtered.map(f => f.id)); state.grid.filtered = newOrder.filter(f => fids.has(f.id)); state.grid.lazyLoadState.allFiles = state.grid.filtered; } else { state.grid.lazyLoadState.allFiles = newOrder; }
        state.grid.selected = [...selectedIds]; state.grid.isDirty = false; state.grid.skipReorderOnClose = true;
        if (Utils.elements.gridContainer) Utils.elements.gridContainer.innerHTML = '';
        this.initializeLazyLoad(sn); this.updateSelectionUI(); Core.updateStackCounts();
        if (sn === state.currentStack) { const aid = state.stacks[sn][state.currentStackPosition]?.id; if (aid) { const ni = state.stacks[sn].findIndex(f => f.id === aid); if (ni !== -1) state.currentStackPosition = ni; } await Core.displayCurrentImage(); }
        if (uq.length > 0) Utils.defer(async () => { await Promise.allSettled(uq.map(u => App.updateUserMetadata(u.fileId, { stackSequence: u.newSequence }, { skipDebounce: true, operationType: 'stack:reorder', origin: 'grid:drag', providerSilent: true, skipProviderSync: true }))); }, { priority: 'high', timeout: 32 });
    },
    detachDragListeners() { if (this._dragMoveHandler) { window.removeEventListener('pointermove', this._dragMoveHandler); this._dragMoveHandler = null; } if (this._dragEndHandler) { window.removeEventListener('pointerup', this._dragEndHandler); window.removeEventListener('pointercancel', this._dragEndHandler); this._dragEndHandler = null; } },
    setDropTarget(tile) { const s = state.grid.dragSession; if (s.dropTarget === tile) return; if (s.dropTarget) s.dropTarget.classList.remove('drop-target'); if (tile) { tile.classList.add('drop-target'); s.dropTarget = tile; } else { s.dropTarget = null; } },
    clearDragState() { const s = state.grid.dragSession || {}; if (s.dropTarget) s.dropTarget.classList.remove('drop-target'); if (s.dragElements?.length) s.dragElements.forEach(el => el.classList.remove('dragging')); document.body.style.userSelect = ''; this.resetDragSession(); },
    resetDragSession() { this.detachDragListeners(); state.grid.dragSession = createDefaultGridDragSession(); state.grid.isDragging = false; },
    toggleSelection(e, fileId) { const gi = e.currentTarget; const idx = state.grid.selected.indexOf(fileId); if (idx === -1) { state.grid.selected.push(fileId); gi.classList.add('selected'); } else { state.grid.selected.splice(idx, 1); gi.classList.remove('selected'); } state.grid.isDirty = true; state.grid.skipReorderOnClose = false; this.updateSelectionUI(); },
    updateSelectionUI() { const c = state.grid.selected.length; const btns = [Utils.elements.tagSelected, Utils.elements.notesSelected, Utils.elements.moveSelected, Utils.elements.deleteSelected, Utils.elements.exportSelected, Utils.elements.folderSelected]; Utils.elements.selectionText.textContent = `${c} selected`; btns.forEach(b => { if (b) b.disabled = (c === 0); }); },
    selectAll() { state.grid.selected = state.grid.lazyLoadState.allFiles.map(f => f.id); document.querySelectorAll('#grid-container .grid-item').forEach(i => i.classList.add('selected')); state.grid.isDirty = true; state.grid.skipReorderOnClose = false; this.updateSelectionUI(); },
    deselectAll() { document.querySelectorAll('#grid-container .grid-item.selected').forEach(i => i.classList.remove('selected')); state.grid.selected = []; state.grid.skipReorderOnClose = false; this.updateSelectionUI(); },
    performSearch() { const q = Utils.elements.omniSearch.value.trim(); Utils.elements.clearSearchBtn.style.display = q ? 'block' : 'none'; if (!q) { this.resetSearch(); return; } const results = this.searchImages(q); state.grid.filtered = results; Utils.elements.selectAllBtn.textContent = String(results.length); if (results.length === 0) { state.grid.selected = []; Utils.elements.gridEmptyState.classList.remove('hidden'); } else { state.grid.selected = results.map(f => f.id); Utils.elements.gridEmptyState.classList.add('hidden'); } Utils.elements.gridContainer.innerHTML = ''; this.initializeLazyLoad(state.grid.stack, results); this.updateSelectionUI(); state.grid.isDirty = true; state.grid.skipReorderOnClose = false; this.updateFocusAfterSearch(results); },
    updateFocusAfterSearch(results = []) { if (!results.length) return; const sn = state.grid.stack; if (!sn || sn !== state.currentStack) return; const fid = results[0]?.id; if (!fid) return; const ti = (state.stacks[sn]||[]).findIndex(f => f.id === fid); if (ti === -1) return; if (state.currentStackPosition !== ti) state.currentStackPosition = ti; Core.displayCurrentImage(); Core.updateImageCounters(); },
    resetSearch() { Utils.elements.omniSearch.value = ''; Utils.elements.clearSearchBtn.style.display = 'none'; Utils.elements.gridEmptyState.classList.add('hidden'); state.grid.filtered = []; Utils.elements.gridContainer.innerHTML = ''; this.initializeLazyLoad(state.grid.stack); Core.updateStackCounts(); this.deselectAll(); state.grid.skipReorderOnClose = false; },
    syncWithStack(stackName, options = {}) { if (!stackName) return; const { removedIds = [], preselectFirst = true, selectedId = null } = options; if (removedIds.length > 0) { state.grid.selected = state.grid.selected.filter(id => !removedIds.includes(id)); state.grid.filtered = state.grid.filtered.filter(f => !removedIds.includes(f.id)); } if (state.grid.stack !== stackName) return; const af = state.grid.filtered.length > 0 ? state.grid.filtered : (state.stacks[stackName]||[]); if (selectedId) { const sf = af.find(f => f.id === selectedId); state.grid.selected = sf ? [sf.id] : []; } else if (preselectFirst) { const cfid = state.stacks[stackName]?.[state.currentStackPosition]?.id; const pf = cfid ? af.find(f => f.id === cfid) : null; if (pf) state.grid.selected = [pf.id]; else if (af.length > 0) state.grid.selected = [af[0].id]; else state.grid.selected = []; } Utils.elements.gridContainer.innerHTML = ''; this.initializeLazyLoad(stackName, af); this.updateSelectionUI(); state.grid.isDirty = true; state.grid.skipReorderOnClose = false; },
    searchImages(query) {
        const lq = query.toLowerCase(); const terms = lq.split(/\s+/).filter(Boolean);
        const mods = terms.filter(t => t.startsWith('#')); const excl = terms.filter(t => t.startsWith('-')).map(t => t.substring(1)); const incl = terms.filter(t => !t.startsWith('#') && !t.startsWith('-'));
        let results = [...state.stacks[state.grid.stack]]; const tagFilters = [];
        mods.forEach(m => { if (m === '#favorite') results = results.filter(f => Utils.isFavorite(f)); else if (m.startsWith('#quality:')) { const r = parseInt(m.split(':')[1]); if (!isNaN(r)) results = results.filter(f => f.qualityRating === r); } else if (m.startsWith('#content:')) { const r = parseInt(m.split(':')[1]); if (!isNaN(r)) results = results.filter(f => f.contentRating === r); } else if (m.length > 1) { const nt = TagService.normalizeTagValue(m); if (nt.length > 1) tagFilters.push(nt.toLowerCase()); } });
        if (tagFilters.length > 0) results = results.filter(f => { const tags = TagService.normalizeTagList(f.tags||[]).map(t => t.toLowerCase()); return tagFilters.every(t => tags.includes(t)); });
        incl.forEach(term => { results = results.filter(f => { const st = [f.name||'', f.tags?.join(' ')||'', f.notes||'', f.createdTime ? new Date(f.createdTime).toISOString().split('T')[0] : '', JSON.stringify(f.extractedMetadata||{})].join(' ').toLowerCase(); return st.includes(term); }); });
        excl.forEach(term => { results = results.filter(f => { const st = [f.name||'', f.tags?.join(' ')||'', f.notes||'', f.createdTime ? new Date(f.createdTime).toISOString().split('T')[0] : '', JSON.stringify(f.extractedMetadata||{})].join(' ').toLowerCase(); return !st.includes(term); }); });
        return results;
    },
    async reorderStackOnClose() { const sa = state.stacks[state.grid.stack]; let top = [], bottom = []; if (state.grid.filtered.length > 0) { const fids = new Set(state.grid.filtered.map(f => f.id)); top = state.grid.filtered.sort((a,b) => a.name.localeCompare(b.name)); bottom = sa.filter(f => !fids.has(f.id)); } else if (state.grid.selected.length > 0) { const sids = new Set(state.grid.selected); top = sa.filter(f => sids.has(f.id)).sort((a,b) => a.name.localeCompare(b.name)); bottom = sa.filter(f => !sids.has(f.id)); } else return; const ns = [...top, ...bottom]; const ts = Date.now(); ns.forEach((f,i) => { f.stackSequence = ts - i; }); ns.forEach(f => { state.dbManager.scheduleMetadataSave(f.id, {...f}, { folderId: state.currentFolder.id, providerType: state.providerType }, { priority: 'high' }); }); state.dbManager.scheduleFolderCacheSave(state.currentFolder.id, state.imageFiles, { priority: 'high' }); state.stacks[state.grid.stack] = ns; state.currentStackPosition = 0; Utils.showToast('Stack order updated', 'success'); }
};
