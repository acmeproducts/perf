# Orbital8 Atomic Checklist

This checklist restructures every requirement listed after the marker `####$ material to create checklist #####` in `reporeport.txt` into atomic, independently testable statements. Numbering uses the pattern `<section>.<subsection>.<line item>`.

## 1. Interaction & Gestures
### 1.1 Quick Move / Focus Navigation
- **1.1.1** Hub double-tap toggles focus mode on and off.
- **1.1.2** Focus toggle ignores stray taps in triangular dead zones and never advances two images unintentionally.
- **1.1.3** Stack switcher button remains functional while Quick Move logic is active.
- **1.1.4** Details button remains functional while Quick Move logic is active.
- **1.1.5** Folder button remains functional while Quick Move logic is active.
- **1.1.6** Favorites control remains functional while Quick Move logic is active.
- **1.1.7** Trash can icon remains functional while Quick Move logic is active.
- **1.1.8** Stack navigation produces no regressions after Quick Move integration.

## 2. Search, Tagging & Selection
### 2.1 Search Index Coverage
- **2.1.1** Search index includes image filenames.
- **2.1.2** Search index includes created timestamps.
- **2.1.3** Search index includes modified timestamps.
- **2.1.4** Search index includes assigned tags.
- **2.1.5** Search index includes image notes.
- **2.1.6** Search index includes parsed metadata fields.
- **2.1.7** Search index includes PNG embedded text (zTXt or similar).

### 2.2 Search Pipeline Behavior
- **2.2.1** Query parsing applies #modifier tokens before positive terms.
- **2.2.2** Query parsing applies positive inclusion terms after modifiers.
- **2.2.3** Query parsing applies exclusion terms after positive terms.
- **2.2.4** Grid view and stage remain synchronized after search filtering.
- **2.2.5** Search results maintain stage ordering when filters apply.
- **2.2.6** Search results expose #favorite items when requested.
- **2.2.7** Search selections remain active until the search pill is cleared.

### 2.3 Search Helper Overlay
- **2.3.1** Desktop users can click modifier buttons without closing the helper automatically.
- **2.3.2** Helper overlay can be repositioned by the user.
- **2.3.3** Helper overlay can be dismissed intentionally via close control.
- **2.3.4** Helper overlay no longer collides with the favorites control.

### 2.4 Tagging UX
- **2.4.1** Tag input text renders in black by default.
- **2.4.2** Assigned tags display as removable chips above the input in the details view.
- **2.4.3** Assigned tags display as removable chips above the input in the bulk edit view.
- **2.4.4** Recently used tags appear as removable chips below the input in the details view.
- **2.4.5** Recently used tags appear as removable chips below the input in the bulk edit view.
- **2.4.6** Tag entry instantly propagates new tags to assigned lists without extra confirmation steps.
- **2.4.7** Tagging UI in details view matches the bulk edit layout and behavior.
- **2.4.8** Non-hash tags entered are automatically prepended with `#` before assignment.

## 3. UI Layout & Controls
### 3.1 Focus Mode Favorite Control
- **3.1.1** Focus mode displays only a heart icon (no surrounding circular button).
- **3.1.2** Unselected favorite icon renders with a gray outline/fill per spec.
- **3.1.3** Selected favorite icon renders filled red per spec.
- **3.1.4** Favorite icon hit box enables easy click or tap without exposing additional chrome.
- **3.1.5** Clicking or tapping the favorite icon updates metadata immediately.
- **3.1.6** Favorite flag persists between sessions.
- **3.1.7** Favorite flag is searchable via the `#favorite` token.

## 4. Modals & Export
### 4.1 Export Experience
- **4.1.1** Export operates entirely from local state without server round-trips.
- **4.1.2** Export UI shows a running success counter.
- **4.1.3** Export UI shows a running failure counter.
- **4.1.4** Export UI omits scrolling log transcripts.

### 4.2 Modal Ergonomics
- **4.2.1** Details modal is draggable.
- **4.2.2** Details modal is resizable.
- **4.2.3** Details modal double-click resets to max/full-screen state.
- **4.2.4** Grid modal is draggable.
- **4.2.5** Grid modal is resizable.
- **4.2.6** Grid modal double-click resets to max/full-screen state.
- **4.2.7** Bulk tagging view shows tag chips immediately upon entry without extra confirmation.

