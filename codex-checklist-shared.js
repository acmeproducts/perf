(function () {
  const STORAGE_PREFIX = 'codexrecall.checklist.';
  const LEGACY_KEY = 'viewer_entries_state_v1';
  const MIGRATION_MARKER = 'codexrecall.viewer.migrated';
  const CodexChecklist = { current: null };

  function createMemoryStorage() {
    const store = new Map();
    return {
      get length() {
        return store.size;
      },
      key(index) {
        const keys = Array.from(store.keys());
        return index >= 0 && index < keys.length ? keys[index] : null;
      },
      getItem(key) {
        return store.has(key) ? store.get(key) : null;
      },
      setItem(key, value) {
        store.set(key, String(value));
      },
      removeItem(key) {
        store.delete(key);
      },
      clear() {
        store.clear();
      }
    };
  }

  function resolveStorage() {
    if (window.CodexStorage) {
      return window.CodexStorage;
    }
    try {
      if (window.localStorage) {
        return window.localStorage;
      }
    } catch (error) {
      console.warn('CodexChecklist: unable to access localStorage, using in-memory storage.', error);
    }
    return createMemoryStorage();
  }

  const storage = resolveStorage();

  function deepClone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      console.warn('CodexChecklist: failed to clone value', error);
      return value;
    }
  }

  function keyFor(owner, repo) {
    return `${STORAGE_PREFIX}${owner}.${repo}`;
  }

  function parseKey(key) {
    if (!key || !key.startsWith(STORAGE_PREFIX)) return null;
    const remainder = key.slice(STORAGE_PREFIX.length);
    if (!remainder) return null;
    const parts = remainder.split('.');
    if (parts.length < 2) return null;
    const [owner, ...repoParts] = parts;
    const repo = repoParts.join('.') || null;
    if (!owner || !repo) return null;
    return { owner, repo };
  }

  function readPayload(key) {
    try {
      const raw = storage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.entries)) {
        return null;
      }
      return {
        savedAt: parsed.savedAt || null,
        entries: parsed.entries
      };
    } catch (error) {
      console.warn('CodexChecklist: failed to read payload for', key, error);
      return null;
    }
  }

  function createSnapshot({ owner, repo, payload, source = null }) {
    const normalizedPayload = {
      savedAt: payload && payload.savedAt ? payload.savedAt : new Date().toISOString(),
      entries: Array.isArray(payload && payload.entries) ? payload.entries : []
    };
    return {
      owner,
      repo,
      key: keyFor(owner, repo),
      source,
      payload: deepClone(normalizedPayload)
    };
  }

  function listAll() {
    const snapshots = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      const info = parseKey(key);
      if (!info) continue;
      const payload = readPayload(key);
      if (!payload) continue;
      snapshots.push(createSnapshot({ ...info, payload, source: 'storage' }));
    }
    snapshots.sort((a, b) => {
      const aTime = Date.parse(a.payload.savedAt || '') || 0;
      const bTime = Date.parse(b.payload.savedAt || '') || 0;
      return bTime - aTime;
    });
    return snapshots;
  }

  function loadChecklist(owner, repo) {
    if (!owner || !repo) return null;
    const payload = readPayload(keyFor(owner, repo));
    if (!payload) return null;
    return createSnapshot({ owner, repo, payload, source: 'storage' });
  }

  function loadLatest() {
    const all = listAll();
    return all.length ? all[0] : null;
  }

  function setCurrent(detail, { dispatchEvent = true, bubble = true } = {}) {
    if (!detail || !detail.owner || !detail.repo) return null;
    const snapshot = createSnapshot({ owner: detail.owner, repo: detail.repo, payload: detail.payload || {}, source: detail.source || null });
    CodexChecklist.current = snapshot;
    if (dispatchEvent) {
      window.dispatchEvent(new CustomEvent('codexrecall:checklist-updated', { detail: snapshot }));
    }
    if (bubble && window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({
          type: 'codexrecall-checklist-updated',
          owner: snapshot.owner,
          repo: snapshot.repo,
          payload: snapshot.payload
        }, '*');
      } catch (error) {
        console.warn('CodexChecklist: unable to post message to parent', error);
      }
    }
    return snapshot;
  }

  function broadcastUpdate(detail) {
    return setCurrent(detail);
  }

  function migrateLegacy() {
    if (storage.getItem(MIGRATION_MARKER)) {
      return null;
    }
    let migrated = null;
    try {
      const raw = storage.getItem(LEGACY_KEY);
      if (!raw) {
        storage.setItem(MIGRATION_MARKER, 'true');
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) {
        storage.removeItem(LEGACY_KEY);
        storage.setItem(MIGRATION_MARKER, 'true');
        return null;
      }
      const owner = 'legacy';
      const repo = 'viewer';
      const key = keyFor(owner, repo);
      if (!storage.getItem(key)) {
        const payload = { savedAt: new Date().toISOString(), entries: parsed };
        storage.setItem(key, JSON.stringify(payload));
        migrated = setCurrent({ owner, repo, payload, source: 'migration' });
      }
      storage.removeItem(LEGACY_KEY);
      storage.setItem(MIGRATION_MARKER, 'true');
    } catch (error) {
      console.warn('CodexChecklist: failed to migrate legacy viewer state', error);
    }
    return migrated;
  }

  function handleStorage(event) {
    if (!event.key) return;
    if (event.key === LEGACY_KEY) {
      migrateLegacy();
      return;
    }
    if (!event.key.startsWith(STORAGE_PREFIX)) return;
    const info = parseKey(event.key);
    if (!info) return;
    const payload = readPayload(event.key);
    if (!payload) return;
    setCurrent({ ...info, payload, source: 'storage' }, { bubble: false });
  }

  window.addEventListener('storage', handleStorage);
  window.addEventListener('message', event => {
    const data = event && event.data;
    if (!data || data.type !== 'codexrecall-checklist-updated') return;
    if (!data.owner || !data.repo || !data.payload) return;
    setCurrent({ owner: data.owner, repo: data.repo, payload: data.payload, source: 'message' }, { bubble: false });
  });

  Object.assign(CodexChecklist, {
    STORAGE_PREFIX,
    LEGACY_KEY,
    keyFor,
    parseKey,
    listAll,
    loadChecklist,
    loadLatest,
    setCurrent,
    broadcastUpdate,
    migrateLegacy
  });

  window.CodexChecklist = CodexChecklist;

  migrateLegacy();
  if (!CodexChecklist.current) {
    const initial = loadLatest();
    if (initial) {
      setCurrent(initial, { dispatchEvent: false, bubble: false });
    }
  }
})();
