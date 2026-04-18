// ===== pic-v1-curate-foundation.js =====
// Constants, State, GoogleDriveFolderCacheStore, DriveLinkHelper, getDebugSurface, Utils

const APP_IDENTITY = {
    label: 'Orbital8 Pick V1',
    dbName: 'Orbital8-Pick-V1',
    storagePrefix: 'orbital8_pick_v1',
    debugGlobal: '__orbitalPickV1',
    syncLogWindowName: 'orbital8-pick-sync-log'
};
const APP_STORAGE_KEYS = {
    lastFolder: `${APP_IDENTITY.storagePrefix}:last_folder`,
    onedriveRoot: `${APP_IDENTITY.storagePrefix}:onedrive_root`,
    visualIntensity: `${APP_IDENTITY.storagePrefix}:visual_intensity`,
    hapticEnabled: `${APP_IDENTITY.storagePrefix}:haptic_enabled`,
    googleAccessToken: `${APP_IDENTITY.storagePrefix}:google_access_token`,
    googleRefreshToken: `${APP_IDENTITY.storagePrefix}:google_refresh_token`,
    googleClientSecret: `${APP_IDENTITY.storagePrefix}:google_client_secret`
};
const GOOGLE_DRIVE_FOLDER_CACHE_SCHEMA_VERSION = 1;
const createGoogleDriveFolderCacheEntry = () => ({ folderImageCountCache: new Map(), folderHasImagesCache: new Map() });
const STACKS = ['in', 'out', 'priority', 'trash'];
const STACK_NAMES = { 'in': 'Inbox', 'out': 'Maybe', 'priority': 'Keep', 'trash': 'Recycle' };
const loadLastFolderFromStorage = () => { try { const raw = localStorage.getItem(APP_STORAGE_KEYS.lastFolder); if (!raw) return null; const parsed = JSON.parse(raw); if (parsed && parsed.folderId && parsed.providerType) return parsed; } catch (e) { console.warn('Failed to load last folder:', e); } return null; };
const OMNI_SEARCH_RESULT_LIMIT = 8;
const FOLDER_LIST_CACHE_TTL_MS = 60 * 1000;
const createDefaultGridDragSession = () => ({ active: false, pointerId: null, dropTarget: null, selectedIds: [], dragElements: [] });

const state = {
    provider: null, providerType: null, dbManager: null, metadataExtractor: null,
    syncManager: null, syncLog: null, visualCues: null, haptic: null, export: null, folderSyncCoordinator: null,
    currentFolder: { id: null, name: '' },
    imageFiles: [], currentImageLoadId: null, currentStack: 'in', currentStackPosition: 0,
    isFocusMode: false, stacks: { in: [], out: [], priority: [], trash: [] },
    isDragging: false, isPinching: false, initialDistance: 0, currentScale: 1,
    maxScale: 4, minScale: 0.3, panOffset: { x: 0, y: 0 },
    grid: { stack: null, selected: [], filtered: [], isDirty: false, isDragging: false,
        dragSession: createDefaultGridDragSession(), skipReorderOnClose: false,
        lazyLoadState: { allFiles: [], renderedCount: 0, observer: null, batchSize: 20 } },
    tags: new Set(), loadingProgress: { current: 0, total: 0 },
    folderMoveMode: { active: false, files: [] },
    isReturningToFolders: false, navigationToken: null, activeRequests: new AbortController(),
    sessionVisitedFolders: new Set(), isImageTransitioning: false, showDebugToasts: true,
    lastPickedFolder: loadLastFolderFromStorage(),
    folderSearchDataset: [], folderSearchTerm: '', folderSort: { field: 'date', direction: 'desc' },
    folderListCache: new Map(),
    folderScanProgress: { active: false, message: '', current: 0, total: 0, currentFolderName: '' },
    storageStatus: { available: true, reason: null },
    googleDriveFolderCacheStore: { schemaVersion: GOOGLE_DRIVE_FOLDER_CACHE_SCHEMA_VERSION, entries: new Map() },
};

