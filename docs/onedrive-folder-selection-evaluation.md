# OneDrive Folder Selection Evaluation

## Scope

Compared the OneDrive folder selection approaches in `ui-v3.html`, `ui-v1.html`, and `vid-v1.html` to determine the fastest path with persistence, the fewest user choices, and the least amount of folder scanning. The updated recommendation also applies the same aggressive folder-stat persistence rules to Google Drive so both providers expose concrete counts and freshness information once a folder has been loaded.

## What each version does

### `ui-v3.html`
- Starts from the `Downloads` folder when it exists, otherwise falls back to root.
- Lists immediate child folders under the current parent and lets the user either browse deeper or select a folder directly.
- Persists the last picked folder for quick re-entry.
- Does **not** persist a custom OneDrive root, so users with messy drives are repeatedly exposed to the same higher-level clutter.
- Does **not** pre-scan descendant folders for media, which keeps the initial scan relatively cheap.

### `ui-v1.html`
- Adds a persistent OneDrive root saved in local storage.
- Lets the user choose a level-1 folder, then lists level-2 folders under it.
- Uses cached folder lists for repeated entry.
- Still performs extra per-folder work in level-2 root selection by calling direct media stats and creating virtual entries for folders with direct media.
- That extra inspection reduces clutter somewhat, but it reintroduces scanning overhead that fights the speed goal.

### `vid-v1.html`
- Keeps the same persistent-root model as `ui-v1.html`.
- Adds the same two-stage root selection and caching.
- Persists last-picked folder and folder stats more aggressively, which is the right direction for avoiding repeated blind scans.
- Still performs per-folder direct media inspection when building level-2 options, so the chooser is not minimal-scan.

## Best direction

The best base is **the persistent OneDrive root approach from `ui-v1.html` / `vid-v1.html`, but with the media-inspection step removed and the post-load folder-stat persistence extended to both OneDrive and Google Drive**.

In practical terms, the streamlined method is:

1. **Persist a last-picked folder for both OneDrive and Google Drive.**
2. **Persist folder scan results aggressively after a folder is loaded.**
3. **For OneDrive, support an optional persisted root folder, but do not require a root change workflow.**
4. **Keep normal subfolder browsing in scope for both providers.**
5. **Show a single prominent "Last folder" resume action first.**
6. **Do not scan folders to decide what is relevant during selection.**
7. **Do not compute direct media counts during folder selection.**
8. **Do not generate virtual choices or filtered recommendations.**

This gives the system a simple contract: the user is responsible for picking a sane root, the app only reads the minimum metadata needed to render folders at the current level, and any expensive media scan happens once per chosen folder and is then reused.

## Recommended UX contract

### Default path
- If a persisted last-picked folder exists for the active provider, show `Last folder` as the primary action.
- For OneDrive, if no last-picked folder exists but a persisted root exists, open that root immediately.
- If no provider-specific persistence exists, fall back once to the provider default entry point, then let the user browse subfolders normally.

### Root handling
- A custom root is optional and only matters for OneDrive.
- There is **no requirement** to force the user through a root-change flow.
- If a root-change control exists, it should reuse ordinary folder navigation instead of introducing a separate level-1/level-2 chooser mode.
- Subfolders remain fully in scope whether or not a custom root is set.

### Folder list behavior
- Only request `children` for the current parent.
- Only use folder metadata already returned by OneDrive, such as `name`, `id`, `childCount`, and timestamps, while the chooser is on screen.
- Never inspect each candidate folder for media during selection.
- Never crawl descendants during selection.
- Only scan folder contents after the user explicitly selects a destination folder.

### Persisted scan-result behavior
- After a folder is loaded, persist the scan result for that folder for both OneDrive and Google Drive.
- Store exact media count for the active media type, the folder metadata timestamp used for that scan, and the time the scan was last completed.
- Persist those stats aggressively for the current folder and for browsed subfolders as soon as a trusted scan result is available.
- Use that persisted record to show concrete folder information such as `184 videos`, `metadata updated 3 days ago`, or `scan completed 2 hours ago` instead of vague labels like `media detected`.
- Reuse the persisted count and age indicators in the folder list, last-folder banner, and resume path until the folder metadata indicates the contents may have changed.
- If the folder metadata timestamp changes, mark the persisted count stale and rescan only when the user re-enters that specific folder.

## Why this is the fastest option

### Fewer network calls
- `ui-v3.html` is cheap because it only loads the current parent's children.
- `ui-v1.html` and `vid-v1.html` become more expensive during root selection because they also inspect level-2 folders for direct media.
- Removing that inspection preserves the persistence benefit without paying the scan tax.

### Fewer user decisions
- A persisted last-picked folder eliminates repeat navigation for the common case on both providers.
- An optional persisted OneDrive root can collapse the drive down to the user's chosen working area without making root changes mandatory.
- Persisted scan results let the UI show exact counts and age without asking the user to wait for the same folder or subfolder to be re-evaluated.
- Avoiding "smart" filtering means there are no extra prompts, modes, or synthetic folder choices to interpret.

### Better failure model
- If the user picks a bad root with empty or irrelevant folders, that is visible immediately and easy to fix.
- The app does not waste time trying to protect the user from their own drive structure.

## Final recommendation

**Adopt the `ui-v1.html` / `vid-v1.html` persistence concepts, but simplify them further than either implementation currently does:**

- keep persisted `last folder` for both OneDrive and Google Drive
- keep an optional persisted `OneDrive root`, but do not require root changes
- keep folder-list caching by parent
- persist per-folder scan results after load, including exact media count, metadata-relative freshness, and last scan time, for both providers
- aggressively persist trusted stats for browsed subfolders too
- remove generic `media detected` labels in favor of exact persisted counts and age
- remove level-2 media-stat inspection
- remove virtual root entries
- remove any relevance filtering during selection
- keep normal subfolder browsing in scope
- scan contents only after final folder selection

That combination is the most aligned with the stated priorities: **speed first, minimum choices, minimum friction, minimum scanning**.
