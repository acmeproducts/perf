import { createState, applySearchAndSort, setSort, buildHandoffPayload, persistHandoffPayload, getHandoffStorageKey } from './pic-v1-state.js';
import { createAuthModule } from './pic-v1-auth.js';
import { createBrowserModule } from './pic-v1-browser.js';
import { createUi } from './pic-v1-ui.js';
import { PROVIDERS } from './pic-v1-providers.js';

const state = createState();
const auth = createAuthModule();
const browser = createBrowserModule({ getSession: auth.getSession });

const elements = {
  providerGrid: document.getElementById('provider-grid'),
  providerStatus: document.getElementById('provider-status'),
  authStatus: document.getElementById('auth-status'),
  browserStatus: document.getElementById('browser-status'),
  handoffStatus: document.getElementById('handoff-status'),
  connectBtn: document.getElementById('connect-btn'),
  disconnectBtn: document.getElementById('disconnect-btn'),
  searchInput: document.getElementById('search-input'),
  sortSelect: document.getElementById('sort-select'),
  viewToggleBtn: document.getElementById('view-toggle-btn'),
  upBtn: document.getElementById('up-btn'),
  handoffBtn: document.getElementById('handoff-btn'),
  listView: document.getElementById('list-view'),
  gridView: document.getElementById('grid-view'),
  crumbs: document.getElementById('crumbs'),
  selectionCount: document.getElementById('selection-count'),
  selectionPreview: document.getElementById('selection-preview'),
  googleConfigRow: document.getElementById('google-config-row'),
  googleClientId: document.getElementById('google-client-id')
};

const getSelectedItems = () => state.items.filter((item) => state.selectedIds.has(item.id));

const refreshVisibleItems = () => {
  applySearchAndSort(state);
  ui.renderRows(state.visibleItems, state.selectedIds);
  ui.renderCards(state.visibleItems, state.selectedIds);
  ui.renderSelection(getSelectedItems(), getHandoffStorageKey());
};

const buildCrumbs = async () => {
  const crumbs = [{ id: '', name: 'Root' }];
  for (const crumbId of state.breadcrumbs) {
    const node = await browser.getFolder(state.provider.id, crumbId);
    if (node) crumbs.push({ id: node.id, name: node.name });
  }
  ui.renderBreadcrumbs(crumbs);
};

const loadFolder = async (folderId = null, addBreadcrumb = true) => {
  if (!state.provider || !state.session) {
    ui.setBrowserStatus('Connect a provider first.');
    return;
  }

  state.currentFolderId = folderId;
  if (!folderId) state.breadcrumbs = [];
  if (addBreadcrumb && folderId && state.breadcrumbs[state.breadcrumbs.length - 1] !== folderId) {
    state.breadcrumbs.push(folderId);
  }

  state.items = folderId
    ? await browser.listFolder(state.provider.id, folderId)
    : await browser.listRoots(state.provider.id);

  ui.setBrowserStatus(`${state.items.length} entries loaded from ${state.provider.label}.`);
  await buildCrumbs();
  refreshVisibleItems();
};

