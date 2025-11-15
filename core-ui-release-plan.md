# Core-First UI Release Bundle Plan

## Purpose
Lay out the first implementation wave for the core-first (Approach D) strategy so all
necessary work lands in a single, coherent pull request. This ensures reviewers and
QA see the full end-to-end experience—shared core, canonical actions, and frame-safe
chrome—before we branch into future cartridges.

## Release scope
1. **Similarity inventory + promotion.** Document every overlapping widget across
   `ui-v7` and `ui-v8`, then move the common DOM, styles, and event bindings into the
   existing files as shared sections (templates, script helpers, or tagged blocks).
2. **Canonical action layer.** Replace stack-specific arrays with a single action
   dictionary (`UP/DOWN/LEFT/RIGHT/CENTER`, optional modifiers) plus metadata mapping.
3. **Immutable gesture skeleton.** Render the baseline triangle/hub controller once
   and bind it to the canonical actions so both baseline and paradigm inherit the same
   navigation affordances.
4. **Frame-safe chrome modules.** Convert progress bars, pill counters, tap zones,
   and focus overlays into opt-in modules defined inline with explicit activation
   guards so only the requested chrome renders.
5. **Configuration persistence update.** Store cartridge preference outside the URL
   (folder-level/localStorage hybrid) while still honoring manual `?cartridge=`
   overrides. OAuth callbacks remain untouched.

All five deliverables land together so QA can validate the full “smart config, dumb
UI shell” contract in a single test cycle.

### Readiness gate (pre-implementation)
Before engineering starts on B1, the following go/no-go criteria are confirmed:

1. **Data reset approved.** All currently triaged assets are disposable test data,
   so the canonical action rollout can start with a clean slate and needs no
   metadata migration or backfill work.
2. **QA capacity confirmed.** The QA team will run the bundled checklist (below)
   in one pass, validating both baseline regression coverage and paradigm feature
   parity.
3. **Single-PR commitment.** Engineering agrees the B1–B5 work streams ship
   together on one branch/PR, so reviewers always see the end-to-end core-first
   experience.
4. **Checklist ownership.** A named QA owner is assigned before coding begins so
   the final verification window is already booked when the PR opens.

With these gates satisfied (“Ready”), the team can move directly into the B1
similarity inventory without revisiting upstream dependencies.

#### Gate status — Ready ✅
- **Data reset:** Confirmed. Existing triage artifacts are disposable test assets,
  so engineers can overwrite them while introducing the canonical action schema.
- **QA capacity:** Confirmed. QA has committed to running the bundled checklist
  (baseline regression + paradigm parity) as soon as the single PR is posted.
- **Single-PR plan:** Confirmed. All B1–B5 bundles will land together in one PR
  titled “Core-first UI bundle (B1–B5)” per this plan.
- **Checklist owner:** Confirmed. QA leadership accepted ownership of the
  checklist deliverable and is tracking it alongside the release test plan.

### Migration assumption
Because the current data set is strictly non-production test content, no metadata
migration is required for the canonical action rollout. Any items touched before
this release can be re-triaged under the new schema, so we only need to ensure the
new serialization paths are internally consistent.

### Addition-by-subtraction goals inside the bundle
- **Undo removal:** Drop the bespoke undo queue/UI in favor of the provider recycle
  bin. Recovery flows will route through the new contextual modules (e.g., MLPUM)
  once available, reducing chrome and state management.
- **MLPUM prototype:** Implement the multi-layer popup menu as one of the chrome
  modules introduced in B4, so recycle-bin previews and other contextual actions
  surface on demand instead of via permanent toolbars.
- **Handle-free grid mode:** Update the grid renderer so drag-and-drop gestures
  remain, but the visible grab handles disappear to reclaim thumbnail space.
- **Footer guardrails:** Freeze a maximum footer height (and optional auto-hide)
  so image aspect ratios remain intact, even when cartridges expose footer copy.

