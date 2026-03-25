// pic-v1-app.js — bootstrap, event wiring, downstream handoff

import { state, persistSession, clearSession }      from './pic-v1-state.js';
import { createProvider }                            from './pic-v1-providers.js';
import { loadRoots, loadFolder, navigateUp,
         searchProvider, setSort, toggleSortDir,
         invalidateAll }                             from './pic-v1-browser.js';
import { showScreen, toast, renderAuthScreen,
         setAuthStatus, setAuthBusy, renderFolders,
         renderLoading, renderBrowserHeader,
         updateSelectionBar, setViewMode,
         renderLastSessionBanner, renderDetailPanel,
         refreshSortDirBtn }                         from './pic-v1-ui.js';

// ─── Handoff hook ─────────────────────────────────────────────────────────────
// This is the explicit boundary between the browser experience and the
// downstream curation workflow (ui-v1 or equivalent).
// Replace the body of this function to integrate with the real curation flow.

function handOffToCuration(payload) {
  // payload shape:
  // {
  //   providerType:  'googledrive' | 'onedrive',
  //   provider:      <provider instance>,
  //   folders:       [{ id, provider, name, kind, parentId, size, modifiedAt, createdAt, path, hasChildren, imageCount }, …],
  //   primaryFolder: { same shape } | null,   // first / only selected folder
  //   session:       { accessToken?, account? }
  // }
  //
  // Stub: log payload and show confirmation toast.
  // Real integration: postMessage to ui-v1 frame, redirect with query params,
  // write to shared localStorage, or call ui-v1's initializeWithProvider() directly.

  console.info('[pic-v1] handoff payload:', payload);

  // ── Example redirect integration (uncomment + adjust as needed) ─────────────
  // const params = new URLSearchParams({
  //   provider:  payload.providerType,
  //   folderId:  payload.primaryFolder?.id,
  //   folderName: payload.primaryFolder?.name,
  // });
  // window.location.href = `ui-v1.html?${params}`;

  // ── Example postMessage to parent frame ─────────────────────────────────────
  // if (window.parent !== window) {
  //   window.parent.postMessage({ type: 'PIC_V1_HANDOFF', payload }, '*');
  // }

  toast(`Ready: ${payload.folders.length} folder${payload.folders.length === 1 ? '' : 's'} handed off to curation`, 'success', 4000);
}

// ─── State ────────────────────────────────────────────────────────────────────

let _currentRawFolders = [];
let _searchDebounce    = null;
let _detailFolder      = null;

// ─── Bootstrap ───────────────────────────────────────────────────────────────

export async function init() {
  // Handle Google OAuth redirect code in popup window
  if (window.opener && (location.search.includes('code=') || location.search.includes('error='))) {
    const p = new URLSearchParams(location.search);
    const code  = p.get('code');
    const error = p.get('error');
    if (error) window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error }, location.origin);
    else if (code) window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', code }, location.origin);
    window.close();
    return;
  }

  wireProviderScreen();
  wireAuthScreen();
  wireBrowserScreen();

  showScreen('screen-provider');
}

// ─── Provider screen ──────────────────────────────────────────────────────────

function wireProviderScreen() {
  document.getElementById('btn-google-drive')?.addEventListener('click', () => selectProvider('googledrive'));
  document.getElementById('btn-onedrive')?.addEventListener('click',     () => selectProvider('onedrive'));
}

async function selectProvider(type) {
  state.providerType = type;
  state.provider     = createProvider(type);

  // If already authenticated, skip auth screen
  if (state.provider.getSession()) {
    await enterBrowser();
    return;
  }

  renderAuthScreen(type);
  showScreen('screen-auth');
}

// ─── Auth screen ──────────────────────────────────────────────────────────────

function wireAuthScreen() {
  document.getElementById('auth-back-btn')?.addEventListener('click', () => {
    showScreen('screen-provider');
  });

  document.getElementById('auth-connect-btn')?.addEventListener('click', doConnect);
  document.getElementById('auth-secret-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doConnect();
  });
}

async function doConnect() {
  const isGoogle = state.providerType === 'googledrive';
  const secret   = isGoogle ? document.getElementById('auth-secret-input')?.value.trim() : null;

  if (isGoogle && !secret) {
    setAuthStatus('Please enter your OAuth client secret.', 'error');
    return;
  }

  setAuthBusy(true);
  setAuthStatus('Connecting…', 'info');

  try {
    await state.provider.connect(secret || undefined);
    setAuthStatus('Connected!', 'success');
    await new Promise(r => setTimeout(r, 700));
    await enterBrowser();
  } catch (err) {
    setAuthStatus(`Connection failed: ${err.message}`, 'error');
  } finally {
    setAuthBusy(false);
  }
}

