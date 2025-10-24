# Diagnostic & Implementation Blueprint for `ui-v5`

`ui-v5.html` now mirrors the clean visual baseline, but the sync layer still reflects the heavyweight queue/coordinator era. This document captures the actionable delta required to satisfy the new product requirements:

* Deterministic drag-and-drop ordering with `image-id:stack:sequence` updated for every mutation.
* Fast folder switching backed by IndexedDB + in-memory caches that use bespoke timestamps to determine freshness.
* Cloud parity for Google Drive ("trashed"), OneDrive, and any future providers by syncing metadata across RAM, IndexedDB, and remote APIs.
* Inbox append semantics (new images land at the tail of the inbox stack) and recycle-bin behavior that simply toggles the Drive `trashed` flag.
* Elimination of dead code that belonged to the removed queue/coordinator pipeline so the page stays approachable for follow-up sessions.

---

## 1. Retire the legacy queue/coordinator stack

**Delete** the following blocks from `ui-v5.html`:

1. The entire `SyncActivityLogger` class (`rg "class SyncActivityLogger"`).
2. The entire `SyncManager` class (`rg "class SyncManager"`).
3. The `FolderSyncCoordinator` class and any helper enums/constants declared alongside it.
4. Any footer/menu wiring that references `sync-log`, `syncButton`, or `window.__orbitalSyncLogger`.
5. Instantiation lines inside `initializeServices()` and the global `state` object that set `state.syncManager`, `state.folderSyncCoordinator`, or `state.syncLog`.

The new flow will not enqueue mutations; everything becomes immediate metadata writes paired with timestamp updates.

---

## 2. Introduce timestamp-driven freshness tracking

**Add** the `TimestampAuthority` implementation immediately above the existing `const state = { ... }` declaration:

```js
class TimestampAuthority {
    constructor() {
        this.folderTimestamps = new Map();
        this.itemTimestamps = new Map();
    }
    hydrateFromCache(cache) {
        cache?.folders?.forEach(({ id, updatedAt }) => this.folderTimestamps.set(id, updatedAt));
        cache?.items?.forEach(({ id, updatedAt }) => this.itemTimestamps.set(id, updatedAt));
    }
    recordFolderUpdate(folderId, updatedAt) {
        this.folderTimestamps.set(folderId, updatedAt);
    }
    recordItemUpdate(itemId, updatedAt) {
        this.itemTimestamps.set(itemId, updatedAt);
    }
    needsFolderRefresh(folderId, incomingStamp) {
        const current = this.folderTimestamps.get(folderId) ?? 0;
        return !incomingStamp || incomingStamp > current;
    }
    needsItemRefresh(itemId, incomingStamp) {
        const current = this.itemTimestamps.get(itemId) ?? 0;
        return !incomingStamp || incomingStamp > current;
    }
    export() {
        return {
            folders: Array.from(this.folderTimestamps, ([id, updatedAt]) => ({ id, updatedAt })),
            items: Array.from(this.itemTimestamps, ([id, updatedAt]) => ({ id, updatedAt }))
        };
    }
}
```

**Change** the `state` object to include:

```js
state: {
    ...,
    timestampAuthority: new TimestampAuthority(),
    cachedFolderEntries: new Map(),
    cachedStacksByFolder: new Map(),
}
```

**Change** `initializeServices()` so that after IndexedDB warm-up it calls:

```js
const cachedTimestamps = await state.dbManager?.loadTimestampSnapshot();
state.timestampAuthority.hydrateFromCache(cachedTimestamps);
```

**Add** `loadTimestampSnapshot()` and `saveTimestampSnapshot()` helpers to the IndexedDB layer (`rg "class DBManager"`) that read/write a new object store named `timestamps`. This store should contain two records keyed by `'folders'` and `'items'`, each storing the arrays returned by `TimestampAuthority.export()`.

**Change** the folder load pipeline (`App.loadFolderManifest` and the block in `App.refreshFolderContents`) to:

1. Read `incomingFolderUpdatedAt` from the provider manifest (`file.appProperties?.orbital8FolderUpdatedAt` for Drive, the bespoke field for other providers).
2. Call `state.timestampAuthority.needsFolderRefresh(folderId, incomingFolderUpdatedAt)` to decide between cached data and remote fetch.
3. After applying remote changes, invoke `state.timestampAuthority.recordFolderUpdate(folderId, Date.now())` and persist `timestampAuthority.export()` via the new IndexedDB helper.

---

## 3. Fast folder switching and cache wiring

**Add** a lightweight cache wrapper below `TimestampAuthority`:

```js
class FolderCache {
    constructor() {
        this.folders = new Map();
    }
    hydrate(cacheEntries) {
        cacheEntries?.forEach(entry => this.folders.set(entry.folderId, entry));
    }
    remember(folderId, payload) {
        this.folders.set(folderId, { folderId, payload, cachedAt: Date.now() });
    }
    get(folderId) {
        return this.folders.get(folderId);
    }
    invalidate(folderId) {
        this.folders.delete(folderId);
    }
}
```

**Change** the `state` object to reference `folderCache: new FolderCache()` and prehydrate it from IndexedDB (`state.dbManager?.loadFolderCache()`), mirroring the timestamp hydration.

**Change** `App.loadImages()` (search for `async loadImages(`) so that it first consults `state.folderCache.get(state.currentFolder.id)` and renders cached payloads synchronously. Only when `TimestampAuthority.needsFolderRefresh` returns `true` should the remote provider be invoked.

**Change** the folder navigation handler (`App.switchFolder` or the click handler registered on `.folder-button`) to:

1. Abort any in-flight fetch via `state.activeRequests?.abort()`.
2. Use cached data when available for optimistic UI.
3. After remote merge, update `folderCache.remember(folderId, payload)` and flush the snapshot to IndexedDB.

