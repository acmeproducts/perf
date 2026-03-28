// ===== pic-v1-providers.js =====
// BaseProvider, GoogleDriveProvider, OneDriveProvider, ExportSystem
// Plain script globals — no ES module imports/exports
// Extracted verbatim from ui-v1.html (Orbital8 Goji V1 Canonical)

class BaseProvider {
    constructor() { if (this.constructor === BaseProvider) throw new Error("Abstract classes can't be instantiated."); }
    async authenticate() { throw new Error("Method 'authenticate()' must be implemented."); }
    async disconnect() { throw new Error("Method 'disconnect()' must be implemented."); }
    async getFolders() { throw new Error("Method 'getFolders()' must be implemented."); }
    async getFilesAndMetadata(folderId) { throw new Error("Method 'getFilesAndMetadata(folderId)' must be implemented."); }
    async drillIntoFolder(folder) { throw new Error("Method 'drillIntoFolder(folder)' must be implemented."); }
    async navigateToParent() { throw new Error("Method 'navigateToParent()' must be implemented."); }
    async updateFileMetadata(fileId, metadata) { throw new Error("Method 'updateFileMetadata(fileId, metadata)' must be implemented."); }
    async moveFileToFolder(fileId, targetFolderId) { throw new Error("Method 'moveFileToFolder(fileId, targetFolderId)' must be implemented."); }
    async deleteFile(fileId) { throw new Error("Method 'deleteFile(fileId)' must be implemented."); }
}

