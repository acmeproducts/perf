# performance.html Reconstruction Plan

## 1. Objectives and Constraints
- **Goal**: Extend `performance.html` with Modules B–E (Sort, Grid, Detail, Focus) while keeping existing Module A (authentication + provider integration) unchanged and functional.
- **Non-negotiable constraints**:
  - Treat `performance.html` as the authoritative Module A baseline. Copy it once and never edit its Module A sections (CSS lines 1–664, HTML shell through line 981, JS lines 982–4756).
  - All new work must be sourced from `ui-v10.html`; no new features invented without reference.
  - Preserve provider abstractions for both Google Drive and OneDrive.
  - Maintain Smart Data / Dumb Report separation: business logic remains in JS modules, markup stays declarative.

## 2. Artifacts to Keep Handy
| Purpose | File | Notes |
| --- | --- | --- |
| Reference implementation | `ui-v10.html` | Use as source for extraction. Keep the line ranges in Section 4 bookmarked. |
| Working base | `performance.html` | Do **not** touch Module A CSS/HTML/JS sections listed above. |
| Architecture philosophy | `5_steps.txt` | Ensure module responsibilities align with this doc. |

> Tip: Create local read-only copies (`cp performance.html phase0.html`) to guard against accidental edits.

## 3. Target Module Overview
| Module | Responsibility | Key UI Surface | Depends on |
| --- | --- | --- | --- |
| B – Sort Mode | Gesture, flick, stack assignment, pill counters | Gesture screen A | Module A state, shared utilities |
| C – Grid Mode | Bulk selection, search, batch operations | Grid modal | Module B utilities (`getImageUrl`, stack data) |
| D – Detail Mode | Metadata, tags, notes, ratings | Details modal | Module C (selection hooks), Module A provider |
| E – Focus Mode | Keyboard-centric review, favorites | Gesture screen B | Module B state, Module D metadata helpers |

Shared helpers (TagService, TagEditor, NotesEditor) should live alongside Modules D/E for reuse.

## 4. Extraction Roadmap from `ui-v10.html`
- **CSS additions (approx. lines 200–600)**: `.app-container`, `.gesture-layer`, `.edge-glow-*`, `.pill-counter`, `.modal`, `.grid-*`, `.tab-*`, `.star-rating`, `.tag-chip`, focus mode layouts. Insert immediately after the existing CSS block (line 664).
- **HTML replacements (approx. lines 900–1140)**: Replace `<div id="app-root" class="hidden"></div>` with the full app container, viewport, gesture layers, pills, modals (grid/details/action) and focus shell.
- **Module B (approx. 5555–6515)**: `Gestures`, stack handling, keyboard hooks, plus `UI`/`Events` wiring for sort mode.
- **Module C (approx. 4756–5058)**: Grid rendering, selection, search, bulk actions.
- **Module D (approx. 1224–1596 & 5059–5554)**: TagService, TagEditor, NotesEditor, details modal orchestrator.
- **Module E (approx. 5652–5933 & 6286–6494)**: Focus mode overlays, toggle logic inside `Gestures`, plus `Events.setupFocusMode()` and keyboard integration.

Always confirm line ranges in the source file before extraction—they shift if the upstream file changes.

## 5. Incremental Build Phases
Each phase produces a new HTML snapshot (`orbital8-v10-phaseN.html`). Never overwrite a prior phase.

### Phase 1 – Layout Foundation
1. Copy `performance.html` → `orbital8-v10-phase1.html`.
2. Append CSS additions after line 664.
3. Replace `<div id="app-root" class="hidden"></div>` with the full app container markup.
4. Smoke test: open in browser, ensure Module A screens still function and new layout renders without JS behavior.

**Checks**
- Module A flow (auth → folder select) still succeeds.
- `#app-container` visible once framework starts.
- Browser console empty.

### Phase 2 – Module B (Sort Mode)
1. Copy Phase 1 → Phase 2 file.
2. Inject Module B JS immediately after line 4756, keeping Module A untouched.
3. Lift gesture/stack helpers from `ui-v10.html` wholesale—avoid pseudo-code placeholders.
4. Update `initApp()` to initialize Module B and reveal the new UI.

**Checks**
- Load folder → first image renders.
- Flick/drag updates stack pills and edge glows.
- Arrow keys advance/rewind images.
- Console free of errors.