**Add** `FolderCache` persistence alongside the timestamps (new object store `folderCache` with JSON payloads keyed by folderId).

---

## 4. Stack sequencing and drag & drop guarantees

**Change** the utilities around sequencing (`rg "stackSequence"`) as follows:

1. **Change** `App.resequenceStack()` (search for `operationType: 'stack:resequence'`) to delegate to a shared helper:
   ```js
   function resequenceStackEntries(entries) {
       return entries
           .sort((a, b) => (a.stackSequence ?? 0) - (b.stackSequence ?? 0))
           .map((entry, index) => ({ ...entry, stackSequence: index + 1 }));
   }
   ```
   Place the helper near the other utility functions at the bottom of the script.
2. **Change** each mutation (`stack:move`, `stack:resequence`, inbox append, recycle move) to use `resequenceStackEntries` before calling `App.updateUserMetadata`. Persist the updated order both in RAM (`state.imagesById`, `state.currentImages`) and IndexedDB caches.
3. **Add** a new metadata flag `appProperties.orbital8SequenceEpoch` (Drive) / `metadata.sequenceEpoch` (other providers) updated with `Date.now()` whenever the helper runs. Use this timestamp inside `TimestampAuthority.recordItemUpdate` so drag/drop updates propagate to other devices.
4. **Change** the drag handlers at lines ~6390–6470 so that `pointerup` or `drop` events call a new `commitDragResult({ fileId, targetStack, targetIndex })` helper. This helper must:
   - Compute the resequenced list for the target stack.
   - Call `App.updateUserMetadata(fileId, { stack: targetStack, stackSequence: computedSequence, sequenceEpoch: Date.now() })`.
   - Call `state.timestampAuthority.recordItemUpdate(fileId, Date.now())` and persist timestamps immediately.

---

## 5. Inbox append & recycle bin semantics

**Change** the upload completion handler (`rg "handleUploadComplete"`) so that new images are inserted by:

```js
const inboxEntries = state.currentImages.filter(img => img.stack === 'inbox');
const resequenced = resequenceStackEntries([...inboxEntries, newImage]);
const appendedImage = resequenced.find(entry => entry.id === newImage.id);
await App.updateUserMetadata(appendedImage.id, {
    stack: 'inbox',
    stackSequence: appendedImage.stackSequence,
    sequenceEpoch: Date.now()
}, { operationType: 'stack:append' });
```

**Change** delete/recycle flows (`rg "stack:move'"` and the Drive adapter method `trashFile`) to:

1. Pass `{ trashed: true }` to Google Drive's `files.update` call instead of removing metadata.
2. Record the move locally as `stack: 'recycle'` and resequence the recycle stack using the helper above.
3. Touch the timestamp authority for the deleted image.

---

## 6. Provider adapters & metadata synchronization

**Change** Google Drive provider functions (`rg "DriveProvider"`) to:

* Include `appProperties.orbital8SequenceEpoch` and `appProperties.orbital8FolderUpdatedAt` when serializing metadata.
* Ensure `listFiles` filters out files where `trashed === true` unless the caller explicitly requests the recycle stack.
* When mapping Drive files, expose `updatedAt` by taking `Number(file.appProperties?.orbital8SequenceEpoch) || Number(file.modifiedTime) || 0` and feed it into `TimestampAuthority.needsItemRefresh`.

**Change** OneDrive and other providers to provide equivalent fields (`file.sequenceEpoch`, `folder.updatedAt`) and pass them to the timestamp authority.

**Add** a shared helper `applyProviderDelta({ folderId, incomingFiles, source })` that:

1. Filters files using `TimestampAuthority.needsItemRefresh`.
2. Normalizes them into `{ id, stack, stackSequence, sequenceEpoch, updatedAt }` payloads.
3. Applies resequencing per stack before committing to IndexedDB and RAM.
4. Calls `timestampAuthority.recordItemUpdate` for each accepted file and persists the snapshot.

---

## 7. Prune dead UI affordances

**Delete** the following from the DOM templates in `ui-v5.html`:

* Any modal, button, or menu item whose sole purpose was displaying sync queue/log state (`data-footer-role="sync-log"`, `.footer-link.sync-log`).
* Redundant progress indicators tied to the old queue (`#sync-queue-length`, `queueBadge`).
* Debug-only banners such as `sync-status-bar` that are now replaced by real-time metadata commits.

---

## 8. Persist everything deterministically

**Add** an event-driven `flushTimestampSnapshot()` that is invoked by the same mutation points that update timestamps (drag/drop commits, inbox appends, recycle moves, provider delta merges) and also on `visibilitychange`. Avoid background timers—each call should be chained off the completion promise of the triggering action so persistence finishes deterministically.

**Change** the `beforeunload` handler to await the in-flight flush promise (if any) so pending timestamp writes complete before the tab closes.

---

## 9. Regression checklist for future sessions

* Drag-drop between stacks updates `stackSequence`, `sequenceEpoch`, and timestamps.
* Uploading a file appends it to the inbox stack tail, with resequenced ordering.
* Moving to recycle toggles Drive `trashed` and resequences the recycle stack.
* Switching folders uses cached payloads, fetching from the network only when timestamps demand it.
* IndexedDB mirrors RAM state for `images`, `folderCache`, and `timestamps` so reloads are instant.
* No references to `SyncManager`, `FolderSyncCoordinator`, or `SyncActivityLogger` remain.

Following this checklist ensures a fresh session can open `diagnostic.md`, apply the explicit add/change/delete instructions above, and evolve `ui-v5.html` to the desired sync architecture without sifting through dead code.
