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
• Replace the init() implementation so it opens a fresh Orbital8-Simple-V10 database with only two stores: folderCache and metadata (indexed by folderId).
• Remove folder-state, manifest, and sync-queue helpers, and simplify clearFolderData to delete cache entries plus per-folder metadata using the new index.
• Add getCachedMetadataForFolder(folderId) and cacheMetadata(fileId, metadata, folderId) helpers that read/write maps of metadata records keyed by fileId.
• Introduce SimpleMetadataManager
• Add the class described in the draft to sit beside the provider classes. It should batch-load metadata from the cloud, translate provider-specific fields into the normalized structure, and expose a default metadata factory enriched with the fields UI features expect (stack, tags, notes, ratings, stack sequence, favorite, extracted metadata placeholder, etc.).
• Implement saveFileMetadata so updates are written back via provider APIs using the same appProperties (Drive) or JSON file (OneDrive) formats already in use.
• Update application state and initialization
• Insert metadataManager: null into state, drop obsolete navigation/sync bookkeeping (navigationToken, sessionVisitedFolders, sync references), and ensure activeRequests is still initialized.
• In selectProvider / initializeWithProvider, instantiate SimpleMetadataManager right after the provider is chosen so every folder load can call into it.
• Trim initApp to stop constructing the removed sync classes while preserving visual cues, haptics, export, metadata extractor, and IndexedDB initialization.
• Replace the folder-loading workflow
• Retire loadImages, syncFolderFromCloud, refreshFolderInBackground, and processAllMetadata in favor of a new loadFolder (or refactored loadImages) that:
• Fetches the file list from the provider via getFilesAndMetadata.
• Merges cached metadata from IndexedDB immediately for instant UI hydration.
• Falls back to SimpleMetadataManager.getDefaultMetadata() (extended with extractedMetadata and status fields) when a file lacks cached values.
• Saves the assembled file array to both RAM (state.imageFiles) and folderCache, then initializes stacks/display exactly as today.
• Triggers a background metadata refresh that re-fetches cloud metadata, updates in-memory structures, persists through cacheMetadata, and re-renders stacks/counts if anything changed.
• Kicks off extractMetadataInBackground so PNG metadata extraction still runs asynchronously.
• Update call sites (initializeWithProvider, resetCurrentFolder, any navigation helpers) to invoke the new loader and remove navigation-token/session bookkeeping tied to the old coordinator flow.
• Revise metadata mutation paths
• Replace App.updateUserMetadata with the cache-first → IndexedDB → cloud implementation from the draft, ensuring it updates state.imageFiles, persists via cacheMetadata/saveFolderCache, calls SimpleMetadataManager.saveFileMetadata, and finally refreshes stack counts.
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
