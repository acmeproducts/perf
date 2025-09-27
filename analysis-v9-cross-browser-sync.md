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