const GoogleDriveFolderCacheStore = {
    ensureSchema() { const store = state.googleDriveFolderCacheStore; if (store.schemaVersion !== GOOGLE_DRIVE_FOLDER_CACHE_SCHEMA_VERSION) { store.schemaVersion = GOOGLE_DRIVE_FOLDER_CACHE_SCHEMA_VERSION; store.entries.clear(); } return store; },
    buildCacheKey(providerType, accountIdentity) { return `${providerType || 'unknown'}::${accountIdentity || 'anonymous'}`; },
    getOrCreateEntry(providerType, accountIdentity) { const store = this.ensureSchema(); const key = this.buildCacheKey(providerType, accountIdentity); if (!store.entries.has(key)) { store.entries.set(key, createGoogleDriveFolderCacheEntry()); } return { key, entry: store.entries.get(key) }; },
    clear(key) { const store = this.ensureSchema(); if (key) { store.entries.delete(key); return; } store.entries.clear(); }
};

const DriveLinkHelper = {
    extractFileId(input) {
        if (!input) return null;
        if (typeof input === 'string' && !input.includes('://') && /^[a-zA-Z0-9_-]{10,}$/.test(input)) return input;
        try { const url = new URL(input); const idParam = url.searchParams.get('id') || url.searchParams.get('file_id'); if (idParam) return idParam; const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/); if (pathMatch && pathMatch[1]) return pathMatch[1]; const ucMatch = url.pathname.match(/\/uc(?:\/export)?\/download\/([^/?]+)/); if (ucMatch && ucMatch[1]) return ucMatch[1]; } catch (e) { return null; }
        return null;
    },
    buildDriveUrl(baseUrl, searchParams = {}) { try { const url = new URL(baseUrl); Object.entries(searchParams).forEach(([k,v]) => { if (v != null && v !== '') url.searchParams.set(k,v); }); return url.toString(); } catch(e) { const q = new URLSearchParams(); Object.entries(searchParams).forEach(([k,v]) => { if (v != null && v !== '') q.set(k,v); }); const s = q.toString(); if (!s) return baseUrl; return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${s}`; } },
    buildShareUrl(fileId, resourceKey = null) { if (!fileId) return null; return this.buildDriveUrl(`https://drive.google.com/file/d/${fileId}/view`, { usp: 'sharing', resourcekey: resourceKey }); },
    buildUcDownloadUrl(fileId, resourceKey = null) { if (!fileId) return null; return this.buildDriveUrl('https://drive.google.com/uc', { id: fileId, export: 'view', resourcekey: resourceKey }); },
    buildApiDownloadUrl(fileId, resourceKey = null) { if (!fileId) return null; return this.buildDriveUrl(`https://www.googleapis.com/drive/v3/files/${fileId}`, { alt: 'media', resourceKey }); },
    buildThumbnailUrl(fileId, width = 1000, resourceKey = null) { if (!fileId) return null; return this.buildDriveUrl('https://drive.google.com/thumbnail', { id: fileId, sz: `w${Math.max(64, Number(width) || 1000)}`, resourcekey: resourceKey }); },
    normalizeToAssetUrl(rawUrl, fallbackId = null, resourceKey = null) {
        if (!rawUrl || typeof rawUrl !== 'string') return null;
        const directHosts = new RegExp('(?:^|\\.)googleusercontent\\.com$');
        const fileId = fallbackId || this.extractFileId(rawUrl);
        try {
            const parsed = new URL(rawUrl); const host = parsed.hostname;
            if (directHosts.test(host)) return rawUrl;
            if (host === 'drive.google.com') { if (parsed.pathname.startsWith('/uc')) { parsed.searchParams.set('export','view'); if (!parsed.searchParams.get('id') && fileId) parsed.searchParams.set('id',fileId); if (resourceKey) parsed.searchParams.set('resourcekey',resourceKey); return parsed.toString(); } if (fileId) return this.buildUcDownloadUrl(fileId,resourceKey); }
            if (host === 'www.googleapis.com') { parsed.searchParams.set('alt','media'); if (resourceKey) parsed.searchParams.set('resourceKey',resourceKey); return parsed.toString(); }
            if (fileId) return this.buildUcDownloadUrl(fileId,resourceKey);
        } catch(e) { if (fileId) return this.buildUcDownloadUrl(fileId,resourceKey) || this.buildApiDownloadUrl(fileId,resourceKey); return null; }
        if (fileId) return this.buildUcDownloadUrl(fileId,resourceKey) || this.buildApiDownloadUrl(fileId,resourceKey);
        return null;
    },
    resolveFileUrls(file, options = {}) {
        const targetFile = options.target || file;
        const fileId = options.fileId || targetFile?.targetFileId || targetFile?.id || file?.targetFileId || file?.id || null;
        const resourceKey = options.resourceKey || targetFile?.resourceKey || targetFile?.shortcutDetails?.targetResourceKey || file?.resourceKey || file?.shortcutDetails?.targetResourceKey || null;
        const normalizedWebViewUrl = this.normalizeToAssetUrl(targetFile?.webViewLink || file?.webViewLink, fileId, resourceKey);
        const normalizedWebContentUrl = this.normalizeToAssetUrl(targetFile?.webContentLink || file?.webContentLink, fileId, resourceKey);
        const viewUrl = this.buildShareUrl(fileId, resourceKey) || normalizedWebViewUrl || targetFile?.webViewLink || file?.webViewLink || '';
        const directUrl = normalizedWebContentUrl || this.buildUcDownloadUrl(fileId, resourceKey) || this.buildApiDownloadUrl(fileId, resourceKey) || '';
        return { fileId, resourceKey, viewUrl, directUrl, exportUrl: directUrl, thumbnailUrl: fileId ? this.buildThumbnailUrl(fileId, 1000, resourceKey) : null, thumbnailUrlSmall: fileId ? this.buildThumbnailUrl(fileId, 800, resourceKey) : null };
    },
    resolveAssetUrls(file, options = {}) {
        const resolved = this.resolveFileUrls(file, options); const fileId = resolved.fileId; const resourceKey = resolved.resourceKey;
        return { ...resolved,
            imageUrl: file?.permanentImageUrl || file?.downloadUrl || resolved.directUrl || (fileId ? this.buildApiDownloadUrl(fileId, resourceKey) : ''),
            thumbnailUrl: file?.permanentThumbnailUrl || this.normalizeToAssetUrl(file?.thumbnailLink, fileId, resourceKey) || resolved.thumbnailUrl || resolved.directUrl,
            thumbnailUrlSmall: file?.permanentThumbnailUrlSmall || file?.permanentThumbnailUrl || this.normalizeToAssetUrl(file?.thumbnailLink || file?.thumbnail?.url, fileId, resourceKey) || resolved.thumbnailUrlSmall || resolved.thumbnailUrl || resolved.directUrl
        };
    }
};

const getDebugSurface = () => { const existing = window[APP_IDENTITY.debugGlobal]; if (existing && typeof existing === 'object') return existing; const ds = {}; window[APP_IDENTITY.debugGlobal] = ds; return ds; };

const Utils = {
    elements: {},
    normalizeFavorite(value) { if (value === true || value === false) return value; if (typeof value === 'string') { const n = value.trim().toLowerCase(); if (n === 'true') return true; if (n === 'false') return false; } return Boolean(value); },
    isFavorite(input) { if (input && typeof input === 'object') { if ('favorite' in input && input.favorite != null) return this.normalizeFavorite(input.favorite); if (input.appProperties && 'favorite' in input.appProperties) return this.normalizeFavorite(input.appProperties.favorite); } return this.normalizeFavorite(input); },
    init() {
        this.elements = {
            providerScreen: document.getElementById('provider-screen'), authScreen: document.getElementById('auth-screen'),
            folderScreen: document.getElementById('folder-screen'), loadingScreen: document.getElementById('loading-screen'),
            appContainer: document.getElementById('app-container'),
            googleDriveBtn: document.getElementById('google-drive-btn'), onedriveBtn: document.getElementById('onedrive-btn'),
            providerStatus: document.getElementById('provider-status'),
            authTitle: document.getElementById('auth-title'), authSubtitle: document.getElementById('auth-subtitle'),
            gdriveSecretContainer: document.getElementById('gdrive-secret-container'), gdriveClientSecret: document.getElementById('gdrive-client-secret'),
            authButton: document.getElementById('auth-button'), authBackButton: document.getElementById('auth-back-button'), authStatus: document.getElementById('auth-status'),
            folderTitle: document.getElementById('folder-title'), folderSubtitle: document.getElementById('folder-subtitle'),
            lastFolderBanner: document.getElementById('last-folder-banner'), lastFolderLink: document.getElementById('last-folder-link'), lastFolderMeta: document.getElementById('last-folder-meta'),
            folderSearchContainer: document.getElementById('folder-search-container'), folderSearchInput: document.getElementById('folder-search-input'), folderSearchResults: document.getElementById('folder-search-results'),
            folderSortControls: document.getElementById('folder-sort-controls'), folderSortSelect: document.getElementById('folder-sort-select'), folderSortDirection: document.getElementById('folder-sort-direction'),
            folderList: document.getElementById('folder-list'), folderRefreshButton: document.getElementById('folder-refresh-button'), folderBackButton: document.getElementById('folder-back-button'), folderLogoutButton: document.getElementById('folder-logout-button'),
            backButton: document.getElementById('back-button'), backButtonSpinner: document.getElementById('back-button-spinner'), detailsButton: document.getElementById('details-button'),
            imageViewport: document.getElementById('image-viewport'), centerImage: document.getElementById('center-image'),
            emptyState: document.getElementById('empty-state'), selectAnotherStackBtn: document.getElementById('select-another-stack-btn'), selectAnotherFolderBtn: document.getElementById('select-another-folder-btn'),
            toast: document.getElementById('toast'), centerTrashBtn: document.getElementById('center-trash-btn'),
            focusStackName: document.getElementById('focus-stack-name'), focusImageCount: document.getElementById('focus-image-count'), normalImageCount: document.getElementById('normal-image-count'),
            focusDeleteBtn: document.getElementById('focus-delete-btn'), focusFavoriteBtn: document.getElementById('focus-favorite-btn'), focusFavoriteIcon: document.getElementById('focus-favorite-icon'),
            loadingCounter: document.getElementById('loading-counter'), loadingMessage: document.getElementById('loading-message'), loadingProgressBar: document.getElementById('loading-progress-bar'), cancelLoading: document.getElementById('cancel-loading'),
            edgeTop: document.getElementById('edge-top'), edgeBottom: document.getElementById('edge-bottom'), edgeLeft: document.getElementById('edge-left'), edgeRight: document.getElementById('edge-right'),
            gestureLayer: document.getElementById('gesture-layer'), gestureScreenA: document.getElementById('gesture-screen-a'), gestureScreenB: document.getElementById('gesture-screen-b'),
            gestureTriUp: document.getElementById('gesture-tri-up'), gestureTriRight: document.getElementById('gesture-tri-right'), gestureTriDown: document.getElementById('gesture-tri-down'), gestureTriLeft: document.getElementById('gesture-tri-left'),
            gestureHalfLeft: document.getElementById('gesture-half-left'), gestureHalfRight: document.getElementById('gesture-half-right'),
            pillPriority: document.getElementById('pill-priority'), pillTrash: document.getElementById('pill-trash'), pillIn: document.getElementById('pill-in'), pillOut: document.getElementById('pill-out'),
            gridModal: document.getElementById('grid-modal'), gridContent: document.getElementById('grid-content'), gridTitle: document.getElementById('grid-title'),
            gridContainer: document.getElementById('grid-container'), gridEmptyState: document.getElementById('grid-empty-state'),
            selectAllBtn: document.getElementById('select-all-btn'), deselectAllBtn: document.getElementById('deselect-all-btn'), selectionText: document.getElementById('selection-text'),
            closeGrid: document.getElementById('close-grid'), gridSize: document.getElementById('grid-size'), gridSizeValue: document.getElementById('grid-size-value'),
            omniSearch: document.getElementById('omni-search'), clearSearchBtn: document.getElementById('clear-search-btn'),
            searchHelper: document.getElementById('search-helper'), searchHelperIcon: document.getElementById('search-helper-icon'), searchHelperPopup: document.getElementById('search-helper-popup'), searchHelperClose: document.getElementById('search-helper-close'),
            tagSelected: document.getElementById('tag-selected'), notesSelected: document.getElementById('notes-selected'), moveSelected: document.getElementById('move-selected'),
            deleteSelected: document.getElementById('delete-selected'), exportSelected: document.getElementById('export-selected'), folderSelected: document.getElementById('folder-selected'),
            actionModal: document.getElementById('action-modal'), actionTitle: document.getElementById('action-title'), actionContent: document.getElementById('action-content'),
            actionCancel: document.getElementById('action-cancel'), actionConfirm: document.getElementById('action-confirm'),
            detailsModal: document.getElementById('details-modal'), detailsModalHeader: document.getElementById('details-modal-header'), gridModalHeaderMain: document.getElementById('grid-modal-header-main'),
            detailsClose: document.getElementById('details-close'), detailFilename: document.getElementById('detail-filename'), detailFilenameLink: document.getElementById('detail-filename-link'),
            detailDate: document.getElementById('detail-date'), detailSize: document.getElementById('detail-size'), detailTags: document.getElementById('detail-tags'), detailNotes: document.getElementById('detail-notes'),
            qualityRating: document.getElementById('quality-rating'), contentRating: document.getElementById('content-rating'), metadataTable: document.getElementById('metadata-table')
        };
    },
    showScreen(screenId) { ['provider-screen','auth-screen','folder-screen','loading-screen','app-container'].forEach(id => { const s = document.getElementById(id); if (s) s.classList.toggle('hidden', id !== screenId); }); },
    showModal(id) { document.getElementById(id).classList.remove('hidden'); },
    hideModal(id) { document.getElementById(id).classList.add('hidden'); },
    showToast(message, type = 'success', important = false) {
        if (!state.showDebugToasts) { this.clearFooterToasts(); return; }
        if (!important && Math.random() < 0.7) return;
        const toast = this.elements.toast || document.getElementById('toast'); if (!toast) return;
        toast.textContent = message; toast.classList.remove('show','success','info','error'); toast.classList.add('show'); if (type) toast.classList.add(type);
        if (this._toastHideTimer) clearTimeout(this._toastHideTimer);
        this._toastHideTimer = setTimeout(() => { toast.classList.remove('show','success','info','error'); toast.textContent = ''; this._toastHideTimer = null; }, 3000);
        if (important && state.haptic) { state.haptic.triggerFeedback(type === 'error' ? 'error' : 'buttonPress'); }
    },
    clearFooterToasts() { if (this._toastHideTimer) { clearTimeout(this._toastHideTimer); this._toastHideTimer = null; } const t = this.elements.toast || document.getElementById('toast'); if (t) { t.classList.remove('show','success','info','error'); t.textContent = ''; } },
    async setImageSrc(img, file) {
        const loadId = file.id + '_' + Date.now(); state.currentImageLoadId = loadId;
        const imageUrl = this.getPreferredImageUrl(file);
        return new Promise((resolve) => {
            img.onload = () => { if (state.currentImageLoadId !== loadId) return; resolve(); };
            img.onerror = () => { if (state.currentImageLoadId !== loadId) return; const fb = this.getFallbackImageUrl(file); img.onerror = () => { if (state.currentImageLoadId !== loadId) return; img.src = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27150%27 height=%27150%27 viewBox=%270 0 150 150%27 fill=%27none%27%3E%3Crect width=%27150%27 height=%27150%27 fill=%27%23E5E7EB%27/%3E%3C/svg%3E'; resolve(); }; img.src = fb; };
            img.src = imageUrl; img.alt = file.name || 'Image';
        });
    },
    getPreferredImageUrl(file) { if (state.providerType === 'googledrive') { const u = DriveLinkHelper.resolveAssetUrls(file); return u.thumbnailUrl || u.imageUrl; } else { if (file.thumbnails && file.thumbnails.large) return file.thumbnails.large.url; return file.downloadUrl || `https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/content`; } },
    getFallbackImageUrl(file) { if (state.providerType === 'googledrive') { const u = DriveLinkHelper.resolveAssetUrls(file); return u.thumbnailUrlSmall || u.thumbnailUrl || u.imageUrl; } else { return file.downloadUrl || `https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/content`; } },
    defer(callback, options = {}) { const { priority = 'normal', timeout = 120 } = options; const run = () => { try { const r = callback(); if (r && typeof r.then === 'function') r.catch(e => console.error('Deferred task failed', e)); } catch(e) { console.error('Deferred task failed', e); } }; if (priority === 'animation' && typeof requestAnimationFrame === 'function') { requestAnimationFrame(run); return; } if (typeof requestIdleCallback === 'function') { requestIdleCallback(run, { timeout: priority === 'high' ? Math.min(timeout,48) : timeout }); } else { setTimeout(run, priority === 'high' ? 0 : priority === 'animation' ? 16 : 32); } },
    formatFileSize(bytes) { if (bytes === 0) return '0 Bytes'; const k = 1024; const sizes = ['Bytes','KB','MB','GB']; const i = Math.floor(Math.log(bytes)/Math.log(k)); return parseFloat((bytes/Math.pow(k,i)).toFixed(2)) + ' ' + sizes[i]; },
    updateLoadingProgress(current, total, message = '') {
        state.loadingProgress = { current, total };
        this.elements.loadingCounter.textContent = current;
        this.elements.loadingMessage.textContent = message || (total ? `Processing ${current} of ${total} items...` : `Found ${current} items`);
        if (total > 0) { this.elements.loadingProgressBar.style.width = `${(current/total)*100}%`; }
        else { this.elements.loadingProgressBar.style.width = `${current > 0 ? Math.min(88, 12+((current%12)*6)) : 8}%`; }
    }
};
