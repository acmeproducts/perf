// ===== pic-v1-curate-events.js =====
// Events wiring + initApp bootstrap
// Extracted verbatim from ui-v1.html (Orbital8 Goji V1 Canonical)

const Events = {
    init() {
        this.setupProviderSelection(); this.setupSettings(); this.setupAuth();
        this.setupFolderManagement(); this.setupFolderSearch(); this.setupLoadingScreen();
        this.setupDetailsModal(); this.setupFocusMode(); this.setupTabs();
        this.setupCopyButtons(); this.setupEmptyState(); this.setupPillCounters();
        this.setupGridControls(); this.setupSearchFunctionality(); this.setupActionButtons();
        this.setupKeyboardNavigation();
        this.setupDraggables();
    },
    setupDraggables() {
        const { detailsModal, detailsModalHeader, gridModal, gridModalHeaderMain } = Utils.elements;
        const detailsContent = detailsModal ? detailsModal.querySelector('.modal-content') : null;
        if (detailsContent && detailsModalHeader) {
            DraggableResizable.init(detailsContent, detailsModalHeader);
        } else {
            state.syncLog?.log({ event: 'ui:draggable:init:skip', level: 'warn', details: 'Skipped draggable wiring for details modal.', data: { modalFound: Boolean(detailsModal), headerFound: Boolean(detailsModalHeader) } });
        }
        const gridContent = gridModal ? gridModal.querySelector('.modal-content') : null;
        if (gridContent && gridModalHeaderMain) {
            DraggableResizable.init(gridContent, gridModalHeaderMain);
        } else {
            state.syncLog?.log({ event: 'ui:draggable:init:skip', level: 'warn', details: 'Skipped draggable wiring for grid modal.', data: { modalFound: Boolean(gridModal), headerFound: Boolean(gridModalHeaderMain) } });
        }
    },
    setupProviderSelection() {
        Utils.elements.googleDriveBtn.addEventListener('click', () => App.selectProvider('googledrive'));
        Utils.elements.onedriveBtn.addEventListener('click', () => App.selectProvider('onedrive'));
    },
    setupSettings() {
        document.querySelectorAll('.intensity-btn').forEach(btn => {
            btn.addEventListener('click', () => { state.visualCues.setIntensity(btn.dataset.level); });
        });
        const hapticToggle = document.getElementById('haptic-enabled');
        if (hapticToggle) {
            hapticToggle.addEventListener('change', (e) => {
                if (state.haptic) { state.haptic.setEnabled(e.target.checked); }
            });
        }
        const debugToggle = document.getElementById('debug-toasts-enabled');
        state.showDebugToasts = debugToggle ? debugToggle.checked : true;
        if (!state.showDebugToasts) { Utils.clearFooterToasts(); }
        if (debugToggle) {
            debugToggle.addEventListener('change', (e) => {
                state.showDebugToasts = e.target.checked;
                if (!state.showDebugToasts) { Utils.clearFooterToasts(); }
            });
        }
    },
    setupAuth() {
        Utils.elements.authButton.addEventListener('click', () => App.authenticateCurrentUser());
        Utils.elements.authBackButton.addEventListener('click', async () => { await App.backToProviderSelection(); });
    },
    setupFolderManagement() {
        Utils.elements.backButton.addEventListener('click', () => App.returnToFolderSelection());
        Utils.elements.folderBackButton.addEventListener('click', async () => { await App.backToProviderSelection(); });
        Utils.elements.folderLogoutButton.addEventListener('click', async () => {
            try {
                if (state.provider) { await state.provider.disconnect(); }
                await App.backToProviderSelection();
            } catch (error) {
                Utils.showToast(`Logout failed: ${error.message}`, 'error', true);
            }
        });
        Utils.elements.folderRefreshButton.addEventListener('click', async () => {
            try {
                const provider = state.provider;
                if (typeof provider?.canGoUp === 'function' && provider.canGoUp()) {
                    const folders = await provider.navigateToParent();
                    Folders.display(folders);
                    Folders.updateNavigation();
                } else {
                    await Folders.load({ forceRefresh: true });
                }
            } catch (error) {
                Utils.showToast(`Folder navigation failed: ${error.message}`, 'error', true);
            }
        });
        const { lastFolderLink } = Utils.elements;
        if (lastFolderLink) {
            lastFolderLink.addEventListener('click', (event) => {
                event.preventDefault();
                Folders.handleLastFolderClick();
            });
        }
    },
    setupFolderSearch() {
        const { folderSearchInput, folderSearchResults, folderSearchContainer, folderSortSelect, folderSortDirection } = Utils.elements;
        if (folderSearchInput) {
            folderSearchInput.addEventListener('input', (event) => { Folders.handleSearchInput(event.target.value); });
            folderSearchInput.addEventListener('focus', () => {
                if (folderSearchInput.value) { Folders.handleSearchInput(folderSearchInput.value); }
            });
            folderSearchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') { Folders.resetSearch(); folderSearchInput.blur(); }
                else if (event.key === 'Enter') {
                    if (folderSearchResults) {
                        const firstItem = folderSearchResults.querySelector('.omni-search-item');
                        if (firstItem) { firstItem.click(); event.preventDefault(); }
                    }
                }
            });
        }
        if (folderSearchResults && folderSearchContainer) {
            document.addEventListener('click', (event) => {
                if (!folderSearchContainer.contains(event.target)) { folderSearchResults.classList.add('hidden'); }
            });
        }
        if (folderSortSelect) {
            folderSortSelect.addEventListener('change', (event) => {
                Folders.updateSort(event.target.value, state.folderSort?.direction || 'desc');
            });
        }
        if (folderSortDirection) {
            folderSortDirection.addEventListener('click', () => {
                const nextDirection = state.folderSort?.direction === 'asc' ? 'desc' : 'asc';
                Folders.updateSort(state.folderSort?.field || 'date', nextDirection);
            });
        }
    },
    setupLoadingScreen() {
        Utils.elements.cancelLoading.addEventListener('click', () => {
            if (state.metadataExtractor) { state.metadataExtractor.abort(); }
            state.activeRequests.abort();
            App.returnToFolderSelection();
            Utils.showToast('Loading cancelled', 'info', true);
        });
    },
    setupDetailsModal() {
        Utils.elements.detailsButton.addEventListener('click', () => { if (state.stacks[state.currentStack].length > 0) { Details.show(); } });
        Utils.elements.detailsClose.addEventListener('click', () => Details.hide());
    },
    setupFocusMode() {
        Utils.elements.centerTrashBtn.addEventListener('click', () => Core.deleteCurrentImage({ exitFocusIfEmpty: false, source: 'button:center-trash' }));
        Utils.elements.focusStackName.addEventListener('click', () => Modal.setupFocusStackSwitch());
        Utils.elements.focusDeleteBtn.addEventListener('click', () => Core.deleteCurrentImage({ exitFocusIfEmpty: true, source: 'button:focus-trash' }));
        Utils.elements.focusFavoriteBtn.addEventListener('click', () => {
            try {
                const currentFile = state.stacks[state.currentStack]?.[state.currentStackPosition];
                if (!currentFile) return;
                const currentlyFavorite = Utils.isFavorite(currentFile);
                const nextFavorite = !currentlyFavorite;
                currentFile.favorite = nextFavorite;
                Core.updateFavoriteButton();
                App.updateUserMetadata(currentFile.id, { favorite: nextFavorite }, { providerSilent: true }).catch(error => {
                    currentFile.favorite = currentlyFavorite;
                    Core.updateFavoriteButton();
                    Utils.showToast(`Favorite failed: ${error.message}`, 'error', true);
                });
            } catch (error) {
                Utils.showToast(`Favorite failed: ${error.message}`, 'error', true);
            }
        });
    },
    setupTabs() { document.querySelectorAll('.tab-button').forEach(btn => { btn.addEventListener('click', () => Details.switchTab(btn.dataset.tab)); }); },
    setupCopyButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-metadata')) {
                const value = e.target.dataset.value; const button = e.target;
                button.classList.add('copied'); const originalText = button.textContent; button.textContent = '\u2713';
                Details.copyToClipboard(value);
                setTimeout(() => { button.classList.remove('copied'); button.textContent = originalText; }, 1000);
            }
        });
    },
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
    setupPillCounters() {
        STACKS.forEach(stackName => {
            const pill = document.getElementById(`pill-${stackName}`);
            if (pill) {
                pill.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (state.haptic) { state.haptic.triggerFeedback('pillTap'); }
                    if (stackName === 'trash') {
                        if (state.currentStack !== stackName) { await UI.switchToStack(stackName); }
                        else { Grid.open(stackName); }
                    } else if (state.currentStack === stackName) { Grid.open(stackName); }
                    else { UI.switchToStack(stackName); }
                    UI.acknowledgePillCounter(stackName);
                });
            }
        });
    },
    setupGridControls() {
        Utils.elements.closeGrid.addEventListener('click', () => Grid.close());
        Utils.elements.selectAllBtn.addEventListener('click', () => Grid.selectAll());
        Utils.elements.gridSize.addEventListener('input', () => {
            const value = Utils.elements.gridSize.value;
            Utils.elements.gridSizeValue.textContent = value;
            Utils.elements.gridContainer.style.gridTemplateColumns = `repeat(${value}, 1fr)`;
        });
    },
    setupSearchFunctionality() {
        const searchInput = Utils.elements.omniSearch;
        const clearBtn = Utils.elements.clearSearchBtn;
        if (searchInput) { searchInput.addEventListener('input', () => Grid.performSearch()); }
        if (clearBtn) { clearBtn.addEventListener('click', () => Grid.resetSearch()); }
        const { searchHelper, searchHelperIcon, searchHelperPopup, searchHelperClose } = Utils.elements;
        const modifierLinks = document.querySelectorAll('.modifier-link');
        const appendModifierToInput = (modifier) => {
            if (!searchInput) return;
            const baseValue = searchInput.value.replace(/\s+$/, '');
            const newValue = baseValue ? `${baseValue} ${modifier} ` : `${modifier} `;
            searchInput.value = newValue;
            searchInput.focus();
            Grid.performSearch();
        };
        if (searchHelper && searchHelperIcon && searchHelperPopup) {
            const setHelperState = (isOpen) => {
                const open = Boolean(isOpen);
                searchHelper.classList.toggle('is-open', open);
                searchHelperPopup.setAttribute('aria-hidden', String(!open));
                searchHelperIcon.setAttribute('aria-expanded', String(open));
            };
            const closeHelper = (focusIcon = false) => { setHelperState(false); if (focusIcon) { searchHelperIcon.focus(); } };
            const openHelper = () => setHelperState(true);
            searchHelperIcon.addEventListener('click', (event) => {
                event.preventDefault();
                if (searchHelper.classList.contains('is-open')) { closeHelper(); } else { openHelper(); }
            });
            if (searchHelperClose) {
                searchHelperClose.addEventListener('click', (event) => { event.preventDefault(); closeHelper(true); });
            }
            document.addEventListener('click', (event) => { if (!searchHelper.contains(event.target)) { closeHelper(); } });
            const handleEscape = (event) => { if (event.key === 'Escape') { closeHelper(true); } };
            searchHelperIcon.addEventListener('keydown', handleEscape);
            searchHelperPopup.addEventListener('keydown', handleEscape);
            modifierLinks.forEach(link => {
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    const modifier = link.dataset.modifier;
                    if (!modifier) return;
                    appendModifierToInput(modifier);
                    closeHelper();
                });
            });
        } else {
            modifierLinks.forEach(link => {
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    const modifier = link.dataset.modifier;
                    if (!modifier) return;
                    appendModifierToInput(modifier);
                });
            });
        }
        if (Utils.elements.deselectAllBtn) {
            Utils.elements.deselectAllBtn.addEventListener('click', () => {
                if (Utils.elements.omniSearch.value.trim() || state.grid.filtered.length > 0) { Grid.resetSearch(); }
                else { Grid.deselectAll(); }
            });
        }
    },
    setupActionButtons() {
        Utils.elements.tagSelected.addEventListener('click', () => Modal.setupTagAction());
        Utils.elements.notesSelected.addEventListener('click', () => Modal.setupNotesAction());
        Utils.elements.moveSelected.addEventListener('click', () => Modal.setupMoveAction());
        Utils.elements.deleteSelected.addEventListener('click', () => Modal.setupDeleteAction());
        Utils.elements.exportSelected.addEventListener('click', () => Modal.setupExportAction());
        Utils.elements.folderSelected.addEventListener('click', () => Modal.setupFolderMoveAction());
        Utils.elements.actionCancel.addEventListener('click', () => Modal.hide());
        Utils.elements.actionConfirm.addEventListener('click', async () => {
            try {
                if (Modal.currentAction === 'move') { /* handled by buttons */ }
                else if (Modal.currentAction === 'notes') { await Modal.executeNotes(); }
                else if (Modal.currentAction === 'delete') { await Modal.executeDelete(); }
                else if (Modal.currentAction === 'export') { await Modal.executeExport(); }
                else if (Modal.currentAction === 'folder-move') { Modal.executeFolderMove(); }
            } catch (error) {
                Utils.showToast(`Action failed: ${error.message}`, 'error', true);
            }
        });
    },
    setupKeyboardNavigation() {
        document.addEventListener('keydown', async (e) => {
            if (Utils.elements.appContainer.classList.contains('hidden')) return;
            if (!Utils.elements.detailsModal.classList.contains('hidden')) { if (e.key === 'Escape') Details.hide(); return; }
            if (!Utils.elements.gridModal.classList.contains('hidden')) { if (e.key === 'Escape') Grid.close(); return; }
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
            try {
                if (state.isFocusMode) {
                    if (e.key === 'ArrowRight') await Gestures.nextImage();
                    if (e.key === 'ArrowLeft') await Gestures.prevImage();
                    if (e.key === 'Escape') Gestures.toggleFocusMode();
                    return;
                }
                const keyMap = { 'ArrowUp': 'priority', 'ArrowDown': 'trash', 'ArrowLeft': 'in', 'ArrowRight': 'out' };
                if (keyMap[e.key]) {
                    e.preventDefault();
                    const targetStack = keyMap[e.key];
                    if (state.stacks[state.currentStack].length > 0) {
                        UI.acknowledgePillCounter(targetStack);
                        await Core.moveToStack(targetStack, { source: `keyboard:${e.key}` });
                    }
                    return;
                }
                switch (e.key) {
                    case 'Tab': e.preventDefault(); UI.cycleThroughPills(); break;
                    case 'Escape': await App.returnToFolderSelection(); break;
                }
            } catch (error) {
                Utils.showToast(`Keyboard command failed: ${error.message}`, 'error', true);
            }
        });
    }
};

