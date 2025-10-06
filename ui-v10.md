# ui-v10 Launch Checklist

## 1. Authentication & Session Boot
- MSAL boot with drive scopes (Drive/OneDrive) followed by provider switchboard.
- Persist the selected provider + account in session storage for reconnects.
- Populate telemetry envelope with account fingerprint before folder work begins.

## 2. Local Capability Detection
- Evaluate IndexedDB + BroadcastChannel availability; degrade gracefully if missing.
- Prefetch device capabilities (hover vs. touch) to choose interaction affordances.

## 3. Navigation Shell
- Render global chrome (header actions, stack counter tray, selection pill) with skeleton states.
- Mount router that swaps between folder picker, focus mode, grid modal, and export surfaces.

## 4. Persistence Interfaces
- Initialize `OrbitalDbManager` with migrations to v10 schema.
- Bind provider adapters for manifest fetch/push, asset streaming, and recycle bin operations.

## 5. Interaction Wiring
- Attach gesture handlers for stack flicks, counter taps, and helper overlays.
- Register command palette shortcuts and search helper interactions.

## 6. Cloud-Validated Initial Load

### Decision: Staleness-Gated Hydration
The initial render now performs a staleness check before choosing a data source. If the cached
snapshot is fresh (<= 30 seconds old) we reuse it immediately while issuing a background fetch.
Otherwise, the UI blocks on a cloud fetch so the first paint reflects the latest manifest. This
prevents blind IndexedDB hydration when another device has already flushed newer metadata.

### Step-by-Step Flow
- **6.1** `App.enterFolder(folderId)` enters a loading state and requests the cached folder meta
  (`lastSyncedAt`, `cloudVersion`) from IndexedDB.
- **6.2** Run `isCacheFresh(meta)`; if metadata is missing or older than the freshness window,
  mark the cache as stale and skip straight to a blocking cloud fetch.
- **6.3** Kick `provider.fetchFolderManifest(folderId, sinceVersion)` immediately when the cache is
  stale. When the cache is fresh, snapshot the cached manifest and build stacks/counters from that
  data before presenting the folder so the first paint is still cache-validated.
- **6.4** For stale caches, wait for the cloud fetch to resolve, then normalize the payload,
  instantiate stack collections (`in`, `keep`, `maybe`, `trash`), and compute derived ordering. The
  initial on-screen render occurs only after this cloud-confirmed state exists.
- **6.5** For fresh caches, keep the validated cache on screen while the background fetch runs. If
  the remote payload differs, patch stacks, counters, and the stage selection in one commit so the
  user sees an atomic switch from cache-confirmed data to cloud-confirmed data—never a "stale, then
  fix counters" blip.
- **6.6** Persist the reconciled manifest snapshot, stack order, and `lastSyncedAt` timestamp back to
  IndexedDB so subsequent visits can perform the same freshness check quickly.
- **6.7** Publish a BroadcastChannel message (`foldersync:manifest-updated`) so sibling tabs refresh
  without waiting for their own TTL to expire.

This ordering guarantees stack initialization and counter updates source the same cloud-validated
state that will later persist to the cache, eliminating the stale-first render path that previously
showed outdated data.
