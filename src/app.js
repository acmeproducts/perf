// ===== ORBITAL8 Goji Version - App Root & Web Worker =====

        const STACKS = ['in', 'out', 'priority', 'trash'];
        const STACK_NAMES = { 'in': 'Inbox', 'out': 'Maybe', 'priority': 'Keep', 'trash': 'Recycle' };
        const state = {
            provider: null, providerType: null, dbManager: null, metadataExtractor: null,
            syncManager: null, visualCues: null, haptic: null, export: null, currentFolder: { id: null, name: '' },
            imageFiles: [], currentImageLoadId: null, currentStack: 'in', currentStackPosition: 0,
            isFocusMode: false, stacks: { in: [], out: [], priority: [], trash: [] },
            isDragging: false, isPinching: false, initialDistance: 0, currentScale: 1,
            maxScale: 4, minScale: 0.3, panOffset: { x: 0, y: 0 },
            grid: { stack: null, selected: [], filtered: [], isDirty: false,
                lazyLoadState: { allFiles: [], renderedCount: 0, observer: null, batchSize: 20 } },
            tags: new Set(), loadingProgress: { current: 0, total: 0 },
            folderMoveMode: { active: false, files: [] },
            activeRequests: new AbortController()
        };
        /**
         * @namespace Utils
         * @description A utility object containing helper functions and DOM element references.
         */
        const Utils = {
            /**
             * @property {Object.<string, HTMLElement>} elements - A cache for frequently accessed DOM elements.
             */
            elements: {},

            /**
             * @method init
             * @description Initializes the Utils object by caching references to key DOM elements.
             */
            init() {
                this.elements = {
                    providerScreen: document.getElementById('provider-screen'),
                    gdriveAuthScreen: document.getElementById('gdrive-auth-screen'),
                    onedriveAuthScreen: document.getElementById('onedrive-auth-screen'),
                    gdriveFolderScreen: document.getElementById('gdrive-folder-screen'),
                    onedriveFolderScreen: document.getElementById('onedrive-folder-screen'),
                    loadingScreen: document.getElementById('loading-screen'),
                    appContainer: document.getElementById('app-container'),

                    googleDriveBtn: document.getElementById('google-drive-btn'),
                    onedriveBtn: document.getElementById('onedrive-btn'),
                    providerStatus: document.getElementById('provider-status'),

                    gdriveClientSecret: document.getElementById('gdrive-client-secret'),
                    gdriveAuthButton: document.getElementById('gdrive-auth-button'),
                    gdriveBackButton: document.getElementById('gdrive-back-button'),
                    gdriveAuthStatus: document.getElementById('gdrive-auth-status'),
                    gdriveFolderList: document.getElementById('gdrive-folder-list'),
                    gdriveRefreshFolders: document.getElementById('gdrive-refresh-folders'),
                    gdriveBackToProvider: document.getElementById('gdrive-back-to-provider'),
                    gdriveLogout: document.getElementById('gdrive-logout'),

                    onedriveAuthButton: document.getElementById('onedrive-auth-button'),
                    onedriveBackButton: document.getElementById('onedrive-back-button'),
                    onedriveAuthStatus: document.getElementById('onedrive-auth-status'),
                    onedriveFolderList: document.getElementById('onedrive-folder-list'),
                    onedriveFolderSubtitle: document.getElementById('onedrive-folder-subtitle'),
                    onedriveRefreshFolders: document.getElementById('onedrive-refresh-folders'),
                    onedriveBackToProvider: document.getElementById('onedrive-back-to-provider'),
                    onedriveLogout: document.getElementById('onedrive-logout'),

                    backButton: document.getElementById('back-button'),
                    backButtonSpinner: document.getElementById('back-button-spinner'),
                    detailsButton: document.getElementById('details-button'),
                    imageViewport: document.getElementById('image-viewport'),
                    centerImage: document.getElementById('center-image'),
                    emptyState: document.getElementById('empty-state'),
                    selectAnotherStackBtn: document.getElementById('select-another-stack-btn'),
                    selectAnotherFolderBtn: document.getElementById('select-another-folder-btn'),
                    toast: document.getElementById('toast'),

                    centerTrashBtn: document.getElementById('center-trash-btn'),
                    focusStackName: document.getElementById('focus-stack-name'),
                    focusFilenameDisplay: document.getElementById('focus-filename-display'),
                    focusImageCount: document.getElementById('focus-image-count'),
                    normalImageCount: document.getElementById('normal-image-count'),
                    focusDeleteBtn: document.getElementById('focus-delete-btn'),
                    focusFavoriteBtn: document.getElementById('focus-favorite-btn'),
                    focusFavoriteIcon: document.getElementById('focus-favorite-icon'),

                    loadingCounter: document.getElementById('loading-counter'),
                    loadingMessage: document.getElementById('loading-message'),
                    loadingProgressBar: document.getElementById('loading-progress-bar'),
                    cancelLoading: document.getElementById('cancel-loading'),

                    edgeTop: document.getElementById('edge-top'),
                    edgeBottom: document.getElementById('edge-bottom'),
                    edgeLeft: document.getElementById('edge-left'),
                    edgeRight: document.getElementById('edge-right'),

                    pillPriority: document.getElementById('pill-priority'),
                    pillTrash: document.getElementById('pill-trash'),
                    pillIn: document.getElementById('pill-in'),
                    pillOut: document.getElementById('pill-out'),

                    gridModal: document.getElementById('grid-modal'),
                    gridContent: document.getElementById('grid-content'),
                    gridTitle: document.getElementById('grid-title'),
                    gridContainer: document.getElementById('grid-container'),
                    gridEmptyState: document.getElementById('grid-empty-state'),
                    selectAllBtn: document.getElementById('select-all-btn'),
                    deselectAllBtn: document.getElementById('deselect-all-btn'),
                    selectionText: document.getElementById('selection-text'),
                    closeGrid: document.getElementById('close-grid'),
                    gridSize: document.getElementById('grid-size'),
                    gridSizeValue: document.getElementById('grid-size-value'),

                    omniSearch: document.getElementById('omni-search'),
                    clearSearchBtn: document.getElementById('clear-search-btn'),

                    tagSelected: document.getElementById('tag-selected'),
                    moveSelected: document.getElementById('move-selected'),
                    deleteSelected: document.getElementById('delete-selected'),
                    exportSelected: document.getElementById('export-selected'),
                    folderSelected: document.getElementById('folder-selected'),

                    actionModal: document.getElementById('action-modal'),
                    actionTitle: document.getElementById('action-title'),
                    actionContent: document.getElementById('action-content'),
                    actionCancel: document.getElementById('action-cancel'),
                    actionConfirm: document.getElementById('action-confirm'),

                    detailsModal: document.getElementById('details-modal'),
                    detailsModalHeader: document.getElementById('details-modal-header'),
                    gridModalHeaderMain: document.getElementById('grid-modal-header-main'),
                    detailsClose: document.getElementById('details-close'),
                    detailFilename: document.getElementById('detail-filename'),
                    detailFilenameLink: document.getElementById('detail-filename-link'),
                    detailDate: document.getElementById('detail-date'),
                    detailSize: document.getElementById('detail-size'),
                    detailTags: document.getElementById('detail-tags'),
                    detailNotes: document.getElementById('detail-notes'),
                    qualityRating: document.getElementById('quality-rating'),
                    contentRating: document.getElementById('content-rating'),
                    metadataTable: document.getElementById('metadata-table')
                };
            },

            /**
             * @method showScreen
             * @description Displays a specific screen by ID and hides all others.
             * @param {string} screenId - The ID of the screen to display.
             */
            showScreen(screenId) {
                const screens = ['provider-screen', 'gdrive-auth-screen', 'onedrive-auth-screen',
                               'gdrive-folder-screen', 'onedrive-folder-screen', 'loading-screen', 'app-container'];
                screens.forEach(id => {
                    document.getElementById(id).classList.toggle('hidden', id !== screenId);
                });
            },

            /**
             * @method showModal
             * @description Makes a modal visible.
             * @param {string} id - The ID of the modal to show.
             */
            showModal(id) { document.getElementById(id).classList.remove('hidden'); },
            /**
             * @method hideModal
             * @description Hides a modal.
             * @param {string} id - The ID of the modal to hide.
             */
            hideModal(id) { document.getElementById(id).classList.add('hidden'); },

            /**
             * @method showToast
             * @description Displays a toast message.
             * @param {string} message - The message to display in the toast.
             * @param {string} [type='success'] - The type of toast (e.g., 'success', 'error', 'info').
             * @param {boolean} [important=false] - If true, the toast will always be shown and may trigger haptic feedback.
             */
            showToast(message, type = 'success', important = false) {
                if (!important && Math.random() < 0.7) return;
                const toast = this.elements.toast;
                toast.textContent = message;
                toast.className = `toast ${type} show`;
                setTimeout(() => toast.classList.remove('show'), 3000);
                if (important && state.haptic) {
                    const hapticType = type === 'error' ? 'error' : 'buttonPress';
                    state.haptic.triggerFeedback(hapticType);
                }
            },

            /**
             * @method setImageSrc
             * @description Sets the source of an image element, with fallbacks for errors.
             * @param {HTMLImageElement} img - The image element to update.
             * @param {object} file - The file object containing image details.
             * @returns {Promise<void>} A promise that resolves when the image has loaded or failed.
             */
            async setImageSrc(img, file) {
                const loadId = file.id + '_' + Date.now();
                state.currentImageLoadId = loadId;
                let imageUrl = this.getPreferredImageUrl(file);
                return new Promise((resolve) => {
                    img.onload = () => {
                        if (state.currentImageLoadId !== loadId) return;
                        resolve();
                    };
                    img.onerror = () => {
                        if (state.currentImageLoadId !== loadId) return;
                        let fallbackUrl = this.getFallbackImageUrl(file);

                        img.onerror = () => {
                            if (state.currentImageLoadId !== loadId) return;
                            img.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'150\' viewBox=\'0 0 150 150\' fill=\'none\'%3E%3Crect width=\'150\' height=\'150\' fill=\'%23E5E7EB\'/%3E%3Cpath d=\'M65 60H85V90H65V60Z\' fill=\'%239CA3AF\'/%3E%3Ccircle cx=\'75\' cy=\'45\' r=\'10\' fill=\'%239CA3AF\'/%3E%3C/svg%3E';
                            resolve();
                        };
                        img.src = fallbackUrl;
                    };
                    img.src = imageUrl;
                    img.alt = file.name || 'Image';
                });
            },

            /**
             * @method getPreferredImageUrl
             * @description Gets the preferred URL for an image, typically a high-resolution thumbnail.
             * @param {object} file - The file object.
             * @returns {string} The image URL.
             */
            getPreferredImageUrl(file) {
                if (state.providerType === 'googledrive') {
                    if (file.thumbnailLink) {
                        return file.thumbnailLink.replace('=s220', '=s1000');
                    }
                    return `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`;
                } else { // OneDrive
                    if (file.thumbnails && file.thumbnails.large) {
                        return file.thumbnails.large.url;
                    }
                    return file.downloadUrl || `https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/content`;
                }
            },

            /**
             * @method getFallbackImageUrl
             * @description Gets a fallback URL for an image if the preferred one fails.
             * @param {object} file - The file object.
             * @returns {string} The fallback image URL.
             */
            getFallbackImageUrl(file) {
                 if (state.providerType === 'googledrive') {
                    return file.downloadUrl || `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
                } else { // OneDrive
                    return file.downloadUrl || `https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/content`;
                }
            },

            /**
             * @method formatFileSize
             * @description Formats a file size in bytes into a human-readable string.
             * @param {number} bytes - The file size in bytes.
             * @returns {string} The formatted file size.
             */
            formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            },

            /**
             * @method updateLoadingProgress
             * @description Updates the loading progress indicator.
             * @param {number} current - The current progress count.
             * @param {number} total - The total number of items.
             * @param {string} [message=''] - An optional message to display.
             */
            updateLoadingProgress(current, total, message = '') {
                state.loadingProgress = { current, total };
                this.elements.loadingCounter.textContent = current;
                this.elements.loadingMessage.textContent = message || (total ?
                    `Processing ${current} of ${total} items...` :
                    `Found ${current} items`);
                if (total > 0) {
                    const percentage = (current / total) * 100;
                    this.elements.loadingProgressBar.style.width = `${percentage}%`;
                }
            }
        };

        /**
         * @class DBManager
         * @description Manages all interactions with the IndexedDB database.
         */
        class DBManager {
            constructor() { this.db = null; }
            /**
             * @method init
             * @description Initializes the IndexedDB database and creates object stores if they don't exist.
             * @returns {Promise<void>} A promise that resolves when the database is successfully opened.
             */
            async init() {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open('Orbital8-Goji-V1', 1);
                    request.onupgradeneeded = (event) => {
                        const db = event.target.result;
                        if (!db.objectStoreNames.contains('folderCache')) {
                            db.createObjectStore('folderCache', { keyPath: 'folderId' });
                        }
                        if (!db.objectStoreNames.contains('metadata')) {
                            db.createObjectStore('metadata', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('syncQueue')) {
                            db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                        }
                    };
                    request.onsuccess = (event) => { this.db = event.target.result; resolve(); };
                    request.onerror = (event) => reject(event.target.error);
                });
            }
            /**
             * @method getFolderCache
             * @description Retrieves cached file list for a folder from the database.
             * @param {string} folderId - The ID of the folder to retrieve from the cache.
             * @returns {Promise<Array<object>|null>} A promise that resolves with the array of file objects or null if not found.
             */
            async getFolderCache(folderId) {
                if (!this.db) return null;
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction('folderCache', 'readonly');
                    const store = transaction.objectStore('folderCache');
                    const request = store.get(folderId);
                    request.onsuccess = () => resolve(request.result ? request.result.files : null);
                    request.onerror = () => reject(request.error);
                });
            }
            /**
             * @method saveFolderCache
             * @description Saves a list of files for a folder to the database cache.
             * @param {string} folderId - The ID of the folder.
             * @param {Array<object>} files - The array of file objects to cache.
             * @returns {Promise<void>} A promise that resolves when the data is saved.
             */
            async saveFolderCache(folderId, files) {
                if (!this.db) return;
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction('folderCache', 'readwrite');
                    const store = transaction.objectStore('folderCache');
                    const request = store.put({ folderId, files, timestamp: Date.now() });
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }
            /**
             * @method getMetadata
             * @description Retrieves metadata for a specific file from the database.
             * @param {string} fileId - The ID of the file.
             * @returns {Promise<object|null>} A promise that resolves with the metadata object or null if not found.
             */
            async getMetadata(fileId) {
                if (!this.db) return null;
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction('metadata', 'readonly');
                    const store = transaction.objectStore('metadata');
                    const request = store.get(fileId);
                    request.onsuccess = () => resolve(request.result ? request.result.metadata : null);
                    request.onerror = () => reject(request.error);
                });
            }
            /**
             * @method saveMetadata
             * @description Saves metadata for a specific file to the database.
             * @param {string} fileId - The ID of the file.
             * @param {object} metadata - The metadata object to save.
             * @returns {Promise<void>} A promise that resolves when the metadata is saved.
             */
            async saveMetadata(fileId, metadata) {
                if (!this.db) return;
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction('metadata', 'readwrite');
                    const store = transaction.objectStore('metadata');
                    const request = store.put({ id: fileId, metadata });
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }
            /**
             * @method addToSyncQueue
             * @description (Placeholder) Adds an operation to the synchronization queue.
             * @param {object} operation - The operation to add.
             * @returns {Promise<void>}
             */
            async addToSyncQueue(operation) { return Promise.resolve(); }
            /**
             * @method readSyncQueue
             * @description (Placeholder) Reads all operations from the synchronization queue.
             * @returns {Promise<Array<object>>}
             */
            async readSyncQueue() { return Promise.resolve([]); }
            /**
             * @method deleteFromSyncQueue
             * @description (Placeholder) Deletes an operation from the synchronization queue.
             * @param {number} id - The ID of the operation to delete.
             * @returns {Promise<void>}
             */
            async deleteFromSyncQueue(id) { return Promise.resolve(); }
        }
        /**
         * @class SyncManager
         * @description (Placeholder) Manages background data synchronization with a web worker.
         */
        class SyncManager {
            constructor() { this.worker = null; this.syncInterval = null; }
            /** @method start - (Placeholder) Starts the sync process. */
            start() { /* Placeholder */ }
            /** @method stop - (Placeholder) Stops the sync process. */
            stop() { /* Placeholder */ }
            /** @method requestSync - (Placeholder) Requests an immediate sync. */
            requestSync() { /* Placeholder */ }
        }
        /**
         * @class VisualCueManager
         * @description Manages the intensity of visual effects and cues in the UI.
         */
        class VisualCueManager {
            constructor() {
                this.currentIntensity = localStorage.getItem('orbital8_visual_intensity') || 'medium';
                this.applyIntensity(this.currentIntensity);
            }
            /**
             * @method setIntensity
             * @description Sets the visual intensity level and saves it to local storage.
             * @param {('low'|'medium'|'high')} level - The desired intensity level.
             */
            setIntensity(level) {
                this.currentIntensity = level;
                this.applyIntensity(level);
                localStorage.setItem('orbital8_visual_intensity', level);
                document.querySelectorAll('.intensity-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.level === level);
                });
            }
            /**
             * @method applyIntensity
             * @description Applies the visual intensity settings to the UI by updating CSS variables.
             * @param {('low'|'medium'|'high')} level - The intensity level to apply.
             */
            applyIntensity(level) {
                const settings = {
                    low: { glow: 0.3, ripple: 1000, extraEffects: false },
                    medium: { glow: 0.6, ripple: 1500, extraEffects: false },
                    high: { glow: 1.0, ripple: 2000, extraEffects: true }
                };
                const config = settings[level];
                document.documentElement.style.setProperty('--glow', config.glow);
                document.documentElement.style.setProperty('--ripple', `${config.ripple}ms`);
                if (config.extraEffects) { document.body.classList.add('high-intensity-mode');
                } else { document.body.classList.remove('high-intensity-mode'); }
            }
        }
        /**
         * @class HapticFeedbackManager
         * @description Manages haptic feedback for user interactions on supported devices.
         */
        class HapticFeedbackManager {
            constructor() {
                this.isEnabled = localStorage.getItem('orbital8_haptic_enabled') !== 'false';
                this.isSupported = 'vibrate' in navigator;
                const checkbox = document.getElementById('haptic-enabled');
                if (checkbox) checkbox.checked = this.isEnabled;
            }
            /**
             * @method setEnabled
             * @description Enables or disables haptic feedback.
             * @param {boolean} enabled - True to enable, false to disable.
             */
            setEnabled(enabled) {
                this.isEnabled = enabled;
                localStorage.setItem('orbital8_haptic_enabled', enabled);
            }
            /**
             * @method triggerFeedback
             * @description Triggers a specific haptic feedback pattern if enabled and supported.
             * @param {('swipe'|'pillTap'|'buttonPress'|'error')} type - The type of feedback to trigger.
             */
            triggerFeedback(type) {
                if (!this.isEnabled || !this.isSupported) return;
                const patterns = { swipe: [20, 40], pillTap: [35], buttonPress: [25], error: [100, 50, 100] };
                const pattern = patterns[type];
                if (pattern && navigator.vibrate) { navigator.vibrate(pattern); }
            }
        }
        /**
         * @class MetadataExtractor
         * @description Handles the extraction of metadata from PNG files.
         */
        class MetadataExtractor {
            constructor() { this.abortController = null; }
            /**
             * @method abort
             * @description Aborts any ongoing metadata fetch operation.
             */
            abort() {
                if (this.abortController) {
                    this.abortController.abort();
                    this.abortController = null;
                }
            }
            /**
             * @method extract
             * @description Extracts metadata from a PNG file buffer.
             * @param {ArrayBuffer} buffer - The PNG file data as an ArrayBuffer.
             * @returns {Promise<object>} A promise that resolves with the extracted metadata object.
             */
            async extract(buffer) {
                if (!buffer) return {};
                const metadata = {};
                const view = new DataView(buffer);
                if (buffer.byteLength < 8) return {};
                let pos = 8;
                try {
                    while (pos < buffer.byteLength - 12) {
                        const chunkLength = view.getUint32(pos, false);
                        pos += 4;
                        let chunkType = '';
                        for (let i = 0; i < 4; i++) { chunkType += String.fromCharCode(view.getUint8(pos + i)); }
                        pos += 4;
                        if (chunkType === 'tEXt') {
                            let keyword = '';
                            let value = '';
                            let nullFound = false;
                            for (let i = 0; i < chunkLength; i++) {
                                const byte = view.getUint8(pos + i);
                                if (!nullFound) {
                                    if (byte === 0) { nullFound = true; } else { keyword += String.fromCharCode(byte); }
                                } else { value += String.fromCharCode(byte); }
                            }
                            metadata[keyword] = value;
                        } else if (chunkType === 'IHDR') {
                            const width = view.getUint32(pos, false);
                            const height = view.getUint32(pos + 4, false);
                            metadata._dimensions = { width, height };
                        } else if (chunkType === 'IEND') { break; }
                        pos += chunkLength + 4;
                        if (chunkLength > buffer.byteLength || pos > buffer.byteLength) { break; }
                    }
                } catch (error) { /* Return what we have so far */ }
                return metadata;
            }
            /**
             * @method fetchMetadata
             * @description Fetches the initial bytes of a file and extracts its metadata.
             * @param {object} file - The file object to process.
             * @param {boolean} [isForExport=false] - A flag to indicate if the fetch is for an export operation.
             * @returns {Promise<object>} A promise that resolves with the extracted metadata or an error object.
             */
            async fetchMetadata(file, isForExport = false) {
                if (file.mimeType !== 'image/png') {
                    if (!isForExport) file.metadataStatus = 'loaded';
                    return { error: 'Not a PNG file' };
                }
                try {
                    this.abortController = new AbortController();
                    let response;
                    const requestOptions = {};
                    if(state.activeRequests) requestOptions.signal = state.activeRequests.signal;

                    if (state.providerType === 'googledrive') {
                        response = await state.provider.makeApiCall(`/files/${file.id}?alt=media`, { headers: { 'Range': 'bytes=0-65535' }, ...requestOptions }, false);
                    } else {
                        const accessToken = await state.provider.getAccessToken();
                        response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/content`, { headers: { 'Authorization': `Bearer ${accessToken}`, 'Range': 'bytes=0-65535' }, ...requestOptions });
                    }
                    if (!response.ok) { throw new Error(`HTTP ${response.status} ${response.statusText}`); }
                    const buffer = await response.arrayBuffer();
                    return await this.extract(buffer);
                } catch (error) {
                    if (error.name === 'AbortError') { return { error: 'Operation cancelled' }; }
                    return { error: error.message };
                }
            }
        }
        /**
         * @class BaseProvider
         * @description An abstract base class for cloud storage providers.
         */
        class BaseProvider {
            constructor() {}
            /**
             * @method updateUserMetadata
             * @description (Placeholder) Updates user-specific metadata for a file in the cloud.
             * @param {string} fileId - The ID of the file to update.
             * @param {object} updates - The metadata updates to apply.
             * @returns {Promise<void>}
             */
            updateUserMetadata(fileId, updates) {
                 // All updates are now local-first, this method is for cloud sync only (Phase 2)
                 return Promise.resolve();
            }
        }
        /**
         * @class GoogleDriveProvider
         * @extends BaseProvider
         * @description Implements the cloud storage provider interface for Google Drive.
         */
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
                this.loadStoredCredentials();
            }
            /**
             * @method loadStoredCredentials
             * @description Loads Google Drive API credentials from local storage.
             */
            loadStoredCredentials() {
                this.accessToken = localStorage.getItem('google_access_token');
                this.refreshToken = localStorage.getItem('google_refresh_token');
                this.clientSecret = localStorage.getItem('google_client_secret');
                this.isAuthenticated = !!(this.accessToken && this.refreshToken && this.clientSecret);
            }
            /**
             * @method storeCredentials
             * @description Stores Google Drive API credentials to local storage.
             */
            storeCredentials() {
                if (this.accessToken) localStorage.setItem('google_access_token', this.accessToken);
                if (this.refreshToken) localStorage.setItem('google_refresh_token', this.refreshToken);
                if (this.clientSecret) localStorage.setItem('google_client_secret', this.clientSecret);
            }
            /**
             * @method clearStoredCredentials
             * @description Removes Google Drive API credentials from local storage.
             */
            clearStoredCredentials() {
                localStorage.removeItem('google_access_token');
                localStorage.removeItem('google_refresh_token');
                localStorage.removeItem('google_client_secret');
            }
            /**
             * @method authenticate
             * @description Initiates the Google Drive authentication flow.
             * @param {string} clientSecret - The Google API client secret.
             * @returns {Promise<boolean>} A promise that resolves to true if authentication is successful.
             */
            async authenticate(clientSecret) {
                if (clientSecret) { this.clientSecret = clientSecret; this.storeCredentials(); }
                if (!this.clientSecret) { throw new Error('Client secret is required for Google Drive authentication'); }
                if (this.accessToken && this.refreshToken) {
                    try { await this.makeApiCall('/files?pageSize=1'); this.isAuthenticated = true; return true; } catch (error) { /* continue */ }
                }
                return new Promise((resolve, reject) => {
                    const authUrl = this.buildAuthUrl();
                    const popup = window.open(authUrl, 'google-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');
                    if (!popup) { reject(new Error('Popup blocked by browser')); return; }
                    const checkClosed = setInterval(() => { if (popup.closed) { clearInterval(checkClosed); reject(new Error('Authentication cancelled')); } }, 1000);
                    const messageHandler = async (event) => {
                        if (event.origin !== window.location.origin) return;
                        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                            clearInterval(checkClosed); window.removeEventListener('message', messageHandler); popup.close();
                            try { await this.exchangeCodeForTokens(event.data.code); this.isAuthenticated = true; resolve(true); } catch (error) { reject(error); }
                        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
                            clearInterval(checkClosed); window.removeEventListener('message', messageHandler); popup.close(); reject(new Error(event.data.error));
                        }
                    };
                    window.addEventListener('message', messageHandler);
                });
            }
            /**
             * @method buildAuthUrl
             * @description Constructs the Google OAuth URL for authentication.
             * @returns {string} The full authentication URL.
             */
            buildAuthUrl() {
                const params = new URLSearchParams({ client_id: this.clientId, redirect_uri: this.redirectUri, response_type: 'code', scope: this.scope, access_type: 'offline', prompt: 'consent' });
                return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
            }
            /**
             * @method exchangeCodeForTokens
             * @description Exchanges an authorization code for access and refresh tokens.
             * @param {string} code - The authorization code received from Google.
             * @returns {Promise<void>}
             */
            async exchangeCodeForTokens(code) {
                const response = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ client_id: this.clientId, client_secret: this.clientSecret, code: code, grant_type: 'authorization_code', redirect_uri: this.redirectUri })
                });
                if (!response.ok) { throw new Error('Token exchange failed'); }
                const tokens = await response.json();
                this.accessToken = tokens.access_token; this.refreshToken = tokens.refresh_token;
                this.storeCredentials();
            }
            /**
             * @method refreshAccessToken
             * @description Uses the refresh token to obtain a new access token.
             * @returns {Promise<string>} A promise that resolves with the new access token.
             */
            async refreshAccessToken() {
                if (!this.refreshToken || !this.clientSecret) { throw new Error('No refresh token or client secret available'); }
                const response = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ client_id: this.clientId, client_secret: this.clientSecret, refresh_token: this.refreshToken, grant_type: 'refresh_token' })
                });
                if (!response.ok) { throw new Error('Failed to refresh access token'); }
                const tokens = await response.json(); this.accessToken = tokens.access_token; this.storeCredentials(); return this.accessToken;
            }
            /**
             * @method makeApiCall
             * @description Makes a call to the Google Drive API, handling token refresh if necessary.
             * @param {string} endpoint - The API endpoint to call.
             * @param {object} [options={}] - The options for the fetch request.
             * @param {boolean} [isJson=true] - Whether to parse the response as JSON.
             * @returns {Promise<object|Response>} The API response.
             */
            async makeApiCall(endpoint, options = {}, isJson = true) {
                if (!this.accessToken) { throw new Error('Not authenticated'); }
                const url = endpoint.startsWith('https://') ? endpoint : `${this.apiBase}${endpoint}`;
                const headers = { 'Authorization': `Bearer ${this.accessToken}`, ...options.headers };
                if(isJson) { headers['Content-Type'] = 'application/json'; }
                let response = await fetch(url, { ...options, headers });
                if (response.status === 401 && this.refreshToken && this.clientSecret) {
                    try {
                        await this.refreshAccessToken();
                        headers['Authorization'] = `Bearer ${this.accessToken}`;
                        response = await fetch(url, { ...options, headers });
                    } catch (refreshError) { this.isAuthenticated = false; this.clearStoredCredentials(); throw new Error('Authentication expired. Please reconnect.'); }
                }
                if (!response.ok) { const errorText = await response.text(); throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`); }
                if (isJson) { return await response.json(); }
                return response;
            }
            /**
             * @method getFolders
             * @description Retrieves a list of folders from Google Drive.
             * @returns {Promise<Array<object>>} A promise that resolves with an array of folder objects.
             */
            async getFolders() {
                const response = await this.makeApiCall('/files?q=mimeType%3D%27application/vnd.google-apps.folder%27&fields=files(id,name,createdTime,modifiedTime)&orderBy=modifiedTime%20desc');
                return response.files.map(folder => ({ id: folder.id, name: folder.name, type: 'folder', createdTime: folder.createdTime, modifiedTime: folder.modifiedTime }));
            }
            /**
             * @method getFilesAndMetadata
             * @description Retrieves files and their metadata from a specific folder in Google Drive.
             * @param {string} [folderId='root'] - The ID of the folder to retrieve files from.
             * @returns {Promise<{folders: Array, files: Array<object>}>} A promise that resolves with an object containing files and folders.
             */
            async getFilesAndMetadata(folderId = 'root') {
                const allFiles = []; let nextPageToken = null;
                do {
                    const query = `'${folderId}' in parents and trashed=false and (mimeType contains 'image/')`;
                    let url = `/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webContentLink,appProperties,parents),nextPageToken&pageSize=100`;
                    if (nextPageToken) { url += `&pageToken=${nextPageToken}`; }
                    const response = await this.makeApiCall(url, { signal: state.activeRequests.signal });
                    const files = response.files.filter(file => file.mimeType && file.mimeType.startsWith('image/')).map(file => ({ id: file.id, name: file.name, type: 'file', mimeType: file.mimeType, size: file.size ? parseInt(file.size) : 0, createdTime: file.createdTime, modifiedTime: file.modifiedTime, thumbnailLink: file.thumbnailLink, downloadUrl: file.webContentLink, appProperties: file.appProperties || {}, parents: file.parents }));
                    allFiles.push(...files);
                    nextPageToken = response.nextPageToken;
                    if (this.onProgressCallback) { this.onProgressCallback(allFiles.length); }
                } while (nextPageToken);
                return { folders: [], files: allFiles };
            }
            /**
             * @method moveFileToFolder
             * @description Moves a file to a different folder in Google Drive.
             * @param {string} fileId - The ID of the file to move.
             * @param {string} targetFolderId - The ID of the destination folder.
             * @returns {Promise<boolean>} A promise that resolves to true if the move is successful.
             */
            async moveFileToFolder(fileId, targetFolderId) {
                const file = await this.makeApiCall(`/files/${fileId}?fields=parents`);
                const previousParents = file.parents.join(',');
                await this.makeApiCall(`/files/${fileId}?addParents=${targetFolderId}&removeParents=${previousParents}&fields=id,parents`, { method: 'PATCH' });
                return true;
            }
            /**
             * @method updateFileProperties
             * @description Updates the custom properties of a file in Google Drive.
             * @param {string} fileId - The ID of the file to update.
             * @param {object} properties - The properties to set on the file.
             * @returns {Promise<boolean>} A promise that resolves to true if the update is successful.
             */
            async updateFileProperties(fileId, properties) {
                await this.makeApiCall(`/files/${fileId}`, { method: 'PATCH', body: JSON.stringify({ appProperties: properties }) });
                return true;
            }
            /**
             * @method deleteFile
             * @description Moves a file to the trash in Google Drive.
             * @param {string} fileId - The ID of the file to delete.
             * @returns {Promise<boolean>} A promise that resolves to true if the file is trashed successfully.
             */
            async deleteFile(fileId) {
                await this.makeApiCall(`/files/${fileId}`, { method: 'PATCH', body: JSON.stringify({ trashed: true }) });
                return true;
            }
            /**
             * @method disconnect
             * @description Disconnects from Google Drive by clearing stored credentials.
             */
            async disconnect() {
                this.isAuthenticated = false; this.accessToken = null; this.refreshToken = null; this.clientSecret = null;
                this.clearStoredCredentials();
            }
        }
        /**
         * @class OneDriveProvider
         * @extends BaseProvider
         * @description Implements the cloud storage provider interface for Microsoft OneDrive.
         */
        class OneDriveProvider extends BaseProvider {
            constructor() {
                super();
                this.name = 'onedrive';
                this.apiBase = 'https://graph.microsoft.com/v1.0';
                this.isAuthenticated = false; this.activeAccount = null; this.msalInstance = null;
                this.currentParentId = null; this.currentParentPath = ''; this.breadcrumb = [];
                this.onProgressCallback = null; this.initMSAL();
            }
            /**
             * @method initMSAL
             * @description Initializes the MSAL (Microsoft Authentication Library) client.
             */
            initMSAL() {
                const msalConfig = {
                    auth: { clientId: 'b407fd45-c551-4dbb-9da5-cab3a2c5a949', authority: 'https://login.microsoftonline.com/common', redirectUri: window.location.origin + window.location.pathname },
                    cache: { cacheLocation: 'localStorage' }
                };
                this.msalInstance = new msal.PublicClientApplication(msalConfig);
            }
            /**
             * @method authenticate
             * @description Initiates the OneDrive authentication flow using MSAL.
             * @returns {Promise<boolean>} A promise that resolves to true if authentication is successful.
             */
            async authenticate() {
                try {
                    const accounts = this.msalInstance.getAllAccounts();
                    if (accounts.length > 0) { this.msalInstance.setActiveAccount(accounts[0]); this.activeAccount = accounts[0]; }
                    else { const loginResponse = await this.msalInstance.loginPopup({ scopes: ['Files.ReadWrite.AppFolder', 'User.Read'] });
                        this.activeAccount = loginResponse.account; this.msalInstance.setActiveAccount(this.activeAccount);
                    }
                    this.isAuthenticated = true; return true;
                } catch (error) { this.isAuthenticated = false; throw new Error(`Authentication failed: ${error.message}`); }
            }
            /**
             * @method getAccessToken
             * @description Acquires an access token for the Microsoft Graph API, refreshing if necessary.
             * @returns {Promise<string>} A promise that resolves with the access token.
             */
            async getAccessToken() {
                if (!this.activeAccount) { throw new Error('No active account'); }
                try {
                    const response = await this.msalInstance.acquireTokenSilent({ scopes: ['Files.ReadWrite.AppFolder'], account: this.activeAccount });
                    return response.accessToken;
                } catch (silentError) {
                    if (silentError instanceof msal.InteractionRequiredAuthError) {
                        const response = await this.msalInstance.acquireTokenPopup({ scopes: ['Files.ReadWrite.AppFolder'], account: this.activeAccount });
                        return response.accessToken;
                    } throw silentError;
                }
            }
            /**
             * @method makeApiCall
             * @description Makes a call to the Microsoft Graph API.
             * @param {string} endpoint - The API endpoint to call.
             * @param {object} [options={}] - The options for the fetch request.
             * @returns {Promise<Response>} The fetch Response object.
             */
            async makeApiCall(endpoint, options = {}) {
                const accessToken = await this.getAccessToken();
                const url = endpoint.startsWith('https://') ? endpoint : `${this.apiBase}${endpoint}`;
                const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...options.headers };
                const response = await fetch(url, { ...options, headers });
                if (response.status === 401) { throw new Error('TOKEN_EXPIRED'); }
                if (!response.ok) { const errorText = await response.text(); throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`); }
                return response;
            }
            /**
             * @method getFilesAndMetadata
             * @description Retrieves files and metadata from a specific folder in OneDrive.
             * @param {string} [folderId='root'] - The ID of the folder to retrieve files from.
             * @returns {Promise<{folders: Array, files: Array<object>}>} A promise that resolves with an object containing files and folders.
             */
            async getFilesAndMetadata(folderId = 'root') {
                const allFiles = [];
                let endpoint = folderId === 'root' ? '/me/drive/root/children' : `/me/drive/items/${folderId}/children`;
                let nextLink = `${this.apiBase}${endpoint}`;
                while(nextLink) {
                    const response = await this.makeApiCall(nextLink.replace(this.apiBase, ''), { signal: state.activeRequests.signal });
                    const data = await response.json();
                    const files = data.value.filter(item => item.file && item.file.mimeType && item.file.mimeType.startsWith('image/'))
                        .map(item => ({
                            id: item.id, name: item.name, type: 'file', mimeType: item.file.mimeType, size: item.size || 0,
                            createdTime: item.createdDateTime, modifiedTime: item.lastModifiedDateTime,
                            thumbnails: item.thumbnails && item.thumbnails.length > 0 ? { large: item.thumbnails[0].large } : null,
                            downloadUrl: item['@microsoft.graph.downloadUrl']
                        }));
                    allFiles.push(...files);
                    nextLink = data['@odata.nextLink'];
                    if (this.onProgressCallback) { this.onProgressCallback(allFiles.length); }
                }
                return { folders: [], files: allFiles };
            }
            /**
             * @method getDownloadsFolder
             * @description Finds and returns the user's Downloads folder, or the root if not found.
             * @returns {Promise<object>} A promise that resolves with the folder object.
             */
            async getDownloadsFolder() {
                try {
                    const response = await this.makeApiCall('/me/drive/root/children');
                    const data = await response.json();
                    const downloadsFolder = data.value.find(item => item.folder && (item.name.toLowerCase() === 'downloads' || item.name.toLowerCase() === 'download'));
                    if (downloadsFolder) { return downloadsFolder; }
                    return { id: 'root', name: 'Root', folder: true };
                } catch (error) { console.warn('Could not find Downloads folder, using root:', error); return { id: 'root', name: 'Root', folder: true }; }
            }
            /**
             * @method getFolders
             * @description Retrieves the initial list of folders, starting from the Downloads folder.
             * @returns {Promise<Array<object>>} A promise that resolves with an array of folder objects.
             */
            async getFolders() {
                try {
                    const downloadsFolder = await this.getDownloadsFolder();
                    this.currentParentId = downloadsFolder.id; this.currentParentPath = downloadsFolder.name;
                    this.breadcrumb = [{ id: downloadsFolder.id, name: downloadsFolder.name }];
                    return await this.loadFoldersInParent(downloadsFolder.id);
                } catch (error) { console.warn('Failed to load initial folders:', error); return []; }
            }
            /**
             * @method loadFoldersInParent
             * @description Loads the list of subfolders within a given parent folder.
             * @param {string} parentId - The ID of the parent folder.
             * @returns {Promise<Array<object>>} A promise that resolves with an array of folder objects.
             */
            async loadFoldersInParent(parentId) {
                try {
                    const folders = [];
                    let endpoint = parentId === 'root' ? '/me/drive/root/children' : `/me/drive/items/${parentId}/children`;
                    let nextLink = `${this.apiBase}${endpoint}`;
                    do {
                        const response = await this.makeApiCall(nextLink.replace(this.apiBase, ''));
                        const data = await response.json();
                        const folderItems = data.value.filter(item => item.folder).map(folder => ({ id: folder.id, name: folder.name, type: 'folder', createdTime: folder.createdDateTime, modifiedTime: folder.lastModifiedDateTime, itemCount: folder.folder.childCount || 0, hasChildren: (folder.folder.childCount || 0) > 0 }));
                        folders.push(...folderItems);
                        nextLink = data['@odata.nextLink'];
                    } while (nextLink);
                    return folders.sort((a, b) => a.name.localeCompare(b.name));
                } catch (error) { console.warn('Failed to load folders:', error); return []; }
            }
            /**
             * @method drillIntoFolder
             * @description Navigates into a subfolder and loads its contents.
             * @param {object} folder - The folder object to drill into.
             * @returns {Promise<Array<object>>} A promise that resolves with the list of folders in the new directory.
             */
            async drillIntoFolder(folder) {
                try {
                    this.breadcrumb.push({ id: folder.id, name: folder.name });
                    this.currentParentId = folder.id;
                    this.currentParentPath = this.breadcrumb.map(b => b.name).join(' / ');
                    return await this.loadFoldersInParent(folder.id);
                } catch (error) { console.warn('Failed to drill into folder:', error); return []; }
            }
            /**
             * @method navigateToParent
             * @description Navigates to the parent directory.
             * @returns {Promise<Array<object>>} A promise that resolves with the list of folders in the parent directory.
             */
            async navigateToParent() {
                if (this.breadcrumb.length <= 1) { return await this.getFolders(); }
                this.breadcrumb.pop();
                const parentFolder = this.breadcrumb[this.breadcrumb.length - 1];
                this.currentParentId = parentFolder.id;
                this.currentParentPath = this.breadcrumb.map(b => b.name).join(' / ');
                return await this.loadFoldersInParent(parentFolder.id);
            }
            /**
             * @method getCurrentPath
             * @description Gets the current folder path as a string.
             * @returns {string} The current path.
             */
            getCurrentPath() { return this.currentParentPath; }
            /**
             * @method canGoUp
             * @description Checks if navigation to a parent directory is possible.
             * @returns {boolean} True if it's possible to go up, false otherwise.
             */
            canGoUp() { return this.breadcrumb.length > 1; }
            /**
             * @method moveFileToFolder
             * @description Moves a file to a different folder in OneDrive.
             * @param {string} fileId - The ID of the file to move.
             * @param {string} targetFolderId - The ID of the destination folder.
             * @returns {Promise<boolean>} A promise that resolves to true if the move is successful.
             */
            async moveFileToFolder(fileId, targetFolderId) {
                await this.makeApiCall(`/me/drive/items/${fileId}`, { method: 'PATCH', body: JSON.stringify({ parentReference: { id: targetFolderId } }) });
                return true;
            }
            /**
             * @method deleteFile
             * @description Deletes a file in OneDrive.
             * @param {string} fileId - The ID of the file to delete.
             * @returns {Promise<boolean>} A promise that resolves to true if the deletion is successful.
             */
            async deleteFile(fileId) {
                await this.makeApiCall(`/me/drive/items/${fileId}`, { method: 'DELETE' });
                return true;
            }
            /**
             * @method disconnect
             * @description Disconnects from OneDrive by logging out the current user.
             */
            async disconnect() {
                this.isAuthenticated = false; this.activeAccount = null;
                if (this.msalInstance) {
                    const accounts = this.msalInstance.getAllAccounts();
                    if (accounts.length > 0) { await this.msalInstance.logoutPopup({ account: accounts[0] }); }
                }
            }
        }
        /**
         * @class ExportSystem
         * @description Handles the logic for exporting image data and metadata to a CSV file.
         */
        class ExportSystem {
            /**
             * @method exportData
             * @description Exports a list of images with their metadata to a CSV file.
             * @param {Array<object>} imagesWithMetadata - An array of image objects, each including metadata.
             */
            async exportData(imagesWithMetadata) {
                if (imagesWithMetadata.length === 0) {
                    Utils.showToast('No images to export', 'info', true);
                    return;
                }
                const csvData = this.formatForCSV(imagesWithMetadata);
                this.downloadCSV(csvData);
            }
            /**
             * @method formatForCSV
             * @description Formats the image data into a CSV-compatible array.
             * @param {Array<object>} images - The array of image objects.
             * @returns {Array<Array<string>>} A 2D array representing the CSV data.
             */
            formatForCSV(images) {
                const headers = [ 'Filename', 'Direct Image URL', 'Prompt', 'Negative Prompt', 'Model', 'Width', 'Height', 'Steps', 'Seed', 'CFG Scale', 'Size', 'Created Date', 'Modified Date', 'Tags', 'Notes', 'Quality Rating', 'Content Rating', 'Provider', 'Metadata (JSON)' ];
                const rows = images.map(image => {
                    const meta = image.extractedMetadata || {}; const dims = meta._dimensions || {};
                    return [ image.name || '', this.getDirectImageURL(image), this.extractMetadataValue(meta, ['prompt', 'Prompt', 'parameters']), this.extractMetadataValue(meta, ['negative_prompt', 'Negative Prompt']), this.extractMetadataValue(meta, ['model', 'Model']), dims.width || '', dims.height || '', this.extractMetadataValue(meta, ['steps', 'Steps']), this.extractMetadataValue(meta, ['seed', 'Seed']), this.extractMetadataValue(meta, ['cfg_scale', 'CFG Scale']), Utils.formatFileSize(image.size), image.createdTime ? new Date(image.createdTime).toISOString() : '', image.modifiedTime ? new Date(image.modifiedTime).toISOString() : '', (image.tags || []).join('; '), image.notes || '', image.qualityRating || 0, image.contentRating || 0, state.providerType || 'unknown', JSON.stringify(meta) ];
                });
                return [headers, ...rows];
            }
            /**
             * @method extractMetadataValue
             * @description Safely extracts a value from a metadata object using a list of possible keys.
             * @param {object} metadata - The metadata object.
             * @param {Array<string>} keys - An array of possible keys for the desired value.
             * @returns {string} The extracted value or an empty string if not found.
             */
            extractMetadataValue(metadata, keys) {
                for (const key of keys) {
                    if (metadata[key]) {
                        if (key === 'parameters') {
                            const promptMatch = metadata[key].match(/^(.*?)(Negative prompt:|$)/);
                            if (promptMatch && promptMatch[1]) return promptMatch[1].trim();
                        } return metadata[key];
                    }
                } return '';
            }
            /**
             * @method getDirectImageURL
             * @description Constructs a direct-view URL for an image based on the cloud provider.
             * @param {object} image - The image object.
             * @returns {string} The direct URL to the image.
             */
            getDirectImageURL(image) {
                if (state.providerType === 'googledrive') { return `https://drive.google.com/uc?id=${image.id}&export=view`;
                } else if (state.providerType === 'onedrive') { return image.downloadUrl || `https://graph.microsoft.com/v1.0/me/drive/items/${image.id}/content`; }
                return '';
            }
            /**
             * @method downloadCSV
             * @description Triggers a browser download for the generated CSV data.
             * @param {Array<Array<string>>} data - The CSV data to download.
             */
            downloadCSV(data) {
                const folderName = state.currentFolder.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const stackName = state.grid.stack;
                const date = new Date().toISOString().split('T')[0];
                const filename = `orbital8_${folderName}_${stackName}_${date}.csv`;
                const csvContent = data.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') ).join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = filename; a.style.display = 'none';
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        }
        if (window.location.search.includes('code=') || window.location.search.includes('error=')) {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code'); const error = urlParams.get('error');
            if (window.opener) {
                if (error) { window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: error }, window.location.origin);
                } else if (code) { window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', code: code }, window.location.origin); }
                window.close();
            }
        }

        /**
         * @namespace App
         * @description The main application object, handling high-level logic and state transitions.
         */
        const App = {
            /**
             * @method selectGoogleDrive
             * @description Handles the selection of Google Drive as the storage provider.
             */
            selectGoogleDrive() {
                state.providerType = 'googledrive';
                Utils.showScreen('gdrive-auth-screen');
                const provider = new GoogleDriveProvider();
                if (provider.isAuthenticated) {
                    state.provider = provider;
                    Utils.showScreen('gdrive-folder-screen');
                    Folders.loadGoogleDriveFolders();
                }
            },
            /**
             * @method selectOneDrive
             * @description Handles the selection of OneDrive as the storage provider.
             */
            async selectOneDrive() {
                state.providerType = 'onedrive';
                Utils.showScreen('onedrive-auth-screen');
                const provider = new OneDriveProvider();
                try {
                    const success = await provider.authenticate();
                    if (success) {
                        state.provider = provider;
                        Utils.showScreen('onedrive-folder-screen');
                        Folders.loadOneDriveFolders();
                    }
                } catch (error) {
                    Utils.elements.onedriveAuthStatus.textContent = 'Click to sign in with your Microsoft account';
                }
            },

            /**
             * @method backToProviderSelection
             * @description Returns the UI to the initial provider selection screen.
             */
            backToProviderSelection() {
                if(state.syncManager) state.syncManager.stop();
                state.provider = null;
                state.providerType = null;
                Utils.showScreen('provider-screen');
            },

            /**
             * @method initializeWithProvider
             * @description Initializes the main application view with a selected provider and folder.
             * @param {string} providerType - The type of the provider (e.g., 'googledrive').
             * @param {string} folderId - The ID of the selected folder.
             * @param {string} folderName - The name of the selected folder.
             * @param {BaseProvider} providerInstance - An instance of the selected provider.
             */
            async initializeWithProvider(providerType, folderId, folderName, providerInstance) {
                state.providerType = providerType;
                state.provider = providerInstance;
                state.currentFolder.id = folderId;
                state.currentFolder.name = folderName;
                state.activeRequests = new AbortController();

                await this.loadImages();
                this.switchToCommonUI();
                if(state.syncManager) state.syncManager.start();
            },

            /**
             * @method loadImages
             * @description Loads images from the cache or fetches them from the cloud provider.
             */
            async loadImages() {
                const cachedFiles = await state.dbManager.getFolderCache(state.currentFolder.id);

                if (cachedFiles) {
                    Utils.showScreen('app-container');
                    state.imageFiles = cachedFiles;
                    await this.processAllMetadata(state.imageFiles);
                    Core.initializeStacks();
                    Core.initializeImageDisplay();
                    this.refreshFolderInBackground();
                    return;
                }

                Utils.showScreen('loading-screen');
                Utils.updateLoadingProgress(0, 0, 'Fetching from cloud...');

                try {
                    const result = await state.provider.getFilesAndMetadata(state.currentFolder.id);
                    const files = result.files || [];

                    if (files.length === 0) {
                        Utils.showToast('No images found in this folder', 'info', true);
                        this.returnToFolderSelection();
                        return;
                    }

                    state.imageFiles = files;
                    await this.processAllMetadata(state.imageFiles, true);
                    await state.dbManager.saveFolderCache(state.currentFolder.id, state.imageFiles);

                    Core.initializeStacks();
                    Core.initializeImageDisplay();

                } catch (error) {
                    if (error.name !== 'AbortError') {
                        Utils.showToast(`Error loading images: ${error.message}`, 'error', true);
                    }
                    this.returnToFolderSelection();
                }
            },

            /**
             * @method refreshFolderInBackground
             * @description Fetches the latest folder content from the cloud and merges changes.
             */
            async refreshFolderInBackground() {
                try {
                    const result = await state.provider.getFilesAndMetadata(state.currentFolder.id);
                    const cloudFiles = result.files || [];
                    const localFiles = await state.dbManager.getFolderCache(state.currentFolder.id) || [];

                    const cloudFileMap = new Map(cloudFiles.map(f => [f.id, f]));
                    const localFileMap = new Map(localFiles.map(f => [f.id, f]));
                    let hasChanges = false;

                    for (const cloudFile of cloudFiles) {
                        const localFile = localFileMap.get(cloudFile.id);
                        if (!localFile || new Date(cloudFile.modifiedTime) > new Date(localFile.modifiedTime)) {
                            hasChanges = true;
                            localFileMap.set(cloudFile.id, cloudFile);
                        }
                    }

                    for (const localId of localFileMap.keys()) {
                        if (!cloudFileMap.has(localId)) {
                            hasChanges = true;
                            localFileMap.delete(localId);
                        }
                    }

                    if (hasChanges) {
                        const newMergedFiles = Array.from(localFileMap.values());
                        await this.processAllMetadata(newMergedFiles);
                        await state.dbManager.saveFolderCache(state.currentFolder.id, newMergedFiles);
                        state.imageFiles = newMergedFiles;
                        Core.initializeStacks();
                        Core.updateStackCounts();
                        if(state.imageFiles.length > 0) Core.displayCurrentImage();
                        else Core.showEmptyState();
                        Utils.showToast('Folder updated in background', 'info');
                    }
                } catch (error) {
                    console.warn("Background refresh failed:", error.message);
                }
            },

            /**
             * @method processAllMetadata
             * @description Processes metadata for all files, loading from cache or generating defaults.
             * @param {Array<object>} files - The array of file objects to process.
             * @param {boolean} [isFirstLoad=false] - A flag indicating if this is the initial load.
             */
            async processAllMetadata(files, isFirstLoad = false) {
                 if (isFirstLoad) Utils.updateLoadingProgress(0, files.length, 'Processing files...');
                 for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const metadata = await state.dbManager.getMetadata(file.id);
                    if (metadata) {
                        Object.assign(file, metadata);
                    } else {
                        const defaultMetadata = this.generateDefaultMetadata(file);
                        Object.assign(file, defaultMetadata);
                        await state.dbManager.saveMetadata(file.id, defaultMetadata);
                    }
                    if(isFirstLoad) Utils.updateLoadingProgress(i + 1, files.length);
                }
                this.extractMetadataInBackground(files.filter(f => f.mimeType === 'image/png'));
            },

            /**
             * @method generateDefaultMetadata
             * @description Generates a default metadata object for a file.
             * @param {object} file - The file object.
             * @returns {object} The default metadata object.
             */
            generateDefaultMetadata(file) {
                 const baseMetadata = {
                    stack: 'in',
                    tags: [],
                    qualityRating: 0,
                    contentRating: 0,
                    notes: '',
                    stackSequence: 0,
                    favorite: false,
                    extractedMetadata: {},
                    metadataStatus: 'pending'
                };

                 if (state.providerType === 'googledrive' && file.appProperties) {
                    baseMetadata.stack = file.appProperties.slideboxStack || 'in';
                    baseMetadata.tags = file.appProperties.slideboxTags ? file.appProperties.slideboxTags.split(',').map(t => t.trim()) : [];
                    baseMetadata.qualityRating = parseInt(file.appProperties.qualityRating) || 0;
                    baseMetadata.contentRating = parseInt(file.appProperties.contentRating) || 0;
                    baseMetadata.notes = file.appProperties.notes || '';
                    baseMetadata.stackSequence = parseInt(file.appProperties.stackSequence) || 0;
                    baseMetadata.favorite = file.appProperties.favorite === 'true';
                 }
                 return baseMetadata;
            },

            /**
             * @method switchToCommonUI
             * @description Switches the view to the main application container.
             */
            switchToCommonUI() {
                Utils.showScreen('app-container');
            },

            /**
             * @method returnToFolderSelection
             * @description Returns the user to the folder selection screen for the current provider.
             */
            returnToFolderSelection() {
                if (state.syncManager) {
                    state.syncManager.requestSync();
                }
                state.activeRequests.abort();
                this.resetViewState();
                if (state.providerType === 'googledrive') {
                    Utils.showScreen('gdrive-folder-screen');
                } else if (state.providerType === 'onedrive') {
                    Utils.showScreen('onedrive-folder-screen');
                }
            },

            /**
             * @method resetViewState
             * @description Resets the application's view state to its initial condition.
             */
            resetViewState() {
                state.imageFiles = [];
                state.stacks = { in: [], out: [], priority: [], trash: [] };
                Utils.elements.centerImage.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
                Core.updateStackCounts();
                Core.showEmptyState();
                Utils.elements.emptyState.classList.add('hidden');
            },

            /**
             * @method updateUserMetadata
             * @description Updates a file's metadata in the local state and database.
             * @param {string} fileId - The ID of the file to update.
             * @param {object} updates - An object containing the metadata fields to update.
             */
            async updateUserMetadata(fileId, updates) {
                const file = state.imageFiles.find(f => f.id === fileId);
                if (!file) return;
                Object.assign(file, updates);
                await state.dbManager.saveMetadata(file.id, file);
                await state.dbManager.saveFolderCache(state.currentFolder.id, state.imageFiles);
            },

            /**
             * @method deleteFile
             * @description Deletes a file from local state, database, and the cloud provider.
             * @param {string} fileId - The ID of the file to delete.
             */
            async deleteFile(fileId) {
                const fileIndex = state.imageFiles.findIndex(f => f.id === fileId);
                if (fileIndex > -1) {
                    const [file] = state.imageFiles.splice(fileIndex, 1);
                    const stackIndex = state.stacks[file.stack].findIndex(f => f.id === fileId);
                    if (stackIndex > -1) { state.stacks[file.stack].splice(stackIndex, 1); }
                }

                await state.dbManager.saveFolderCache(state.currentFolder.id, state.imageFiles);

                try {
                    await state.provider.deleteFile(fileId);
                } catch (e) {
                    Utils.showToast(`Failed to delete from cloud: ${e.message}`, 'error', true);
                }
            },

            /**
             * @method extractMetadataInBackground
             * @description Processes a batch of PNG files to extract metadata in the background.
             * @param {Array<object>} pngFiles - An array of PNG file objects to process.
             */
            async extractMetadataInBackground(pngFiles) {
                const BATCH_SIZE = 5;
                for (let i = 0; i < pngFiles.length; i += BATCH_SIZE) {
                    if (state.activeRequests.signal.aborted) return;
                    const batch = pngFiles.slice(i, i + BATCH_SIZE);
                    const promises = batch.map(file => {
                        if (file.metadataStatus === 'pending') {
                            return this.processFileMetadata(file);
                        }
                        return Promise.resolve();
                    });
                    await Promise.allSettled(promises);
                }
            },

            /**
             * @method processFileMetadata
             * @description Fetches and processes metadata for a single file.
             * @param {object} file - The file object to process.
             */
            async processFileMetadata(file) {
                if (file.metadataStatus === 'loaded' || file.metadataStatus === 'loading' || file.metadataStatus === 'error') return;
                file.metadataStatus = 'loading';
                try {
                    const metadata = await state.metadataExtractor.fetchMetadata(file);
                    let finalMetadata = { ...file };

                    if (metadata.error) {
                        finalMetadata.metadataStatus = 'error';
                        finalMetadata.extractedMetadata = { 'Error': metadata.error };
                        finalMetadata.prompt = `Metadata Error: ${metadata.error}`;
                    } else {
                        finalMetadata.metadataStatus = 'loaded';
                        finalMetadata.extractedMetadata = metadata;
                    }

                    await state.dbManager.saveMetadata(file.id, finalMetadata);
                    Object.assign(file, finalMetadata);

                } catch (error) {
                    if (error.name === 'AbortError') return;
                    console.warn(`Background metadata extraction failed for ${file.name}: ${error.message}`);
                    file.metadataStatus = 'error';
                    file.extractedMetadata = { 'Error': error.message };
                    file.prompt = `Metadata Error: ${error.message}`;
                    await state.dbManager.saveMetadata(file.id, file);
                }
            }
        };
        /**
         * @namespace Core
         * @description Handles the core application logic, such as managing image stacks and displaying images.
         */
        const Core = {
            /**
             * @method initializeStacks
             * @description Initializes the image stacks from the main list of image files.
             */
            initializeStacks() {
                STACKS.forEach(stack => { state.stacks[stack] = []; });
                state.imageFiles.forEach(file => {
                    const stack = file.stack || 'in';
                    if (STACKS.includes(stack)) {
                        state.stacks[stack].push(file);
                    } else {
                        state.stacks.in.push(file);
                    }
                });
                STACKS.forEach(stack => {
                    state.stacks[stack] = this.sortFiles(state.stacks[stack]);
                });
                this.updateStackCounts();
            },

            /**
             * @method sortFiles
             * @description Sorts an array of files based on their stack sequence and name.
             * @param {Array<object>} files - The array of file objects to sort.
             * @returns {Array<object>} The sorted array of files.
             */
            sortFiles(files) {
                return [...files].sort((a, b) => {
                    const seqA = a.stackSequence || 0;
                    const seqB = b.stackSequence || 0;
                    if (seqB !== seqA) {
                        return seqB - seqA;
                    }
                    return (a.name || '').localeCompare(b.name || '');
                });
            },

            /**
             * @method updateStackCounts
             * @description Updates the UI pill counters with the number of items in each stack.
             */
            updateStackCounts() {
                STACKS.forEach(stack => {
                    const count = state.stacks[stack] ? state.stacks[stack].length : 0;
                    const pill = document.getElementById(`pill-${stack}`);
                    if (pill) {
                        pill.textContent = count > 999 ? ':)' : count;
                        pill.classList.toggle('visible', count > 0);
                    }
                });
            },

            /**
             * @method initializeImageDisplay
             * @description Sets up the initial image display when the app loads a folder.
             */
            initializeImageDisplay() {
                if (state.imageFiles.length === 0) {
                    this.showEmptyState();
                    return;
                }
                state.currentStackPosition = 0;
                state.currentStack = 'in';

                this.displayTopImageFromStack('in');
                this.updateActiveProxTab();
                this.updateStackCounts();
            },

            /**
             * @method displayTopImageFromStack
             * @description Displays the first image from a specified stack.
             * @param {string} stackName - The name of the stack to display.
             */
            async displayTopImageFromStack(stackName) {
                const stack = state.stacks[stackName];
                if (!stack || stack.length === 0) {
                    this.showEmptyState();
                    return;
                }

                Utils.elements.emptyState.classList.add('hidden');
                state.currentStack = stackName;
                state.currentStackPosition = 0;

                await this.displayCurrentImage();
                this.updateActiveProxTab();
            },

            /**
             * @method displayCurrentImage
             * @description Displays the currently active image in the viewport.
             */
            async displayCurrentImage() {
                const currentStackArray = state.stacks[state.currentStack];
                if (!currentStackArray || currentStackArray.length === 0) {
                    this.showEmptyState();
                    return;
                }

                if (state.currentStackPosition >= currentStackArray.length) {
                    state.currentStackPosition = currentStackArray.length - 1;
                }
                if (state.currentStackPosition < 0) {
                    state.currentStackPosition = 0;
                }

                const currentFile = currentStackArray[state.currentStackPosition];
                if (!currentFile) {
                    this.showEmptyState();
                    return;
                }

                Utils.elements.detailsButton.style.display = 'flex';
                await Utils.setImageSrc(Utils.elements.centerImage, currentFile);

                const folderName = state.currentFolder.name;
                const truncatedFolder = folderName.length > 20 ? folderName.substring(0, 20) + '...' : folderName;
                Utils.elements.focusFilenameDisplay.textContent = `${truncatedFolder} / ${currentFile.name.replace(/\.[^/.]+$/, "")}`;

                state.currentScale = 1;
                state.panOffset = { x: 0, y: 0 };
                this.applyTransform();

                if (currentFile.metadataStatus === 'pending') {
                    App.processFileMetadata(currentFile);
                }

                this.updateImageCounters();
                this.updateFavoriteButton();
            },

            /**
             * @method updateImageCounters
             * @description Updates the UI elements that display the current image position and stack name.
             */
            updateImageCounters() {
                const stack = state.stacks[state.currentStack];
                const total = stack ? stack.length : 0;
                const current = total > 0 ? state.currentStackPosition + 1 : 0;
                const text = `${current} / ${total}`;
                Utils.elements.focusImageCount.textContent = text;
                Utils.elements.normalImageCount.textContent = text;
                Utils.elements.focusStackName.textContent = STACK_NAMES[state.currentStack];
            },

            /**
             * @method updateFavoriteButton
             * @description Toggles the visual state of the favorite button based on the current image's favorite status.
             */
            updateFavoriteButton() {
                const currentFile = state.stacks[state.currentStack]?.[state.currentStackPosition];
                if (!currentFile) return;
                Utils.elements.focusFavoriteBtn.classList.toggle('favorited', !!currentFile.favorite);
            },

            /**
             * @method applyTransform
             * @description Applies CSS transform for scaling and panning the main image.
             */
            applyTransform() {
                const transform = `scale(${state.currentScale}) translate(${state.panOffset.x}px, ${state.panOffset.y}px)`;
                Utils.elements.centerImage.style.transform = transform;
            },

            /**
             * @method updateActiveProxTab
             * @description Highlights the pill counter for the currently active stack.
             */
            updateActiveProxTab() {
                STACKS.forEach(stack => {
                    const pill = document.getElementById(`pill-${stack}`);
                    if (pill) pill.classList.remove('active');
                });

                const currentPill = document.getElementById(`pill-${state.currentStack}`);
                if (currentPill) currentPill.classList.add('active');
            },

            /**
             * @method moveToStack
             * @description Moves the current image to a different stack.
             * @param {string} targetStack - The name of the destination stack.
             */
            async moveToStack(targetStack) {
                const currentStackArray = state.stacks[state.currentStack];
                if (!currentStackArray || currentStackArray.length === 0) return;

                const currentImage = currentStackArray[state.currentStackPosition];
                if (!currentImage) return;

                const originalStackName = state.currentStack;
                if (targetStack === originalStackName) {
                    const otherImages = currentStackArray.filter(img => img.id !== currentImage.id);
                    const minSequence = otherImages.length > 0 ? Math.min(...otherImages.map(img => img.stackSequence || 0)) : Date.now();
                    const newSequence = minSequence - 1;
                    await App.updateUserMetadata(currentImage.id, { stackSequence: newSequence });
                    const [item] = currentStackArray.splice(state.currentStackPosition, 1);
                    item.stackSequence = newSequence;
                    currentStackArray.push(item);
                } else {
                    const newSequence = Date.now();
                    await App.updateUserMetadata(currentImage.id, { stack: targetStack, stackSequence: newSequence });
                    const [item] = currentStackArray.splice(state.currentStackPosition, 1);
                    item.stack = targetStack;
                    item.stackSequence = newSequence;
                    state.stacks[targetStack].unshift(item);
                    state.stacks[targetStack] = this.sortFiles(state.stacks[targetStack]);
                }

                this.updateStackCounts();
                this.updateActiveProxTab();
                await this.displayCurrentImage();
            },

            /**
             * @method showEmptyState
             * @description Displays the "empty state" view when no images are available in a stack.
             */
            showEmptyState() {
                state.currentImageLoadId = null;
                Utils.elements.centerImage.style.opacity = '0';
                Utils.elements.detailsButton.style.display = 'none';
                this.updateImageCounters();
                setTimeout(() => {
                    Utils.elements.centerImage.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
                    Utils.elements.centerImage.alt = 'No images in this stack';
                    Utils.elements.emptyState.classList.remove('hidden');
                    Utils.elements.centerImage.style.opacity = '1';
                    UI.updateEmptyStateButtons();
                }, 200);
            }
        };
        /**
         * @namespace Grid
         * @description Manages the grid view modal, including lazy loading, selection, and searching.
         */
        const Grid = {
            /**
             * @method open
             * @description Opens the grid view for a specific stack.
             * @param {string} stack - The name of the stack to display in the grid.
             */
            open(stack) {
                Utils.showModal('grid-modal');
                Utils.elements.gridTitle.textContent = STACK_NAMES[stack] || stack;
                state.grid.stack = stack;
                state.grid.isDirty = false;
                const value = Utils.elements.gridSize.value;
                Utils.elements.gridContainer.style.gridTemplateColumns = `repeat(${value}, 1fr)`;
                state.grid.selected = []; state.grid.filtered = [];
                Utils.elements.gridContainer.innerHTML = '';
                this.initializeLazyLoad(stack);
                this.updateSelectionUI();
                Core.updateStackCounts();
            },

            /**
             * @method close
             * @description Closes the grid view modal, applying any reordering if necessary.
             */
            async close() {
                if (state.grid.isDirty) {
                    await this.reorderStackOnClose();
                }
                Utils.hideModal('grid-modal');
                this.resetSearch(); this.destroyLazyLoad();
                const selectedImages = state.grid.selected;
                if (selectedImages.length === 1) {
                    const selectedFileId = selectedImages[0];
                    const stackArray = state.stacks[state.currentStack];
                    const selectedIndex = stackArray.findIndex(f => f.id === selectedFileId);
                    if (selectedIndex !== -1) { state.currentStackPosition = selectedIndex; }
                }
                Core.displayCurrentImage();
                state.grid.stack = null; state.grid.selected = [];
            },

            /**
             * @method handleIntersection
             * @description The callback for the IntersectionObserver, which triggers rendering of the next batch.
             * @param {Array<IntersectionObserverEntry>} entries - The intersection entries.
             */
            handleIntersection(entries) {
                if (entries[0].isIntersecting) { this.renderBatch(); }
            },

            /**
             * @method initializeLazyLoad
             * @description Sets up the lazy loading mechanism for the grid.
             * @param {string} stack - The name of the stack being displayed.
             */
            initializeLazyLoad(stack) {
                const lazyState = state.grid.lazyLoadState;
                lazyState.allFiles = state.grid.filtered.length > 0 ? state.grid.filtered : state.stacks[stack];
                lazyState.renderedCount = 0;
                Utils.elements.selectAllBtn.textContent = lazyState.allFiles.length;
                this.renderBatch();
                if (lazyState.observer) lazyState.observer.disconnect();
                lazyState.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
                    root: Utils.elements.gridContent, rootMargin: "400px"
                });
                const sentinel = document.getElementById('grid-sentinel');
                if (sentinel) { lazyState.observer.observe(sentinel); }
            },

            /**
             * @method destroyLazyLoad
             * @description Cleans up the lazy loading observer and state.
             */
            destroyLazyLoad() {
                const lazyState = state.grid.lazyLoadState;
                if (lazyState.observer) { lazyState.observer.disconnect(); lazyState.observer = null; }
                lazyState.allFiles = []; lazyState.renderedCount = 0;
            },

            /**
             * @method renderBatch
             * @description Renders a batch of images into the grid container.
             */
            renderBatch() {
                const lazyState = state.grid.lazyLoadState;
                const container = Utils.elements.gridContainer;
                const filesToRender = lazyState.allFiles.slice(lazyState.renderedCount, lazyState.renderedCount + lazyState.batchSize);

                const oldSentinel = document.getElementById('grid-sentinel');
                if (oldSentinel && lazyState.observer) {
                    lazyState.observer.unobserve(oldSentinel); oldSentinel.remove();
                }

                filesToRender.forEach(file => {
                    const div = document.createElement('div');
                    div.className = 'grid-item'; div.dataset.fileId = file.id;
                    if (state.grid.selected.includes(file.id)) { div.classList.add('selected'); }
                    const img = document.createElement('img');
                    img.className = 'grid-image'; img.alt = file.name || 'Image';
                    img.dataset.src = Utils.getPreferredImageUrl(file);
                    img.onload = () => img.classList.add('loaded');
                    img.onerror = () => {
                        img.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'150\' viewBox=\'0 0 150 150\' fill=\'none\'%3E%3Crect width=\'150\' height=\'150\' fill=\'%23E5E7EB\'/%3E%3Cpath d=\'M65 60H85V90H65V60Z\' fill=\'%239CA3AF\'/%3E%3Ccircle cx=\'75\' cy=\'45\' r=\'10\' fill=\'%239CA3AF\'/%3E%3C/svg%3E';
                        img.classList.add('loaded');
                    };
                    div.addEventListener('click', e => this.toggleSelection(e, file.id));
                    div.appendChild(img); container.appendChild(div);
                });
                container.querySelectorAll('.grid-image:not([src])').forEach(img => { img.src = img.dataset.src; });
                lazyState.renderedCount += filesToRender.length;

                if (lazyState.renderedCount < lazyState.allFiles.length) {
                    const sentinel = document.createElement('div');
                    sentinel.id = 'grid-sentinel';
                    container.appendChild(sentinel);
                    if (lazyState.observer) { lazyState.observer.observe(sentinel); }
                }
            },

            /**
             * @method toggleSelection
             * @description Toggles the selection state of a grid item.
             * @param {Event} e - The click event.
             * @param {string} fileId - The ID of the file to toggle.
             */
            toggleSelection(e, fileId) {
                const gridItem = e.currentTarget;
                const index = state.grid.selected.indexOf(fileId);
                if (index === -1) { state.grid.selected.push(fileId); gridItem.classList.add('selected');
                } else { state.grid.selected.splice(index, 1); gridItem.classList.remove('selected'); }
                state.grid.isDirty = true;
                this.updateSelectionUI();
            },

            /**
             * @method updateSelectionUI
             * @description Updates the UI elements related to selection (e.g., count, action buttons).
             */
            updateSelectionUI() {
                const count = state.grid.selected.length;
                const buttons = [Utils.elements.tagSelected, Utils.elements.moveSelected, Utils.elements.deleteSelected,
                               Utils.elements.exportSelected, Utils.elements.folderSelected];
                Utils.elements.selectionText.textContent = `${count} selected`;
                buttons.forEach(btn => { if (btn) btn.disabled = (count === 0); });
            },

            /**
             * @method selectAll
             * @description Selects all items currently visible in the grid.
             */
            selectAll() {
                const filesToSelect = state.grid.lazyLoadState.allFiles;
                state.grid.selected = filesToSelect.map(f => f.id);
                document.querySelectorAll('#grid-container .grid-item').forEach(item => {
                    item.classList.add('selected');
                });
                state.grid.isDirty = true;
                this.updateSelectionUI();
            },

            /**
             * @method deselectAll
             * @description Deselects all currently selected items in the grid.
             */
            deselectAll() {
                document.querySelectorAll('#grid-container .grid-item.selected').forEach(item => item.classList.remove('selected') );
                state.grid.selected = [];
                this.updateSelectionUI();
            },

            /**
             * @method performSearch
             * @description Executes a search based on the query in the search input and re-renders the grid.
             */
            performSearch() {
                const query = Utils.elements.omniSearch.value.trim();
                Utils.elements.clearSearchBtn.style.display = query ? 'block' : 'none';
                state.grid.selected = [];
                if (!query) { this.resetSearch(); return; }
                state.grid.filtered = this.searchImages(query);

                Utils.elements.gridContainer.innerHTML = '';
                if (state.grid.filtered.length === 0) {
                    Utils.elements.gridEmptyState.classList.remove('hidden');
                    Utils.elements.selectAllBtn.textContent = '0';
                } else {
                    Utils.elements.gridEmptyState.classList.add('hidden');
                }

                this.initializeLazyLoad(state.grid.stack);
                this.updateSelectionUI();
                state.grid.isDirty = true;
            },

            /**
             * @method resetSearch
             * @description Clears the search query and resets the grid to its default state.
             */
            resetSearch() {
                Utils.elements.omniSearch.value = '';
                Utils.elements.clearSearchBtn.style.display = 'none';
                Utils.elements.gridEmptyState.classList.add('hidden');
                state.grid.filtered = [];
                Utils.elements.gridContainer.innerHTML = '';
                this.initializeLazyLoad(state.grid.stack);
                Core.updateStackCounts();
                this.deselectAll();
            },

            /**
             * @method searchImages
             * @description Filters images based on a search query including terms, exclusions, and modifiers.
             * @param {string} query - The search query.
             * @returns {Array<object>} The filtered array of image objects.
             */
            searchImages(query) {
                const lowerCaseQuery = query.toLowerCase();
                const terms = lowerCaseQuery.split(/\s+/).filter(t => t);

                const modifiers = terms.filter(t => t.startsWith('#'));
                const exclusions = terms.filter(t => t.startsWith('-')).map(t => t.substring(1));
                const inclusions = terms.filter(t => !t.startsWith('#') && !t.startsWith('-'));

                let results = [...state.stacks[state.grid.stack]];

                // 1. Pass: Modifiers
                modifiers.forEach(mod => {
                    if (mod === '#favorite') {
                        results = results.filter(file => file.favorite === true);
                    } else if (mod.startsWith('#quality:')) {
                        const rating = parseInt(mod.split(':')[1]);
                        if (!isNaN(rating)) {
                            results = results.filter(file => file.qualityRating === rating);
                        }
                    } else if (mod.startsWith('#content:')) {
                        const rating = parseInt(mod.split(':')[1]);
                        if (!isNaN(rating)) {
                            results = results.filter(file => file.contentRating === rating);
                        }
                    }
                });

                // 2. Pass: Inclusions
                inclusions.forEach(term => {
                    results = results.filter(file => {
                        const searchableText = [
                            file.name || '',
                            file.tags?.join(' ') || '',
                            file.notes || '',
                            file.createdTime ? new Date(file.createdTime).toISOString().split('T')[0] : '',
                            JSON.stringify(file.extractedMetadata || {})
                        ].join(' ').toLowerCase();
                        return searchableText.includes(term);
                    });
                });

                // 3. Pass: Exclusions
                exclusions.forEach(term => {
                    results = results.filter(file => {
                        const searchableText = [
                            file.name || '',
                            file.tags?.join(' ') || '',
                            file.notes || '',
                            file.createdTime ? new Date(file.createdTime).toISOString().split('T')[0] : '',
                            JSON.stringify(file.extractedMetadata || {})
                        ].join(' ').toLowerCase();
                        return !searchableText.includes(term);
                    });
                });

                return results;
            },

            /**
             * @method reorderStackOnClose
             * @description Reorders the items in a stack based on grid selections or filtering before closing the grid.
             */
            async reorderStackOnClose() {
                const stackArray = state.stacks[state.grid.stack];
                let topItems = []; let bottomItems = [];

                if (state.grid.filtered.length > 0) {
                    const filteredIds = new Set(state.grid.filtered.map(f => f.id));
                    topItems = state.grid.filtered.sort((a, b) => a.name.localeCompare(b.name));
                    bottomItems = stackArray.filter(f => !filteredIds.has(f.id));
                } else if (state.grid.selected.length > 0) {
                    const selectedIds = new Set(state.grid.selected);
                    topItems = stackArray.filter(f => selectedIds.has(f.id)).sort((a,b) => a.name.localeCompare(b.name));
                    bottomItems = stackArray.filter(f => !selectedIds.has(f.id));
                } else { return; }

                const newStack = [...topItems, ...bottomItems];
                const timestamp = Date.now();

                newStack.forEach((file, i) => {
                    file.stackSequence = timestamp - i;
                });

                for(const file of newStack) {
                    await state.dbManager.saveMetadata(file.id, file);
                }
                await state.dbManager.saveFolderCache(state.currentFolder.id, state.imageFiles);

                state.stacks[state.grid.stack] = newStack;
                state.currentStackPosition = 0;
                Utils.showToast('Stack order updated', 'success');
            }
        };
        /**
         * @namespace Details
         * @description Manages the details modal, which displays information about a single image.
         */
        const Details = {
            currentTab: 'info',
            /**
             * @method show
             * @description Shows the details modal for the currently active image.
             */
            async show() {
                const currentFile = state.stacks[state.currentStack][state.currentStackPosition];
                if (!currentFile) return;
                if (currentFile.metadataStatus !== 'loaded') {
                    this.populateMetadataTab(currentFile);
                    await App.processFileMetadata(currentFile);
                }
                this.populateAllTabs(currentFile);
                Utils.showModal('details-modal');
                this.switchTab('info');
            },
            /**
             * @method hide
             * @description Hides the details modal.
             */
            hide() { Utils.hideModal('details-modal'); },
            /**
             * @method switchTab
             * @description Switches to a specific tab within the details modal.
             * @param {string} tabName - The name of the tab to switch to.
             */
            switchTab(tabName) {
                document.querySelectorAll('.tab-button').forEach(btn => { btn.classList.toggle('active', btn.dataset.tab === tabName); });
                document.querySelectorAll('.tab-content').forEach(content => { content.classList.toggle('active', content.id === `tab-${tabName}`); });
                this.currentTab = tabName;
            },
            /**
             * @method populateAllTabs
             * @description Populates all tabs in the details modal with the file's information.
             * @param {object} file - The file object.
             */
            populateAllTabs(file) {
                this.populateInfoTab(file); this.populateTagsTab(file); this.populateNotesTab(file); this.populateMetadataTab(file);
            },
            /**
             * @method populateInfoTab
             * @description Populates the 'Info' tab with basic file details.
             * @param {object} file - The file object.
             */
            populateInfoTab(file) {
                const filename = file.name || 'Unknown';
                Utils.elements.detailFilename.textContent = filename;
                if (state.providerType === 'googledrive') { Utils.elements.detailFilenameLink.href = `https://drive.google.com/file/d/${file.id}/view`;
                } else { Utils.elements.detailFilenameLink.href = file.downloadUrl || '#'; }
                Utils.elements.detailFilenameLink.style.display = 'inline';
                const date = file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : file.createdTime ? new Date(file.createdTime).toLocaleString() : 'Unknown';
                Utils.elements.detailDate.textContent = date;
                const size = file.size ? Utils.formatFileSize(file.size) : 'Unknown';
                Utils.elements.detailSize.textContent = size;
            },
            /**
             * @method populateTagsTab
             * @description Populates the 'Tags' tab with the file's tags.
             * @param {object} file - The file object.
             */
            populateTagsTab(file) {
                const tags = file.tags || [];
                Utils.elements.detailTags.innerHTML = '';
                tags.forEach(tag => {
                    const tagElement = document.createElement('div');
                    tagElement.className = 'tag-item';
                    tagElement.innerHTML = `<span>${tag}</span><button class="tag-remove" data-tag="${tag}">×</button>`;
                    Utils.elements.detailTags.appendChild(tagElement);
                });
                const addButton = document.createElement('div');
                addButton.className = 'add-tag-btn'; addButton.textContent = '+ Add Tag';
                addButton.addEventListener('click', () => this.showAddTagInput());
                Utils.elements.detailTags.appendChild(addButton);
                Utils.elements.detailTags.querySelectorAll('.tag-remove').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const tagToRemove = e.target.dataset.tag;
                        this.removeTag(file, tagToRemove);
                    });
                });
            },
            /**
             * @method showAddTagInput
             * @description Displays an input field to add a new tag.
             */
            showAddTagInput() {
                const input = document.createElement('input');
                input.type = 'text'; input.className = 'tag-input';
                input.placeholder = 'Enter tag name'; input.style.marginLeft = '8px';
                const addButton = Utils.elements.detailTags.querySelector('.add-tag-btn');
                addButton.parentNode.insertBefore(input, addButton);
                input.focus();
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        const tagName = input.value.trim();
                        if (tagName) {
                            const currentFile = state.stacks[state.currentStack][state.currentStackPosition];
                            const currentTags = currentFile.tags || [];
                            const newTags = [...new Set([...currentTags, tagName])];
                            App.updateUserMetadata(currentFile.id, { tags: newTags });
                            state.tags.add(tagName);
                            this.populateTagsTab(currentFile);
                            input.remove();
                        }
                    } else if (e.key === 'Escape') { input.remove(); }
                });
                input.addEventListener('blur', () => { setTimeout(() => input.remove(), 100); });
            },
            /**
             * @method removeTag
             * @description Removes a tag from a file.
             * @param {object} file - The file object.
             * @param {string} tagToRemove - The tag to remove.
             */
            removeTag(file, tagToRemove) {
                const currentTags = file.tags || [];
                const newTags = currentTags.filter(tag => tag !== tagToRemove);
                App.updateUserMetadata(file.id, { tags: newTags });
                this.populateTagsTab(file);
            },
            /**
             * @method populateNotesTab
             * @description Populates the 'Notes' tab with the file's notes and ratings.
             * @param {object} file - The file object.
             */
            populateNotesTab(file) {
                Utils.elements.detailNotes.value = file.notes || '';
                const newNotesTextarea = Utils.elements.detailNotes.cloneNode(true);
                Utils.elements.detailNotes.parentNode.replaceChild(newNotesTextarea, Utils.elements.detailNotes);
                Utils.elements.detailNotes = newNotesTextarea;
                Utils.elements.detailNotes.addEventListener('blur', () => {
                    const currentFile = state.stacks[state.currentStack][state.currentStackPosition];
                    if (currentFile.notes !== Utils.elements.detailNotes.value) {
                        App.updateUserMetadata(currentFile.id, { notes: Utils.elements.detailNotes.value });
                    }
                });
                this.setupStarRating('quality', file.qualityRating || 0);
                this.setupStarRating('content', file.contentRating || 0);
            },
            /**
             * @method setupStarRating
             * @description Sets up the interactive star rating component.
             * @param {('quality'|'content')} type - The type of rating.
             * @param {number} currentRating - The current rating value.
             */
            setupStarRating(type, currentRating) {
                const container = Utils.elements[`${type}Rating`]; if (!container) return;
                let rating = currentRating;
                const stars = container.querySelectorAll('.star');
                const updateVisuals = (r) => { stars.forEach((star, index) => { star.classList.toggle('active', index < r); }); };
                container.onmouseleave = () => updateVisuals(rating);
                stars.forEach((star, index) => {
                    star.onmouseenter = () => updateVisuals(index + 1);
                    star.onclick = () => {
                        const newRating = index + 1;
                        if (newRating === rating) { rating = 0; } else { rating = newRating; }
                        updateVisuals(rating);
                        const currentFile = state.stacks[state.currentStack][state.currentStackPosition];
                        if (!currentFile) return;
                        const updatePayload = {};
                        if (type === 'quality') { updatePayload.qualityRating = rating; } else { updatePayload.contentRating = rating; }
                        App.updateUserMetadata(currentFile.id, updatePayload);
                    };
                });
                updateVisuals(rating);
            },
            /**
             * @method populateMetadataTab
             * @description Populates the 'Metadata' tab with the file's extracted and technical metadata.
             * @param {object} file - The file object.
             */
            populateMetadataTab(file) {
                Utils.elements.metadataTable.innerHTML = '';
                if (file.metadataStatus !== 'loaded' && file.metadataStatus !== 'error') {
                    Utils.elements.metadataTable.innerHTML = `<tr><td colspan="2" style="text-align:center; padding: 20px;"><div class="spinner" style="margin: 0 auto;"></div></td></tr>`;
                    return;
                }
                const metadata = file.extractedMetadata || {};
                if (Object.keys(metadata).length === 0) {
                    this.addMetadataRow('Status', 'No embedded metadata found', false);
                    return;
                }
                const priorityFields = ['prompt', 'Prompt', 'model', 'Model', 'seed', 'Seed', 'negative_prompt', 'Negative_Prompt', 'steps', 'Steps', 'cfg_scale', 'CFG_Scale', 'sampler', 'Sampler', 'scheduler', 'Scheduler', 'api_call', 'API_Call'];
                priorityFields.forEach(field => { if (metadata[field]) { this.addMetadataRow(field, metadata[field], true); } });
                const remainingFields = Object.entries(metadata).filter(([key, value]) => !priorityFields.includes(key) && !priorityFields.includes(key.toLowerCase()) && value );
                if (priorityFields.some(field => metadata[field]) && remainingFields.length > 0) {
                    const separatorRow = document.createElement('tr');
                    separatorRow.innerHTML = `<td colspan="2" style="padding: 8px; background: #f0f0f0; text-align: center; font-size: 12px; color: #666; font-weight: bold;">Other Metadata</td>`;
                    Utils.elements.metadataTable.appendChild(separatorRow);
                }
                remainingFields.forEach(([key, value]) => { this.addMetadataRow(key, value, false); });
                if (Object.keys(metadata).length > 0) {
                    const separatorRow = document.createElement('tr');
                    separatorRow.innerHTML = `<td colspan="2" style="padding: 8px; background: #f0f0f0; text-align: center; font-size: 12px; color: #666; font-weight: bold;">File Information</td>`;
                    Utils.elements.metadataTable.appendChild(separatorRow);
                }
                this.addMetadataRow('File Name', file.name || 'Unknown', false);
                this.addMetadataRow('File Size', file.size ? Utils.formatFileSize(file.size) : 'Unknown', false);
                this.addMetadataRow('MIME Type', file.mimeType || 'Unknown', false);
                this.addMetadataRow('Created', file.createdTime ? new Date(file.createdTime).toLocaleString() : 'Unknown', false);
                this.addMetadataRow('Modified', file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : 'Unknown', false);
                this.addMetadataRow('Provider', state.providerType === 'googledrive' ? 'Google Drive' : 'OneDrive', false);
            },
            /**
             * @method addMetadataRow
             * @description Adds a key-value pair as a row to the metadata table.
             * @param {string} key - The metadata key.
             * @param {string} value - The metadata value.
             * @param {boolean} [needsCopyButton=false] - If true, a copy button will be added to the row.
             */
            addMetadataRow(key, value, needsCopyButton = false) {
                const row = document.createElement('tr');
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let formattedValue = String(value);
                if (formattedValue.length > 200) { formattedValue = formattedValue.replace(/,\s+/g, ',\n').replace(/\.\s+/g, '.\n').replace(/;\s+/g, ';\n').trim();
                } else if (formattedValue.length > 100) { formattedValue = formattedValue.replace(/\s+/g, ' ').trim(); }
                const keyCell = document.createElement('td');
                keyCell.className = 'key-cell'; keyCell.textContent = formattedKey;
                const valueCell = document.createElement('td');
                valueCell.className = 'value-cell';
                if (formattedValue.length > 500) { valueCell.style.maxHeight = '120px'; valueCell.style.overflowY = 'auto'; valueCell.style.fontSize = '12px'; valueCell.style.lineHeight = '1.4'; }
                valueCell.textContent = formattedValue;
                if (needsCopyButton) {
                    const copyButton = document.createElement('button');
                    copyButton.className = 'copy-button copy-metadata'; copyButton.textContent = 'Copy';
                    copyButton.dataset.value = String(value); copyButton.title = `Copy ${formattedKey} to clipboard`;
                    valueCell.appendChild(copyButton);
                }
                row.appendChild(keyCell); row.appendChild(valueCell);
                Utils.elements.metadataTable.appendChild(row);
            },
            /**
             * @method copyToClipboard
             * @description Copies the given text to the user's clipboard.
             * @param {string} text - The text to copy.
             */
            copyToClipboard(text) {
                navigator.clipboard.writeText(text).then(() => { Utils.showToast('📋 Copied to clipboard', 'success', true);
                }).catch(() => {
                    const textArea = document.createElement('textarea');
                    textArea.value = text; textArea.style.position = 'fixed'; textArea.style.opacity = '0';
                    document.body.appendChild(textArea); textArea.select();
                    try { document.execCommand('copy'); Utils.showToast('📋 Copied to clipboard', 'success', true);
                    } catch (err) { Utils.showToast('❌ Failed to copy', 'error', true); }
                    document.body.removeChild(textArea);
                });
            }
        };
        /**
         * @namespace Modal
         * @description Manages the unified action modal for various bulk operations.
         */
        const Modal = {
            currentAction: null,
            taggingState: {
                tags: new Set()
            },
            /**
             * @method show
             * @description Shows and configures the action modal.
             * @param {string} type - The type of action being performed (e.g., 'move', 'tag').
             * @param {object} [options={}] - Configuration options for the modal.
             * @param {string} [options.title] - The title of the modal.
             * @param {string} [options.content] - The HTML content for the modal body.
             * @param {string} [options.confirmText] - The text for the confirm button.
             * @param {string} [options.confirmClass] - The CSS class for the confirm button.
             */
            show(type, options = {}) {
                this.currentAction = type;
                const { title, content, confirmText = 'Confirm', confirmClass = 'btn-primary' } = options;
                Utils.elements.actionTitle.textContent = title || 'Action';
                Utils.elements.actionContent.innerHTML = content || '';
                Utils.elements.actionConfirm.textContent = confirmText;
                Utils.elements.actionConfirm.className = `btn ${confirmClass}`;
                Utils.elements.actionConfirm.disabled = false;
                Utils.elements.actionCancel.textContent = "Cancel";
                Utils.showModal('action-modal');
            },
            /**
             * @method hide
             * @description Hides the action modal.
             */
            hide() { Utils.hideModal('action-modal'); this.currentAction = null; },
            /**
             * @method setupMoveAction
             * @description Sets up the modal for the 'move to stack' action.
             */
            setupMoveAction() {
                this.show('move', {
                    title: 'Move to Stack',
                    content: `<div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">${STACKS.map(stack => `<button class="move-option" data-stack="${stack}" style="width: 100%; text-align: left; padding: 8px 16px; border-radius: 6px; border: none; background: transparent; cursor: pointer; transition: background-color 0.2s;">${STACK_NAMES[stack]}</button>`).join('')}</div>`,
                    confirmText: 'Cancel'
                });
                document.querySelectorAll('.move-option').forEach(option => {
                    option.addEventListener('click', () => { this.executeMove(option.dataset.stack); });
                });
            },
            /**
             * @method setupTagAction
             * @description Sets up the modal for the 'add tags' action.
             */
            setupTagAction() {
                this.taggingState.tags.clear();
                this.show('tag', {
                    title: 'Add Tags',
                    content: `<div style="margin-bottom: 16px;">
                                <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 4px;">Enter tags</label>
                                <div id="tag-chip-container"></div>
                                <input type="text" id="modal-tag-input" class="tag-input" placeholder="nature, landscape, vacation">
                             </div>
                             <div id="modal-tag-suggestions" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
                                ${Array.from(state.tags).map(tag => `<button class="tag-suggestion" data-tag="${tag}" style="background-color: #e5e7eb; color: #374151; padding: 4px 8px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: background-color 0.2s; border: none;">${tag}</button>`).join('')}
                             </div>`,
                    confirmText: 'Apply'
                });
                const tagInput = document.getElementById('modal-tag-input');
                tagInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const tagValue = tagInput.value.trim();
                        if (tagValue) {
                            this.addTagChip(tagValue);
                            tagInput.value = '';
                        }
                    }
                });
                document.querySelectorAll('.tag-suggestion').forEach(btn => {
                    btn.addEventListener('click', () => this.addTagChip(btn.dataset.tag));
                });
            },
            /**
             * @method addTagChip
             * @description Adds a tag chip to the tag input container in the modal.
             * @param {string} tag - The tag to add.
             */
            addTagChip(tag) {
                if (this.taggingState.tags.has(tag)) return;
                this.taggingState.tags.add(tag);

                const container = document.getElementById('tag-chip-container');
                const chip = document.createElement('div');
                chip.className = 'tag-chip';
                chip.innerHTML = `<span>${tag}</span><button class="tag-chip-remove" data-tag="${tag}">×</button>`;
                container.appendChild(chip);

                chip.querySelector('.tag-chip-remove').addEventListener('click', () => {
                    this.removeTagChip(chip, tag);
                });
            },
            /**
             * @method removeTagChip
             * @description Removes a tag chip from the tag input container.
             * @param {HTMLElement} chipElement - The chip element to remove.
             * @param {string} tag - The tag to remove from the internal set.
             */
            removeTagChip(chipElement, tag) {
                this.taggingState.tags.delete(tag);
                chipElement.remove();
            },
            /**
             * @method setupDeleteAction
             * @description Sets up the modal for the 'delete' action.
             */
            setupDeleteAction() {
                const selectedCount = state.grid.selected.length;
                const providerName = state.providerType === 'googledrive' ? 'Google Drive' : 'OneDrive';
                const message = `Are you sure you want to move ${selectedCount} image(s) to your ${providerName} trash? This can be recovered from the provider's website.`;
                this.show('delete', { title: 'Confirm Delete', content: `<p style="color: #4b5563; margin-bottom: 16px;">${message}</p>`, confirmText: `Move to ${providerName} Trash`, confirmClass: 'btn-danger' });
            },
            /**
             * @method setupExportAction
             * @description Sets up the modal for the 'export' action.
             */
            setupExportAction() {
                this.show('export', {
                    title: 'Export to Spreadsheet',
                    content: `<p style="color: #4b5563; margin-bottom: 16px;">This will start the new Live Export process for ${state.grid.selected.length} selected image(s).</p><p style="color: #4b5563; margin-bottom: 16px;">It will fetch fresh data directly from the cloud to ensure 100% accuracy.</p>`,
                    confirmText: 'Begin Export'
                });
            },
            /**
             * @method setupFocusStackSwitch
             * @description Sets up the modal for switching stacks in focus mode.
             */
            setupFocusStackSwitch() {
                const availableStacks = STACKS.filter(s => s !== state.currentStack && state.stacks[s].length > 0);
                let content = `<div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">`;
                if (availableStacks.length > 0) { content += availableStacks.map(stack => `<button class="move-option" data-stack="${stack}" style="width: 100%; text-align: left; padding: 8px 16px; border-radius: 6px; border: none; background: transparent; cursor: pointer; transition: background-color 0.2s;">${STACK_NAMES[stack]} (${state.stacks[stack].length})</button>`).join('');
                } else { content += `<p style="color: #4b5563; text-align: center;">No other stacks have images.</p>`; }
                content += `</div>`;
                this.show('focus-stack-switch', { title: 'Switch Stack', content: content, confirmText: 'Cancel' });
                document.querySelectorAll('.move-option').forEach(option => {
                    option.addEventListener('click', () => {
                        const targetStack = option.dataset.stack;
                        UI.switchToStack(targetStack); Core.updateImageCounters(); this.hide();
                    });
                });
            },
            /**
             * @method setupFolderMoveAction
             * @description Sets up the modal for the 'move to folder' action.
             */
            setupFolderMoveAction() {
                this.show('folder-move', {
                    title: 'Move to Different Folder',
                    content: `<p style="color: #4b5563; margin-bottom: 16px;">This will move ${state.grid.selected.length} image${state.grid.selected.length > 1 ? 's' : ''} to a different folder. The images will be removed from this stack and their metadata will move with them.</p><div style="margin-bottom: 16px;"><strong>Note:</strong> This action requires provider support and may not be available for all cloud storage providers.</div>`,
                    confirmText: 'Choose Destination Folder'
                });
            },
            /**
             * @method executeBulkAction
             * @description A generic function to execute an action on all selected files.
             * @param {Function} actionFn - The function to execute for each file.
             * @param {string} successMessage - The message to show on success.
             * @param {object} [options={}] - Options for the bulk action.
             */
            async executeBulkAction(actionFn, successMessage, options = {}) {
                const { refreshGrid = true, deselect = true } = options;
                const confirmBtn = Utils.elements.actionConfirm;
                const originalText = confirmBtn.textContent;
                confirmBtn.disabled = true; confirmBtn.textContent = 'Processing...';
                try {
                    const promises = state.grid.selected.map(fileId => actionFn(fileId));
                    await Promise.all(promises);
                    Utils.showToast(successMessage.replace('{count}', promises.length), 'success', true);
                    if(!options.keepModalOpen) this.hide();
                    if (refreshGrid) { Utils.elements.gridContainer.innerHTML = ''; Grid.initializeLazyLoad(state.grid.stack); }
                    if (deselect) { Grid.deselectAll(); }
                    Core.updateStackCounts();
                } catch (error) { Utils.showToast(`Failed to process some images: ${error.message}`, 'error', true);
                } finally { confirmBtn.disabled = false; confirmBtn.textContent = originalText; }
            },
            /**
             * @method executeMove
             * @description Executes the move action for the selected files.
             * @param {string} targetStack - The destination stack.
             */
            async executeMove(targetStack) {
                await this.executeBulkAction(async (fileId) => {
                    const file = state.imageFiles.find(f => f.id === fileId);
                    if (file) {
                        const currentStack = file.stack; const newSequence = Date.now();
                        await App.updateUserMetadata(fileId, { stack: targetStack, stackSequence: newSequence });
                        const currentStackIndex = state.stacks[currentStack].findIndex(f => f.id === fileId);
                        if (currentStackIndex !== -1) { state.stacks[currentStack].splice(currentStackIndex, 1); }
                        file.stackSequence = newSequence;
                        state.stacks[targetStack].unshift(file);
                        state.stacks[targetStack] = Core.sortFiles(state.stacks[targetStack]);
                    }
                }, `Moved {count} images to ${targetStack}`);
            },
            /**
             * @method executeTag
             * @description Executes the tag action for the selected files.
             */
            async executeTag() {
                const tagsToAdd = Array.from(this.taggingState.tags);
                if (tagsToAdd.length === 0) return;

                await this.executeBulkAction(async (fileId) => {
                    const file = state.imageFiles.find(f => f.id === fileId);
                    if (file) {
                        const currentTags = file.tags || [];
                        const newTags = [...new Set([...currentTags, ...tagsToAdd])];
                        await App.updateUserMetadata(fileId, { tags: newTags });
                        tagsToAdd.forEach(tag => state.tags.add(tag));
                    }
                }, `Tags added to {count} images`, { refreshGrid: false });
            },
            /**
             * @method executeDelete
             * @description Executes the delete action for the selected files.
             */
            async executeDelete() {
                await this.executeBulkAction(async (fileId) => {
                    await App.deleteFile(fileId);
                }, `Moved {count} images to provider trash`);
            },
            /**
             * @method executeExport
             * @description Executes the export action for the selected files.
             */
            async executeExport() {
                const fileIds = [...state.grid.selected];
                const filesToExport = fileIds.map(id => state.imageFiles.find(f => f.id === id)).filter(f => f);
                const total = filesToExport.length; const results = []; let failures = 0;
                Utils.elements.actionTitle.textContent = `Live Export: 0 of ${total}`;
                Utils.elements.actionContent.innerHTML = `<div style="background: #111; border: 1px solid #333; color: #eee; font-family: monospace; font-size: 12px; height: 250px; overflow-y: scroll; padding: 8px; white-space: pre-wrap;" id="export-log"></div>`;
                const logEl = document.getElementById('export-log');
                Utils.elements.actionConfirm.disabled = true; Utils.elements.actionCancel.textContent = "Close";
                const log = (message) => { logEl.textContent += message + '\n'; logEl.scrollTop = logEl.scrollHeight; };
                log(`Starting export for ${total} images...`);
                for (let i = 0; i < filesToExport.length; i++) {
                    const file = filesToExport[i];
                    Utils.elements.actionTitle.textContent = `Live Export: ${i + 1} of ${total}`;
                    log(`\n[${i+1}/${total}] Processing: ${file.name}`);
                    let extractedMetadata = {}; let success = false;
                    for (let attempt = 1; attempt <= 3; attempt++) {
                        try {
                            const metadata = await state.metadataExtractor.fetchMetadata(file, true);
                            if (metadata.error) throw new Error(metadata.error);
                            extractedMetadata = metadata; log(`  ✅ Success`); success = true; break;
                        } catch (error) {
                            log(`  ⚠️ Attempt ${attempt} failed: ${error.message}`);
                            if (attempt < 3) { const delay = 1000 * attempt; log(`     Retrying in ${delay / 1000}s...`); await new Promise(res => setTimeout(res, delay));
                            } else { log(`  ❌ FAILED permanently after 3 attempts.`); failures++; }
                        }
                    }
                    results.push({ ...file, extractedMetadata: extractedMetadata });
                }
                log('\n-------------------------------------');
                log('Export process complete.'); log(`Successfully processed: ${total - failures} files.`); log(`Failed: ${failures} files.`);
                if (results.length > 0) { state.export.exportData(results); log('CSV file has been generated and downloaded.');
                } else { log('No data to export.'); }
                Utils.elements.actionTitle.textContent = `Export Complete`;
                Utils.elements.actionConfirm.disabled = true; Utils.elements.actionCancel.textContent = "Close";
            },
            /**
             * @method executeFolderMove
             * @description Initiates the folder move process.
             */
            executeFolderMove() {
                state.folderMoveMode = { active: true, files: [...state.grid.selected], };
                this.hide(); Grid.close(); App.returnToFolderSelection();
                Utils.showToast(`Select destination folder for ${state.folderMoveMode.files.length} images`, 'info', true);
            }
        };
        /**
         * @namespace Gestures
         * @description Manages all gesture-based interactions like swiping, tapping, and pinching.
         */
        const Gestures = {
            startPos: { x: 0, y: 0 }, currentPos: { x: 0, y: 0 }, gestureStarted: false, lastTapTime: 0, edgeElements: [],
            /**
             * @method init
             * @description Initializes the gesture handling system.
             */
            init() {
                this.edgeElements = [Utils.elements.edgeTop, Utils.elements.edgeBottom, Utils.elements.edgeLeft, Utils.elements.edgeRight];
                this.setupEventListeners(); this.setupPinchZoom(); this.setupTapZones();
            },
            /**
             * @method setupEventListeners
             * @description Sets up the main event listeners for mouse and touch drag gestures.
             */
            setupEventListeners() {
                Utils.elements.imageViewport.addEventListener('mousedown', this.handleStart.bind(this));
                document.addEventListener('mousemove', this.handleMove.bind(this));
                document.addEventListener('mouseup', this.handleEnd.bind(this));
                Utils.elements.imageViewport.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
                document.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
                document.addEventListener('touchend', this.handleEnd.bind(this), { passive: false });
            },
            /**
             * @method setupPinchZoom
             * @description Sets up event listeners for pinch-to-zoom and wheel-to-zoom functionality.
             */
            setupPinchZoom() {
                Utils.elements.centerImage.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
                Utils.elements.centerImage.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
                Utils.elements.centerImage.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
                Utils.elements.centerImage.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
            },
            /**
             * @method setupTapZones
             * @description Sets up event listeners for the navigational tap zones.
             */
             setupTapZones() {
                // Quick Move (Normal Mode) Taps
                document.getElementById('quick-move-left').addEventListener('click', () => { if (!state.isFocusMode) this.executeFlick(this.directionToStack('left')); });
                document.getElementById('quick-move-right').addEventListener('click', () => { if (!state.isFocusMode) this.executeFlick(this.directionToStack('right')); });
                document.getElementById('quick-move-top').addEventListener('click', () => { if (!state.isFocusMode) this.executeFlick(this.directionToStack('top')); });
                document.getElementById('quick-move-bottom').addEventListener('click', () => { if (!state.isFocusMode) this.executeFlick(this.directionToStack('bottom')); });

                // Focus Mode Taps
                document.getElementById('focus-tap-left').addEventListener('click', () => { if (state.isFocusMode) this.prevImage(); });
                document.getElementById('focus-tap-right').addEventListener('click', () => { if (state.isFocusMode) this.nextImage(); });
                document.getElementById('focus-tap-center').addEventListener('click', () => { if (state.isFocusMode) this.toggleFocusMode(); });
            },
            /**
             * @method showEdgeGlow
             * @description Activates the glow effect on a specific edge of the screen.
             * @param {string} direction - The direction of the edge to activate ('top', 'bottom', 'left', 'right').
             */
            showEdgeGlow(direction) {
                this.edgeElements.forEach(edge => edge.classList.remove('active'));
                if (Utils.elements[`edge${direction.charAt(0).toUpperCase() + direction.slice(1)}`]) {
                    Utils.elements[`edge${direction.charAt(0).toUpperCase() + direction.slice(1)}`].classList.add('active');
                }
            },
            /**
             * @method hideAllEdgeGlows
             * @description Deactivates all edge glow effects.
             */
            hideAllEdgeGlows() { this.edgeElements.forEach(edge => edge.classList.remove('active')); },
            /**
             * @method determineSwipeDirection
             * @description Determines the primary direction of a swipe based on delta coordinates.
             * @param {number} deltaX - The change in the X coordinate.
             * @param {number} deltaY - The change in the Y coordinate.
             * @returns {string} The determined direction ('top', 'bottom', 'left', 'right').
             */
            determineSwipeDirection(deltaX, deltaY) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) { return deltaX > 0 ? 'right' : 'left'; } else { return deltaY > 0 ? 'bottom' : 'top'; }
            },
            /**
             * @method directionToStack
             * @description Maps a swipe direction to a corresponding stack name.
             * @param {string} direction - The swipe direction.
             * @returns {string} The name of the target stack.
             */
            directionToStack(direction) {
                const mapping = { 'top': 'priority', 'bottom': 'trash', 'left': 'in', 'right': 'out' };
                return mapping[direction];
            },
            /**
             * @method executeFlick
             * @description Executes the action of moving an image to a stack after a flick gesture.
             * @param {string} targetStack - The name of the destination stack.
             */
            async executeFlick(targetStack) {
                if (state.stacks[state.currentStack].length === 0) return;
                UI.acknowledgePillCounter(targetStack);
                if (state.haptic) { state.haptic.triggerFeedback('swipe'); }
                await Core.moveToStack(targetStack);
                this.hideAllEdgeGlows();
            },
            /**
             * @method handleStart
             * @description Handles the start of a mouse or touch drag gesture.
             * @param {MouseEvent|TouchEvent} e - The event object.
             */
            handleStart(e) {
                const currentTime = Date.now();
                if (currentTime - this.lastTapTime < 300) { e.preventDefault(); this.toggleFocusMode(); this.lastTapTime = 0; return; }
                this.lastTapTime = currentTime;

                if (state.stacks[state.currentStack].length === 0) return;
                if (e.touches && (e.touches.length > 1 || state.isPinching)) return;
                if (state.currentScale > 1.1) return;
                const point = e.touches ? e.touches[0] : e;
                this.startPos = { x: point.clientX, y: point.clientY };
                this.currentPos = { x: point.clientX, y: point.clientY };
                this.gestureStarted = false;
                state.isDragging = true;
                Utils.elements.centerImage.classList.add('dragging');
            },
            /**
             * @method handleMove
             * @description Handles the movement during a mouse or touch drag gesture.
             * @param {MouseEvent|TouchEvent} e - The event object.
             */
            handleMove(e) {
                if (!state.isDragging) return;
                if (state.imageFiles.length === 0) return;
                if (e.touches && e.touches.length > 1) {
                    state.isDragging = false; Utils.elements.centerImage.classList.remove('dragging');
                    this.hideAllEdgeGlows(); return;
                }
                e.preventDefault();
                const point = e.touches ? e.touches[0] : e;
                this.currentPos = { x: point.clientX, y: point.clientY };
                const deltaX = this.currentPos.x - this.startPos.x;
                const deltaY = this.currentPos.y - this.startPos.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                if (distance > 30) {
                    this.gestureStarted = true;
                    if(!state.isFocusMode) {
                        const direction = this.determineSwipeDirection(deltaX, deltaY);
                        if (direction) { this.hideAllEdgeGlows(); this.showEdgeGlow(direction); }
                    }
                } else {
                    if(!state.isFocusMode) this.hideAllEdgeGlows();
                }
            },
            /**
             * @method handleEnd
             * @description Handles the end of a mouse or touch drag gesture, triggering actions if necessary.
             * @param {MouseEvent|TouchEvent} e - The event object.
             */
            handleEnd(e) {
                if (!state.isDragging) return;
                state.isDragging = false; Utils.elements.centerImage.classList.remove('dragging');
                if (!this.gestureStarted) { this.hideAllEdgeGlows(); return; }

                const deltaX = this.currentPos.x - this.startPos.x;
                const deltaY = this.currentPos.y - this.startPos.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                if (distance > 80) {
                    if(state.isFocusMode){
                         if (deltaX < 0) { this.nextImage(); }
                         else { this.prevImage(); }
                    } else {
                        const direction = this.determineSwipeDirection(deltaX, deltaY);
                        const targetStack = this.directionToStack(direction);
                        if (targetStack && direction) { this.executeFlick(targetStack); return; }
                    }
                }
                this.hideAllEdgeGlows();
            },
            /**
             * @method getDistance
             * @description Calculates the distance between two touch points.
             * @param {Touch} touch1 - The first touch point.
             * @param {Touch} touch2 - The second touch point.
             * @returns {number} The distance between the points.
             */
            getDistance(touch1, touch2) { const dx = touch1.clientX - touch2.clientX; const dy = touch1.clientY - touch2.clientY; return Math.sqrt(dx * dx + dy * dy); },
            /**
             * @method getCenter
             * @description Calculates the center point between two touch points.
             * @param {Touch} touch1 - The first touch point.
             * @param {Touch} touch2 - The second touch point.
             * @returns {{x: number, y: number}} The center coordinates.
             */
            getCenter(touch1, touch2) { return { x: (touch1.clientX + touch2.clientX) / 2, y: (touch1.clientY + touch2.clientY) / 2 }; },
            /**
             * @method handleTouchStart
             * @description Handles the start of a touch event for pinch-to-zoom.
             * @param {TouchEvent} e - The touch event object.
             */
            handleTouchStart(e) {
                if (e.touches.length === 2) {
                    e.preventDefault(); state.isPinching = true;
                    state.initialDistance = this.getDistance(e.touches[0], e.touches[1]);
                    state.lastTouchPos = this.getCenter(e.touches[0], e.touches[1]);
                } else if (e.touches.length === 1 && state.currentScale > 1) { state.lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
            },
            /**
             * @method handleTouchMove
             * @description Handles the move event during a touch for pinch-to-zoom and panning.
             * @param {TouchEvent} e - The touch event object.
             */
            handleTouchMove(e) {
                if (e.touches.length === 2 && state.isPinching) {
                    e.preventDefault();
                    const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                    const scaleFactor = currentDistance / state.initialDistance;
                    let newScale = state.currentScale * scaleFactor;
                    newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));
                    state.currentScale = newScale; state.initialDistance = currentDistance; Core.applyTransform();
                } else if (e.touches.length === 1 && state.currentScale > 1) {
                    e.preventDefault();
                    const deltaX = e.touches[0].clientX - state.lastTouchPos.x;
                    const deltaY = e.touches[0].clientY - state.lastTouchPos.y;
                    state.panOffset.x += deltaX / state.currentScale;
                    state.panOffset.y += deltaY / state.currentScale;
                    state.lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; Core.applyTransform();
                }
            },
            /**
             * @method handleTouchEnd
             * @description Handles the end of a touch event for pinch-to-zoom.
             * @param {TouchEvent} e - The touch event object.
             */
            handleTouchEnd(e) {
                if (e.touches.length < 2) { state.isPinching = false; }
                if (state.currentScale < 1.1) { state.currentScale = 1; state.panOffset = { x: 0, y: 0 }; Core.applyTransform(); }
            },
            /**
             * @method handleWheel
             * @description Handles the mouse wheel event for zooming.
             * @param {WheelEvent} e - The wheel event object.
             */
            handleWheel(e) {
                e.preventDefault();
                const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
                let newScale = state.currentScale * scaleChange;
                newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));
                state.currentScale = newScale;
                if (state.currentScale <= 1.1) { state.currentScale = 1; state.panOffset = { x: 0, y: 0 }; }
                Core.applyTransform();
            },
            /**
             * @method toggleFocusMode
             * @description Toggles the focus mode UI.
             */
            toggleFocusMode() {
                state.isFocusMode = !state.isFocusMode;
                Utils.elements.appContainer.classList.toggle('focus-mode', state.isFocusMode);
                Core.updateImageCounters();
            },
            /**
             * @method nextImage
             * @description Navigates to the next image in the current stack.
             */
            async nextImage() {
                const stack = state.stacks[state.currentStack];
                if (stack.length === 0) return;
                state.currentStackPosition = (state.currentStackPosition + 1) % stack.length;
                await Core.displayCurrentImage();
            },
            /**
             * @method prevImage
             * @description Navigates to the previous image in the current stack.
             */
            async prevImage() {
                const stack = state.stacks[state.currentStack];
                if (stack.length === 0) return;
                state.currentStackPosition = (state.currentStackPosition - 1 + stack.length) % stack.length;
                await Core.displayCurrentImage();
            },
            /**
             * @method deleteCurrentImage
             * @description Deletes the currently visible image.
             */
            async deleteCurrentImage() {
                const currentStackArray = state.stacks[state.currentStack];
                if (currentStackArray.length === 0) return;
                const fileToDelete = currentStackArray[state.currentStackPosition];
                try {
                    await App.deleteFile(fileToDelete.id);
                    Core.updateStackCounts();
                    if (currentStackArray.length === 0) { this.toggleFocusMode(); Core.showEmptyState();
                    } else { await Core.displayCurrentImage(); }
                } catch (error) { Utils.showToast(`Failed to delete ${fileToDelete.name}`, 'error', true); }
            }
        };
        /**
         * @namespace Folders
         * @description Manages the UI and logic for folder selection screens.
         */
        const Folders = {
            /**
             * @method loadGoogleDriveFolders
             * @description Fetches and displays the list of Google Drive folders.
             */
            async loadGoogleDriveFolders() {
                Utils.elements.gdriveFolderList.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; padding: 40px; color: rgba(255, 255, 255, 0.7);"><div class="spinner"></div><span>Loading folders...</span></div>`;
                try {
                    const folders = await state.provider.getFolders();
                    if (folders.length === 0) { Utils.elements.gdriveFolderList.innerHTML = `<div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.7);"><span>No folders found in your Drive</span></div>`; return; }
                    Utils.elements.gdriveFolderList.innerHTML = '';
                    folders.forEach(folder => {
                        const div = document.createElement('div'); div.className = 'folder-item';
                        div.innerHTML = `<svg class="folder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg><div class="folder-info"><div class="folder-name">${folder.name}</div><div class="folder-date">${new Date(folder.modifiedTime).toLocaleDateString()}</div></div>`;
                        div.addEventListener('click', () => {
                            if (state.folderMoveMode.active) { this.handleFolderMoveSelection(folder.id, folder.name); } else { App.initializeWithProvider('googledrive', folder.id, folder.name, state.provider); }
                        });
                        Utils.elements.gdriveFolderList.appendChild(div);
                    });
                } catch (error) { Utils.showToast(`Error loading folders: ${error.message}`, 'error', true); }
            },
            /**
             * @method loadOneDriveFolders
             * @description Fetches and displays the initial list of OneDrive folders.
             */
            async loadOneDriveFolders() {
                Utils.elements.onedriveFolderList.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; padding: 40px; color: rgba(255, 255, 255, 0.7);"><div class="spinner"></div><span>Loading folders...</span></div>`;
                try {
                    const folders = await state.provider.getFolders();
                    this.displayOneDriveFolders(folders); this.updateOneDriveNavigation();
                } catch (error) { Utils.showToast('Error loading folders', 'error', true); }
            },
            /**
             * @method displayOneDriveFolders
             * @description Renders the list of OneDrive folders in the UI.
             * @param {Array<object>} folders - The array of folder objects to display.
             */
            displayOneDriveFolders(folders) {
                Utils.elements.onedriveFolderList.innerHTML = '';
                if (folders.length === 0) { Utils.elements.onedriveFolderList.innerHTML = `<div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.7);"><span>No folders found in this location</span></div>`; return; }
                folders.forEach(folder => {
                    const div = document.createElement('div'); div.className = 'folder-item';
                    const hasChildren = folder.hasChildren; const iconColor = hasChildren ? 'var(--accent)' : 'rgba(255, 255, 255, 0.6)';
                    div.innerHTML = `<svg class="folder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: ${iconColor};"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg><div class="folder-info"><div class="folder-name">${folder.name}</div><div class="folder-date">${new Date(folder.modifiedTime).toLocaleDateString()} • ${folder.itemCount} items ${hasChildren ? ' • Has subfolders' : ''}</div></div><div class="folder-actions">${hasChildren ? `<button class="folder-action-btn drill-btn" data-folder-id="${folder.id}">Browse →</button>` : ''}<button class="folder-action-btn select-btn" data-folder-id="${folder.id}">Select</button></div>`;
                    Utils.elements.onedriveFolderList.appendChild(div);
                });
                document.querySelectorAll('.drill-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation(); const folderId = btn.dataset.folderId;
                        const folderElement = btn.closest('.folder-item'); const folderName = folderElement.querySelector('.folder-name').textContent;
                        try {
                            const subfolders = await state.provider.drillIntoFolder({ id: folderId, name: folderName });
                            this.displayOneDriveFolders(subfolders); this.updateOneDriveNavigation();
                        } catch (error) { Utils.showToast('Error loading subfolders', 'error', true); }
                    });
                });
                document.querySelectorAll('.select-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation(); const folderId = btn.dataset.folderId;
                        const folderElement = btn.closest('.folder-item'); const folderName = folderElement.querySelector('.folder-name').textContent;
                        if (state.folderMoveMode.active) { this.handleFolderMoveSelection(folderId, folderName);
                        } else { App.initializeWithProvider('onedrive', folderId, folderName, state.provider); }
                    });
                });
            },
            /**
             * @method handleFolderMoveSelection
             * @description Handles the selection of a destination folder when moving files.
             * @param {string} folderId - The ID of the selected destination folder.
             * @param {string} folderName - The name of the selected destination folder.
             */
            async handleFolderMoveSelection(folderId, folderName) {
                const filesToMove = state.folderMoveMode.files;
                Utils.showScreen('loading-screen'); Utils.updateLoadingProgress(0, filesToMove.length);
                try {
                    for(let i = 0; i < filesToMove.length; i++) {
                        const fileId = filesToMove[i];
                        await state.provider.moveFileToFolder(fileId, folderId);
                        const fileIndex = state.imageFiles.findIndex(f => f.id === fileId);
                        if (fileIndex > -1) {
                            const [file] = state.imageFiles.splice(fileIndex, 1);
                            const stackIndex = state.stacks[file.stack].findIndex(f => f.id === fileId);
                            if (stackIndex > -1) { state.stacks[file.stack].splice(stackIndex, 1); }
                        }
                        Utils.updateLoadingProgress(i + 1, filesToMove.length);
                    }
                    Utils.showToast(`Moved ${filesToMove.length} images to ${folderName}`, 'success', true);
                    await state.dbManager.saveFolderCache(state.currentFolder.id, state.imageFiles);
                    state.folderMoveMode = { active: false, files: [] };
                    Core.initializeStacks(); Core.updateStackCounts(); App.returnToFolderSelection();
                } catch (error) { Utils.showToast('Error moving files', 'error', true); App.returnToFolderSelection(); }
            },
            /**
             * @method updateOneDriveNavigation
             * @description Updates the navigation controls (e.g., path, 'Go Up' button) for the OneDrive folder view.
             */
            updateOneDriveNavigation() {
                const currentPath = state.provider.getCurrentPath();
                const canGoUp = state.provider.canGoUp();
                Utils.elements.onedriveFolderSubtitle.textContent = `Current: ${currentPath}`;
                const refreshBtn = Utils.elements.onedriveRefreshFolders;
                if (canGoUp) {
                    refreshBtn.textContent = '← Go Up';
                    refreshBtn.onclick = async () => {
                        try {
                            const folders = await state.provider.navigateToParent();
                            this.displayOneDriveFolders(folders); this.updateOneDriveNavigation();
                        } catch (error) { Utils.showToast('Error navigating to parent folder', 'error', true); }
                    };
                } else {
                    refreshBtn.textContent = 'Refresh';
                    refreshBtn.onclick = () => this.loadOneDriveFolders();
                }
            }
        };
        /**
         * @namespace UI
         * @description Manages miscellaneous UI updates and interactions.
         */
        const UI = {
            /**
             * @method updateEmptyStateButtons
             * @description Shows or hides buttons on the empty state screen based on available stacks.
             */
            updateEmptyStateButtons() {
                const stacksWithImages = STACKS.filter(stack => state.stacks[stack].length > 0);
                const hasOtherStacks = stacksWithImages.some(stack => stack !== state.currentStack);
                Utils.elements.selectAnotherStackBtn.style.display = hasOtherStacks ? 'block' : 'none';
                Utils.elements.selectAnotherFolderBtn.style.display = 'block';
            },
            /**
             * @method acknowledgePillCounter
             * @description Triggers a visual effect on a pill counter to acknowledge an action.
             * @param {string} stackName - The name of the stack whose pill should be animated.
             */
            acknowledgePillCounter(stackName) {
                const pill = document.getElementById(`pill-${stackName}`);
                if (pill) {
                    pill.classList.remove('triple-ripple', 'glow-effect');
                    pill.offsetHeight; pill.classList.add('triple-ripple');
                    setTimeout(() => { pill.classList.add('glow-effect'); }, 100);
                    setTimeout(() => { pill.classList.remove('triple-ripple', 'glow-effect'); }, 3000);
                }
            },
            /**
             * @method switchToStack
             * @description Switches the main view to a different stack.
             * @param {string} stackName - The name of the stack to switch to.
             */
            switchToStack(stackName) { Core.displayTopImageFromStack(stackName); },
            /**
             * @method cycleThroughPills
             * @description Cycles to the next stack in the predefined order.
             */
            cycleThroughPills() {
                const stackOrder = ['in', 'out', 'priority', 'trash'];
                const currentIndex = stackOrder.indexOf(state.currentStack);
                const nextIndex = (currentIndex + 1) % stackOrder.length;
                const nextStack = stackOrder[nextIndex];
                this.switchToStack(nextStack);
            }
        };
        /**
         * @namespace DraggableResizable
         * @description Handles making modal elements draggable and resizable.
         */
        const DraggableResizable = {
            /**
             * @method init
             * @description Initializes the draggable and resizable functionality for a modal.
             * @param {HTMLElement} modal - The modal element.
             * @param {HTMLElement} header - The header element of the modal to be used as the drag handle.
             */
            init(modal, header) {
                let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
                let isDragging = false;

                header.onmousedown = dragMouseDown;

                /**
                 * @function dragMouseDown
                 * @description Handles the mouse down event on the modal header to initiate dragging.
                 * @param {MouseEvent} e - The mouse event.
                 */
                function dragMouseDown(e) {
                    e = e || window.event;
                    e.preventDefault();
                    pos3 = e.clientX;
                    pos4 = e.clientY;
                    isDragging = true;
                    document.onmouseup = closeDragElement;
                    document.onmousemove = elementDrag;
                }

                /**
                 * @function elementDrag
                 * @description Handles the mouse move event to drag the modal.
                 * @param {MouseEvent} e - The mouse event.
                 */
                function elementDrag(e) {
                    if (!isDragging) return;
                    e = e || window.event;
                    e.preventDefault();
                    pos1 = pos3 - e.clientX;
                    pos2 = pos4 - e.clientY;
                    pos3 = e.clientX;
                    pos4 = e.clientY;

                    let newTop = modal.offsetTop - pos2;
                    let newLeft = modal.offsetLeft - pos1;

                    // Boundary checks
                    const parent = modal.parentElement;
                    if (newTop < 0) newTop = 0;
                    if (newLeft < 0) newLeft = 0;
                    if (newTop + modal.offsetHeight > parent.clientHeight) newTop = parent.clientHeight - modal.offsetHeight;
                    if (newLeft + modal.offsetWidth > parent.clientWidth) newLeft = parent.clientWidth - modal.offsetWidth;

                    modal.style.top = newTop + "px";
                    modal.style.left = newLeft + "px";
                }

                /**
                 * @function closeDragElement
                 * @description Handles the mouse up event to stop dragging.
                 */
                function closeDragElement() {
                    isDragging = false;
                    document.onmouseup = null;
                    document.onmousemove = null;
                }

                header.ondblclick = () => {
                     if (modal.id === 'details-modal') {
                        modal.style.top = '50%';
                        modal.style.left = '50%';
                        modal.style.transform = 'translate(-50%, -50%)';
                        modal.style.width = '800px';
                        modal.style.height = '95vh';
                    } else if (modal.id === 'grid-modal') {
                        modal.style.top = '0px';
                        modal.style.left = '0px';
                        modal.style.width = '100%';
                        modal.style.height = '100%';
                        modal.style.maxHeight = '100vh';
                        modal.style.maxWidth = '100vw';
                        modal.style.transform = 'none';
                        Utils.elements.gridContent.scrollTop = 0;
                    }
                };
            }
        };
        /**
         * @namespace Events
         * @description Sets up all event listeners for the application.
         */
        const Events = {
            /**
             * @method init
             * @description Initializes all event listeners for the application.
             */
            init() {
                this.setupProviderSelection(); this.setupSettings(); this.setupGoogleDriveAuth();
                this.setupOneDriveAuth(); this.setupFolderManagement(); this.setupLoadingScreen();
                this.setupDetailsModal(); this.setupFocusMode(); this.setupTabs();
                this.setupCopyButtons(); this.setupEmptyState(); this.setupPillCounters();
                this.setupGridControls(); this.setupSearchFunctionality(); this.setupActionButtons();
                this.setupKeyboardNavigation();
                this.setupDraggables();
            },
            /**
             * @method setupDraggables
             * @description Sets up the draggable functionality for modals.
             */
            setupDraggables() {
                DraggableResizable.init(Utils.elements.detailsModal.querySelector('.modal-content'), Utils.elements.detailsModalHeader);
                DraggableResizable.init(Utils.elements.gridModal.querySelector('.modal-content'), Utils.elements.gridModalHeaderMain);
            },
            /**
             * @method setupProviderSelection
             * @description Sets up event listeners for the provider selection buttons.
             */
            setupProviderSelection() {
                Utils.elements.googleDriveBtn.addEventListener('click', () => App.selectGoogleDrive());
                Utils.elements.onedriveBtn.addEventListener('click', () => App.selectOneDrive());
            },
            /**
             * @method setupSettings
             * @description Sets up event listeners for the settings controls (e.g., intensity, haptics).
             */
            setupSettings() {
                document.querySelectorAll('.intensity-btn').forEach(btn => {
                    btn.addEventListener('click', () => { state.visualCues.setIntensity(btn.dataset.level); });
                });
                document.getElementById('haptic-enabled').addEventListener('change', (e) => { state.haptic.setEnabled(e.target.checked); });
            },
            /**
             * @method setupGoogleDriveAuth
             * @description Sets up event listeners for the Google Drive authentication screen.
             */
            setupGoogleDriveAuth() {
                Utils.elements.gdriveAuthButton.addEventListener('click', async () => {
                    const clientSecret = Utils.elements.gdriveClientSecret.value.trim();
                    if (!clientSecret) { Utils.elements.gdriveAuthStatus.textContent = 'Please enter client secret'; Utils.elements.gdriveAuthStatus.className = 'status error'; return; }
                    Utils.elements.gdriveAuthButton.disabled = true; Utils.elements.gdriveAuthButton.textContent = 'Connecting...';
                    Utils.elements.gdriveAuthStatus.textContent = 'Connecting to Google Drive...'; Utils.elements.gdriveAuthStatus.className = 'status info';
                    try {
                        const provider = new GoogleDriveProvider();
                        const success = await provider.authenticate(clientSecret);
                        if (success) {
                            state.provider = provider;
                            Utils.elements.gdriveAuthStatus.textContent = '✅ Connected to Google Drive!';
                            Utils.elements.gdriveAuthStatus.className = 'status success';
                            Utils.elements.gdriveClientSecret.value = '';
                            setTimeout(() => { Utils.showScreen('gdrive-folder-screen'); Folders.loadGoogleDriveFolders(); }, 1000);
                        }
                    } catch (error) { Utils.elements.gdriveAuthStatus.textContent = `Authentication failed: ${error.message}`; Utils.elements.gdriveAuthStatus.className = 'status error';
                    } finally { Utils.elements.gdriveAuthButton.disabled = false; Utils.elements.gdriveAuthButton.textContent = 'Connect Drive'; }
                });
                Utils.elements.gdriveBackButton.addEventListener('click', () => App.backToProviderSelection());
            },
            /**
             * @method setupOneDriveAuth
             * @description Sets up event listeners for the OneDrive authentication screen.
             */
            setupOneDriveAuth() {
                Utils.elements.onedriveAuthButton.addEventListener('click', async () => {
                    Utils.elements.onedriveAuthButton.disabled = true; Utils.elements.onedriveAuthButton.textContent = 'Connecting...';
                    Utils.elements.onedriveAuthStatus.textContent = 'Connecting to OneDrive...'; Utils.elements.onedriveAuthStatus.className = 'status info';
                    try {
                        const provider = new OneDriveProvider();
                        const success = await provider.authenticate();
                        if (success) {
                            state.provider = provider;
                            Utils.elements.onedriveAuthStatus.textContent = '✅ Connected to OneDrive!';
                            Utils.elements.onedriveAuthStatus.className = 'status success';
                            setTimeout(() => { Utils.showScreen('onedrive-folder-screen'); Folders.loadOneDriveFolders(); }, 1000);
                        }
                    } catch (error) { Utils.elements.onedriveAuthStatus.textContent = `Authentication failed: ${error.message}`; Utils.elements.onedriveAuthStatus.className = 'status error';
                    } finally { Utils.elements.onedriveAuthButton.disabled = false; Utils.elements.onedriveAuthButton.textContent = 'Connect OneDrive'; }
                });
                Utils.elements.onedriveBackButton.addEventListener('click', () => App.backToProviderSelection());
            },
            /**
             * @method setupFolderManagement
             * @description Sets up event listeners for folder management controls (back, refresh, logout).
             */
            setupFolderManagement() {
                Utils.elements.backButton.addEventListener('click', () => App.returnToFolderSelection());
                Utils.elements.gdriveRefreshFolders.addEventListener('click', () => Folders.loadGoogleDriveFolders());
                Utils.elements.gdriveBackToProvider.addEventListener('click', () => App.backToProviderSelection());
                Utils.elements.gdriveLogout.addEventListener('click', () => { state.provider.disconnect(); App.backToProviderSelection(); });
                Utils.elements.onedriveRefreshFolders.addEventListener('click', () => Folders.loadOneDriveFolders());
                Utils.elements.onedriveBackToProvider.addEventListener('click', () => App.backToProviderSelection());
                Utils.elements.onedriveLogout.addEventListener('click', () => { state.provider.disconnect(); App.backToProviderSelection(); });
            },
            /**
             * @method setupLoadingScreen
             * @description Sets up the event listener for the 'Cancel' button on the loading screen.
             */
            setupLoadingScreen() {
                Utils.elements.cancelLoading.addEventListener('click', () => {
                    if (state.metadataExtractor) { state.metadataExtractor.abort(); }
                    state.activeRequests.abort();
                    App.returnToFolderSelection();
                    Utils.showToast('Loading cancelled', 'info', true);
                });
            },
            /**
             * @method setupDetailsModal
             * @description Sets up event listeners for the details modal controls.
             */
            setupDetailsModal() {
                Utils.elements.detailsButton.addEventListener('click', () => { if (state.stacks[state.currentStack].length > 0) { Details.show(); } });
                Utils.elements.detailsClose.addEventListener('click', () => Details.hide());
            },
            /**
             * @method setupFocusMode
             * @description Sets up event listeners for the focus mode UI controls.
             */
            setupFocusMode() {
                Utils.elements.centerTrashBtn.addEventListener('click', () => Core.moveToStack('trash'));
                Utils.elements.focusStackName.addEventListener('click', () => Modal.setupFocusStackSwitch());
                Utils.elements.focusDeleteBtn.addEventListener('click', () => Gestures.deleteCurrentImage());
                Utils.elements.focusFavoriteBtn.addEventListener('click', async () => {
                    const currentFile = state.stacks[state.currentStack]?.[state.currentStackPosition];
                    if (!currentFile) return;
                    const isFavorite = !currentFile.favorite;
                    await App.updateUserMetadata(currentFile.id, { favorite: isFavorite });
                    Core.updateFavoriteButton();
                });
            },
            /**
             * @method setupTabs
             * @description Sets up event listeners for the tabs in the details modal.
             */
            setupTabs() { document.querySelectorAll('.tab-button').forEach(btn => { btn.addEventListener('click', () => Details.switchTab(btn.dataset.tab)); }); },
            /**
             * @method setupCopyButtons
             * @description Sets up a global event listener for copy buttons.
             */
            setupCopyButtons() {
                document.addEventListener('click', (e) => {
                    if (e.target.classList.contains('copy-metadata')) {
                        const value = e.target.dataset.value; const button = e.target;
                        button.classList.add('copied'); const originalText = button.textContent; button.textContent = '✓';
                        Details.copyToClipboard(value);
                        setTimeout(() => { button.classList.remove('copied'); button.textContent = originalText; }, 1000);
                    }
                });
            },
            /**
             * @method setupEmptyState
             * @description Sets up event listeners for the buttons on the empty state screen.
             */
            setupEmptyState() {
                Utils.elements.selectAnotherStackBtn.addEventListener('click', () => {
                    const stacksWithImages = STACKS.filter(stack => state.stacks[stack].length > 0);
                    if (stacksWithImages.length > 0) {
                        const nextStack = stacksWithImages.find(stack => stack !== state.currentStack) || stacksWithImages[0];
                        UI.switchToStack(nextStack);
                    } else {
                        Utils.elements.selectAnotherStackBtn.style.display = 'none';
                        Utils.elements.selectAnotherFolderBtn.style.display = 'block';
                    }
                });
                Utils.elements.selectAnotherFolderBtn.addEventListener('click', () => { App.returnToFolderSelection(); });
            },
            /**
             * @method setupPillCounters
             * @description Sets up event listeners for the stack pill counters.
             */
            setupPillCounters() {
                STACKS.forEach(stackName => {
                    const pill = document.getElementById(`pill-${stackName}`);
                    if (pill) {
                        pill.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (state.haptic) { state.haptic.triggerFeedback('pillTap'); }
                             if (state.currentStack === stackName) {
                                Grid.open(stackName);
                            } else {
                                UI.switchToStack(stackName);
                            }
                            UI.acknowledgePillCounter(stackName);
                        });
                    }
                });
            },
            /**
             * @method setupGridControls
             * @description Sets up event listeners for the grid view controls (close, select, zoom).
             */
            setupGridControls() {
                Utils.elements.closeGrid.addEventListener('click', () => Grid.close());
                Utils.elements.selectAllBtn.addEventListener('click', () => Grid.selectAll());
                Utils.elements.deselectAllBtn.addEventListener('click', () => Grid.deselectAll());
                Utils.elements.gridSize.addEventListener('input', () => {
                    const value = Utils.elements.gridSize.value;
                    Utils.elements.gridSizeValue.textContent = value;
                    Utils.elements.gridContainer.style.gridTemplateColumns = `repeat(${value}, 1fr)`;
                });
            },
            /**
             * @method setupSearchFunctionality
             * @description Sets up event listeners for the omni-search bar in the grid view.
             */
            setupSearchFunctionality() {
                Utils.elements.omniSearch.addEventListener('input', () => Grid.performSearch());
                Utils.elements.clearSearchBtn.addEventListener('click', () => Grid.resetSearch());
                document.querySelectorAll('.modifier-link').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const modifier = e.target.dataset.modifier;
                        const searchInput = Utils.elements.omniSearch;
                        searchInput.value += ` ${modifier} `;
                        searchInput.focus();
                        Grid.performSearch();
                    });
                });
            },
            /**
             * @method setupActionButtons
             * @description Sets up event listeners for the bulk action buttons in the grid view and action modal.
             */
            setupActionButtons() {
                Utils.elements.moveSelected.addEventListener('click', () => Modal.setupMoveAction());
                Utils.elements.tagSelected.addEventListener('click', () => Modal.setupTagAction());
                Utils.elements.deleteSelected.addEventListener('click', () => Modal.setupDeleteAction());
                Utils.elements.exportSelected.addEventListener('click', () => Modal.setupExportAction());
                Utils.elements.folderSelected.addEventListener('click', () => Modal.setupFolderMoveAction());
                Utils.elements.actionCancel.addEventListener('click', () => Modal.hide());
                Utils.elements.actionConfirm.addEventListener('click', () => {
                    if (Modal.currentAction === 'move') { /* handled by buttons */
                    } else if (Modal.currentAction === 'tag') { Modal.executeTag();
                    } else if (Modal.currentAction === 'delete') { Modal.executeDelete();
                    } else if (Modal.currentAction === 'export') { Modal.executeExport();
                    } else if (Modal.currentAction === 'folder-move') { Modal.executeFolderMove(); }
                });
            },
            /**
             * @method setupKeyboardNavigation
             * @description Sets up keyboard shortcuts for app navigation and actions.
             */
            setupKeyboardNavigation() {
                document.addEventListener('keydown', (e) => {
                    if (Utils.elements.appContainer.classList.contains('hidden')) return;
                    if (!Utils.elements.detailsModal.classList.contains('hidden')) { if (e.key === 'Escape') Details.hide(); return; }
                    if (!Utils.elements.gridModal.classList.contains('hidden')) { if (e.key === 'Escape') Grid.close(); return; }
                    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
                    if (state.isFocusMode) {
                        if (e.key === 'ArrowRight') Gestures.nextImage();
                        if (e.key === 'ArrowLeft') Gestures.prevImage();
                        if (e.key === 'Escape') Gestures.toggleFocusMode();
                        return;
                    }
                    const keyMap = { 'ArrowUp': 'priority', 'ArrowDown': 'trash', 'ArrowLeft': 'in', 'ArrowRight': 'out' };
                    if (keyMap[e.key]) {
                        e.preventDefault();
                        const targetStack = keyMap[e.key];
                        if (state.stacks[state.currentStack].length > 0) { UI.acknowledgePillCounter(targetStack); Core.moveToStack(targetStack); }
                        return;
                    }
                    switch (e.key) {
                        case 'Tab': e.preventDefault(); UI.cycleThroughPills(); break;
                        case 'Escape': App.returnToFolderSelection(); break;
                    }
                });
            }
        };
        /**
         * @function initApp
         * @description The main entry point for the application. Initializes all modules and starts the app.
         */
        async function initApp() {
            try {
                Utils.init();
                state.visualCues = new VisualCueManager();
                state.haptic = new HapticFeedbackManager();
                state.export = new ExportSystem();
                state.dbManager = new DBManager();
                await state.dbManager.init();
                state.syncManager = new SyncManager();
                state.metadataExtractor = new MetadataExtractor();
                Utils.showScreen('provider-screen');
                Events.init();
                Gestures.init();
                Core.updateActiveProxTab();
            } catch (error) {
                Utils.showToast(`Failed to initialize app: ${error.message}`, 'error', true);
            }
        }
        document.addEventListener('DOMContentLoaded', initApp);
