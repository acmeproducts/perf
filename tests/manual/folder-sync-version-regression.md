# Folder Sync version regression check

This manual regression script verifies that a local flush updates the cached `cloudVersion` across tabs/devices that share the same IndexedDB cache.

## Prerequisites

1. Build/serve `ui-v9b.html` and sign into the same provider in two browser contexts (Device A and Device B). A second tab in the same browser profile works because it reuses the cache.
2. Select the same folder in both tabs so they point at identical cached data.
3. Open the developer console in both tabs. The UI now exposes `window.__orbitalAppState`, `window.__orbitalFolderSyncCoordinator`, and `window.__orbitalDbManager` for debugging helpers.

## Device B – start the probe

Run the following helper first on Device B. It records the current `cloudVersion`, waits for Device A to broadcast that a flush occurred, and asserts the cached state increased immediately.

```js
(async function foldersyncProbeB(channelName = 'foldersync-version-regression') {
  const coordinator = window.__orbitalFolderSyncCoordinator;
  if (!coordinator) throw new Error('FolderSyncCoordinator is not available. Open a folder first.');
  const folderId = window.__orbitalAppState.currentFolder?.id;
  if (!folderId) throw new Error('Select a folder before running the probe.');
  const context = coordinator.buildContext(folderId);
  const db = window.__orbitalDbManager;
  const beforeState = await db.getFolderState(context);
  const beforeCloud = Number(beforeState?.cloudVersion || 0);
  console.log('[Device B] cloudVersion before flush:', beforeCloud);
  await new Promise((resolve, reject) => {
    const channel = new BroadcastChannel(channelName);
    const timeout = setTimeout(() => {
      channel.close();
      reject(new Error('Timed out waiting for Device A to flush.'));
    }, 8000);
    channel.onmessage = async (event) => {
      if (!event?.data || event.data.type !== 'foldersync:flush-recorded') return;
      if (event.data.folderId !== folderId) return;
      clearTimeout(timeout);
      channel.close();
      const afterState = await db.getFolderState(context);
      const afterCloud = Number(afterState?.cloudVersion || 0);
      console.log('[Device B] cloudVersion after flush:', afterCloud);
      console.assert(afterCloud > beforeCloud, `Expected cloudVersion ${afterCloud} to exceed ${beforeCloud}`);
      resolve();
    };
    channel.postMessage({ type: 'foldersync:probe-ready', folderId });
  });
})().catch((error) => console.error('Device B probe failed:', error));
```

## Device A – perform the flush

Immediately after the probe is running on Device B, execute the following snippet on Device A to trigger a local flush and broadcast the chosen version.

```js
(async function foldersyncProbeA(channelName = 'foldersync-version-regression') {
  const coordinator = window.__orbitalFolderSyncCoordinator;
  if (!coordinator) throw new Error('FolderSyncCoordinator is not available. Open a folder first.');
  const folderId = window.__orbitalAppState.currentFolder?.id;
  if (!folderId) throw new Error('Select a folder before running the probe.');
  const nextVersion = await coordinator.recordLocalFlush(folderId, { timestamp: Date.now() });
  console.log('[Device A] flushed folder version:', nextVersion);
  const channel = new BroadcastChannel(channelName);
  channel.postMessage({ type: 'foldersync:flush-recorded', folderId, nextVersion });
  channel.close();
})();
```

## Expected result

Device B should immediately log a higher `cloudVersion` and the console assertion should pass without throwing. If the assertion fails, the regression fix is broken.
