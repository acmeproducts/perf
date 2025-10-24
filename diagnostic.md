# Diagnosis of ui-v5 Regression

## Summary Bullets
- **Coordinator removal without replacement**: `ui-v5.html` disables the legacy `SyncManager` queue while mutation flows still depend on it, leaving no active sync pipeline.
- **Timestamp architecture bloat**: The new folder/item timestamp design adds services (`FolderTimestampService`, extra IndexedDB stores) without delivering the promised simple sync behavior.
- **Incomplete freshness checks**: Folder loads still rely on heavy timestamp comparisons yet fall back to full fetches, creating complex and fragile refresh logic.
- **Inconsistent state reconciliation**: Remote changes and deletions (especially Drive trash) are not deterministically merged, leading to out-of-sync stacks and broken drag/drop ordering.
- **Permanent Drive share links**: `ui-v4.html` hard-codes the reusable template `https://drive.google.com/file/d/${fileId}/view?usp=sharing`, so Drive exports no longer rely on the short-lived `uc?id=…&export=view` downloads.

## Outline of Root Causes
1. **Architecture pivot**
   1.1. Plan.md and Spec.md directed removal of the working coordinator/queue pipeline.
   1.2. `initApp()` nulls out the old `SyncManager`, so queued mutations never flush.
2. **Database changes**
   2.1. New IndexedDB stores for folder timestamps/summaries increase complexity.
   2.2. No straightforward marker guarantees; timestamp reads/writes are inconsistent.
3. **Sync logic regression**
   3.1. Loading relies on timestamp deltas instead of deterministic full refresh.
   3.2. Cloud deletions/trashed files are not reconciled cleanly, leaving orphaned images.
4. **UI/ordering issues**
   4.1. Drag/drop ordering still expects sequential updates from the old pipeline.
   4.2. Stack sequence (`image-id:stack:sequence`) desynchronizes from display order.

# Plan to Rebuild ui-v5 with Simple Sync

1. **Reset baseline**
   - Duplicate `ui-v4.html` into `ui-v5.html` and strip legacy coordinator/queue wiring.
2. **Implement simple merge loader**
   - Replace `App.loadImages()` with deterministic fetch/merge handling defaults to inbox and cleanup of trashed/missing IDs.
3. **Create `SimpleSync` helper**
   - Centralize remote change application and ensure folder timestamp PATCH occurs post-merge.
4. **Simplify IndexedDB**
   - Retain only metadata store and remove timestamp/summary stores introduced for the aborted manifest workflow.
5. **Streamline mutation flows**
   - Update metadata writes to go directly to the provider and resequence stacks immediately after moves/drags.
6. **Harden provider adapters**
   - Ensure Drive adapter filters trashed files, treats missing timestamps as `null`, and always triggers refreshes.
7. **Reinstate drag/drop sequencing**
   - Ensure grid and pointer interactions regenerate sequential `stackSequence` values synchronized with display order.

## Success Criteria
1. Folder refresh performs deterministic merge without relying on coordinator/queue.
2. New images default into the inbox stack tail with correct sequence values.
3. Deleted or trashed Drive files disappear locally on next sync.
4. Drag/drop and move operations immediately resequence stacks and persist metadata.
5. Folder timestamp metadata (`orbital8LastUpdated`) updates after every sync to support cross-device freshness checks.
6. `ui-v5.html` remains functional parity with `ui-v4.html` baseline aside from the simplified sync layer.
