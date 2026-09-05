<!-- UI-V2-GRAVEYARD v1.0.0 -->
# UI-V2 GRAVEYARD v1.0.0

**Location:** `UI-V2-GRAVEYARD.md` in `acmeproducts/perf`.
**Purpose:** Hard veto list for approaches that failed, caused regressions, duplicated UI, destroyed known-good behavior, or created deployment ambiguity.
**Authority:** A graveyard entry vetoes reuse of that approach unless the owner explicitly revives it and the plan is updated in the same session.

---

## 1 · BURIED APPROACHES

| # | Buried approach | Why it is buried | Lesson / replacement discipline | Status |
|---|---|---|---|---|
| G1 | Embedding large HTML/CSS/JS payloads directly inside GitHub Actions YAML heredocs | Produced invalid workflow YAML, line-indentation failures, transport complexity, delayed race conditions, and false confidence that application changes had shipped | Work in normal source files using the established repository editing/build path. Workflow YAML orchestrates; it does not carry application source payloads | BURIED |
| G2 | Forward-patching a damaged or uncertain `ui-v2.html` snapshot | Later snapshot commits removed large portions of previously validated behavior; patching forward made lineage impossible to trust | Establish an approved baseline first. On failure: rollback -> graveyard -> plan -> rebuild from clean approved input | BURIED |
| G3 | Runtime “stabilization” layers using broad `MutationObserver` synchronization | Created a self-triggering DOM loop and browser lockup after provider selection | Initialization must be deterministic and scoped. Do not use broad DOM observers to repair application architecture at runtime | BURIED |
| G4 | Inventing parallel Explore/Table decorations instead of reusing Focus controls | Produced fake hearts, duplicate trash/details controls, layout drift, and inconsistent behavior | Focus chrome is canonical. Reuse the actual controls and handlers rather than lookalikes | BURIED |
| G5 | Treating Table’s destinations as hard-coded permanent semantic stacks (`YES/MAYBE/NO`, `KEEP/TRASH`, Inbox/Maybe-only) | Confused stack navigation with curation targets and contradicted the later folder-specific tag-target model | Table tag targets are folder-specific tags. Current stack remains independent and switchable | BURIED |
| G6 | Restricting Table to Inbox + Maybe as the only source/workspace | Removed the ability to curate whichever stack the user is currently working in | Table opens on the current stack; stack selector can switch working stack | BURIED |
| G7 | Explore sorting/fling targets on the sphere-thumbnail surface | Made Explore too busy and contradicted the inspection-first design | Sphere has no tag targets. Tagging activates at medium inspection | BURIED |
| G8 | Image-to-image collision physics in Table | Added chaos without enough curation value | Keep target/rim/bank/vacuum/capture physics; remove image-image collisions | BURIED |
| G9 | Separate per-surface thumbnail loading/caching paths | Caused repeated fetch/repaint work and inconsistent performance across Grid/Explore/Table | One shared thumbnail service/cache with visible-first loading and provider-expiry recovery | BURIED |
| G10 | Claiming deployment success from repository state or Actions success alone | Live page repeatedly differed from claimed build; footer/runtime markers could also be misleading | Verify the published artifact itself, then provide the test URL automatically | BURIED |
| G11 | Using only runtime footer rewriting as the build/version signal | A later script failure could leave an older footer version visible and obscure what code was actually served | Build identity must be present statically in the shipped HTML and verified in the published artifact | BURIED |
| G12 | Making application changes before the owner approved implementation | Violated project governance and caused unwanted forward changes | Information/planning requests are read-only unless implementation is explicitly authorized | BURIED |
| G13 | Assuming fragmented conversation history is complete enough to build from | Key decisions were missing across devices/session history, causing repeated requirement misses | `ui-v2-plan.md` is the authoritative session ledger; owner rulings must be written there in the same turn | BURIED |
| G14 | Describing “same Sort trail” while implementing only a similarly named class/effect | Visual/behavior parity was claimed without actual parity | Reuse the actual existing implementation or explicitly document a divergence; verify on device | BURIED |
| G15 | Hiding duplicate controls with CSS while leaving competing DOM/handlers in place as the intended architecture | Reduced symptoms but preserved duplicate semantics and future collision risk | Canonical control ownership must be explicit in source; legacy controls may remain only when required for compatibility and must not own behavior | BURIED |
| G16 | Releasing a global input guard by re-reading transition state *after* the transition has already mutated it | The Focus exit-pointer guard (`ModeNavigation.transitionGuard`) is set on pointer-down on the Focus X and cleared in a `setTimeout(0)` after pointer-up that re-reads `CanonicalInspection.referrer`. The exit click runs first and nulls the referrer, so for Sort-origin Focus (entered via the double-tap mode chooser) the clear condition (`referrer.surface === 'sort'`) is never true and the guard leaks permanently. A capture-phase document click handler then swallows every subsequent click: Sort stack taps go inert and the mode-choice modal reopens (pointer-event driven) but its buttons (click driven) never respond again. Incident 2026-09-04: symptom surfaced right after deploy `12e45d8` (coordinate picking) and that commit was rolled back per protocol (`02ccb84`); A/B repro then proved the inertness reproduces identically on the pre-change build, so the guard leak pre-dates `12e45d8`. | Any guard keyed to a single pointer sequence must capture its release decision (destination, ids) at guard **creation** time, never from mutable state read after the transition ran. Global capture-phase input suppression must have an unconditional release path for the pointer sequence that created it. Regression gate: repeated Sort → chooser → Focus → X → Sort round trips must leave document clicks fully live. | BURIED |
| G17 | Serving full-quality (800px) thumbnails to ~112px sphere cards while the shared cache retained every decoded preload `Image` indefinitely | Each sphere card decoded ~2.5MB of pixels it painted at ~1/7 scale; the cache (`maxResident: 640`) pinned the decoded preloads via `entry.preload` even after load, so a few hundred images exceeded iPad Safari's per-tab memory budget. Result on device (R4.17–R4.22): tab jetsam ("crashes and restarts"), decode-driven main-thread jank ("slow"), and taps landing on stale-painted card positions ("inaccurate") because layout advanced while paint lagged. | Every rendition must be sized to its painted surface (sphere = 300px); decoded preloads are released the moment they settle (the on-screen `<img>` and the HTTP cache carry the pixels); preload traffic runs through a bounded slot queue. Regression gates: sphere rendition URL is w300, loaded entries have `preload === null`, 60 simultaneous ensures never exceed 16 in flight. | BURIED |
| G18 | Resolving a card selection from a pointer-down on a sphere that is still gliding on momentum | The card the person saw and decided to tap has rotated away by the time pointer-down fires (human reaction + paint latency), so the picker resolves a different card even though the pick itself is geometrically correct. WebKit device-family reproduction with pixel ground truth: 6/6 taps wrong mid-glide, 6/6 correct at rest. Free-trackball momentum (R4.19) lengthened glides and made this the dominant on-device miss. Symptom reported as "tap never returns the right image." | A tap on a gliding sphere (velocity above `catchThreshold`) catches and stops it and never selects; selection is only resolved against a still sphere. Regression gates: mid-glide trusted tap zeroes momentum without entering Focus and the follow-up tap opens exactly the painted front card; a below-threshold sphere selects on the first tap. | BURIED |