## 5. Performance, Caching & Sync
### 5.1 Three-Tier Caching Framework
- **5.1.1** In-memory LRU cache backs recent resources.
- **5.1.2** IndexedDB warm cache stores folder contents.
- **5.1.3** IndexedDB warm cache stores metadata records.
- **5.1.4** IndexedDB warm cache stores sync queue entries.
- **5.1.5** IndexedDB warm cache stores PNG text payloads.
- **5.1.6** IndexedDB warm cache stores sync metadata.
- **5.1.7** Cloud fetch layer hydrates from remote storage.
- **5.1.8** UI updates optimistically reflect staged changes before remote confirmation.
- **5.1.9** Background sync worker unifies sync operations.

### 5.2 Sync Overhaul Enhancements
- **5.2.1** Metadata edits debounce at approximately 750 ms per file.
- **5.2.2** Sync batches metadata updates per file before commit.
- **5.2.3** Inline blob workers handle metadata extraction or heavy sync tasks.
- **5.2.4** Lifecycle flush handshake coordinates start/finish of sync flushes.
- **5.2.5** OneDrive adapter performs GET–merge–PUT upserts for manifests and metadata.
- **5.2.6** PNG zTXt blocks are inflated to recover embedded prompts.
- **5.2.7** Periodic eviction metrics are emitted for cache health.
- **5.2.8** UI “no-touch” surfaces remain unaffected during sync operations.

### 5.3 Manifest Version Guard
- **5.3.1** Every manifest flush publishes a new version higher than the remote marker prior to persistence.

## 6. Diagnostics & Logging
### 6.1 SyncDiagnostics Workflow
- **6.1.1** Console helper returns a shareable JSON diagnostic report.
- **6.1.2** Toast notifications coordinate with SyncDiagnostics execution.
- **6.1.3** Footer includes a log button to open diagnostics on mobile without dev tools.

## 7. Guardrails & Release Tracking
### 7.1 Immutable Screens & Scope
- **7.1.1** Provider selection screen retains original layout and behavior.
- **7.1.2** Authentication flow retains original layout and behavior.
- **7.1.3** Folder chooser retains original layout and behavior.
- **7.1.4** Overall look and feel remain within personal-scale scope.

### 7.2 Release Metadata
- **7.2.1** Header comment documents release timestamp, version, and change summary.
- **7.2.2** Footer mirrors header metadata for release timestamp, version, and change summary.

## 8. Shareable URLs
### 8.1 Durable Media Links
- **8.1.1** Image display uses permanent URLs.
- **8.1.2** Thumbnail display uses permanent URLs.

## 9. Long-Term UI Architecture
### 9.1 Headless Core & Shell Switcher
- **9.1.1** Headless core exposes reusable state and component primitives.
- **9.1.2** Progressive disclosure interface is available via shell switcher.
- **9.1.3** Integrated dashboard interface is available via shell switcher.
- **9.1.4** Task modes interface is available via shell switcher.
- **9.1.5** Casual “Tinder” interface is available via shell switcher.
- **9.1.6** Guided assistant interface is available via shell switcher.

## 10. Detailed Feature Checklist
### 10.1 Navigation & Display
#### 10.1.1 Storage Provider Selection
- **10.1.1.1** OneDrive provider option is available.
- **10.1.1.2** Google Drive provider option is available.
- **10.1.1.3** Selecting OneDrive begins the proper auth flow.
- **10.1.1.4** Selecting Google Drive begins the proper auth flow.

#### 10.1.2 Authentication
- **10.1.2.1** OneDrive authentication completes successfully.
- **10.1.2.2** Google Drive authentication completes successfully.

#### 10.1.3 Folder Selection
- **10.1.3.1** Folder picker displays available folders after auth.
- **10.1.3.2** User can choose a folder containing multiple images.
- **10.1.3.3** Selected folder metadata loads into the app state.

### 10.2 Sort Mode & Stack Operations
#### 10.2.1 Inbox / In Stack
- **10.2.1.1** Inbox stack displays images assigned to "In".
- **10.2.1.2** Flick gesture moves image into Inbox stack correctly.
- **10.2.1.3** Tap gesture selects image in Inbox stack correctly.
- **10.2.1.4** Click gesture selects image in Inbox stack correctly.

#### 10.2.2 Keep / Priority Stack
- **10.2.2.1** Keep stack displays images assigned to "Keep".
- **10.2.2.2** Flick gesture moves image into Keep stack correctly.
- **10.2.2.3** Tap gesture selects image in Keep stack correctly.
- **10.2.2.4** Click gesture selects image in Keep stack correctly.