## Task bundles (single PR)
| Bundle | Description | Key files |
| --- | --- | --- |
| B1 | Similarity inventory + shared inline blocks | `core-ui-rationalization.md`, `ui-v7.html`, `ui-v8.html` |
| B2 | Canonical action schema + metadata mapper | `ui-v7.html`, `ui-v8.html`, `codex-storage.js` |
| B3 | Triangle/hub consolidation + gesture bindings | `ui-v7.html`, `ui-v8.html` |
| B4 | Chrome modules (pill counters, progress bar, tap zones, MLPUM) with activation guards | `ui-v7.html`, `ui-v8.html` |
| B5 | Cartridge persistence refactor | `ui-v8.html`, `codex-storage.js`, cartridge manager utilities |

We queue the bundles sequentially inside one branch but only open the PR when all five
are complete. Intermediate commits stay local until the full release bundle is ready.

## Execution guidelines
1. **Start with docs.** Update `core-ui-rationalization.md` as modules graduate into
   the core so the memo stays accurate.
2. **Feature flags vs. modules.** When in doubt, move behavior into a module with an
   explicit activation hook instead of adding yet another feature flag. Modules can be
   parameterized later, but they stay inside the existing entry files.
3. **Overlap checks.** After every bundle, run an overlap audit (visual or DOM diff)
   to confirm only one set of chrome elements renders at a time.
4. **Testing cadence.** Smoke-test both baseline and paradigm scenarios after each
   bundle locally, but defer full regression to the final PR build.
5. **PR packaging.** Squash or organize commits logically, then open a single PR titled
   “Core-first UI bundle (B1–B5)” summarizing all bundles with shared testing notes.

## QA checklist (baseline parity + paradigm parity)
QA will execute this discrete list once the single PR is ready. Each item must pass
in both the baseline and paradigm cartridges unless otherwise noted.

1. **Authentication & folder load** – Launch the app, authenticate with the
   storage provider, and open a test folder without URL parameter overrides.
2. **Cartridge persistence** – Switch cartridges, reload the page, and confirm the
   folder re-opens with the previously selected cartridge (non-URL persistence).
3. **Gesture skeleton** – In both cartridges, verify that the triangle/hub layer
   handles tap, swipe, and double-tap gestures identically for prev/next and focus
   toggling.
4. **Canonical action mapping** – Triage items via up/down/left/right actions and
   confirm the serialized metadata reflects the canonical action codes regardless
   of cartridge branding.
5. **Chrome modules** – Toggle modules (pill counters, progress bar, tap zones,
   MLPUM) per cartridge and confirm only the requested chrome renders (no overlap).
6. **Handle-free grid drag** – Enter grid mode, drag thumbnails without visible
   handles, and ensure drag/drop behavior matches the previous baseline.
7. **Footer guardrail** – Resize the viewport and confirm the footer respects the
   frozen height budget or auto-hide rules so imagery remains dominant.
8. **Contextual recycle bin (MLPUM)** – Invoke the menu, inspect recycle-bin
   previews, and restore an item to confirm the undo replacement flow works.
9. **Regression sweep** – Repeat the above with the alternate cartridge to confirm
   feature parity, then run a brief smoke test of focus mode, tagging, and export
   to ensure legacy flows still behave.

## Future simplification backlog
- **Contextual recycle grid (MLPUM v2).** Expand the menu-driven recycle bin into a
  grid panel with batch restore, making it the official “undo” surface.
- **Footer telemetry minimization.** Gradually migrate non-essential stats/labels out
  of the footer and into contextual overlays so the viewport remains dominant.
- **Tap-zone discovery cues.** Replace permanent labels with transient hints or
  onboarding pulses so the gesture layer stays clean while still discoverable.
- **Focus-mode toggle rationalization.** If the center hub already covers the new
  canonical actions, remove redundant focus toggles from cartridges that no longer
  need them.

##  Decision: the similarity inventory will live in code comments, with in line comments per the release doc.
