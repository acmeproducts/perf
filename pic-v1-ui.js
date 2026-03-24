import { PROVIDERS } from './pic-v1-providers.js';

const fmtSize = (value) => {
  const size = Number(value || 0);
  if (!size) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let idx = 0;
  let v = size;
  while (v >= 1024 && idx < units.length - 1) {
    v /= 1024;
    idx += 1;
  }
  return `${v.toFixed(v > 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
};

const fmtDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

export const createUi = (elements, handlers) => {
  const bind = () => {
    elements.providerGrid.addEventListener('click', (event) => {
      const card = event.target.closest('[data-provider-id]');
      if (!card) return;
      handlers.onSelectProvider(card.dataset.providerId);
    });

    elements.connectBtn.addEventListener('click', handlers.onConnect);
    elements.disconnectBtn.addEventListener('click', handlers.onDisconnect);
    elements.searchInput.addEventListener('input', (event) => handlers.onSearch(event.target.value));
    elements.sortSelect.addEventListener('change', (event) => handlers.onSort(event.target.value));
    elements.viewToggleBtn.addEventListener('click', handlers.onToggleView);
    elements.upBtn.addEventListener('click', handlers.onNavigateUp);
    elements.handoffBtn.addEventListener('click', handlers.onHandoff);
    elements.crumbs.addEventListener('click', (event) => {
      const crumb = event.target.closest('[data-crumb-id]');
      if (!crumb) return;
      handlers.onNavigateToCrumb(crumb.dataset.crumbId || null);
    });
  };

  const renderProviderCards = (selectedId) => {
    elements.providerGrid.innerHTML = PROVIDERS.map((provider) => `
      <button class="provider-card ${provider.id === selectedId ? 'active' : ''}" data-provider-id="${provider.id}">
        <div class="provider-title">${provider.label}</div>
        <div class="provider-desc">${provider.description}</div>
        <span class="badge">${provider.tier}</span>
      </button>
    `).join('');
  };

  const renderRows = (items, selectedIds) => {
    elements.listView.innerHTML = items.map((item) => `
      <div class="row ${selectedIds.has(item.id) ? 'selected' : ''}" data-item-id="${item.id}">
        <input type="checkbox" ${selectedIds.has(item.id) ? 'checked' : ''} data-select-id="${item.id}" aria-label="Select ${item.name}" />
        <div class="row-main" data-open-id="${item.id}">
          <strong>${item.kind === 'folder' ? '📁' : '🖼️'} ${item.name}</strong>
          <small>${item.path || '/'} · ${fmtSize(item.size)} · ${fmtDate(item.modifiedAt)}</small>
        </div>
        ${item.kind === 'folder' ? `<button class="btn" data-open-id="${item.id}">Open</button>` : '<span></span>'}
      </div>
    `).join('');

    elements.listView.querySelectorAll('[data-select-id]').forEach((input) => {
      input.addEventListener('change', () => handlers.onToggleSelect(input.dataset.selectId));
    });

    elements.listView.querySelectorAll('[data-open-id]').forEach((openButton) => {
      openButton.addEventListener('click', () => handlers.onOpenNode(openButton.dataset.openId));
    });
  };

  const renderCards = (items, selectedIds) => {
    elements.gridView.innerHTML = items.map((item) => `
      <article class="card ${selectedIds.has(item.id) ? 'selected' : ''}" data-card-id="${item.id}">
        <h4 style="margin:0 0 8px;">${item.kind === 'folder' ? '📁' : '🖼️'} ${item.name}</h4>
        <p>${item.path || '/'}</p>
        <p>Size: ${fmtSize(item.size)}</p>
        <p>Modified: ${fmtDate(item.modifiedAt)}</p>
        <div style="display:flex; gap:8px;">
          <button class="btn" data-select-id="${item.id}">${selectedIds.has(item.id) ? 'Deselect' : 'Select'}</button>
          ${item.kind === 'folder' ? `<button class="btn" data-open-id="${item.id}">Open</button>` : ''}
        </div>
      </article>
    `).join('');

    elements.gridView.querySelectorAll('[data-select-id]').forEach((button) => {
      button.addEventListener('click', () => handlers.onToggleSelect(button.dataset.selectId));
    });

    elements.gridView.querySelectorAll('[data-open-id]').forEach((button) => {
      button.addEventListener('click', () => handlers.onOpenNode(button.dataset.openId));
    });
  };

  const renderBreadcrumbs = (crumbs) => {
    elements.crumbs.innerHTML = crumbs.map((crumb) => `
      <button class="crumb" data-crumb-id="${crumb.id || ''}">${crumb.name}</button>
    `).join('');
  };

  const renderSelection = (selectedItems, storageKey) => {
    elements.selectionCount.textContent = `${selectedItems.length} selected`;
    elements.selectionPreview.textContent = selectedItems.length
      ? JSON.stringify({ selected: selectedItems.slice(0, 8), handoffStorageKey: storageKey }, null, 2)
      : 'Select files/folders to build handoff payload.';
  };

  return {
    bind,
    renderProviderCards,
    renderRows,
    renderCards,
    renderBreadcrumbs,
    renderSelection,
    setProviderStatus: (message) => { elements.providerStatus.textContent = message; },
    setAuthStatus: (message) => { elements.authStatus.textContent = message; },
    setBrowserStatus: (message) => { elements.browserStatus.textContent = message; },
    setHandoffStatus: (message) => { elements.handoffStatus.textContent = message; },
    setViewMode: (mode) => {
      const showGrid = mode === 'grid';
      elements.listView.classList.toggle('hidden', showGrid);
      elements.gridView.classList.toggle('hidden', !showGrid);
      elements.viewToggleBtn.textContent = showGrid ? 'List View' : 'Grid View';
    }
  };
};
