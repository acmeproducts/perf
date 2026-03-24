const STORAGE_KEY = 'pic_v1_handoff_payload';

export const createState = () => ({
  provider: null,
  session: null,
  roots: [],
  currentFolderId: null,
  breadcrumbs: [],
  items: [],
  visibleItems: [],
  selectedIds: new Set(),
  viewMode: 'list',
  searchTerm: '',
  sort: { field: 'modifiedAt', direction: 'desc' }
});

export const sortItems = (items, sort) => {
  const { field, direction } = sort;
  const directionFactor = direction === 'asc' ? 1 : -1;
  const sorted = [...items].sort((a, b) => {
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    if (typeof av === 'number' || typeof bv === 'number') {
      return (Number(av) - Number(bv)) * directionFactor;
    }
    return String(av).localeCompare(String(bv)) * directionFactor;
  });
  return sorted;
};

export const applySearchAndSort = (state) => {
  const searchTerm = state.searchTerm.trim().toLowerCase();
  const filtered = state.items.filter((item) => {
    if (!searchTerm) return true;
    return [item.name, item.path, item.kind].some((value) => String(value || '').toLowerCase().includes(searchTerm));
  });
  state.visibleItems = sortItems(filtered, state.sort);
  return state.visibleItems;
};

export const setSort = (state, sortValue) => {
  const [field, direction] = sortValue.split(':');
  state.sort = { field, direction };
};

export const buildHandoffPayload = (state) => {
  const selected = state.items.filter((item) => state.selectedIds.has(item.id));
  return {
    provider: state.provider?.id || null,
    providerLabel: state.provider?.label || null,
    selectedFolderId: state.currentFolderId,
    sort: state.sort,
    selectedCount: selected.length,
    timestamp: new Date().toISOString(),
    items: selected.map((item) => ({
      id: item.id,
      provider: item.provider,
      name: item.name,
      kind: item.kind,
      parentId: item.parentId,
      size: item.size,
      modifiedAt: item.modifiedAt,
      createdAt: item.createdAt,
      path: item.path
    }))
  };
};

export const persistHandoffPayload = (payload) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const getHandoffStorageKey = () => STORAGE_KEY;
