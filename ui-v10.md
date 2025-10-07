Proposed plan for ui-v10.md
Goals & guardrails
• Preserve the existing UI, styling, gestures, modals, search, export, and every end-user workflow exactly as they appear in ui-v9b.html. Only the synchronization/data-layer internals may change.
• Deliver the new “RAM → IndexedDB → Cloud” flow so metadata updates feel instant locally, persist across reloads, and reconcile through the cloud for cross-device sorting, including the detailed multi-step scenario outlined in the prompt.
• Update all visible/versioned metadata (comments, footer text, etc.) from v9b to v10 without touching provider selection, authentication, or folder-picking UX.
Implementation steps
• Create the new HTML shell
• Copy ui-v9b.html to ui-v10.html and perform targeted version string updates (including the top-of-file version comment and footer baseline) so the document clearly identifies itself as v10 with the new timestamp.
• Remove legacy sync instrumentation
• Delete the SyncActivityLogger, FolderSyncCoordinator, and SyncManager classes plus the UI hooks that surface the sync log/reset links; these are no longer part of the simplified architecture.
• Strip syncLog, folderSyncCoordinator, and syncManager from the global state definition and eliminate all conditional logging blocks that reference them (e.g., in Core.moveToStack, App.deleteFile, and other workflows).
• Remove the corresponding initialization and teardown paths (initApp, provider navigation, folder reset) that currently wire these classes together.
• Refactor DBManager for the new storage model
• Replace the init() implementation so it opens a fresh Orbital8-Simple-V10 database with only two stores.
  • folderCache (store name `folderCache`, keyPath `folderId`): each record stores `{ folderId, files, lastCloudUpdatedAt, lastCacheUpdatedAt }` where `files` is the exact array rendered on screen.
  • metadata (store name `metadata`, keyPath `folderId`): each record stores `{ folderId, entries }` and `entries` is a map keyed by `fileId` with normalized metadata objects.
