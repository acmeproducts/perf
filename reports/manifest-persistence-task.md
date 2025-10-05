# Suggested Task: Stabilize manifest persistence across index and UI variants

## Summary
Navigation away from an active folder aborts in-flight manifest saves because `App.syncFolderFromCloud` reuses `state.activeRequests` for persistence while `App.returnToFolderSelection` calls `abort()` on the same controller. This leaves the remote `.orbital8-state.json` stale, so other devices observe the "0 folder" condition and never receive new queue entries.

## Scope
- index.html
- ui-v1.html
- ui-v2.html
- ui-v3.html
- ui-v4.html
- ui-v4a.html
- ui-v5.html
- ui-v6.html
- ui-v7.html
- ui-v8.html
- ui-v9.html
- ui-v9a.html
- ui-v9b.html
- ui-v10.html
- ui-v11.html

## Task Checklist
1. In each file's `App.syncFolderFromCloud`, stop passing `state.activeRequests?.signal` to `state.provider.saveFolderManifest`; use a dedicated `AbortController` for manifest persistence or omit the signal entirely so navigation aborts do not cancel the write.
2. Refactor `App.returnToFolderSelection` so aborting navigation requests does not touch the manifest controller. If a dedicated controller is used, wait for the save to resolve or explicitly leave it untouched when resetting UI state.
3. Update the `catch` blocks around manifest saves to distinguish genuine provider failures from intentional navigation aborts. Only set `manifestRequiresRescan = true` when the provider call fails, not when the manifest controller was explicitly cancelled by the user.
4. Add inline comments noting that manifest persistence must survive folder exits to prevent the "0 folder" state across devices.
5. Manually verify that leaving a folder during sync still results in the manifest being updated on Google Drive/OneDrive and that subsequent launches do not trigger a forced rescan.
