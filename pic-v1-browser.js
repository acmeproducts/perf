// pic-v1-browser.js — data loading, search, sort, cache layer

import { state, persistSort } from './pic-v1-state.js';

const CACHE_TTL = 60_000; // 1 minute

// ─── Cache helpers ────────────────────────────────────────────────────────────

function cacheKey(providerType, folderId) {
  return `${providerType}::${folderId}`;
}

function getCached(key) {
  const entry = state.folderCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.updatedAt > CACHE_TTL) return null;
  return entry.folders;
}

function setCache(key, folders) {
  state.folderCache.set(key, { folders, updatedAt: Date.now() });
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

export function sortFolders(folders) {
  const { sortField, sortDir } = state;
  const mult = sortDir === 'asc' ? 1 : -1;

  return [...folders].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') {
      cmp = (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true });
    } else if (sortField === 'modified') {
      cmp = (Date.parse(a.modifiedAt) || 0) - (Date.parse(b.modifiedAt) || 0);
    } else if (sortField === 'items') {
      cmp = (a.imageCount ?? -1) - (b.imageCount ?? -1);
    }
    if (cmp !== 0) return cmp * mult;
    return (a.name || '').localeCompare(b.name || '');
  });
}

export function setSort(field, dir) {
  state.sortField = field;
  state.sortDir   = dir;
  persistSort();
}

export function toggleSortDir() {
  state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  persistSort();
}

// ─── Search filter ────────────────────────────────────────────────────────────

export function filterFolders(folders, query) {
  if (!query || !query.trim()) return folders;
  const q = query.trim().toLowerCase();
  return folders.filter(f => (f.name || '').toLowerCase().includes(q));
}

// ─── Load roots ───────────────────────────────────────────────────────────────

export async function loadRoots(onProgress) {
  const provider = state.provider;
  const key      = cacheKey(state.providerType, '__roots__');
  const cached   = getCached(key);

  if (cached) {
    return cached;
  }

  state.isLoading = true;
  onProgress?.({ message: 'Loading folders…', current: 0, total: 0 });

  try {
    const folders = await provider.listRoots();
    setCache(key, folders);
    return folders;
  } finally {
    state.isLoading = false;
  }
}

// ─── Load subfolder ───────────────────────────────────────────────────────────

export async function loadFolder(folder, onProgress) {
  const provider = state.provider;
  const key      = cacheKey(state.providerType, folder.id);
  const cached   = getCached(key);

  if (cached) {
    return cached;
  }

  state.isLoading = true;
  onProgress?.({ message: `Loading ${folder.name}…`, current: 0, total: 0 });

  try {
    const folders = await provider.drillInto(folder);
    setCache(key, folders);
    return folders;
  } finally {
    state.isLoading = false;
  }
}

// ─── Navigate up ─────────────────────────────────────────────────────────────

export async function navigateUp(onProgress) {
  const provider = state.provider;
  state.isLoading = true;
  onProgress?.({ message: 'Going up…', current: 0, total: 0 });

  try {
    const folders = await provider.navigateUp();
    const bc = provider.getBreadcrumb();
    const parentId = bc.length ? bc[bc.length - 1].id : '__roots__';
    const key = cacheKey(state.providerType, parentId);
    setCache(key, folders);
    return folders;
  } finally {
    state.isLoading = false;
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchProvider(query) {
  if (!query || query.trim().length < 2) return [];
  state.isLoading = true;
  try {
    return await state.provider.searchFolders(query.trim());
  } finally {
    state.isLoading = false;
  }
}

// ─── Invalidate cache entry ───────────────────────────────────────────────────

export function invalidateCache(folderId) {
  state.folderCache.delete(cacheKey(state.providerType, folderId || '__roots__'));
}

export function invalidateAll() {
  state.folderCache.clear();
}