• Remove folder-state, manifest, and sync-queue helpers, and simplify clearFolderData to delete cache entries plus per-folder metadata using the new `folderId` index.
• Add getCachedMetadataForFolder(folderId) and cacheMetadata(fileId, metadata, folderId) helpers that read/write the `entries` map with metadata records keyed by fileId.
• Introduce SimpleMetadataManager
• Add the class described in the draft to sit beside the provider classes. It should batch-load metadata from the cloud via `loadFolderMetadata(folderId)` and translate provider-specific fields into the normalized structure described below.
• Ensure the normalized metadata object always exposes `{ stackId, stackSeq, tags: [], notes: '', rating: null, favorite: false, extractedMetadata: null, extractedMetadataStatus: 'idle' }` plus any provider derived fields (`mimeType`, `dimensions`, etc.) that existing UI code references.
• Implement `getDefaultMetadata(file)` to return a fresh copy of the normalized structure seeded with provider hints (e.g., stack inferred from filename) and any cached `extractedMetadata` placeholders.
• Implement saveFileMetadata(fileId, metadata, folderId) so updates are written back via provider APIs using the same appProperties (Drive) or JSON file (OneDrive) formats already in use. The method should also return the normalized metadata that was persisted so callers can refresh UI state.
• Update application state and initialization
• Insert metadataManager: null into state, drop obsolete navigation/sync bookkeeping (navigationToken, sessionVisitedFolders, sync references), and ensure activeRequests is still initialized.
• In selectProvider / initializeWithProvider, instantiate SimpleMetadataManager right after the provider is chosen so every folder load can call into it.
• Trim initApp to stop constructing the removed sync classes while preserving visual cues, haptics, export, metadata extractor, and IndexedDB initialization.
• Replace the folder-loading workflow
• Retire loadImages, syncFolderFromCloud, refreshFolderInBackground, and processAllMetadata in favor of a new loadFolder (or refactored loadImages) that:
• Starts by reading the cached folder record (if present). When `lastCacheUpdatedAt` matches `lastCloudUpdatedAt` we may render immediately from IndexedDB; otherwise call `provider.getFilesAndMetadata(folderId)` to fetch `{ files, metadata, lastCloudUpdatedAt }` before painting anything. The provider must supply `metadata` as a map keyed by `fileId` plus a `lastCloudUpdatedAt` ISO string; if the provider has no native timestamp, generate `new Date().toISOString()` when composing the payload.
• Persist an explicit ISO timestamp for both `lastCloudUpdatedAt` (taken from the provider payload at fetch time) and `lastCacheUpdatedAt` (stamped when we write to IndexedDB) on every `folderCache` record. Never rely on provider “freshness” hints alone.
• During load, parse both timestamps into epoch milliseconds and compare them directly. If `lastCacheUpdatedAt` is missing or differs from `lastCloudUpdatedAt`, treat the cache as stale: render only the freshly fetched cloud metadata, then overwrite the cache with the new payload and timestamps. If the timestamps match exactly, hydrate UI state immediately from IndexedDB and skip the provider call only when we already have the file list in cache.
• Falls back to SimpleMetadataManager.getDefaultMetadata() when a file lacks cloud metadata. Do not substitute potentially stale cache values in this case.
• Saves the assembled file array to both RAM (`state.imageFiles`) and `folderCache` only after confirming the cache snapshot matches what was rendered on screen, then initializes stacks/display exactly as today.
• Eliminates the old “display cache → sync → re-render” loop; the UI must always display the same payload that was verified against the provider before the first paint.
• Triggers a background metadata refresh hook that simply revalidates timestamps and no-ops if they still match. When differences are detected, re-fetch from the cloud, update in-memory structures, persist through cacheMetadata, and re-render stacks/counts.
• Kicks off extractMetadataInBackground so PNG metadata extraction still runs asynchronously.
• Update call sites (initializeWithProvider, resetCurrentFolder, any navigation helpers) to invoke the new loader and remove navigation-token/session bookkeeping tied to the old coordinator flow.
• Revise metadata mutation paths
• Replace App.updateUserMetadata with the cache-first → IndexedDB → cloud implementation from the draft, ensuring it updates state.imageFiles, persists via cacheMetadata/saveFolderCache, calls SimpleMetadataManager.saveFileMetadata, and finally refreshes stack counts. When invoked by background PNG extraction, the extractor should call `cacheMetadata` directly after applying `SimpleMetadataManager.getDefaultMetadata()` merges, then delegate to `saveFileMetadata` so cloud state stays in sync.
• Convert any remaining `DBManager.saveMetadata` call sites into `SimpleMetadataManager.saveFileMetadata` so there is a single persistence path. The DB manager should only manage IndexedDB reads/writes; cloud writes happen exclusively through the metadata manager.
• Ensure every caller that previously awaited state.dbManager.saveMetadata (grid bulk moves, gestures, notes/tags modals, metadata extractor) now routes through the updated method so cached data stays consistent.
• Clean up dependent workflows
• Remove sync-log instrumentation from gesture moves, trash operations, keyboard handlers, etc., but keep functional behavior identical (updates to stacks, toasts, grid syncing).
• Simplify App.deleteFile and returnToFolderSelection so they no longer reference sync components, while still updating the cache, handling abort controllers, and restoring UI state.
• Update DBManager.saveMetadata usages tied to metadata extraction so they either call cacheMetadata with enriched payloads or adjust the method to write to the new schema.
• Confirm Google Drive and OneDrive provider classes no longer expose manifest helpers (loadFolderManifest, saveFolderManifest, etc.) and keep shortcut resolution/download logic intact.
• Documentation & version polish
• Update any inline comments or debug banners that mention Goji/v9 so they reference v10.
• Ensure footers show the new timestamp/version and remove any sync-related buttons or tooltips that are now obsolete.
Validation plan
• Primary cross-device scenario (manual):
• On device A, open a folder, perform the sequence (keep 3, trash 3, maybe 3, send 3 back to inbox, delete next via trash icon, bulk-delete 3 via grid). Confirm the 11th original inbox item now appears first on center stage after closing the grid.
• On device B, open the same folder and verify the initially displayed image matches the original 11th item, then move one image to Keep, one to Maybe, one to Trash, delete two more, close the folder.
• Return to device A, reopen the folder, and confirm the center-stage image corresponds to the original 15th entry, demonstrating cloud reconciliation.
• Regression sweeps:
• Spot-check authentication, folder browsing, gesture sorting, grid interactions, modal editing, bulk actions, search/filtering, export, and focus mode to ensure no UI regressions.
• Reload folders after metadata edits to verify cache hits show immediate results and background refreshes toast when updates arrive.
• Confirm PNG metadata extraction still populates details after load.
• Validate IndexedDB (folderCache/metadata) contents via DevTools to ensure the three-layer flow persists data as expected.
Testing
• ⚠️ Not run (QA review only; plan stage)
6.4 and 6.5 need more work do not display then sych then update displayed counters. 2 options 1. staleness check of cache vs cloud , if stale load/display cloud, display, else display cache 2. load/display cloud @codex never display potentially stale data

Issues
• Plan Step 6 still displays cached metadata before confirming freshness
• The current plan (items 6.4–6.5) explicitly hydrates the UI from IndexedDB and only later refreshes from the cloud, which violates the new requirement to “never display potentially stale data.” We need to either validate cache freshness before rendering or always render cloud data first, as outlined in the two options you provided.
Suggested taskRevise Step 6 to prevent stale metadata from rendering