// ─── Browser screen ───────────────────────────────────────────────────────────

async function enterBrowser() {
  state.selectedItems.clear();
  _currentRawFolders = [];
  _detailFolder      = null;

  renderDetailPanel(null);
  renderLastSessionBanner();
  showScreen('screen-browser');
  await loadAndRender();
}

function wireBrowserScreen() {
  // Back to providers
  document.getElementById('browser-back-btn')?.addEventListener('click', async () => {
    showScreen('screen-provider');
  });

  // Disconnect
  document.getElementById('browser-disconnect-btn')?.addEventListener('click', async () => {
    await state.provider?.disconnect?.();
    clearSession();
    invalidateAll();
    showScreen('screen-provider');
  });

  // Navigate up
  document.getElementById('browser-up-btn')?.addEventListener('click', async () => {
    if (!state.provider?.canGoUp?.()) return;
    renderLoading({ message: 'Going up…' });
    try {
      const folders = await navigateUp(p => renderLoading(p));
      _currentRawFolders = folders;
      renderFolders(folders);
    } catch (err) { toast(`Error: ${err.message}`, 'error'); }
  });

  // Refresh
  document.getElementById('browser-refresh-btn')?.addEventListener('click', async () => {
    invalidateAll();
    await loadAndRender();
  });

  // Search
  document.getElementById('browser-search')?.addEventListener('input', e => {
    state.searchQuery = e.target.value;
    clearTimeout(_searchDebounce);
    if (e.target.value.trim().length >= 2) {
      _searchDebounce = setTimeout(async () => {
        try {
          const results = await searchProvider(e.target.value);
          _currentRawFolders = results;
          renderFolders(results);
        } catch (err) { toast(`Search failed: ${err.message}`, 'error'); }
      }, 380);
    } else {
      renderFolders(_currentRawFolders);
    }
  });

  // Clear search
  document.getElementById('browser-search-clear')?.addEventListener('click', () => {
    const input = document.getElementById('browser-search');
    if (input) input.value = '';
    state.searchQuery = '';
    renderFolders(_currentRawFolders);
  });

  // Sort field
  document.getElementById('sort-field')?.addEventListener('change', e => {
    setSort(e.target.value, state.sortDir);
    renderFolders(_currentRawFolders);
  });

  // Sort direction toggle
  document.getElementById('sort-dir-btn')?.addEventListener('click', () => {
    toggleSortDir();
    refreshSortDirBtn();
    renderFolders(_currentRawFolders);
  });

  // View mode
  document.getElementById('btn-view-list')?.addEventListener('click', () => {
    setViewMode('list');
    renderFolders(_currentRawFolders);
  });
  document.getElementById('btn-view-grid')?.addEventListener('click', () => {
    setViewMode('grid');
    renderFolders(_currentRawFolders);
  });

  // Folder content — delegated events
  document.getElementById('folder-content')?.addEventListener('click', e => {
    const drillBtn   = e.target.closest('.btn-drill');
    const selectBtn  = e.target.closest('.btn-select-folder');
    const detailCta  = e.target.closest('.detail-cta');
    const row        = e.target.closest('[data-folder-id]');
    const chk        = e.target.closest('.folder-check');

    if (drillBtn) {
      e.stopPropagation();
      drillInto({ id: drillBtn.dataset.folderId, name: drillBtn.dataset.folderName });
      return;
    }
    if (selectBtn || detailCta) {
      e.stopPropagation();
      const id   = (selectBtn || detailCta).dataset.folderId;
      const name = (selectBtn || detailCta).dataset.folderName;
      initiateHandoff([{ id, name }]);
      return;
    }
    if (chk) {
      e.stopPropagation();
      toggleSelection(chk.dataset.id);
      return;
    }
    if (row) {
      const folder = _currentRawFolders.find(f => f.id === row.dataset.folderId);
      if (folder) {
        _detailFolder = folder;
        renderDetailPanel(folder);
        highlightRow(row.dataset.folderId);
      }
    }
  });

  // Detail panel CTA
  document.getElementById('detail-panel-inner')?.addEventListener('click', e => {
    const cta = e.target.closest('.detail-cta');
    if (cta) initiateHandoff([{ id: cta.dataset.folderId, name: cta.dataset.folderName }]);
  });

  // Selection bar — continue CTA
  document.getElementById('selection-cta-btn')?.addEventListener('click', () => {
    const items = [...state.selectedItems].map(id => {
      const f = _currentRawFolders.find(x => x.id === id);
      return f || { id, name: id };
    });
    initiateHandoff(items);
  });

  // Selection bar — clear
  document.getElementById('selection-clear-btn')?.addEventListener('click', () => {
    state.selectedItems.clear();
    renderFolders(_currentRawFolders);
  });

  // Last session banner
  document.getElementById('last-session-link')?.addEventListener('click', e => {
    e.preventDefault();
    const data = state.lastSession;
    if (data?.folderId) initiateHandoff([{ id: data.folderId, name: data.folderName || '' }]);
  });

  // Breadcrumb navigation
  document.getElementById('browser-breadcrumb')?.addEventListener('click', async e => {
    const seg = e.target.closest('.breadcrumb-seg--link');
    if (!seg) return;
    const targetId = seg.dataset.id;
    if (!targetId) return;
    // Pop breadcrumb back to this segment
    const bc = state.provider.getBreadcrumb();
    const idx = bc.findIndex(b => b.id === targetId);
    if (idx < 0) return;
    // Navigate up until we reach this segment
    while (state.provider.getBreadcrumb().length > idx + 1 && state.provider.canGoUp()) {
      await navigateUp();
    }
    await loadAndRender();
  });
}

