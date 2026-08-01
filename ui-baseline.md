# Canonical `ui.html` baseline

`ui.html` is the self-contained canonical application entry point. It retains the registered URI while consolidating the strongest existing behavior into one deployable HTML file.

## Baseline behavior

- Uses an application-specific IndexedDB and local-storage identity.
- Persists folder lists, folder contents, folder state, manifests, and per-image metadata.
- Opens cached folders first and reconciles cloud changes in the background.
- Hydrates cached metadata with a bulk IndexedDB read.
- Extracts pending PNG metadata in bounded worker batches and batches database writes.
- Keeps a bounded, least-recently-used image cache and prefetches adjacent images.
- Performs background metadata work silently so the main image and stack controls remain unobstructed.

## Manual verification

1. Open `ui.html` through its registered application URI and authenticate a cloud provider.
2. Select a folder, confirm its images and stack counts load, and navigate several images.
3. Return to the folder list and reopen the folder; cached content should appear before cloud reconciliation completes.
4. Confirm the lower-right trash control remains unobstructed while metadata extraction and persistence continue.
5. Reload the page and confirm the last folder and cached stack assignments are restored.
