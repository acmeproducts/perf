// pic-v1-ui.js — UI rendering, view controller, component builders

import { state, persistViewMode } from './pic-v1-state.js';
import { sortFolders, filterFolders } from './pic-v1-browser.js';

// ─── Screen management ────────────────────────────────────────────────────────

const SCREENS = ['screen-provider', 'screen-auth', 'screen-browser'];

export function showScreen(id) {
  SCREENS.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.toggle('hidden', s !== id);
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────────

let _toastTimer = null;

export function toast(msg, type = 'info', duration = 3500) {
  const el = document.getElementById('pic-toast');
  if (!el) return;
  clearTimeout(_toastTimer);
  el.textContent = msg;
  el.className   = `pic-toast pic-toast--${type} pic-toast--show`;
  _toastTimer = setTimeout(() => { el.classList.remove('pic-toast--show'); }, duration);
}

// ─── Auth screen ─────────────────────────────────────────────────────────────

export function renderAuthScreen(providerType) {
  const isGoogle = providerType === 'googledrive';

  document.getElementById('auth-provider-name').textContent =
    isGoogle ? 'Google Drive' : 'OneDrive';

  document.getElementById('auth-provider-icon').innerHTML =
    isGoogle ? googleIcon(32) : onedriveIcon(32);

  document.getElementById('auth-secret-row').classList.toggle('hidden', !isGoogle);
  document.getElementById('auth-connect-btn').textContent =
    isGoogle ? 'Connect Google Drive' : 'Sign in with Microsoft';

  document.getElementById('auth-status').textContent =
    isGoogle
      ? 'Enter your OAuth client secret to continue.'
      : 'Click below to sign in with your Microsoft account.';
  document.getElementById('auth-status').className = 'auth-status auth-status--info';
}

export function setAuthStatus(msg, type = 'info') {
  const el = document.getElementById('auth-status');
  if (!el) return;
  el.textContent = msg;
  el.className   = `auth-status auth-status--${type}`;
}

export function setAuthBusy(busy) {
  const btn = document.getElementById('auth-connect-btn');
  if (!btn) return;
  btn.disabled    = busy;
  btn.textContent = busy
    ? 'Connecting…'
    : (state.providerType === 'googledrive' ? 'Connect Google Drive' : 'Sign in with Microsoft');
}

// ─── Browser header ───────────────────────────────────────────────────────────

export function renderBrowserHeader() {
  const provider   = state.provider;
  const isGoogle   = state.providerType === 'googledrive';
  const breadcrumb = provider?.getBreadcrumb?.() || [];
  const canGoUp    = provider?.canGoUp?.() || false;

  // Provider label + icon
  document.getElementById('browser-provider-icon').innerHTML =
    isGoogle ? googleIcon(18) : onedriveIcon(18);
  document.getElementById('browser-provider-label').textContent =
    isGoogle ? 'Google Drive' : 'OneDrive';

  // Breadcrumb
  renderBreadcrumb(breadcrumb);

  // Up button
  const upBtn = document.getElementById('browser-up-btn');
  if (upBtn) upBtn.disabled = !canGoUp;

  // Sort controls state
  document.getElementById('sort-field').value = state.sortField;
  updateSortDirBtn();

  // View mode toggle
  document.getElementById('btn-view-list').classList.toggle('active', state.viewMode === 'list');
  document.getElementById('btn-view-grid').classList.toggle('active', state.viewMode === 'grid');
}

function renderBreadcrumb(breadcrumb) {
  const el = document.getElementById('browser-breadcrumb');
  if (!el) return;
  el.innerHTML = '';

  breadcrumb.forEach((seg, i) => {
    const span = document.createElement('span');
    span.className = 'breadcrumb-seg';
    span.textContent = seg.name;
    span.dataset.id  = seg.id;
    if (i < breadcrumb.length - 1) span.classList.add('breadcrumb-seg--link');
    el.appendChild(span);

    if (i < breadcrumb.length - 1) {
      const sep = document.createElement('span');
      sep.className   = 'breadcrumb-sep';
      sep.textContent = '/';
      el.appendChild(sep);
    }
  });
}

function updateSortDirBtn() {
  const btn = document.getElementById('sort-dir-btn');
  if (!btn) return;
  const asc = state.sortDir === 'asc';
  btn.setAttribute('aria-label', asc ? 'Sort ascending' : 'Sort descending');
  btn.innerHTML = asc
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14m0 0 5-5m-5 5-5-5"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5m0 0-5 5m5-5 5 5"/></svg>`;
}

export function refreshSortDirBtn() { updateSortDirBtn(); }

// ─── Folder list / grid ───────────────────────────────────────────────────────

export function renderFolders(rawFolders) {
  const query   = state.searchQuery;
  const folders = sortFolders(filterFolders(rawFolders, query));

  state.currentFolders = folders;

  const container = document.getElementById('folder-content');
  const empty     = document.getElementById('folder-empty');
  const selBar    = document.getElementById('selection-bar');

  container.innerHTML = '';

  if (folders.length === 0) {
    empty.classList.remove('hidden');
    selBar.classList.add('hidden');
    renderBrowserHeader();
    return;
  }

  empty.classList.add('hidden');
  renderBrowserHeader();

  if (state.viewMode === 'grid') {
    container.className = 'folder-grid';
    folders.forEach(f => container.appendChild(buildGridCard(f)));
  } else {
    container.className = 'folder-list';
    folders.forEach(f => container.appendChild(buildListRow(f)));
  }

  updateSelectionBar();
}

function buildListRow(folder) {
  const sel  = state.selectedItems.has(folder.id);
  const row  = document.createElement('div');
  row.className        = `folder-row${sel ? ' folder-row--selected' : ''}`;
  row.dataset.folderId = folder.id;
  row.dataset.folderName = folder.name;

  row.innerHTML = `
    <label class="folder-row__check" aria-label="Select ${folder.name}">
      <input type="checkbox" class="folder-check" data-id="${folder.id}" ${sel ? 'checked' : ''}>
      <span class="checkmark"></span>
    </label>
    <div class="folder-row__icon">${folderIcon(folder)}</div>
    <div class="folder-row__info">
      <div class="folder-row__name">${escHtml(folder.name)}</div>
      <div class="folder-row__meta">${folderMeta(folder)}</div>
    </div>
    <div class="folder-row__actions">
      ${folder.hasChildren ? `<button class="btn-drill" data-folder-id="${folder.id}" data-folder-name="${folder.name}" aria-label="Browse into ${folder.name}">Browse <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>` : ''}
      <button class="btn-select-folder" data-folder-id="${folder.id}" data-folder-name="${folder.name}" aria-label="Select ${folder.name}">Select</button>
    </div>`;

  return row;
}

function buildGridCard(folder) {
  const sel  = state.selectedItems.has(folder.id);
  const card = document.createElement('div');
  card.className        = `folder-card${sel ? ' folder-card--selected' : ''}`;
  card.dataset.folderId = folder.id;
  card.dataset.folderName = folder.name;

  card.innerHTML = `
    <label class="folder-card__check" aria-label="Select ${folder.name}">
      <input type="checkbox" class="folder-check" data-id="${folder.id}" ${sel ? 'checked' : ''}>
      <span class="checkmark"></span>
    </label>
    <div class="folder-card__icon">${folderIcon(folder)}</div>
    <div class="folder-card__name">${escHtml(folder.name)}</div>
    <div class="folder-card__meta">${folderMeta(folder)}</div>
    <div class="folder-card__actions">
      ${folder.hasChildren ? `<button class="btn-drill btn-drill--sm" data-folder-id="${folder.id}" data-folder-name="${folder.name}">Browse →</button>` : ''}
      <button class="btn-select-folder btn-select-folder--primary" data-folder-id="${folder.id}" data-folder-name="${folder.name}">Select</button>
    </div>`;

  return card;
}

function folderIcon(folder) {
  const color = folder.hasChildren ? 'var(--accent)' : 'rgba(255,255,255,0.45)';
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>`;
}

function folderMeta(folder) {
  const parts = [];
  const count = folder.imageCount;
  if (typeof count === 'number' && count >= 0)
    parts.push(`${count} image${count === 1 ? '' : 's'}`);
  if (folder.modifiedAt) {
    const d = new Date(folder.modifiedAt);
    if (!isNaN(d)) parts.push(relativeDate(d));
  }
  if (folder.hasChildren) parts.push('Has subfolders');
  return parts.length ? parts.join(' · ') : 'Folder';
}

function relativeDate(date) {
  const diff = Date.now() - date.getTime();
  const m    = Math.floor(diff / 60000);
  if (m < 1)   return 'Just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ─── Loading state ────────────────────────────────────────────────────────────

export function renderLoading(progress = {}) {
  const container = document.getElementById('folder-content');
  const empty     = document.getElementById('folder-empty');
  empty.classList.add('hidden');

  const msg   = progress.message || 'Loading folders…';
  const total = Number(progress.total) || 0;
  const curr  = Number(progress.current) || 0;
  const pct   = total > 0 ? Math.round((curr / total) * 100) : 0;

  container.className = 'folder-list';
  container.innerHTML = `
    <div class="browser-loading">
      <div class="browser-loading__spinner"></div>
      <div class="browser-loading__text">${escHtml(msg)}</div>
      ${total > 0 ? `
      <div class="browser-loading__bar-wrap">
        <div class="browser-loading__bar" style="width:${pct}%"></div>
      </div>
      <div class="browser-loading__count">${curr} / ${total}</div>` : ''}
    </div>`;
}

// ─── Selection bar ────────────────────────────────────────────────────────────

export function updateSelectionBar() {
  const bar   = document.getElementById('selection-bar');
  const count = state.selectedItems.size;

  if (count === 0) {
    bar.classList.add('hidden');
    return;
  }

  bar.classList.remove('hidden');
  document.getElementById('selection-count').textContent =
    `${count} folder${count === 1 ? '' : 's'} selected`;
}

// ─── Search input ─────────────────────────────────────────────────────────────

export function getSearchQuery() {
  return (document.getElementById('browser-search')?.value || '').trim();
}

export function clearSearch() {
  const el = document.getElementById('browser-search');
  if (el) el.value = '';
  state.searchQuery = '';
}

// ─── View mode ────────────────────────────────────────────────────────────────

export function setViewMode(mode) {
  state.viewMode = mode;
  persistViewMode();
  document.getElementById('btn-view-list').classList.toggle('active', mode === 'list');
  document.getElementById('btn-view-grid').classList.toggle('active', mode === 'grid');
}

// ─── Last session banner ──────────────────────────────────────────────────────

export function renderLastSessionBanner() {
  const banner = document.getElementById('last-session-banner');
  const data   = state.lastSession;

  if (!banner) return;

  if (!data || !data.folderId || data.providerType !== state.providerType) {
    banner.classList.add('hidden');
    return;
  }

  banner.classList.remove('hidden');

  const nameEl  = document.getElementById('last-session-name');
  const metaEl  = document.getElementById('last-session-meta');
  if (nameEl) nameEl.textContent = data.folderName || 'Untitled folder';

  if (metaEl) {
    const parts = [];
    if (typeof data.fileCount === 'number') parts.push(`${data.fileCount} images`);
    if (data.accessedAt) parts.push(relativeDate(new Date(data.accessedAt)));
    metaEl.textContent = parts.join(' · ');
  }
}

// ─── Detail panel (right-side on wider screens) ───────────────────────────────

export function renderDetailPanel(folder) {
  const panel = document.getElementById('detail-panel');
  const inner = document.getElementById('detail-panel-inner');
  if (!panel || !inner) return;

  if (!folder) {
    inner.innerHTML = `<p class="detail-empty">Select a folder to see details</p>`;
    return;
  }

  inner.innerHTML = `
    <div class="detail-icon">${folderIcon(folder)}</div>
    <div class="detail-name">${escHtml(folder.name)}</div>
    <div class="detail-meta">${folderMeta(folder)}</div>
    ${folder.path ? `<div class="detail-path">${escHtml(folder.path)}</div>` : ''}
    <div class="detail-dates">
      ${folder.modifiedAt ? `<div><span>Modified</span><strong>${new Date(folder.modifiedAt).toLocaleString()}</strong></div>` : ''}
      ${folder.createdAt  ? `<div><span>Created</span><strong>${new Date(folder.createdAt).toLocaleString()}</strong></div>`  : ''}
    </div>
    <button class="detail-cta" data-folder-id="${folder.id}" data-folder-name="${folder.name}">
      Use this folder →
    </button>`;
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

function googleIcon(size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`;
}

function onedriveIcon(size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="#0078D4" d="M10.5 14.5H19c1.66 0 3-1.34 3-3 0-1.5-1.1-2.74-2.55-2.96A5 5 0 0 0 10 7a4.5 4.5 0 0 0-4.47 4H5.5a3.5 3.5 0 0 0 0 7h5v-3.5z"/><path fill="#0364B8" d="M8 12.5A3.5 3.5 0 0 0 4.5 16h14a2 2 0 0 0 0-4H9.5L8 12.5z"/></svg>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

export { googleIcon, onedriveIcon };