class GoogleDriveProvider extends BaseProvider {
    constructor() {
        super();
        this.name = 'googledrive';
        this.clientId = '567988062464-fa6c1ovesqeudqs5398vv4mbo6q068p9.apps.googleusercontent.com';
        this.redirectUri = window.location.origin + window.location.pathname;
        this.scope = 'https://www.googleapis.com/auth/drive';
        this.apiBase = 'https://www.googleapis.com/drive/v3';
        this.accessToken = null; this.refreshToken = null; this.clientSecret = null;
        this.isAuthenticated = false; this.onProgressCallback = null;
        this.activeFolderCacheKey = null;
        this.currentParentId = 'root'; this.currentParentPath = 'My Drive';
        this.breadcrumb = [{ id: 'root', name: 'My Drive' }];
        this.folderImageCountCache = new Map(); this.folderHasImagesCache = new Map();
        this.loadStoredCredentials(); this.bindSharedFolderCaches();
    }
    normalizeDriveFileMetadata(file, options = {}) {
        const target = options.target || file;
        const targetId = target?.id || null; const fallbackId = targetId || file?.id || null;
        const effectiveId = options.useShortcutId ? file.id : fallbackId;
        const resolvedUrls = DriveLinkHelper.resolveFileUrls(file, { target, fileId: fallbackId });
        const resourceKey = resolvedUrls.resourceKey; const viewUrl = resolvedUrls.viewUrl;
        const apiDownloadUrl = target?.webContentLink || (fallbackId ? DriveLinkHelper.buildApiDownloadUrl(fallbackId, resourceKey) : null);
        const downloadUrl = resolvedUrls.directUrl || apiDownloadUrl;
        const sizeValue = target?.size != null ? Number(target.size) : null;
        const normalized = {
            id: effectiveId, name: file?.name || target?.name, type: 'file', mimeType: target?.mimeType,
            size: Number.isFinite(sizeValue) ? sizeValue : 0,
            createdTime: target?.createdTime || file?.createdTime, modifiedTime: target?.modifiedTime || file?.modifiedTime,
            thumbnailLink: DriveLinkHelper.normalizeToAssetUrl(target?.thumbnailLink || file?.thumbnailLink, fallbackId, resourceKey) || target?.thumbnailLink || file?.thumbnailLink,
            downloadUrl, permanentImageUrl: downloadUrl, viewUrl, permanentViewUrl: viewUrl,
            driveApiDownloadUrl: apiDownloadUrl,
            permanentThumbnailUrl: resolvedUrls.thumbnailUrl, permanentThumbnailUrlSmall: resolvedUrls.thumbnailUrlSmall,
            appProperties: target?.appProperties || file?.appProperties || {},
            parents: file?.parents || target?.parents || [],
            targetFileId: targetId || fallbackId || null, resourceKey: resourceKey || null
        };
        if (options.useShortcutId) { normalized.shortcutId = file.id; normalized.isShortcut = true; normalized.shortcutDetails = file.shortcutDetails || null; }
        return normalized;
    }
    async fetchRawFilesByIds(fileIds = [], options = {}) {
        if (!Array.isArray(fileIds) || fileIds.length === 0) return [];
        const signal = options.signal;
        const fields = 'id,name,mimeType,size,createdTime,modifiedTime,appProperties,parents,thumbnailLink,webContentLink,webViewLink,resourceKey,shortcutDetails(targetId,targetMimeType,targetResourceKey)';
        const requests = fileIds.map(id => this.makeApiCall(`/files/${id}?fields=${fields}&supportsAllDrives=true&includeItemsFromAllDrives=true`, { signal }));
        const responses = await Promise.allSettled(requests);
        return responses.filter(r => r.status === 'fulfilled').map(r => r.value).filter(Boolean);
    }
    loadStoredCredentials() { this.accessToken = localStorage.getItem(APP_STORAGE_KEYS.googleAccessToken); this.refreshToken = localStorage.getItem(APP_STORAGE_KEYS.googleRefreshToken); this.clientSecret = localStorage.getItem(APP_STORAGE_KEYS.googleClientSecret); this.isAuthenticated = !!(this.accessToken && this.refreshToken && this.clientSecret); }
    getCacheIdentity() { if (this.refreshToken) return `refresh:${this.refreshToken}`; if (this.accessToken) return `access:${this.accessToken}`; return 'anonymous'; }
    bindSharedFolderCaches(options = {}) { const prev = options.previousKey ?? this.activeFolderCacheKey; const { key, entry } = GoogleDriveFolderCacheStore.getOrCreateEntry(this.name, this.getCacheIdentity()); this.activeFolderCacheKey = key; this.folderImageCountCache = entry.folderImageCountCache; this.folderHasImagesCache = entry.folderHasImagesCache; if (options.clearPrevious && prev && prev !== key) GoogleDriveFolderCacheStore.clear(prev); return entry; }
    invalidateSharedFolderCaches() { if (!this.activeFolderCacheKey) return; GoogleDriveFolderCacheStore.clear(this.activeFolderCacheKey); this.activeFolderCacheKey = null; this.folderImageCountCache = new Map(); this.folderHasImagesCache = new Map(); }
    storeCredentials() { if (this.accessToken) localStorage.setItem(APP_STORAGE_KEYS.googleAccessToken, this.accessToken); if (this.refreshToken) localStorage.setItem(APP_STORAGE_KEYS.googleRefreshToken, this.refreshToken); if (this.clientSecret) localStorage.setItem(APP_STORAGE_KEYS.googleClientSecret, this.clientSecret); }
    clearStoredCredentials() { localStorage.removeItem(APP_STORAGE_KEYS.googleAccessToken); localStorage.removeItem(APP_STORAGE_KEYS.googleRefreshToken); localStorage.removeItem(APP_STORAGE_KEYS.googleClientSecret); }
    async authenticate(clientSecret) {
        if (clientSecret) { this.clientSecret = clientSecret; this.storeCredentials(); }
        if (!this.clientSecret) throw new Error('Client secret is required');
        if (this.accessToken && this.refreshToken) { try { await this.makeApiCall('/files?pageSize=1'); this.isAuthenticated = true; return true; } catch(e) {} }
        return new Promise((resolve, reject) => {
            const popup = window.open(this.buildAuthUrl(), 'google-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');
            if (!popup) { reject(new Error('Popup blocked')); return; }
            const checkClosed = setInterval(() => { if (popup.closed) { clearInterval(checkClosed); reject(new Error('Authentication cancelled')); } }, 1000);
            const messageHandler = async (event) => {
                if (event.origin !== window.location.origin) return;
                if (event.data.type === 'GOOGLE_AUTH_SUCCESS') { clearInterval(checkClosed); window.removeEventListener('message', messageHandler); popup.close(); try { await this.exchangeCodeForTokens(event.data.code); this.isAuthenticated = true; resolve(true); } catch(e) { reject(e); } }
                else if (event.data.type === 'GOOGLE_AUTH_ERROR') { clearInterval(checkClosed); window.removeEventListener('message', messageHandler); popup.close(); reject(new Error(event.data.error)); }
            };
            window.addEventListener('message', messageHandler);
        });
    }
    buildAuthUrl() { const params = new URLSearchParams({ client_id: this.clientId, redirect_uri: this.redirectUri, response_type: 'code', scope: this.scope, access_type: 'offline', prompt: 'consent' }); return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`; }
    async exchangeCodeForTokens(code) {
        const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: this.clientId, client_secret: this.clientSecret, code, grant_type: 'authorization_code', redirect_uri: this.redirectUri }) });
        if (!response.ok) throw new Error('Token exchange failed');
        const prev = this.activeFolderCacheKey; const tokens = await response.json();
        this.accessToken = tokens.access_token; this.refreshToken = tokens.refresh_token; this.storeCredentials();
        this.bindSharedFolderCaches({ previousKey: prev, clearPrevious: true });
    }
    async refreshAccessToken() { if (!this.refreshToken || !this.clientSecret) throw new Error('No refresh token'); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: this.clientId, client_secret: this.clientSecret, refresh_token: this.refreshToken, grant_type: 'refresh_token' }) }); if (!r.ok) throw new Error('Failed to refresh token'); const t = await r.json(); this.accessToken = t.access_token; this.storeCredentials(); return this.accessToken; }
    async makeApiCall(endpoint, options = {}, isJson = true) {
        if (!this.accessToken) throw new Error('Not authenticated');
        let url; if (endpoint.startsWith('https://')) url = endpoint; else if (endpoint.startsWith('/upload/drive/')) url = `https://www.googleapis.com${endpoint}`; else url = `${this.apiBase}${endpoint}`;
        const headers = { 'Authorization': `Bearer ${this.accessToken}`, ...options.headers }; if (isJson) headers['Content-Type'] = 'application/json';
        let response = await fetch(url, { ...options, headers });
        if (response.status === 401 && this.refreshToken && this.clientSecret) { try { await this.refreshAccessToken(); headers['Authorization'] = `Bearer ${this.accessToken}`; response = await fetch(url, { ...options, headers }); } catch(e) { this.isAuthenticated = false; this.clearStoredCredentials(); throw new Error('Authentication expired.'); } }
        if (!response.ok) { const t = await response.text(); throw new Error(`API call failed: ${response.status} ${response.statusText} - ${t}`); }
        if (isJson) return await response.json(); return response;
    }
    async loadFoldersInParent(parentId = 'root') {
        const allFolders = []; let nextPageToken = null;
        const query = `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        do { let url = `/files?q=${encodeURIComponent(query)}&fields=files(id,name,createdTime,modifiedTime),nextPageToken&pageSize=100&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true`; if (nextPageToken) url += `&pageToken=${nextPageToken}`; const r = await this.makeApiCall(url); allFolders.push(...(r.files || [])); nextPageToken = r.nextPageToken; } while (nextPageToken);
        return allFolders.map(f => ({ id: f.id, name: f.name, type: 'folder', createdTime: f.createdTime, modifiedTime: f.modifiedTime, hasChildren: true }));
    }
    async getFolders() { this.currentParentId = 'root'; this.currentParentPath = 'My Drive'; this.breadcrumb = [{ id: 'root', name: 'My Drive' }]; return await this.loadFoldersInParent('root'); }
    async filterFoldersWithImages(folders = [], options = {}) {
        if (!Array.isArray(folders) || folders.length === 0) return folders?.slice() || [];
        const signal = options.signal || state?.activeRequests?.signal; const results = new Array(folders.length); let index = 0; let processed = 0;
        Folders.setFolderScanProgress({ active: true, message: 'Scanning folders for images...', current: 0, total: folders.length, currentFolderName: '' });
        const workers = Array.from({ length: Math.min(4, folders.length) }, () => (async () => { while (index < folders.length) { const ci = index++; const folder = folders[ci]; if (!folder) continue; try { Folders.setFolderScanProgress({ active: true, message: 'Scanning folders for images...', current: processed, total: folders.length, currentFolderName: folder.name || '' }); const has = await this.folderHasImages(folder.id, { signal }); if (has) { const merged = { ...folder }; const cc = this.folderImageCountCache.get(folder.id); if (typeof cc === 'number') merged.imageCount = cc; results[ci] = merged; } } catch(e) { console.warn(`Folder check failed for ${folder?.id}:`, e); } finally { processed++; Folders.setFolderScanProgress({ active: true, message: 'Scanning folders for images...', current: processed, total: folders.length, currentFolderName: folder?.name || '' }); } } })());
        await Promise.all(workers); return results.filter(Boolean);
    }
    async folderHasImages(folderId, options = {}) {
        if (!folderId) return false; if (this.folderHasImagesCache.has(folderId)) return this.folderHasImagesCache.get(folderId);
        const cc = this.folderImageCountCache.get(folderId); if (typeof cc === 'number') { const has = cc > 0; this.folderHasImagesCache.set(folderId, has); return has; }
        const query = `'${folderId}' in parents and trashed=false and (mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.shortcut')`;
        const r = await this.makeApiCall(`/files?q=${encodeURIComponent(query)}&fields=files(mimeType,shortcutDetails(targetMimeType))&pageSize=1&supportsAllDrives=true&includeItemsFromAllDrives=true`, { signal: options.signal });
        const files = r?.files || []; const has = files.some(f => f?.mimeType?.startsWith('image/') || (f?.mimeType === 'application/vnd.google-apps.shortcut' && f?.shortcutDetails?.targetMimeType?.startsWith('image/')));
        this.folderHasImagesCache.set(folderId, has); return has;
    }
    async annotateFoldersWithImageCounts(folders = []) {
        if (!Array.isArray(folders) || folders.length === 0) return folders?.slice() || [];
        const results = folders.map(f => ({ ...f })); let index = 0;
        const workers = Array.from({ length: Math.min(4, folders.length) }, () => (async () => { while (index < folders.length) { const ci = index++; const sf = folders[ci]; const tf = results[ci]; if (!sf?.id) continue; try { tf.imageCount = await this.getImageCountForFolder(sf.id); tf.itemCount = tf.imageCount; } catch(e) {} } })());
        await Promise.all(workers); return results;
    }
    async getImageCountForFolder(folderId) {
        if (!folderId) return 0; if (this.folderImageCountCache.has(folderId)) return this.folderImageCountCache.get(folderId);
        let count = 0; let nextPageToken = null;
        const baseQuery = `'${folderId}' in parents and trashed=false and (mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.shortcut')`;
        do { let url = `/files?q=${encodeURIComponent(baseQuery)}&fields=files(mimeType,shortcutDetails(targetMimeType)),nextPageToken&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true`; if (nextPageToken) url += `&pageToken=${nextPageToken}`; const r = await this.makeApiCall(url); (r.files || []).forEach(f => { if (f?.mimeType?.startsWith('image/')) count++; else if (f?.mimeType === 'application/vnd.google-apps.shortcut' && f?.shortcutDetails?.targetMimeType?.startsWith('image/')) count++; }); nextPageToken = r.nextPageToken; } while (nextPageToken);
        this.folderImageCountCache.set(folderId, count); return count;
    }
    async getFilesAndMetadata(folderId = 'root') {
        const allFiles = []; let nextPageToken = null; const signal = state.activeRequests?.signal;
        do {
            const query = `'${folderId}' in parents and trashed=false and (mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.shortcut')`;
            let url = `/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webContentLink,webViewLink,appProperties,parents,resourceKey,shortcutDetails(targetId,targetMimeType,targetResourceKey)),nextPageToken&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;
            if (nextPageToken) url += `&pageToken=${nextPageToken}`;
            const response = await this.makeApiCall(url, { signal }); const files = response.files || [];
            const directImages = []; const shortcutCandidates = [];
            for (const f of files) { if (f?.mimeType?.startsWith('image/')) directImages.push(f); else if (f?.mimeType === 'application/vnd.google-apps.shortcut' && f?.shortcutDetails?.targetMimeType?.startsWith('image/')) shortcutCandidates.push(f); }
            const normalized = directImages.map(f => this.normalizeDriveFileMetadata(f));
            let resolvedShortcuts = [];
            if (shortcutCandidates.length > 0) { const targetIds = [...new Set(shortcutCandidates.map(f => f.shortcutDetails?.targetId).filter(Boolean))]; if (targetIds.length > 0) { const targetFiles = await this.fetchRawFilesByIds(targetIds, { signal }); const targetMap = new Map(targetFiles.map(t => [t.id, t])); resolvedShortcuts = shortcutCandidates.map(s => { const t = targetMap.get(s.shortcutDetails?.targetId); if (!t || !t.mimeType?.startsWith('image/')) return null; return this.normalizeDriveFileMetadata(s, { target: t, useShortcutId: true }); }).filter(Boolean); } }
            allFiles.push(...normalized, ...resolvedShortcuts); nextPageToken = response.nextPageToken;
            if (this.onProgressCallback) this.onProgressCallback({ current: allFiles.length, total: 0, message: 'Fetching from cloud...' });
        } while (nextPageToken);
        return { folders: [], files: allFiles };
    }
    async loadFolderManifest(folderId, options = {}) {
        try { const query = `'${folderId}' in parents and name = '.orbital8-state.json' and trashed=false`; const r = await this.makeApiCall(`/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime,appProperties,parents)&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=1`, { signal: options.signal }); const mf = r.files?.[0]; if (!mf) return null; const fileId = mf.id; let md = {}; try { const mr = await this.makeApiCall(`/files/${fileId}?alt=media`, { method: 'GET', signal: options.signal }, false); md = JSON.parse(await mr.text() || '{}'); } catch(e) { if (/403|404/.test(e.message||'')) return { entries: {}, requiresFullResync: true, cloudVersion: Date.now(), manifestFileId: fileId }; throw e; } return { entries: md.entries || {}, requiresFullResync: Boolean(md.requiresFullResync), cloudVersion: Number(md.cloudVersion || mf.appProperties?.orbital8CloudVersion || Date.now()), manifestFileId: fileId }; }
        catch(e) { if (/403|404/.test(e.message||'')) return { entries: {}, requiresFullResync: true, cloudVersion: Date.now() }; throw e; }
    }
    async getFolderVersion(folderId, options = {}) { try { const query = `'${folderId}' in parents and name = '.orbital8-state.json' and trashed=false`; const r = await this.makeApiCall(`/files?q=${encodeURIComponent(query)}&fields=files(id,appProperties,modifiedTime)&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=1`, { signal: options.signal }); const mf = r.files?.[0]; if (!mf) return null; const v = Number(mf.appProperties?.orbital8CloudVersion ?? (mf.modifiedTime ? Date.parse(mf.modifiedTime) : 0)); return { cloudVersion: Number.isFinite(v) ? v : null, manifestFileId: mf.id }; } catch(e) { if (/403|404/.test(e.message||'')) return null; throw e; } }
    async saveFolderManifest(folderId, manifest, options = {}) {
        const cloudVersion = manifest.cloudVersion ?? Date.now();
        const payload = { folderId, provider: 'googledrive', cloudVersion, requiresFullResync: Boolean(manifest.requiresFullResync), entries: manifest.entries || {}, updatedAt: new Date().toISOString() };
        const metadata = { name: '.orbital8-state.json', parents: [folderId], mimeType: 'application/json', appProperties: { orbital8CloudVersion: String(cloudVersion) } };
        let fileId = manifest.manifestFileId || options.manifestFileId || null; let discoveredManifests = null;
        if (!fileId) { try { const query = `'${folderId}' in parents and name = '.orbital8-state.json' and trashed=false`; const lr = await this.makeApiCall(`/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime%20desc&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=10`, { signal: options.signal }); const files = lr?.files || []; if (files.length > 0) { fileId = files[0].id; discoveredManifests = files; } } catch(e) {} }
        if (!fileId) { const cr = await this.makeApiCall('/files?supportsAllDrives=true&includeItemsFromAllDrives=true', { method: 'POST', body: JSON.stringify(metadata) }); fileId = cr.id; }
        await this.makeApiCall(`/files/${fileId}?supportsAllDrives=true`, { method: 'PATCH', body: JSON.stringify({ appProperties: metadata.appProperties }) });
        await this.makeApiCall(`/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true&includeItemsFromAllDrives=true`, { method: 'PATCH', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' }, signal: options.signal }, false);
        return { cloudVersion, manifestFileId: fileId };
    }
    async updateFolderVersionMarker(folderId, version, options = {}) { let fileId = options.manifestFileId; if (!fileId) { const m = await this.loadFolderManifest(folderId, { signal: options.signal }); fileId = m?.manifestFileId; } if (!fileId) { await this.saveFolderManifest(folderId, { entries: {}, cloudVersion: version, requiresFullResync: false }); return; } await this.makeApiCall(`/files/${fileId}?supportsAllDrives=true`, { method: 'PATCH', body: JSON.stringify({ appProperties: { orbital8CloudVersion: String(version) } }) }); }
    async fetchFilesByIds(folderId, fileIds = [], options = {}) {
        if (!Array.isArray(fileIds) || fileIds.length === 0) return [];
        const rawFiles = await this.fetchRawFilesByIds(fileIds, { signal: options.signal });
        const directImages = []; const shortcutCandidates = [];
        for (const f of rawFiles) { if (f?.mimeType?.startsWith('image/')) directImages.push(f); else if (f?.mimeType === 'application/vnd.google-apps.shortcut' && f?.shortcutDetails?.targetMimeType?.startsWith('image/')) shortcutCandidates.push(f); }
        const normalized = directImages.map(f => this.normalizeDriveFileMetadata(f));
        if (shortcutCandidates.length === 0) return normalized;
        const targetIds = [...new Set(shortcutCandidates.map(f => f.shortcutDetails?.targetId).filter(Boolean))];
        if (targetIds.length === 0) return normalized;
        const targetFiles = await this.fetchRawFilesByIds(targetIds, { signal: options.signal });
        const targetMap = new Map(targetFiles.map(t => [t.id, t]));
        return [...normalized, ...shortcutCandidates.map(s => { const t = targetMap.get(s.shortcutDetails?.targetId); if (!t || !t.mimeType?.startsWith('image/')) return null; return this.normalizeDriveFileMetadata(s, { target: t, useShortcutId: true }); }).filter(Boolean)];
    }
    getFolderCacheContext(parentId = this.currentParentId) { return parentId || 'root'; }
    getFolderCacheContextForParent(parentId) { return this.getFolderCacheContext(parentId); }
    getParentCacheContext() { if (this.breadcrumb.length <= 1) return this.getFolderCacheContext(); return this.getFolderCacheContext(this.breadcrumb[this.breadcrumb.length - 2]?.id); }
    async drillIntoFolder(folder) { const nb = this.breadcrumb[this.breadcrumb.length-1]?.id === folder.id ? [...this.breadcrumb] : [...this.breadcrumb, { id: folder.id, name: folder.name }]; this.breadcrumb = nb; this.currentParentId = folder.id; this.currentParentPath = nb.map(e => e.name).join(' / '); return await this.loadFoldersInParent(folder.id); }
    async navigateToParent() { if (this.breadcrumb.length <= 1) return await this.getFolders(); const nb = this.breadcrumb.slice(0, -1); const pf = nb[nb.length-1] || { id: 'root', name: 'My Drive' }; this.breadcrumb = nb; this.currentParentId = pf.id; this.currentParentPath = nb.map(e => e.name).join(' / '); return await this.loadFoldersInParent(pf.id); }
    getCurrentPath() { return this.currentParentPath; }
    canGoUp() { return this.breadcrumb.length > 1; }
    async moveFileToFolder(fileId, targetFolderId) { const f = await this.makeApiCall(`/files/${fileId}?fields=parents`); await this.makeApiCall(`/files/${fileId}?addParents=${targetFolderId}&removeParents=${f.parents.join(',')}&fields=id,parents`, { method: 'PATCH' }); return true; }
    async updateFileMetadata(fileId, metadata) { await this.makeApiCall(`/files/${fileId}`, { method: 'PATCH', body: JSON.stringify({ appProperties: metadata }) }); return true; }
    async deleteFile(fileId) { await this.makeApiCall(`/files/${fileId}`, { method: 'PATCH', body: JSON.stringify({ trashed: true }) }); return true; }
    async disconnect() { this.invalidateSharedFolderCaches(); this.isAuthenticated = false; this.accessToken = null; this.refreshToken = null; this.clientSecret = null; this.clearStoredCredentials(); }
}

class OneDriveProvider extends BaseProvider {
    constructor() {
        super(); this.name = 'onedrive'; this.apiBase = 'https://graph.microsoft.com/v1.0';
        this.isAuthenticated = false; this.activeAccount = null; this.msalInstance = null;
        this.currentParentId = null; this.currentParentPath = ''; this.breadcrumb = [];
        this.onProgressCallback = null; this.folderImageCountCache = new Map(); this.folderHasImagesCache = new Map(); this.folderChildCandidateCache = new Map();
        this.rootFolder = this.loadStoredRootFolder(); this.initMSAL();
        const accounts = this.msalInstance.getAllAccounts();
        if (accounts.length > 0) { this.msalInstance.setActiveAccount(accounts[0]); this.activeAccount = accounts[0]; this.isAuthenticated = true; }
    }
    initMSAL() { this.msalInstance = new msal.PublicClientApplication({ auth: { clientId: 'b407fd45-c551-4dbb-9da5-cab3a2c5a949', authority: 'https://login.microsoftonline.com/common', redirectUri: window.location.origin + window.location.pathname }, cache: { cacheLocation: 'localStorage' } }); }
    async authenticate() { try { const accounts = this.msalInstance.getAllAccounts(); if (accounts.length > 0) { this.msalInstance.setActiveAccount(accounts[0]); this.activeAccount = accounts[0]; } else { const lr = await this.msalInstance.loginPopup({ scopes: ['Files.ReadWrite.AppFolder', 'User.Read'] }); this.activeAccount = lr.account; this.msalInstance.setActiveAccount(this.activeAccount); } this.isAuthenticated = true; return true; } catch(e) { this.isAuthenticated = false; throw new Error(`Authentication failed: ${e.message}`); } }
    async getAccessToken() { if (!this.activeAccount) throw new Error('No active account'); try { return (await this.msalInstance.acquireTokenSilent({ scopes: ['Files.ReadWrite.AppFolder'], account: this.activeAccount })).accessToken; } catch(e) { if (e instanceof msal.InteractionRequiredAuthError) return (await this.msalInstance.acquireTokenPopup({ scopes: ['Files.ReadWrite.AppFolder'], account: this.activeAccount })).accessToken; throw e; } }
    async makeApiCall(endpoint, options = {}) { const token = await this.getAccessToken(); const url = endpoint.startsWith('https://') ? endpoint : `${this.apiBase}${endpoint}`; const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers }; const r = await fetch(url, { ...options, headers }); if (r.status === 401) throw new Error('TOKEN_EXPIRED'); if (!r.ok) { const t = await r.text(); throw new Error(`API call failed: ${r.status} ${r.statusText} - ${t}`); } return r; }
    getVirtualRootFolderId(folderId) { return folderId ? `virtual-root--${folderId}` : ''; }
    parseVirtualRootFolderId(folderId) { if (typeof folderId !== 'string' || !folderId.startsWith('virtual-root--')) return null; return { sourceFolderId: folderId.slice('virtual-root--'.length) }; }
    isDirectMediaItem(item) { return Boolean(item?.file?.mimeType?.startsWith('image/')); }
    buildFolderItem(folder, parentId) { return { id: folder.id, name: folder.name, type: 'folder', createdTime: folder.createdDateTime, modifiedTime: folder.lastModifiedDateTime, itemCount: folder.folder?.childCount || 0, hasChildren: (folder.folder?.childCount || 0) > 0, parentId: folder.parentReference?.id || parentId || 'root' }; }
    async getDirectMediaStats(folderId, options = {}) { if (!folderId) return { imageCount: 0, itemCount: 0, modifiedTime: null }; let imageCount = 0; let latestModifiedTime = null; let nextLink = `${this.apiBase}/me/drive/items/${folderId}/children`; while (nextLink) { const r = await this.makeApiCall(nextLink.replace(this.apiBase, ''), { signal: options.signal || state.activeRequests?.signal }); const data = await r.json(); for (const item of (data?.value || [])) { if (!this.isDirectMediaItem(item)) continue; imageCount++; const c = item.lastModifiedDateTime || item.createdDateTime; if (c && (!latestModifiedTime || Date.parse(c) > Date.parse(latestModifiedTime))) latestModifiedTime = c; } nextLink = data['@odata.nextLink']; } this.folderImageCountCache.set(folderId, imageCount); this.folderHasImagesCache.set(folderId, imageCount > 0); return { imageCount, itemCount: imageCount, modifiedTime: latestModifiedTime }; }
    buildVirtualRootFolderEntry(folder, stats = {}) { const ic = typeof stats.imageCount === 'number' ? stats.imageCount : 0; return { id: this.getVirtualRootFolderId(folder.id), sourceFolderId: folder.id, name: `${folder.name} / Images at root`, type: 'folder', createdTime: folder.createdTime, modifiedTime: stats.modifiedTime || folder.modifiedTime, imageCount: ic, itemCount: ic, hasChildren: false, isSelectable: true, isVirtualRoot: true, parentId: folder.id, rootSelectionLevel: 2 }; }
    async getFilesAndMetadata(folderId = 'root') {
        const resolvedFolderId = this.parseVirtualRootFolderId(folderId)?.sourceFolderId || folderId;
        const allFiles = []; let endpoint = resolvedFolderId === 'root' ? '/me/drive/root/children' : `/me/drive/items/${resolvedFolderId}/children`;
        let nextLink = `${this.apiBase}${endpoint}`;
        while (nextLink) { const r = await this.makeApiCall(nextLink.replace(this.apiBase, ''), { signal: state.activeRequests.signal }); const data = await r.json(); allFiles.push(...data.value.filter(i => i.file?.mimeType?.startsWith('image/')).map(i => ({ id: i.id, name: i.name, type: 'file', mimeType: i.file.mimeType, size: i.size || 0, createdTime: i.createdDateTime, modifiedTime: i.lastModifiedDateTime, thumbnails: i.thumbnails?.length > 0 ? { large: i.thumbnails[0].large } : null, downloadUrl: i['@microsoft.graph.downloadUrl'] }))); nextLink = data['@odata.nextLink']; if (this.onProgressCallback) this.onProgressCallback({ current: allFiles.length, total: 0, message: 'Fetching from cloud...' }); }
        return { folders: [], files: allFiles };
    }
    async loadFolderManifest(folderId, options = {}) { try { const mr = await this.makeApiCall(`/me/drive/special/approot:/manifests/${folderId}.json:/content`, { method: 'GET', signal: options.signal }); const md = await mr.json(); let cv = md.cloudVersion ?? null; try { const sr = await this.makeApiCall(`/me/drive/special/approot:/state/${folderId}.json:/content`, { method: 'GET', signal: options.signal }); const sd = await sr.json(); if (sd?.cloudVersion != null) cv = sd.cloudVersion; } catch(e) { if (!/404/.test(String(e.message))) throw e; } return { entries: md.entries || {}, requiresFullResync: Boolean(md.requiresFullResync), cloudVersion: Number(cv ?? Date.now()) }; } catch(e) { if (/404/.test(String(e.message))) return null; if (/403/.test(String(e.message))) return { entries: {}, requiresFullResync: true, cloudVersion: Date.now() }; throw e; } }
    async getFolderVersion(folderId, options = {}) { try { const sr = await this.makeApiCall(`/me/drive/special/approot:/state/${folderId}.json:/content`, { method: 'GET', signal: options.signal }); const sd = await sr.json(); const v = Number(sd?.cloudVersion ?? sd?.localVersion ?? 0); return { cloudVersion: Number.isFinite(v) ? v : null }; } catch(e) { if (/404|401/.test(String(e.message))) return null; return null; } }
    async saveFolderManifest(folderId, manifest, options = {}) { const headers = { 'Content-Type': 'application/json' }; const cv = manifest.cloudVersion ?? Date.now(); await this.makeApiCall(`/me/drive/special/approot:/manifests/${folderId}.json:/content`, { method: 'PUT', headers, body: JSON.stringify({ folderId, cloudVersion: cv, requiresFullResync: Boolean(manifest.requiresFullResync), entries: manifest.entries || {}, updatedAt: new Date().toISOString() }), signal: options.signal }); await this.makeApiCall(`/me/drive/special/approot:/state/${folderId}.json:/content`, { method: 'PUT', headers, body: JSON.stringify({ folderId, cloudVersion: cv, updatedAt: new Date().toISOString() }), signal: options.signal }); return { cloudVersion: cv }; }
    async updateFolderVersionMarker(folderId, version, options = {}) { try { await this.makeApiCall(`/me/drive/special/approot:/state/${folderId}.json:/content`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folderId, cloudVersion: version, updatedAt: new Date().toISOString() }), signal: options.signal }); } catch(e) { if (/404/.test(String(e.message))) await this.saveFolderManifest(folderId, { entries: {}, cloudVersion: version, requiresFullResync: false }, options); else throw e; } }
    async fetchFilesByIds(folderId, fileIds = [], options = {}) { if (!Array.isArray(fileIds) || fileIds.length === 0) return []; const results = await Promise.allSettled(fileIds.map(id => this.makeApiCall(`/me/drive/items/${id}`, { signal: options.signal }))); const items = await Promise.all(results.filter(r => r.status === 'fulfilled').map(r => r.value.json())); return items.map(i => ({ id: i.id, name: i.name, type: 'file', mimeType: i.file?.mimeType || 'application/octet-stream', size: i.size || 0, createdTime: i.createdDateTime, modifiedTime: i.lastModifiedDateTime, thumbnails: i.thumbnails?.length > 0 ? { large: i.thumbnails[0].large } : null, downloadUrl: i['@microsoft.graph.downloadUrl'] })); }
    loadStoredRootFolder() { try { const raw = localStorage.getItem(APP_STORAGE_KEYS.onedriveRoot); if (!raw) return null; const p = JSON.parse(raw); if (p?.id) return p; } catch(e) {} return null; }
    persistRootFolder(folder) { if (!folder?.id) return; const p = { id: folder.id, name: folder.name || 'Root', parentId: folder.parentId || 'root', updatedAt: new Date().toISOString() }; this.rootFolder = p; try { localStorage.setItem(APP_STORAGE_KEYS.onedriveRoot, JSON.stringify(p)); } catch(e) {} }
    clearPersistedRootFolder() { this.rootFolder = null; try { localStorage.removeItem(APP_STORAGE_KEYS.onedriveRoot); } catch(e) {} }
    async getDriveRootFolders(options = {}) { const folders = []; let nextLink = `${this.apiBase}/me/drive/root/children`; while (nextLink) { const r = await this.makeApiCall(nextLink.replace(this.apiBase, ''), { signal: options.signal }); const data = await r.json(); folders.push(...(data.value || []).filter(i => i.folder).map(i => this.buildFolderItem(i, 'root'))); nextLink = data['@odata.nextLink']; } return folders; }
    async getDriveRootFolder(options = {}) { const r = await this.makeApiCall('/me/drive/root', { signal: options.signal }); const i = await r.json(); return { id: 'root', name: i?.name || 'Drive root', type: 'folder', createdTime: i?.createdDateTime, modifiedTime: i?.lastModifiedDateTime, itemCount: i?.folder?.childCount || 0, hasChildren: (i?.folder?.childCount || 0) > 0, parentId: null, isDriveRootOption: true }; }
    async getDownloadsFolder(options = {}) { const folders = await this.getDriveRootFolders(options); return folders.find(i => ['downloads','download'].includes((i.name||'').toLowerCase())) || await this.getDriveRootFolder(options); }
    async getEffectiveRootFolder(options = {}) { const dr = await this.getDownloadsFolder(options); const sr = this.rootFolder || this.loadStoredRootFolder(); if (!sr?.id) { this.rootFolder = dr; return dr; } if (sr.id === 'root') { try { const r = await this.getDriveRootFolder(options); this.rootFolder = r; return r; } catch(e) { this.clearPersistedRootFolder(); this.rootFolder = dr; return dr; } } if (sr.id === dr.id) { this.rootFolder = dr; return dr; } try { const r = await this.makeApiCall(`/me/drive/items/${sr.id}`, { signal: options.signal }); const i = await r.json(); if (!i?.folder) { this.clearPersistedRootFolder(); this.rootFolder = dr; return dr; } const rr = { id: i.id, name: i.name || sr.name, type: 'folder', createdTime: i.createdDateTime, modifiedTime: i.lastModifiedDateTime, itemCount: i.folder?.childCount || 0, hasChildren: (i.folder?.childCount || 0) > 0, parentId: i.parentReference?.id || 'root' }; this.rootFolder = rr; return rr; } catch(e) { this.clearPersistedRootFolder(); this.rootFolder = dr; return dr; } }
    async getRootFolderOptions(options = {}) { const dr = await this.getDriveRootFolder(options); const rf = await this.getDriveRootFolders(options); return [dr, ...rf.sort((a,b) => (a.name||'').localeCompare(b.name||''))]; }
    async setRootFolder(folder, options = {}) { if (!folder?.id) throw new Error('Choose a folder.'); const dr = await this.getDownloadsFolder(options); const nf = { ...folder, name: folder.name || (folder.id === 'root' ? 'Drive root' : 'Root'), parentId: folder.parentId || 'root' }; if (nf.id === dr.id && nf.id !== 'root') { this.clearPersistedRootFolder(); this.rootFolder = dr; return dr; } this.persistRootFolder(nf); this.rootFolder = nf; return nf; }
    getRootFolderLabel() { return this.rootFolder?.name || 'Downloads'; }
    getFolderCacheContext(parentId = this.currentParentId) { return parentId ? `parent:${parentId}` : 'root'; }
    getFolderCacheContextForParent(parentId) { return this.getFolderCacheContext(parentId); }
    getParentCacheContext() { if (this.breadcrumb.length <= 1) return this.getFolderCacheContext(); return this.getFolderCacheContext(this.breadcrumb[this.breadcrumb.length - 2]?.id); }
    async getFolders(options = {}) { const rf = await this.getEffectiveRootFolder(options); const folders = await this.loadFoldersInParent(rf.id, options); this.currentParentId = rf.id; this.currentParentPath = rf.name; this.breadcrumb = [{ id: rf.id, name: rf.name }]; return folders; }
    async loadFoldersInParent(parentId, options = {}) {
        const cacheKey = Folders.buildFolderCacheKey(this.name, this.getFolderCacheContext(parentId));
        const cachedEntry = !options.forceRefresh ? await Folders.getCachedFolders(cacheKey) : null;
        if (cachedEntry && (Date.now() - cachedEntry.updatedAt) < FOLDER_LIST_CACHE_TTL_MS) return cachedEntry.folders;
        const folders = []; let endpoint = parentId === 'root' ? '/me/drive/root/children' : `/me/drive/items/${parentId}/children`; let nextLink = `${this.apiBase}${endpoint}`;
        do { const r = await this.makeApiCall(nextLink.replace(this.apiBase, ''), { signal: options.signal || state.activeRequests?.signal }); const data = await r.json(); folders.push(...data.value.filter(i => i.folder && (i.folder.childCount || 0) > 0).map(f => this.buildFolderItem(f, parentId || 'root'))); nextLink = data['@odata.nextLink']; } while (nextLink);
        const sorted = folders.sort((a,b) => a.name.localeCompare(b.name)); await Folders.setCachedFolders(cacheKey, sorted); return sorted;
    }
    async folderHasDirectAssets(folderId, options = {}) { if (!folderId) return false; if (!options.forceRefresh && this.folderImageCountCache.has(folderId)) return (this.folderImageCountCache.get(folderId)||0) > 0; let nextLink = `${this.apiBase}/me/drive/items/${folderId}/children`; while (nextLink) { const r = await this.makeApiCall(nextLink.replace(this.apiBase, ''), { signal: options.signal || state.activeRequests?.signal }); const data = await r.json(); for (const i of (data?.value||[])) { if (i?.file?.mimeType?.startsWith('image/')) { this.folderImageCountCache.set(folderId, 1); this.folderHasImagesCache.set(folderId, true); return true; } } nextLink = data['@odata.nextLink']; } this.folderImageCountCache.set(folderId, 0); this.folderHasImagesCache.set(folderId, false); return false; }
    async inspectFolderLevel(folderId, options = {}) {
        if (!folderId) return { imageCount: null, itemCount: null, isSelectable: false, hasChildren: false, entryKind: 'empty' };
        if (!options.forceRefresh && this.folderImageCountCache.has(folderId) && this.folderHasImagesCache.has(folderId) && this.folderChildCandidateCache.has(folderId)) { const dm = (this.folderImageCountCache.get(folderId)||0) > 0; const hc = Boolean(this.folderChildCandidateCache.get(folderId)); return { imageCount: dm ? 1 : null, itemCount: dm ? 1 : null, isSelectable: dm, hasChildren: hc, entryKind: dm && hc ? 'pseudo' : dm ? 'loadable' : hc ? 'browse' : 'empty' }; }
        const signal = options.signal || state.activeRequests?.signal; let dm = false; let hc = false; let nextLink = `${this.apiBase}/me/drive/items/${folderId}/children`;
        while (nextLink && (!dm || !hc)) { const r = await this.makeApiCall(nextLink.replace(this.apiBase, ''), { signal }); const data = await r.json(); const checks = []; for (const i of (data?.value||[])) { if (!dm && i?.file?.mimeType?.startsWith('image/')) dm = true; else if (!hc && i?.folder?.childCount > 0) checks.push(this.folderHasDirectAssets(i.id, { signal, forceRefresh: options.forceRefresh })); if (dm && hc) break; } if (!hc && checks.length > 0) { const cr = await Promise.allSettled(checks); hc = cr.some(r => r.status === 'fulfilled' && r.value); } nextLink = data['@odata.nextLink']; }
        this.folderImageCountCache.set(folderId, dm ? 1 : 0); this.folderHasImagesCache.set(folderId, dm || hc); this.folderChildCandidateCache.set(folderId, hc);
        return { imageCount: dm ? 1 : null, itemCount: dm ? 1 : null, isSelectable: dm, hasChildren: hc, entryKind: dm && hc ? 'pseudo' : dm ? 'loadable' : hc ? 'browse' : 'empty' };
    }
    async filterFoldersWithImages(folders = [], options = {}) {
        if (!Array.isArray(folders) || folders.length === 0) return folders?.slice() || [];
        const results = new Array(folders.length); let index = 0; let processed = 0; const signal = options.signal || state.activeRequests?.signal;
        Folders.setFolderScanProgress({ active: true, message: 'Evaluating folders for images...', current: 0, total: folders.length, currentFolderName: '' });
        const workers = Array.from({ length: Math.min(4, folders.length) }, () => (async () => { while (index < folders.length) { const ci = index++; const f = folders[ci]; if (!f?.id) continue; try { Folders.setFolderScanProgress({ active: true, message: 'Evaluating folders for images...', current: processed, total: folders.length, currentFolderName: f.name || '' }); const el = await this.inspectFolderLevel(f.id, { signal, forceRefresh: options.forceRefresh }); if (el.isSelectable || el.hasChildren) results[ci] = { ...f, ...el }; } catch(e) {} finally { processed++; Folders.setFolderScanProgress({ active: true, message: 'Evaluating folders for images...', current: processed, total: folders.length, currentFolderName: f?.name || '' }); } } })());
        await Promise.all(workers); return results.filter(Boolean);
    }
    async refreshFolderCandidate(folder, options = {}) { if (!folder?.id) return null; if (folder.isVirtualRoot) { const sid = folder.sourceFolderId || this.parseVirtualRootFolderId(folder.id)?.sourceFolderId; if (!sid) return null; const stats = await this.getDirectMediaStats(sid, { signal: options.signal, forceRefresh: true }); if ((stats.imageCount||0) <= 0) return null; return this.buildVirtualRootFolderEntry({ ...folder, id: sid, name: folder.name.replace(/\s*\/ Images at root$/, '') }, stats); } if (folder.rootSelectionLevel === 2) return { ...folder, isSelectable: false }; const el = await this.inspectFolderLevel(folder.id, { signal: options.signal, forceRefresh: true }); if (!el.isSelectable && !el.hasChildren) return null; return { ...folder, ...el }; }
    async drillIntoFolder(folder, options = {}) { const folders = await this.loadFoldersInParent(folder.id, options); const nb = this.breadcrumb[this.breadcrumb.length-1]?.id === folder.id ? [...this.breadcrumb] : [...this.breadcrumb, { id: folder.id, name: folder.name }]; this.breadcrumb = nb; this.currentParentId = folder.id; this.currentParentPath = nb.map(b => b.name).join(' / '); return folders; }
    async navigateToParent(options = {}) { if (this.breadcrumb.length <= 1) return await this.getFolders(options); const nb = this.breadcrumb.slice(0, -1); const pf = nb[nb.length-1]; const folders = await this.loadFoldersInParent(pf.id, options); this.breadcrumb = nb; this.currentParentId = pf.id; this.currentParentPath = nb.map(b => b.name).join(' / '); return folders; }
    getCurrentPath() { return this.currentParentPath; }
    canGoUp() { return this.breadcrumb.length > 1; }
    async moveFileToFolder(fileId, targetFolderId) { await this.makeApiCall(`/me/drive/items/${fileId}`, { method: 'PATCH', body: JSON.stringify({ parentReference: { id: targetFolderId } }) }); return true; }
    async updateFileMetadata(fileId, metadata) { return Promise.resolve(true); }
    async deleteFile(fileId) { await this.makeApiCall(`/me/drive/items/${fileId}`, { method: 'DELETE' }); return true; }
    async disconnect() { this.isAuthenticated = false; this.activeAccount = null; if (this.msalInstance) { const accounts = this.msalInstance.getAllAccounts(); if (accounts.length > 0) await this.msalInstance.logoutPopup({ account: accounts[0] }); } }
}

class ExportSystem {
    async exportData(imagesWithMetadata) { if (imagesWithMetadata.length === 0) { Utils.showToast('No images to export', 'info', true); return; } this.downloadCSV(this.formatForCSV(imagesWithMetadata)); }
    formatForCSV(images) {
        const headers = ['Filename','Direct Image URL','Prompt','Negative Prompt','Model','Width','Height','Steps','Seed','CFG Scale','Size','Created Date','Modified Date','Tags','Notes','Quality Rating','Content Rating','Provider','Metadata (JSON)'];
        const rows = images.map(img => { const meta = img.extractedMetadata || {}; const dims = meta._dimensions || {}; return [img.name || '', this.getDirectImageURL(img), this.extractMetadataValue(meta, ['prompt','Prompt','parameters']), this.extractMetadataValue(meta, ['negative_prompt','Negative Prompt']), this.extractMetadataValue(meta, ['model','Model']), dims.width || '', dims.height || '', this.extractMetadataValue(meta, ['steps','Steps']), this.extractMetadataValue(meta, ['seed','Seed']), this.extractMetadataValue(meta, ['cfg_scale','CFG Scale']), Utils.formatFileSize(img.size), img.createdTime ? new Date(img.createdTime).toISOString() : '', img.modifiedTime ? new Date(img.modifiedTime).toISOString() : '', (img.tags || []).join('; '), img.notes || '', img.qualityRating || 0, img.contentRating || 0, state.providerType || 'unknown', JSON.stringify(meta)]; });
        return [headers, ...rows];
    }
    extractMetadataValue(metadata, keys) { for (const k of keys) { if (metadata[k]) { if (k === 'parameters') { const m = metadata[k].match(/^(.*?)(Negative prompt:|$)/); if (m?.[1]) return m[1].trim(); } return metadata[k]; } } return ''; }
    getDirectImageURL(image) { if (state.providerType === 'googledrive') return DriveLinkHelper.resolveAssetUrls(image).exportUrl || ''; if (state.providerType === 'onedrive') return image.downloadUrl || `https://graph.microsoft.com/v1.0/me/drive/items/${image.id}/content`; return ''; }
    downloadCSV(data) { const fn = `${APP_IDENTITY.storagePrefix}_${state.currentFolder.name.replace(/[^a-z0-9]/gi,'_').toLowerCase()}_${state.grid.stack}_${new Date().toISOString().split('T')[0]}.csv`; const csv = data.map(row => row.map(f => `"${String(f).replace(/"/g,'""')}"`).join(',')).join('\n'); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fn; a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
}
