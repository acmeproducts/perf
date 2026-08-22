<!-- UI-V2-GRAVEYARD v1.2.0 -->
# UI-V2 GRAVEYARD v1.2.0

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
| G7 | Explore sorting/fling targets on the sphere-thumbnail surface | Made Explore too busy and contradicted the inspection-first design | Sphere has no tag targets. Tagging belongs to Table | BURIED |
| G8 | Image-to-image collision physics in Table | Added chaos without enough curation value | Keep target/rim/bank/vacuum/capture physics; remove image-image collisions | BURIED |
| G9 | Separate per-surface thumbnail loading/caching paths | Caused repeated fetch/repaint work and inconsistent performance across Grid/Explore/Table | One shared thumbnail service/cache with visible-first loading and provider-expiry recovery | BURIED |
| G10 | Claiming deployment success from repository state or Actions success alone | Live page repeatedly differed from claimed build; footer/runtime markers could also be misleading | Verify the published artifact itself, then provide the test URL automatically | BURIED |
| G11 | Using only runtime footer rewriting as the build/version signal | A later script failure could leave an older footer version visible and obscure what code was actually served | Build identity must be present statically in the shipped HTML and verified in the published artifact | BURIED |
| G12 | Making application changes before the owner approved implementation | Violated project governance and caused unwanted forward changes | Information/planning requests are read-only unless implementation is explicitly authorized | BURIED |
| G13 | Assuming fragmented conversation history is complete enough to build from | Key decisions were missing across devices/session history, causing repeated requirement misses | The canonical master plan is the authoritative session ledger; owner rulings must be written there before implementation | BURIED |
| G14 | Describing “same Sort trail” while implementing only a similarly named class/effect | Visual/behavior parity was claimed without actual parity | Reuse the actual existing implementation or explicitly document a divergence; verify on device | BURIED |
| G15 | Hiding duplicate controls with CSS while leaving competing DOM/handlers in place as the intended architecture | Reduced symptoms but preserved duplicate semantics and future collision risk | Canonical control ownership must be explicit in source; legacy controls may remain only when required for compatibility and must not own behavior | BURIED |
| G16 | Making an Explore thumbnail tap mutate normal-stack order / `stackSequence` in order to obtain continuity | R4.7 coupled a view-selection action to persistent data ordering through `promoteFileId()`. The follow-on R4.8 removed that mutation locally instead of rebuilding the complete pointer contract, producing a patch-on-patch regression in exact tap/Focus/return/Grid continuity | Explore selection is a stable `fileId` view anchor only. Never mutate normal-stack order merely because an Explore thumbnail was inspected. Maintain a canonical active `fileId` through Explore → Focus navigation → Explore/Grid, and derive Grid presentation order without persisting a stack reorder | BURIED |
| G17 | Rebalancing/persisting Explore layout on every pinch-move sample | The pinch path recalculated automatic card scale, labels, persistence scheduling and layout logging for each touch movement while the same scale also affected both sphere radius and card scale. This made pinch zoom jumpy and inconsistent | During a pinch, update only continuous spatial extent in animation frames. Preserve rotation/selection, avoid per-sample persistence/logging/repopulation, and settle/persist once when the gesture ends. Thumbnail percentage remains an independent control | BURIED |
| G18 | Publishing wrapper/test-loader HTML that fetches `ui-v2.html` and injects a runtime patch | R4.9.1 created a second transport path and made the tested behavior differ from the authoritative application artifact | All candidate behavior must live in the governed `ui-v2.html`; use the normal Pages URL only | BURIED |
| G19 | Resolving an overlapping sphere tap by choosing the card whose projected center is nearest the pointer | The R4.9.1 wrapper could substitute a different card when projected rectangles overlap, violating exact stable `fileId` identity | Capture the exact visible card ownership at gesture start. A tap may activate only that captured `fileId`; blank/ambiguous space does not invent a nearest card | BURIED |
| G20 | Fixing far-side selection by opacity alone | Raising opacity makes rear thumbnails easier to see but does not fix event ownership or overlap stealing | Keep rear cards identifiable and separately fix hit ownership; visual depth and input identity are independent concerns | BURIED |
| G21 | Letting DOM z-order at pointer-up redefine the selected sphere image | Pointer capture, overlap and rotation can make the pointer-up target differ from the thumbnail deliberately pressed | Record stable `fileId` from the visible hit at pointer-down and retain it through a clean tap; movement cancels activation but never substitutes another file | BURIED |

---

## 2 · FAILURE PROTOCOL

When a device gate fails or a release materially violates the approved plan:

1. Stop. Do not patch forward.
2. Identify the last owner-approved baseline.
3. Roll back/rebuild from that clean baseline.
4. Add the failed approach and evidence to this graveyard.
5. Update `UI-V2-MASTER-PLAN.md` with the failure, open questions, and new release status.
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
- `UI-V2-MASTER-PLAN.md` records the exception before implementation;
- the acceptance gate includes a regression check for the original failure.

---

## 4 · CHANGE LOG

**v1.2.0 · 2026-08-22.** Buried the R4.9.1 wrapper/test-loader, nearest-center overlap resolver, opacity-only far-side repair, and pointer-up DOM retargeting as G18-G21. Exact sphere selection must retain the stable visible `fileId` captured at gesture start; the authoritative application is the only test artifact.

**v1.1.0 · 2026-08-22.** Recorded the failed R4.7/R4.8 Explore anchoring strategy and pinch-layout coupling as G16-G17. Governance recovery is rollback to the R4.7 baseline, then rebuild the pointer and zoom behavior from the amended canonical plan rather than patching R4.8.

**v1.0.0 · 2026-08-12.** Created from the UI-V2 development failures and governance lessons recovered from the project discussion. Initial entries G1-G15 establish hard vetoes around patch-forward development, workflow payload experiments, duplicate chrome, incorrect Table semantics, runtime observer stabilization, cache fragmentation, deployment inference, and unauthorized implementation.
