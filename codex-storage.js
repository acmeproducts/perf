(function (global) {
  const fallbackStore = new Map();
  const subscribers = new Set();

  let mode = 'memory';
  let nativeStorage = null;

  try {
    nativeStorage = global.localStorage;
    if (nativeStorage) {
      const probeKey = `__codexstorage__${Math.random().toString(36).slice(2)}`;
      nativeStorage.setItem(probeKey, '1');
      nativeStorage.removeItem(probeKey);
      mode = 'localStorage';
    }
  } catch (error) {
    nativeStorage = null;
    mode = 'memory';
    console.warn('[CodexStorage] Falling back to in-memory storage due to sandboxed environment.', error);
  }

  function toStringValue(value) {
    if (value === undefined) return 'undefined';
    return value === null ? 'null' : String(value);
  }

  function emitChange(key, newValue, oldValue) {
    const detail = {
      key: key ?? null,
      newValue: newValue ?? null,
      oldValue: oldValue ?? null,
      storageArea: api,
      url: global.location ? global.location.href : ''
    };

    subscribers.forEach(listener => {
      try {
        listener(detail);
      } catch (listenerError) {
        console.warn('[CodexStorage] subscriber failed', listenerError);
      }
    });

    if (mode === 'memory') {
      try {
        const storageEvent = typeof StorageEvent === 'function'
          ? new StorageEvent('storage', detail)
          : new Event('storage');
        if (!(storageEvent instanceof StorageEvent)) {
          Object.assign(storageEvent, detail);
        }
        global.dispatchEvent(storageEvent);
      } catch (eventError) {
        const fallbackEvent = new Event('storage');
        Object.assign(fallbackEvent, detail);
        global.dispatchEvent(fallbackEvent);
      }
    }

    global.dispatchEvent(new CustomEvent('codexstorage:change', { detail }));
  }

  function keyFromFallback(index) {
    const keys = Array.from(fallbackStore.keys());
    return index >= 0 && index < keys.length ? keys[index] : null;
  }

  const api = {
    key(index) {
      if (mode === 'localStorage') {
        return nativeStorage.key(index);
      }
      return keyFromFallback(Number(index));
    },
    getItem(key) {
      if (mode === 'localStorage') {
        return nativeStorage.getItem(key);
      }
      return fallbackStore.has(key) ? fallbackStore.get(key) : null;
    },
    setItem(key, value) {
      const stringValue = toStringValue(value);
      if (mode === 'localStorage') {
        const oldValue = nativeStorage.getItem(key);
        nativeStorage.setItem(key, stringValue);
        emitChange(key, stringValue, oldValue);
        return;
      }
      const oldValue = fallbackStore.has(key) ? fallbackStore.get(key) : null;
      fallbackStore.set(key, stringValue);
      emitChange(key, stringValue, oldValue);
    },
    removeItem(key) {
      if (mode === 'localStorage') {
        const oldValue = nativeStorage.getItem(key);
        nativeStorage.removeItem(key);
        emitChange(key, null, oldValue);
        return;
      }
      const oldValue = fallbackStore.has(key) ? fallbackStore.get(key) : null;
      fallbackStore.delete(key);
      emitChange(key, null, oldValue);
    },
    clear() {
      if (mode === 'localStorage') {
        const hadEntries = nativeStorage.length > 0;
        nativeStorage.clear();
        if (hadEntries) {
          emitChange(null, null, null);
        }
        return;
      }
      const hadEntries = fallbackStore.size > 0;
      fallbackStore.clear();
      if (hadEntries) {
        emitChange(null, null, null);
      }
    },
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    }
  };

  Object.defineProperties(api, {
    length: {
      get() {
        return mode === 'localStorage' ? nativeStorage.length : fallbackStore.size;
      }
    },
    mode: {
      value: mode
    },
    usingFallback: {
      value: mode !== 'localStorage'
    }
  });

  Object.freeze(api);

  global.CodexStorage = api;
  global.dispatchEvent(new CustomEvent('codexstorage:ready', {
    detail: {
      mode,
      usingFallback: api.usingFallback
    }
  }));
})(typeof window !== 'undefined' ? window : globalThis);
