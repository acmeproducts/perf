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

**v1.0.0 · 2026-08-12.** Created from the UI-V2 development failures and governance lessons recovered from the project discussion. Initial entries G1-G15 establish hard vetoes around patch-forward development, workflow payload experiments, duplicate chrome, incorrect Table semantics, runtime observer stabilization, cache fragmentation, deployment inference, and unauthorized implementation.
