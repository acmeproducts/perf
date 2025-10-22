# spec.md

## Baseline
- Use `ui-v9b.html`’s current multi-screen shell—with repeated `.app-footer` elements per view—as the starting markup and layout.

- Retain the baseline application state that already guards folder exits with `isReturningToFolders`/`navigationToken`, tracks active requests, and exposes the debug-toast preference the operator can toggle.

- Preserve the provider-agnostic helpers that normalize Google Drive URLs, favorites, and tags (the preferred tag normalization behavior).

- Keep the existing toast rendering/gating logic so the debug toggle continues to suppress nonessential notifications when disabled.

- Treat the current grid rendering—which only supports tap selection and lazy loading—as the feature gap to close with drag-and-drop reordering.

- Maintain the SyncActivityLogger baseline implementation before adapting it to the new footer contract.

## Additions
- Port Goji’s release-metadata template (`Templates.masterFooter`) and `Footer.apply()` call so every screen hydrates a consistent footer that already contains the “View Synch Log” and “Reset Cloud” controls; ensure initialization invokes it before other managers spin up.

- Extend shared state with Goji’s `createDefaultGridDragSession`, `grid.dragSession`, and the explicit folder/item timestamp tracking needed for ordering and sync freshness.

- Import Goji’s pointer-based grid reordering pipeline—drag handles, drop-target styling, and persisted sequence updates—to deliver accessible ordering while persisting stack changes.

- Adopt Goji’s `App.getCurrentFolderContext` and context-enforced `DBManager.saveMetadata` so every persistence call carries folder/provider identity and fails fast when context is missing during development.

- Replace the existing sync trigger flow with a simple, deterministic folder-open refresh: each time a folder loads, attempt the timestamp-based refresh first by reading its explicit `folderVersion` and per-item timestamps, fetching only items whose timestamps are newer than the cached copies, and reconciling them immediately without background probes or coordinators, but fall back to the cached folder payload when cloud sync fails or the device is offline; ensure the previous cache-hydration path remains intact so folders still render from IndexedDB without a successful refresh.

- Preserve Goji’s stack-move workflow so sending items to trash (or other stacks) immediately updates the grid, aligning with the expectation that the trash stack opens straight into tile view.

## Changes
- Replace static `.app-footer` blocks with lightweight `[data-master-footer-slot]` placeholders and retarget SyncActivityLogger so it binds to `[data-master-footer]` buttons emitted by the shared footer template.

- Integrate Goji’s drag-handle injection into the grid renderer but omit the filename overlay to avoid the occlusion/interaction regressions noted in Goji.

- Ensure folder navigation stays atomic: keep V9b’s `isReturningToFolders`/`navigationToken` guard, but simplify the surrounding logic so the folder button and search operate independently of sync refreshes.

- Tie metadata refresh exclusively to the new folder-open check; remove any hooks that previously bound background probes, delta coordinators, or deferred queue processing to navigation events.

- Keep the debug-toast toggle semantics while pointing any new footer messaging through the shared footer pipeline, so suppressed toasts are still cleared when the toggle is off.

- Combine Goji’s strict context requirement with V9b’s tolerant IndexedDB writes: rely on `App.getCurrentFolderContext` to supply context, but fall back to V9b’s safe write path when context truly cannot be resolved, preventing silent data loss.

## Deletions
- Remove the duplicated `.app-footer` markup now superseded by the shared template to eliminate inconsistent footer variants.

- Exclude Goji’s filename overlay and hidden `#focus-filename-display` element so pill counters remain interactive and the UI stays unobstructed in focus mode.

- Strip out the heavy sync coordination layer—`FolderSyncCoordinator` delta handlers, background probe queues, pending probe state, and related wiring—so syncing is handled solely by the deterministic folder-open refresh.

## Integration Plan
1. Introduce the master footer template, swap markup placeholders, and retarget SyncActivityLogger to the new footer buttons before initializing the rest of the app shell.

2. Expand shared state with Goji’s drag session fields and timestamp tracking, and bring in `App.getCurrentFolderContext`/context-aware DB writes so later features have the required scaffolding.

3. Replace the grid renderer with Goji’s drag-and-drop workflow (minus the filename overlay) while preserving V9b selection behavior, then persist reorders through `persistGroupDropOrder`.

4. Implement the folder-open sync flow: on every folder entry, compare explicit folder/item timestamps, fetch only new or updated items, and reconcile them immediately without any background queues or probes; ensure the folder button/search UI remains responsive and independent.

5. Validate stack transitions, trash navigation, and toast/debug interactions after removing the filename overlay to confirm pills remain responsive and trash opens instantly.

## Use Cases
1. Every screen renders a single master footer populated via `Footer.apply()`, showing release metadata plus “View Synch Log” and “Reset Cloud” without duplicate buttons.

2. Operators can disable debug toasts and still access footer controls, with toasts remaining suppressed until re-enabled.

3. Users drag grid handles to reorder tiles; drop targets highlight, order persists (and survives reload) because `persistGroupDropOrder` updates metadata and cache.

4. Moving an image to trash updates stacks immediately and entering the trash stack shows the grid without any filename overlay masking the pill counters.

5. Pressing the folder/back button repeatedly only triggers one folder reload; each folder entry runs the timestamp-based refresh but never blocks navigation or issues redundant reloads.

6. Metadata changes made on another device update explicit folder/item timestamps; opening the folder triggers an immediate reconciliation that pulls the new records without relying on provider modification dates, probes, or external coordinators.

## Testing
⚠️ Tests not run (read-only analysis only).