#### 10.2.3 Maybe / Out Stack
- **10.2.3.1** Maybe stack displays images assigned to "Maybe".
- **10.2.3.2** Flick gesture moves image into Maybe stack correctly.
- **10.2.3.3** Tap gesture selects image in Maybe stack correctly.
- **10.2.3.4** Click gesture selects image in Maybe stack correctly.

#### 10.2.4 Trash / Recycle Stack
- **10.2.4.1** Trash stack displays images assigned to "Trash".
- **10.2.4.2** Flick gesture moves image into Trash stack correctly.
- **10.2.4.3** Tap gesture selects image in Trash stack correctly.
- **10.2.4.4** Click gesture selects image in Trash stack correctly.
- **10.2.4.5** Trash can icon moves current image to provider recycle bin.
- **10.2.4.6** After trashing, next image in stack displays automatically.
- **10.2.4.7** If no images remain, app displays "No more images" message.

#### 10.2.5 Stack-to-Stack Navigation
- **10.2.5.1** Users can navigate from Inbox to Keep stack.
- **10.2.5.2** Users can navigate from Inbox to Maybe stack.
- **10.2.5.3** Users can navigate from Inbox to Trash stack.
- **10.2.5.4** Users can navigate from Keep to Inbox stack.
- **10.2.5.5** Users can navigate from Keep to Maybe stack.
- **10.2.5.6** Users can navigate from Keep to Trash stack.
- **10.2.5.7** Users can navigate from Maybe to Inbox stack.
- **10.2.5.8** Users can navigate from Maybe to Keep stack.
- **10.2.5.9** Users can navigate from Maybe to Trash stack.
- **10.2.5.10** Users can navigate from Trash to Inbox stack.
- **10.2.5.11** Users can navigate from Trash to Keep stack.
- **10.2.5.12** Users can navigate from Trash to Maybe stack.

#### 10.2.6 Stack-to-Itself Gestures
For each active stack, the following gestures operate correctly:
- **10.2.6.1** Flick upward within current stack behaves as specified.
- **10.2.6.2** Flick downward within current stack behaves as specified.
- **10.2.6.3** Flick left within current stack behaves as specified.
- **10.2.6.4** Flick right within current stack behaves as specified.
- **10.2.6.5** Tap within current stack behaves as specified.
- **10.2.6.6** Click within current stack behaves as specified.

#### 10.2.7 Hub Zone
- **10.2.7.1** Clicking hub toggles focus mode per spec.
- **10.2.7.2** Tapping hub toggles focus mode per spec.

### 10.3 Stack Counters & Grid Behavior
- **10.3.1** Tapping inactive stack counter activates that stack.
- **10.3.2** Activating a new stack marks previous stack inactive.
- **10.3.3** Activating a new stack updates stage display to first image of that stack.
- **10.3.4** Tapping active stack counter opens grid modal.
- **10.3.5** Grid modal auto-selects first image when opened from stack counter.
- **10.3.6** Selecting stack counter inside grid selects all images in that stack.
- **10.3.7** Selection pill updates counts when all images selected.
- **10.3.8** Clearing selection pill deselects all images and updates counts accordingly.

### 10.4 Search Helper & Results Handling
- **10.4.1** Search helper shows no chips (text only interface).
- **10.4.2** Selecting a special item like `#favorite` appends term and closes helper.
- **10.4.3** Helper close "X" button cancels operation successfully.
- **10.4.4** Helper reopens when user clicks information icon again.
- **10.4.5** Zero results show stack counter = 0.
- **10.4.6** Zero results show items selected pill = 0.
- **10.4.7** Zero results show no images in grid.
- **10.4.8** Successful search pre-selects matching images with blue outline.
- **10.4.9** Items selected pill updates to number of matched images.
- **10.4.10** Searching `#` alone yields zero-results state until term matches tag or special selection (e.g., `#favorite`, `#content`).

### 10.5 Tag Modal Layout
- **10.5.1** Tag modal line 1 displays text "Assigned Tags".
- **10.5.2** Tag modal line 2 displays assigned tag chips with removal "x".
- **10.5.3** Tag modal line 3 provides entry field with hint "Enter tags separated by commas...".
- **10.5.4** Tag modal auto-prepends `#` for tags lacking prefix upon Enter.
- **10.5.5** Tag modal line 4 displays text "Recently Used Tags".
- **10.5.6** Tag modal line 5 displays recently used tag chips with removal "x".
- **10.5.7** All tag modal text input renders black text.
- **10.5.8** Tag modal layout and behavior identical between details tab and bulk tab.

