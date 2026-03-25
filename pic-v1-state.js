// pic-v1-state.js — centralized state store

export const STORAGE_KEY_PREFIX = 'pic_v1';

export const STORAGE_KEYS = {
  lastSession:      `${STORAGE_KEY_PREFIX}:last_session`,
  googleToken:      `${STORAGE_KEY_PREFIX}:google_access_token`,
  googleRefresh:    `${STORAGE_KEY_PREFIX}:google_refresh_token`,
  googleSecret:     `${STORAGE_KEY_PREFIX}:google_client_secret`,
  folderCache:      `${STORAGE_KEY_PREFIX}:folder_cache`,
  viewMode:         `${STORAGE_KEY_PREFIX}:view_mode`,
  sortField:        `${STORAGE_KEY_PREFIX}:sort_field`,
  sortDir:          `${STORAGE_KEY_PREFIX}:sort_dir`,
};

function loadLastSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.lastSession);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && p.folderId && p.providerType) return p;
  } catch (_) {}
  return null;
}

export const state = {
  // Provider / auth
  providerType: null,       // 'googledrive' | 'onedrive'
  provider: null,           // provider instance

  // Browser
  breadcrumb: [],           // [{ id, name }]
  currentFolders: [],       // normalized folder objects
  selectedItems: new Set(), // selected folder/item ids
  searchQuery: '',
  sortField: localStorage.getItem(STORAGE_KEYS.sortField) || 'name',
  sortDir:   localStorage.getItem(STORAGE_KEYS.sortDir)   || 'asc',
  viewMode:  localStorage.getItem(STORAGE_KEYS.viewMode)  || 'list', // 'list' | 'grid'
  isLoading: false,
  scanProgress: { active: false, message: '', current: 0, total: 0, folderName: '' },

  // Persisted
  lastSession: loadLastSession(),

  // Folder list cache (memory)
  folderCache: new Map(),   // cacheKey → { folders, updatedAt }

  // Active network abort
  activeRequests: new AbortController(),
};

export function persistSort() {
  localStorage.setItem(STORAGE_KEYS.sortField, state.sortField);
  localStorage.setItem(STORAGE_KEYS.sortDir,   state.sortDir);
}

export function persistViewMode() {
  localStorage.setItem(STORAGE_KEYS.viewMode, state.viewMode);
}

export function persistSession(payload) {
  state.lastSession = payload;
  try { localStorage.setItem(STORAGE_KEYS.lastSession, JSON.stringify(payload)); } catch (_) {}
}

export function clearSession() {
  state.lastSession = null;
  try { localStorage.removeItem(STORAGE_KEYS.lastSession); } catch (_) {}
}