const ui = createUi(elements, {
  onSelectProvider: (providerId) => {
    state.provider = PROVIDERS.find((provider) => provider.id === providerId) || null;
    state.session = null;
    state.items = [];
    state.visibleItems = [];
    state.selectedIds.clear();
    state.breadcrumbs = [];
    ui.renderProviderCards(providerId);

    const isGoogle = providerId === 'google-drive';
    elements.googleConfigRow.classList.toggle('hidden', !isGoogle);

    if (!state.provider) {
      ui.setProviderStatus('Select a provider.');
      return;
    }

    ui.setProviderStatus(`Selected ${state.provider.label}.`);
    ui.setAuthStatus(auth.isConfigured(providerId)
      ? `Ready to connect to ${state.provider.label}.`
      : 'Placeholder provider for future approved OAuth configuration.');
    ui.setBrowserStatus('Not connected.');
    ui.setHandoffStatus('');
    refreshVisibleItems();
    ui.renderBreadcrumbs([{ id: '', name: 'Root' }]);
  },

  onConnect: async () => {
    if (!state.provider) {
      ui.setAuthStatus('Choose a provider first.');
      return;
    }

    try {
      if (!auth.isConfigured(state.provider.id)) {
        ui.setAuthStatus(`${state.provider.label} is a placeholder and not live yet.`);
        return;
      }

      const options = {
        googleClientId: elements.googleClientId.value.trim() || undefined
      };
      state.session = await auth.connect(state.provider.id, options);
      ui.setAuthStatus(`Connected to ${state.provider.label}.`);
      await loadFolder(null, false);
    } catch (error) {
      ui.setAuthStatus(`Connection failed: ${error.message}`);
    }
  },

  onDisconnect: async () => {
    if (!state.provider) {
      ui.setAuthStatus('No provider selected.');
      return;
    }

    try {
      await auth.disconnect(state.provider.id);
      state.session = null;
      state.items = [];
      state.visibleItems = [];
      state.selectedIds.clear();
      state.breadcrumbs = [];
      ui.setAuthStatus(`Disconnected from ${state.provider.label}.`);
      ui.setBrowserStatus('Connect to browse.');
      ui.setHandoffStatus('');
      ui.renderBreadcrumbs([{ id: '', name: 'Root' }]);
      refreshVisibleItems();
    } catch (error) {
      ui.setAuthStatus(`Disconnect failed: ${error.message}`);
    }
  },

  onSearch: async (term) => {
    state.searchTerm = term;
    if (!state.provider || !state.session) return;

    try {
      if (term.trim().length >= 2) {
        state.items = await browser.searchFolders(state.provider.id, term);
        ui.setBrowserStatus(`Search results: ${state.items.length}`);
      } else {
        state.items = state.currentFolderId
          ? await browser.listFolder(state.provider.id, state.currentFolderId)
          : await browser.listRoots(state.provider.id);
        ui.setBrowserStatus(`${state.items.length} entries loaded.`);
      }
      refreshVisibleItems();
    } catch (error) {
      ui.setBrowserStatus(`Search failed: ${error.message}`);
    }
  },

  onSort: (sortValue) => {
    setSort(state, sortValue);
    refreshVisibleItems();
  },

  onToggleView: () => {
    state.viewMode = state.viewMode === 'list' ? 'grid' : 'list';
    ui.setViewMode(state.viewMode);
  },

  onNavigateUp: async () => {
    if (!state.session) return;
    if (!state.currentFolderId) {
      ui.setBrowserStatus('Already at root.');
      return;
    }

    try {
      const current = await browser.getFolder(state.provider.id, state.currentFolderId);
      const parentId = current?.parentId || null;

      if (state.breadcrumbs.length > 0) {
        state.breadcrumbs.pop();
        if (parentId && state.breadcrumbs[state.breadcrumbs.length - 1] !== parentId) {
          state.breadcrumbs.pop();
        }
      }

      await loadFolder(parentId, false);
    } catch (error) {
      ui.setBrowserStatus(`Navigation failed: ${error.message}`);
    }
  },

  onNavigateToCrumb: async (crumbId) => {
    if (!state.session) return;
    try {
      const idx = state.breadcrumbs.indexOf(crumbId);
      if (!crumbId) {
        state.breadcrumbs = [];
        await loadFolder(null, false);
        return;
      }
      if (idx >= 0) {
        state.breadcrumbs = state.breadcrumbs.slice(0, idx + 1);
        await loadFolder(crumbId, false);
      }
    } catch (error) {
      ui.setBrowserStatus(`Breadcrumb navigation failed: ${error.message}`);
    }
  },

  onToggleSelect: (itemId) => {
    if (state.selectedIds.has(itemId)) {
      state.selectedIds.delete(itemId);
    } else {
      state.selectedIds.add(itemId);
    }
    refreshVisibleItems();
  },

  onOpenNode: async (itemId) => {
    const node = state.items.find((item) => item.id === itemId);
    if (!node) return;

    if (node.kind !== 'folder') {
      ui.setBrowserStatus(`Selected item: ${node.name}`);
      if (!state.selectedIds.has(node.id)) {
        state.selectedIds.add(node.id);
      }
      refreshVisibleItems();
      return;
    }

    try {
      await loadFolder(node.id, true);
    } catch (error) {
      ui.setBrowserStatus(`Failed to open folder: ${error.message}`);
    }
  },

  onHandoff: () => {
    const payload = buildHandoffPayload(state);
    persistHandoffPayload(payload);

    window.dispatchEvent(new CustomEvent('pic-v1-handoff', { detail: payload }));
    const previewUrl = `./ui-v1.html?source=pic-v1&provider=${encodeURIComponent(payload.provider || '')}&selected=${payload.selectedCount}`;
    ui.setHandoffStatus(`Handoff ready (${payload.selectedCount} items). Open ${previewUrl} to continue.`);
  }
});

ui.bind();
ui.renderProviderCards(null);
ui.setViewMode(state.viewMode);
ui.setProviderStatus('Select your cloud storage provider.');
ui.setAuthStatus('Waiting for provider selection.');
ui.setBrowserStatus('Connect to load folders/items.');
ui.renderBreadcrumbs([{ id: '', name: 'Root' }]);
refreshVisibleItems();