async function initApp() {
    try {
        Utils.init();
        state.syncLog = new SyncActivityLogger();
        state.syncLog.init();
        state.visualCues = new VisualCueManager();
        state.haptic = new HapticFeedbackManager();
        state.export = new ExportSystem();
        state.dbManager = new DBManager();
        const dbStatus = await state.dbManager.init();
        if (dbStatus && dbStatus.available === false) {
            state.storageStatus = { available: false, reason: dbStatus.reason };
            const reasonText = dbStatus.reason || 'IndexedDB is unavailable.';
            Utils.showToast(`Offline storage disabled: ${reasonText}`, 'error', true);
            state.syncLog?.log({ event: 'storage:indexeddb_unavailable', level: 'warn', details: reasonText });
        } else {
            state.storageStatus = { available: true, reason: null };
            state.syncLog?.log({ event: 'storage:indexeddb_ready', level: 'info', details: 'IndexedDB initialized successfully.' });
        }
        state.folderSyncCoordinator = new FolderSyncCoordinator({ dbManager: state.dbManager, logger: state.syncLog });
        state.syncManager = new SyncManager({ dbManager: state.dbManager, logger: state.syncLog });
        Object.assign(getDebugSurface(), {
            label: APP_IDENTITY.label,
            state,
            dbManager: state.dbManager,
            syncManager: state.syncManager,
            folderSyncCoordinator: state.folderSyncCoordinator,
            syncLog: state.syncLog
        });
        state.syncManager.start();
        state.metadataExtractor = new MetadataExtractor();
        Utils.showScreen('provider-screen');
        Events.init();
        Gestures.init();
        Core.updateActiveProxTab();
    } catch (error) {
        console.error("Fatal initialization error:", error);
        const body = document.body;
        body.innerHTML = `<div style="color: red; padding: 20px; font-family: sans-serif; text-align: center;">
                            <h1>Application Failed to Start</h1>
                            <p>A critical error occurred: ${error.message}</p>
                            <p>Please try refreshing the page or clearing application data.</p>
                          </div>`;
    }
}

// Handle Google OAuth redirect
if (window.location.search.includes('code=') || window.location.search.includes('error=')) {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code'); const error = urlParams.get('error');
    if (window.opener) {
        if (error) { window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: error }, window.location.origin);
        } else if (code) { window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', code: code }, window.location.origin); }
        window.close();
    }
}

document.addEventListener('DOMContentLoaded', initApp);
