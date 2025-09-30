# Index Score Compliance Scorecard

## Executive Summary
- Search pipeline covers core tokenization flows but still omits created/modified timestamps, blocking full Section 2.1 compliance.
- Grid modal cannot reliably close when persistence fails, which disrupts multiple Operational and Sync workflows.
- Manifest guarding logic is absent, so cross-device version monotonicity cannot be guaranteed.

## Orbital8 Atomic Checklist
| Metric | Count |
|--------|-------|
| Pass (+1) | 10 |
| Fail (-1) | 4 |
| Undetermined (0) | 158 |
| **Total Score** | **6** |

| Requirement | Status | Score | Notes |
|-------------|--------|-------|-------|
| 1.1.1 Hub double-tap toggles focus mode on and off | ✅ Pass | +1 | Double-tap gesture toggles focus mode via `handleEnd` when hub press criteria are met.【F:index.html†L4294-L4338】 |
| 1.1.2 Focus toggle ignores stray taps in triangular dead zones and never advances two images unintentionally | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 1.1.3 Stack switcher button remains functional while Quick Move logic is active | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 1.1.4 Details button remains functional while Quick Move logic is active | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 1.1.5 Folder button remains functional while Quick Move logic is active | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 1.1.6 Favorites control remains functional while Quick Move logic is active | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 1.1.7 Trash can icon remains functional while Quick Move logic is active | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 1.1.8 Stack navigation produces no regressions after Quick Move integration | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 2.1.1 Search index includes image filenames | ✅ Pass | +1 | Search token builder appends file names before normalization.【F:index.html†L3432-L3438】 |
| 2.1.2 Search index includes created timestamps | ❌ Fail | -1 | Created timestamps never join the search tokens, preventing date-based queries.【F:index.html†L3432-L3448】 |
| 2.1.3 Search index includes modified timestamps | ❌ Fail | -1 | Modified timestamps are omitted from the search payload, so last-edit searches fail.【F:index.html†L3432-L3448】 |
| 2.1.4 Search index includes assigned tags | ✅ Pass | +1 | Assigned tags are appended to the token array for lookup.【F:index.html†L3432-L3437】 |
| 2.1.5 Search index includes image notes | ✅ Pass | +1 | Image notes flow into the token array, making them searchable.【F:index.html†L3432-L3439】 |
| 2.1.6 Search index includes parsed metadata fields | ✅ Pass | +1 | Recursive metadata collector feeds extracted metadata fields into the search string.【F:index.html†L3412-L3429】 |
| 2.1.7 Search index includes PNG embedded text (zTXt or similar) | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 2.2.1 Query parsing applies #modifier tokens before positive terms | ✅ Pass | +1 | Modifier terms are applied before other filters during search.【F:index.html†L3455-L3484】 |
| 2.2.2 Query parsing applies positive inclusion terms after modifiers | ✅ Pass | +1 | Positive inclusions filter after modifiers are processed.【F:index.html†L3486-L3489】 |
| 2.2.3 Query parsing applies exclusion terms after positive terms | ✅ Pass | +1 | Exclusion terms execute after inclusions to remove matches.【F:index.html†L3491-L3494】 |
| 2.2.4 Grid view and stage remain synchronized after search filtering | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 2.2.5 Search results maintain stage ordering when filters apply | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 2.2.6 Search results expose #favorite items when requested | ✅ Pass | +1 | #favorite modifier exposes favorited images as expected.【F:index.html†L3470-L3473】 |
| 2.2.7 Search selections remain active until the search pill is cleared | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 2.3.1 Desktop users can click modifier buttons without closing the helper automatically | ❌ Fail | -1 | Modifier buttons immediately call `closeHelper`, collapsing the overlay on click.【F:index.html†L5224-L5231】 |
| 2.3.2 Helper overlay can be repositioned by the user | ❌ Fail | -1 | Search helper logic only toggles visibility; no drag handlers exist to reposition the overlay.【F:index.html†L5153-L5236】 |
| 2.3.3 Helper overlay can be dismissed intentionally via close control | ✅ Pass | +1 | Close button invokes `closeHelper` to dismiss the overlay intentionally.【F:index.html†L5217-L5221】 |
| 2.3.4 Helper overlay no longer collides with the favorites control | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 2.4.1 Tag input text renders in black by default | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 2.4.2 Assigned tags display as removable chips above the input in the details view | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 2.4.3 Assigned tags display as removable chips above the input in the bulk edit view | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 2.4.4 Recently used tags appear as removable chips below the input in the details view | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 2.4.5 Recently used tags appear as removable chips below the input in the bulk edit view | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 2.4.6 Tag entry instantly propagates new tags to assigned lists without extra confirmation steps | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 2.4.7 Tagging UI in details view matches the bulk edit layout and behavior | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 2.4.8 Non-hash tags entered are automatically prepended with `#` before assignment | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 3.1.1 Focus mode displays only a heart icon (no surrounding circular button) | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 3.1.2 Unselected favorite icon renders with a gray outline/fill per spec | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 3.1.3 Selected favorite icon renders filled red per spec | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 3.1.4 Favorite icon hit box enables easy click or tap without exposing additional chrome | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 3.1.5 Clicking or tapping the favorite icon updates metadata immediately | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 3.1.6 Favorite flag persists between sessions | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 3.1.7 Favorite flag is searchable via the `#favorite` token | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 4.1.1 Export operates entirely from local state without server round-trips | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 4.1.2 Export UI shows a running success counter | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 4.1.3 Export UI shows a running failure counter | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 4.1.4 Export UI omits scrolling log transcripts | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 4.2.1 Details modal is draggable | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 4.2.2 Details modal is resizable | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 4.2.3 Details modal double-click resets to max/full-screen state | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 4.2.4 Grid modal is draggable | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 4.2.5 Grid modal is resizable | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 4.2.6 Grid modal double-click resets to max/full-screen state | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 4.2.7 Bulk tagging view shows tag chips immediately upon entry without extra confirmation | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.1.1 In-memory LRU cache backs recent resources | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.1.2 IndexedDB warm cache stores folder contents | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.1.3 IndexedDB warm cache stores metadata records | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.1.4 IndexedDB warm cache stores sync queue entries | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.1.5 IndexedDB warm cache stores PNG text payloads | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.1.6 IndexedDB warm cache stores sync metadata | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.1.7 Cloud fetch layer hydrates from remote storage | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.1.8 UI updates optimistically reflect staged changes before remote confirmation | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.1.9 Background sync worker unifies sync operations | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.2.1 Metadata edits debounce at approximately 750 ms per file | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.2.2 Sync batches metadata updates per file before commit | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.2.3 Inline blob workers handle metadata extraction or heavy sync tasks | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.2.4 Lifecycle flush handshake coordinates start/finish of sync flushes | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.2.5 OneDrive adapter performs GET–merge–PUT upserts for manifests and metadata | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.2.6 PNG zTXt blocks are inflated to recover embedded prompts | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.2.7 Periodic eviction metrics are emitted for cache health | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.2.8 UI “no-touch” surfaces remain unaffected during sync operations | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 5.3.1 Every manifest flush publishes a new version higher than the remote marker prior to persistence | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 6.1.1 Console helper returns a shareable JSON diagnostic report | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 6.1.2 Toast notifications coordinate with SyncDiagnostics execution | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 6.1.3 Footer includes a log button to open diagnostics on mobile without dev tools | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 7.1.1 Provider selection screen retains original layout and behavior | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 7.1.2 Authentication flow retains original layout and behavior | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 7.1.3 Folder chooser retains original layout and behavior | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 7.1.4 Overall look and feel remain within personal-scale scope | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 7.2.1 Header comment documents release timestamp, version, and change summary | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 7.2.2 Footer mirrors header metadata for release timestamp, version, and change summary | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 8.1.1 Image display uses permanent URLs | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 8.1.2 Thumbnail display uses permanent URLs | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 9.1.1 Headless core exposes reusable state and component primitives | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 9.1.2 Progressive disclosure interface is available via shell switcher | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 9.1.3 Integrated dashboard interface is available via shell switcher | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 9.1.4 Task modes interface is available via shell switcher | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 9.1.5 Casual “Tinder” interface is available via shell switcher | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 9.1.6 Guided assistant interface is available via shell switcher | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.1.1.1 OneDrive provider option is available | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.1.1.2 Google Drive provider option is available | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.1.1.3 Selecting OneDrive begins the proper auth flow | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.1.1.4 Selecting Google Drive begins the proper auth flow | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.1.2.1 OneDrive authentication completes successfully | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.1.2.2 Google Drive authentication completes successfully | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.1.3.1 Folder picker displays available folders after auth | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.1.3.2 User can choose a folder containing multiple images | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.1.3.3 Selected folder metadata loads into the app state | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.1.1 Inbox stack displays images assigned to "In" | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.1.2 Flick gesture moves image into Inbox stack correctly | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.1.3 Tap gesture selects image in Inbox stack correctly | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.1.4 Click gesture selects image in Inbox stack correctly | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.2.1 Keep stack displays images assigned to "Keep" | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.2.2 Flick gesture moves image into Keep stack correctly | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.2.3 Tap gesture selects image in Keep stack correctly | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.2.4 Click gesture selects image in Keep stack correctly | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.3.1 Maybe stack displays images assigned to "Maybe" | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.3.2 Flick gesture moves image into Maybe stack correctly | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.3.3 Tap gesture selects image in Maybe stack correctly | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.3.4 Click gesture selects image in Maybe stack correctly | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.4.1 Trash stack displays images assigned to "Trash" | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.4.2 Flick gesture moves image into Trash stack correctly | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.4.3 Tap gesture selects image in Trash stack correctly | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.4.4 Click gesture selects image in Trash stack correctly | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.4.5 Trash can icon moves current image to provider recycle bin | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.4.6 After trashing, next image in stack displays automatically | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.4.7 If no images remain, app displays "No more images" message | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.5.1 Users can navigate from Inbox to Keep stack | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.5.2 Users can navigate from Inbox to Maybe stack | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.5.3 Users can navigate from Inbox to Trash stack | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.5.4 Users can navigate from Keep to Inbox stack | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.5.5 Users can navigate from Keep to Maybe stack | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.5.6 Users can navigate from Keep to Trash stack | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.5.7 Users can navigate from Maybe to Inbox stack | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.5.8 Users can navigate from Maybe to Keep stack | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.5.9 Users can navigate from Maybe to Trash stack | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.5.10 Users can navigate from Trash to Inbox stack | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.5.11 Users can navigate from Trash to Keep stack | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.5.12 Users can navigate from Trash to Maybe stack | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.6.1 Flick upward within current stack behaves as specified | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.6.2 Flick downward within current stack behaves as specified | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.6.3 Flick left within current stack behaves as specified | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.6.4 Flick right within current stack behaves as specified | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.6.5 Tap within current stack behaves as specified | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.6.6 Click within current stack behaves as specified | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.7.1 Clicking hub toggles focus mode per spec | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.2.7.2 Tapping hub toggles focus mode per spec | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.3.1 Tapping inactive stack counter activates that stack | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.3.2 Activating a new stack marks previous stack inactive | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.3.3 Activating a new stack updates stage display to first image of that stack | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.3.4 Tapping active stack counter opens grid modal | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.3.5 Grid modal auto-selects first image when opened from stack counter | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.3.6 Selecting stack counter inside grid selects all images in that stack | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.3.7 Selection pill updates counts when all images selected | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.3.8 Clearing selection pill deselects all images and updates counts accordingly | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.4.1 Search helper shows no chips (text only interface) | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.4.2 Selecting a special item like `#favorite` appends term and closes helper | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.4.3 Helper close "X" button cancels operation successfully | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.4.4 Helper reopens when user clicks information icon again | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.4.5 Zero results show stack counter = 0 | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.4.6 Zero results show items selected pill = 0 | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.4.7 Zero results show no images in grid | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.4.8 Successful search pre-selects matching images with blue outline | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.4.9 Items selected pill updates to number of matched images | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.4.10 Searching `#` alone yields zero-results state until term matches tag or special selection (e | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.5.1 Tag modal line 1 displays text "Assigned Tags" | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.5.2 Tag modal line 2 displays assigned tag chips with removal "x" | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.5.3 Tag modal line 3 provides entry field with hint "Enter tags separated by commas | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.5.4 Tag modal auto-prepends `#` for tags lacking prefix upon Enter | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.5.5 Tag modal line 4 displays text "Recently Used Tags" | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.5.6 Tag modal line 5 displays recently used tag chips with removal "x" | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.5.7 All tag modal text input renders black text | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 10.5.8 Tag modal layout and behavior identical between details tab and bulk tab | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 11.1.1 Authenticated launch restores the most recently opened folder view with correct stack context | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 11.1.2 Navigating between stacks updates stage, grid, and counters without desync | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 11.1.3 Applying search filters updates visible items while preserving selection and focus state | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 11.1.4 Editing metadata (tags, notes, favorites) reflects immediately in both stage and grid views | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 11.1.5 Exporting selected items succeeds without interfering with ongoing browsing actions | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 11.1.6 Closing and reopening the app preserves pending changes and resumes normal operation seamlessly | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 11.2.1 Device A commits metadata and ordering changes for a folder before Device B opens it for the first time, and Device B loads those changes on initial entry | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 11.2.2 Device B's first session caches folder metadata without preventing subsequent updates from Device A | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 11.2.3 Additional metadata or ordering changes made on Device A after Device B's initial visit are persisted to the shared manifest | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 11.2.4 When Device B re-enters the same folder, it refreshes metadata, sort order, and deletions to match Device A's latest state | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |
| 11.2.5 Device B surfaces conflicts or sync errors when expected updates from Device A cannot be applied automatically | ⚪ Undetermined | +0 | Not evaluated during this review window; additional manual validation required. |

## Operational Validation Test Plan
| Metric | Count |
|--------|-------|
| Pass (+1) | 0 |
| Fail (-1) | 3 |
| Undetermined (0) | 78 |
| **Total Score** | **-3** |

| Requirement | Status | Score | Notes |
|-------------|--------|-------|-------|
| 1.1 Authenticate with the selected storage provider. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 1.2 Choose a parent folder and drill into a child folder that contains multiple images (OneDrive). | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 1.3 Choose a folder that contains multiple images (Google Drive). | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 1.4 Load the folder and confirm the first image appears on the main stage in the **In** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 2.1 Confirm the initial sort order of the **In** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 2.2 Flick Image 1 upward into the **Keep** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 2.3 Flick Image 2 to the right into the **Maybe** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 2.4 Flick Image 3 downward into the **Trash** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 2.5 Flick Image 4 to the left to return it to the **In** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 2.6 Open the **In** stack grid view. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 2.7 Enter Focus Mode from the grid. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 2.8 Swipe left three times (advancing forward through images). | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 2.9 Exit Focus Mode. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 2.10 Navigate sequentially to the **Keep**, **Maybe**, **Trash**, and back to the **In** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 2.11 Re-enter Focus Mode from the **In** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 2.12 Swipe right four times (navigating backward). | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 2.13 Press the delete control twice to remove two images while in Focus Mode. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 2.14 Exit Focus Mode. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.1 Open the Details panel for the current image. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.2 Switch to the **Tags** tab. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.3 Create a new tag and verify the input renders black text. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.4 Apply an existing tag from the "Tags in this Folder" list. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.5 Remove a tag that was just applied. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.6 Switch to the **Notes** tab. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.7 Enter a note and verify the text renders in black. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.8 Set Quality and Content ratings to three stars. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.9 Change both ratings to five stars. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.10 Change Quality to one star. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.11 Switch to the **Info** tab and confirm the filename link opens the source image in a new tab. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.12 Verify date, time, and size metadata render accurately. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.13 Switch to the **Metadata** tab. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.14 Confirm "Prompt" is the first row, followed by "Model", "Seed", and "Negative Prompt". | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.15 Verify all priority/keep fields expose functional orange copy buttons. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.16 Confirm all remaining metadata fields display correctly. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 3.17 Close the Details panel. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.1 Navigate through **In**, **Maybe**, **Keep**, and **Trash** stacks. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.2 Open the grid for the **Trash** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.3 Confirm the sole image is outlined in blue. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.4 Use **Move** to send the image back to the **In** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.5 Confirm the image disappears from the **Trash** grid. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.6 Close the grid and switch to the **In** stack. | ❌ Fail | -1 | Grid closure awaits IndexedDB reordering; failures leave the modal open so this step cannot complete reliably.【F:index.html†L3499-L3534】 |
| 4.7 Confirm the moved image now appears on center stage. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.8 Flick the current image into the **Keep** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.9 Open the **Keep** stack grid and confirm the moved image is first. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.10 Select the second image in the grid. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.11 Deselect the auto-selected first image. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.12 Close the grid and confirm the second image is now on stage as the **Keep** stack leader. | ❌ Fail | -1 | Stage swap after closing the grid is blocked when `Grid.close()` never resolves under persistence errors.【F:index.html†L3499-L3534】 |
| 4.13 Open the **In** stack grid. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.14 Deselect the auto-selected first image. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.15 Select the next three images. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.16 Use **Move** to reinsert them into the **In** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.17 Confirm the three images now occupy the first three grid positions in alphabetical order. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.18 Confirm the former first image moved to fourth position. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.19 Search for the tag created in Section 3. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.20 Confirm only the tagged image appears and is pre-selected. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.21 Close the grid and confirm the tagged image appears on center stage. | ❌ Fail | -1 | Re-entering stage after grid interactions is blocked by the same modal closure failure.【F:index.html†L3499-L3534】 |
| 4.22 Re-open the grid and run the same search. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.23 Delete the matching image and confirm the provider request payload is correct. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.24 Confirm the grid is empty after deletion. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.25 Clear the search and select the first three **In** stack images. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.26 Use the **Folder** control to move them to a different folder. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.27 Navigate to the destination folder. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.28 Confirm the moved images top the **In** stack grid. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.29 Enter Focus Mode and confirm the ordering. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.30 Select the next three images for export. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.31 Launch the Export modal and verify a progress counter and percentage render. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.32 Confirm the exported CSV includes all columns, a valid source URL, and parsed metadata. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.33 Close the Export modal. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.34 Select three images and confirm the selection pill shows "3 selected". | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.35 Click the pill close **X** and confirm the selection clears. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.36 Click the pill itself and confirm the grid selects all images. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.37 Move all images to the **Maybe** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.38 Confirm the "stack is empty" message renders for the originating stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 4.39 Use the provided control to jump to the next clockwise non-empty stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 5.1 Switch to the **Maybe** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 5.2 Enter Focus Mode. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 5.3 Use the stack selector in the top-left to jump to the **Keep** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 5.4 Confirm the displayed image is the original "test" image that cycled through Trash back to **Keep**. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 5.5 Exit Focus Mode. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 5.6 Flick the current image to the **In** stack. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |
| 5.7 Switch to the **In** stack and confirm the same image now appears on center stage. | ⚪ Undetermined | +0 | Not evaluated during this review window; blocked steps are called out explicitly. |

## Cross-Device Sync Test Plan
| Metric | Count |
|--------|-------|
| Pass (+1) | 1 |
| Fail (-1) | 2 |
| Undetermined (0) | 32 |
| **Total Score** | **-1** |

| Requirement | Status | Score | Notes |
|-------------|--------|-------|-------|
| 1.1 Authenticate Device A with the storage provider and open Folder X that contains multiple images. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 1.2 Authenticate Device B with the same provider, but remain on the provider selection screen. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 1.3 Ensure Folder X has no pending sync operations in either device's local state. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 2.1 On Device A, confirm Folder X loads on the **In** stack stage. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 2.2 Apply unique tags to three different images (e.g., `#sync-a1`, `#sync-a2`, `#sync-a3`). | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 2.3 Add distinct notes to the same three images. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 2.4 Mark one image as a favorite. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 2.5 Move one image from **In** to **Keep** and another from **In** to **Maybe**. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 2.6 Delete one image to send it to the provider recycle bin. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 2.7 Export metadata for the modified items and confirm completion. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 2.8 Verify Device A's sync queue is empty (no pending writes). | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 3.1 Authenticate Device B and open Folder X for the first time. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 3.2 Confirm the stage reflects Device A's latest ordering (favorite, Keep, Maybe adjustments). | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 3.3 Verify the three tags from Section 2.2 are present on the corresponding images. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 3.4 Confirm the associated notes from Section 2.3 are visible. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 3.5 Verify the favorite state matches Device A's selection. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 3.6 Confirm the deleted image no longer appears in any stack. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 3.7 Review sync diagnostics/logs to ensure no errors were raised during hydration. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 4.1 On Device A, apply a new batch of tags (e.g., `#sync-a4`, `#sync-a5`). | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 4.2 Edit the note on one previously modified image. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 4.3 Clear the favorite flag that was set earlier. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 4.4 Restore the previously deleted image from the provider recycle bin. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 4.5 Move two images between stacks to verify ordering churn. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 4.6 Confirm the sync queue drains successfully after each change batch. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 5.1 Re-open Folder X on Device B after Device A completes Section 4. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 5.2 Confirm new tags (`#sync-a4`, `#sync-a5`) appear on the correct images. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 5.3 Verify the edited note reflects Device A's latest text. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 5.4 Confirm the favorite flag is cleared. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 5.5 Verify the restored image reappears in the expected stack position. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 5.6 Ensure stack ordering matches Device A's latest moves. | ❌ Fail | -1 | Stack ordering persistence depends on IndexedDB writes during grid teardown, so Device B cannot rely on the ordering when those writes fail.【F:index.html†L3499-L3534】 |
| 5.7 Validate that no sync conflicts are reported in diagnostics. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 6.1 Ensure Device B can still enter Focus Mode and navigate without desynchronizing selections. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 6.2 Confirm both devices can search for the new tags and receive consistent results. | ✅ Pass | +1 | Search covers tag tokens, enabling both devices to find the new tag terms consistently.【F:index.html†L3432-L3437】【F:index.html†L3486-L3489】 |
| 6.3 Validate export operations continue to function on both devices post-sync. | ⚪ Undetermined | +0 | Not evaluated during this review window except where explicitly noted. |
| 6.4 Confirm neither device logs manifest version regressions. | ❌ Fail | -1 | No manifest version guard exists in this build—there are no manifest/version routines to enforce monotonic updates.【f86516†L1-L2】 |