---

## 2 · FAILURE PROTOCOL

When a device gate fails or a release materially violates the approved plan:

1. Stop. Do not patch forward.
2. Identify the last owner-approved baseline.
3. Roll back/rebuild from that clean baseline.
4. Add the failed approach and evidence to this graveyard.
5. Update `ui-v2-plan.md` with the failure, open questions, and new release status.
6. Rebuild the same intended release from the clean input.
7. Re-run automated gates.
8. Publish.
9. Verify the published artifact.
10. Provide the owner the test URL for the physical/device gate.

A green automated gate means **allowed to test**, not done.

---

## 3 · REVIVAL RULE

A buried approach may only be revived when all are true:

- the owner explicitly approves the revival;
- the reason the old attempt failed is understood with evidence;
- the new design materially removes that failure mode;
- `ui-v2-plan.md` records the exception before implementation;
- the acceptance gate includes a regression check for the original failure.

---

## 4 · CHANGE LOG

**v1.1.0 · 2026-09-04.** Added G16: post-transition state reads must not gate the release of global input guards. Records the Sort-inertness incident (leaked Focus exit-pointer guard after Sort-origin Focus round trips), the precautionary rollback of `12e45d8`, and the A/B evidence clearing that commit as the cause.

**v1.0.0 · 2026-08-12.** Created from the UI-V2 development failures and governance lessons recovered from the project discussion. Initial entries G1-G15 establish hard vetoes around patch-forward development, workflow payload experiments, duplicate chrome, incorrect Table semantics, runtime observer stabilization, cache fragmentation, deployment inference, and unauthorized implementation.