### Phase 3 – Module C (Grid Mode)
1. Copy Phase 2 → Phase 3 file.
2. Add Grid module plus necessary helpers (state, rendering, selection, search, bulk actions).
3. Wire up open/close controls (e.g., dedicated grid button, ESC key, overlay click).
4. Ensure Module C reuses Module B utilities (e.g., `getImageUrl`) instead of duplicating logic.

**Checks**
- Trigger grid modal; thumbnails render correctly.
- Selection state persists and updates pill counters when applying bulk stack moves.
- Search modifiers (`#favorite`, `#quality:3`, etc.) filter results as expected.

### Phase 4 – Module D (Detail Mode)
1. Copy Phase 3 → Phase 4 file.
2. Add TagService, TagEditor, NotesEditor helpers exactly as in `ui-v10.html` (normalize namespaced functions if necessary).
3. Implement Detail module to populate info, tags, notes, ratings, metadata, and hook into provider updates.
4. Ensure grid/double-click shortcuts open detail modal; closing returns to prior context.

**Checks**
- Editing tags/notes updates provider metadata (watch network tab / logging).
- Star ratings persist and visually reflect state.
- Metadata section handles missing values gracefully.

### Phase 5 – Module E (Focus Mode)
1. Copy Phase 4 → Phase 5 final file.
2. Add Focus module; register keyboard listeners cautiously to avoid duplicate bindings.
3. Integrate mode switching (gesture hub double-tap, ESC to exit) and sync with Module B state.
4. Finalize `initApp()` to initialize Modules B–E in order.

**Checks**
- Double-tap enters focus mode; ESC or hub double-tap exits.
- `f` toggles favorite, updates pills/favorite indicators everywhere.
- Delete/stack shortcuts reflect in Module A data and grid/detail views.

## 6. Cross-Module Guidelines
- **State management**: Use the shared `ModuleA.state.files` array as the canonical dataset. Modules B–E should mutate file metadata through provider APIs to ensure persistence.
- **Event binding hygiene**: Register listeners inside `init()` and guard against re-registration (e.g., by checking flags or removing existing listeners first).
- **Styling**: Keep new CSS grouped by component with comments. Avoid overriding Module A selectors.
- **Accessibility**: Ensure keyboard interactions have focus management (e.g., trap focus in modals, return focus to triggering element).
- **Error handling**: Mirror `ui-v10.html` behavior for provider failures; add console warnings if metadata updates fail.

## 7. Testing Protocol
For each phase:
1. Load file locally in modern Chromium-based browser.
2. Open DevTools console → confirm no errors/warnings.
3. Execute manual QA checklist specific to the phase.
4. Document findings in a running QA log (include browser, timestamp, pass/fail notes).
5. Only advance once all checks pass.

Final regression (Phase 5):
- Repeat Module A smoke tests.
- Validate all module features in sequence (Sort → Grid → Detail → Focus) using the same dataset.
- Verify provider operations (metadata updates, stack moves) by refreshing and ensuring state persists.

## 8. Handoff Template
If work pauses mid-phase, include in the session log:
```
## Session Handoff

**Current Phase**: Phase <N>
**Working File**: orbital8-v10-phase<N>.html
**Status**: PASS/FAIL + summary of remaining TODOs

**Next Steps**
1. Continue at step X of Phase <N> / Begin Phase <N+1> tasks.
2. Pull source snippets from <line ranges>.
3. Re-run phase validation checks.

**Known Issues**: …
**Open Questions**: …
```

## 9. Final Deliverable Checklist
- Single HTML document `orbital8-v10-phase5-FINAL.html` containing:
  - Original Module A untouched (lines ≤4756).
  - New CSS grouped at top, clearly commented.
  - App container HTML replacing the placeholder root div.
  - Modules B–E defined after Module A and before the `initApp()` definition concludes.
  - `initApp()` initializes Modules B–E once Module A completes loading.
  - Functionality parity with `ui-v10.html` (gestures, grid, detail, focus, metadata persistence).
  - Works with Google Drive and OneDrive providers.
- Archive intermediate phase files for rollback.

By following this plan the implementation stays modular, testable, and aligned with the existing architecture philosophy while minimizing risk to the stable Module A foundation.
