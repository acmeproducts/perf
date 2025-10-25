# Folder Listing Behavior Checks

## Ordering and Filtering
1. Launch `ui-v5.html` and authenticate with either provider.
2. Visit at least two folders that contain images, then exit back to the folder list.
3. Confirm the folder picker only lists folders with images (any folder exited with zero images should be absent).
4. Verify folders are ordered by the most recently exited folder first. When two folders share the same last-access time, ensure the names are ordered alphabetically (case-insensitive).

## Cached Count Display
1. Reopen a folder that previously displayed images and then exit to the folder list again.
2. Confirm the folder list shows the cached image count next to the folder name (counts remain blank for folders that have never been opened).
3. Refresh the page and reopen the folder picker to ensure cached counts and ordering persist across reloads.
