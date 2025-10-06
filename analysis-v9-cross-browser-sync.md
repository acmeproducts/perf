# v9 cross-browser sync diagnosis

## Observed symptoms
- Browser A (1:46–1:48 AM log) applied four stack mutations and two Drive recycle operations.
- Browser A persisted those updates (`manifest:update` and `foldersync:version:bump`) but only advanced the folder version marker to **1**.
- Browser B opened minutes later and hydrated its cache because its locally stored folder state was already at version **1**. As a result, it skipped downloading Browser A's manifest diff and showed the pre-change state.

## Root cause
We only bump a folder's `cloudVersion` monotonically by **+1** from whatever is already in IndexedDB. When two browsers start from the same cached state (version 1) and one of them flushes first, it reuses the same target version (1). The second browser still sees version 1 locally, so it believes nothing has changed and retains stale metadata. The manifest diff never applies until a later flush happens to push version 2+ or a full resync is forced.

In short, the folder version marker is not guaranteed to increase beyond the value other browsers already cached, so peers cannot detect new work.

## Remediation options

### 1. Use strictly increasing timestamps for version markers
- **Change**: Replace the `localVersion + 1` increment in `FolderSyncCoordinator.recordLocalFlush` with `Math.max(Date.now(), existing.cloudVersion + 1)` and persist that value.
- **Pros**: Guarantees each flush produces a unique, increasing version—even across multiple browsers or tabs that share stale values.
- **Cons**: Versions become large timestamps, which may be harder to reason about and could expose clock skew between devices. Requires ensuring server/storage accepts large integers.

### 2. Force remote version bumps when reusing an existing value
- **Change**: Detect when `nextVersion` equals the current remote version and increment again (e.g., `if (nextVersion <= existing.cloudVersion) nextVersion = existing.cloudVersion + 1`).
- **Pros**: Keeps versions as small integers while guaranteeing progress. Minimal schema impact.
- **Cons**: Still depends on the last persisted cloud value—if the provider write silently ignores repeated values, we can regress. Needs defensive handling when provider overwrites the version marker concurrently.

### 3. Derive version from manifest content hash
- **Change**: Hash the pending manifest payload and store that as the version (or pair it with an increment). Peers detect differences even when numeric versions collide.
- **Pros**: Automatically reflects real data changes and avoids relying solely on counters.
- **Cons**: Requires manifest compare logic and storage of hashes. Slightly heavier computation and introduces extra state to sync.

## Recommendation
Option 2 provides the quickest, least invasive fix: enforce `nextVersion > existing.cloudVersion` before pushing the marker. Pair it with an integration test that exercises two browser caches to ensure the second client downloads changes immediately.

## Incremental manifest reconciliation flow
Once a client observes that the remote `cloudVersion` exceeds the cached value, it should request the manifest diff for the version range instead of rehydrating the complete manifest snapshot. The sync worker must:

1. **Fetch the delta** from the sync service that includes additive, mutative, and removal operations since the local version. The request should carry the client's current version so the service can compute the minimal set of changes.
2. **Apply additions and updates** by upserting the affected manifest entries into IndexedDB, honoring server-side timestamps or etags to prevent stale overwrites when multiple diffs land out of order.
3. **Process deletions** by looking for explicit recycle/delete markers in the diff. When a recycle marker appears, the entry must be removed from the local manifest tables and any derived indices (e.g., folder listings, search caches) to ensure the item no longer surfaces in the UI.
4. **Advance the local version** to the remote version supplied alongside the diff after all mutations commit successfully. This guards against partial application; if a transaction fails, keep the pre-existing version to force a retry.

To validate that the incremental application succeeded, query the local manifest store for the keys included in the diff and assert that their state (presence, metadata, deletion) matches the payload. Emit telemetry counters whenever the post-application verification detects discrepancies, when the delta application fails, or when a deletion marker cannot be resolved locally. Additional safeguards include logging the expected versus applied version numbers and alerting when the gap exceeds one, which may indicate missed diffs or out-of-order delivery.