// ─── Drill into folder ────────────────────────────────────────────────────────

async function drillInto(folder) {
  renderLoading({ message: `Opening ${folder.name}…` });
  try {
    const folders = await loadFolder(folder, p => renderLoading(p));
    _currentRawFolders = folders;
    state.selectedItems.clear();
    _detailFolder = null;
    renderDetailPanel(null);
    renderFolders(folders);
  } catch (err) {
    toast(`Could not open folder: ${err.message}`, 'error');
    renderFolders(_currentRawFolders);
  }
}

// ─── Selection ────────────────────────────────────────────────────────────────

function toggleSelection(id) {
  if (state.selectedItems.has(id)) state.selectedItems.delete(id);
  else state.selectedItems.add(id);

  // Update visual
  const row  = document.querySelector(`[data-folder-id="${id}"]`);
  if (row) row.classList.toggle('folder-row--selected',  state.selectedItems.has(id));
  if (row) row.classList.toggle('folder-card--selected', state.selectedItems.has(id));

  const chk = document.querySelector(`.folder-check[data-id="${id}"]`);
  if (chk) chk.checked = state.selectedItems.has(id);

  updateSelectionBar();
}

function highlightRow(id) {
  document.querySelectorAll('[data-folder-id]').forEach(el => el.classList.remove('folder-row--active'));
  document.querySelector(`[data-folder-id="${id}"]`)?.classList.add('folder-row--active');
}

// ─── Load and render ──────────────────────────────────────────────────────────

async function loadAndRender() {
  renderLoading({ message: 'Loading folders…' });
  try {
    const folders = await loadRoots(p => renderLoading(p));
    _currentRawFolders = folders;
    renderFolders(folders);
    renderLastSessionBanner();
  } catch (err) {
    toast(`Failed to load folders: ${err.message}`, 'error');
    renderFolders([]);
  }
}

// ─── Handoff ──────────────────────────────────────────────────────────────────

function initiateHandoff(items) {
  if (!items || items.length === 0) {
    toast('No folder selected', 'error');
    return;
  }

  const resolved = items.map(item => {
    const full = _currentRawFolders.find(f => f.id === item.id);
    return full || { id: item.id, provider: state.providerType, name: item.name, kind: 'folder', parentId: null, size: null, modifiedAt: null, createdAt: null, path: null, hasChildren: false, imageCount: null };
  });

  const primary = resolved[0];

  // Persist this selection as last session
  persistSession({
    providerType: state.providerType,
    folderId:     primary.id,
    folderName:   primary.name,
    fileCount:    primary.imageCount ?? null,
    accessedAt:   new Date().toISOString(),
  });

  handOffToCuration({
    providerType:  state.providerType,
    provider:      state.provider,
    folders:       resolved,
    primaryFolder: primary,
    session:       state.provider.getSession(),
  });
}
