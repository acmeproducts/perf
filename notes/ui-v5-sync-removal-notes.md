# ui-v5 Sync/Manifest/Offline Reference Notes

## Global initialization
- `initApp()` (~L7355-L7418): instantiates `FolderSyncCoordinator` and `SyncManager`, stores them on `state`, exposes them on `window.__orbitalFolderSyncCoordinator`/`window.__orbitalSyncManager`, and immediately starts the sync manager.

## `state.folderSyncCoordinator` touch points
- `SyncManager.recordFolderVersion()` (~L3178-L3194): guards against missing coordinator before calling `recordLocalFlush` on it after successful mutation processing.
- `App.selectProvider()` (~L4204-L4210): forwards the chosen provider context into the folder sync coordinator.
- `App.backToProviderSelection()` (~L4256-L4267): clears provider context on the coordinator when backing out of a provider.
- `App.initializeWithProvider()` (~L4276-L4292): after a folder loads, rebinds the coordinator to the active provider context.
- `App.loadImages()` (~L4309-L4382): captures `const coordinator = state.folderSyncCoordinator;` and, when present, calls `coordinator.prepareFolder(...)` before syncing.
- `App.syncFolderFromCloud()` (~L4445-L4620): uses the coordinator to build/persist manifests, persist folder state, and mark resync flags during cloud refresh logic.
- `App.resetCurrentFolder()` (~L4984-L5013): invokes `state.folderSyncCoordinator?.markRequiresFullResync(...)` before forcing a resync.
- `initApp()` (~L7355-L7418): assigns `state.folderSyncCoordinator` and exposes the instance globally.

## `state.syncManager` touch points
- `App.selectProvider()` (~L4204-L4210): forwards provider context into the sync manager when a provider is chosen.
- `App.backToProviderSelection()` (~L4256-L4264): flushes/stops the sync manager and clears its provider context on exit.
- `App.initializeWithProvider()` (~L4276-L4288): rebinds and restarts the sync manager after folder initialization succeeds.
- `App.returnToFolderSelection()` (~L4788-L4810): flushes pending mutations on folder switch.
- `App.updateUserMetadata()` (~L4868-L4914): queues local metadata changes through `state.syncManager.queueLocalChange(...)` (with optional immediate flush logic).
- `initApp()` (~L7355-L7418): creates `state.syncManager`, stores it globally, and calls `state.syncManager.start()`.

## Manifest helper implementations (`FolderSyncCoordinator`)
- `prepareFolder()` (~L2606-L2699): orchestrates reading local state/manifest, probes remote versions, and decides whether to fetch remote manifests.
- `fetchRemoteManifest()` (~L2703-L2726): wraps provider `loadFolderManifest` calls with logging/error handling.
- `buildManifestFromFiles()` (~L2727-L2747): constructs manifest entry maps from in-memory file lists.
- `persistManifest()` (~L2777-L2794): normalizes and saves manifest records through `DBManager`.
- `persistFolderState()` (~L2795-L2812): upserts folder state metadata in IndexedDB.
- `markRequiresFullResync()` (~L2813-L2820): flags a folder manifest for full resync.
- `applyLocalManifestUpdates()` (~L2821-L2888): updates manifests based on locally changed files and optionally pushes to provider.
- `recordLocalFlush()` (~L2889-L2928): bumps local/remote version markers post-mutation.

## Manifest helper implementations (provider classes)
- `GoogleDriveProvider.loadFolderManifest()` (~L3688-L3732): fetches `.orbital8-state.json`, including fallback behavior.
- `GoogleDriveProvider.getFolderVersion()` (~L3733-L3753): inspects manifest metadata to determine cloud version/manifest file ID.
- `GoogleDriveProvider.saveFolderManifest()` (~L3754-L3802): creates or updates the Drive manifest file and logs duplicates.
- `GoogleDriveProvider.updateFolderVersionMarker()` (~L3803-L3816): updates Drive appProperties or creates manifests when missing.
- `OneDriveProvider.loadFolderManifest()` (~L3954-L3988): retrieves the OneDrive manifest/state files with error handling.
- `OneDriveProvider.getFolderVersion()` (~L3989-L4010): reads OneDrive state file for cloud version information.
- `OneDriveProvider.saveFolderManifest()` (~L4011-L4041): writes manifest/state JSON blobs back to OneDrive special folders.
- `OneDriveProvider.updateFolderVersionMarker()` (~L4042-L4055): updates the OneDrive state file (creating manifests if necessary).

## Offline queue utilities (`SyncManager`)
- `constructor` (~L2924-L2935): initializes `pendingMutations`, debounce timers, and the `offlineQueue` map.
- `start()` / `retryOfflineQueue()` (~L2936-L2997): on activation, drains `offlineQueue`, replays queued mutations, and logs results.
- `enqueueOfflineEntry()` (~L3170-L3184): populates `offlineQueue` buckets keyed by provider/folder and logs queued mutations.
- `updatePendingState()` (~L3195-L3200): recalculates `hasPendingWork` using `offlineQueue` contents.
- `processEntry()` (~L3006-L3076): reprocesses queued entries, re-enqueuing failures back into `offlineQueue`.

## App-level manifest usage
- `App.syncFolderFromCloud()` (~L4445-L4620): after merging cloud data, rebuilds manifest entries via `coordinator.buildManifestFromFiles(...)`, persists them, and updates folder state/manifests (including handling `requiresFullResync`).
- `App.loadImages()` (~L4309-L4382): uses `coordinator.prepareFolder(...)` to decide between cache and cloud fetch before manifest persistence.
