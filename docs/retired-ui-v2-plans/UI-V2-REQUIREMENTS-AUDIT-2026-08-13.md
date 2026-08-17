# UI-V2 Final Requirements Audit — 2026-08-13

**Audit target:** approved clean baseline `a6de049f8c8b9798c610984b35b9d8ade57d0fa5` (`ui-v2.html`).

**Authority:** `ui-v2-plan.md` final curation contract + `UI-V2-GRAVEYARD.md` vetoes.

**Purpose:** Publish the source audit finding for every enumerated requirement and the required remediation. This is an audit only; it does not authorize or perform application changes.

## Summary

- PASS: 1
- PARTIAL / PARTIAL-FAIL: 6
- FAIL / FAIL-OPPOSITE: 11
- The clean baseline is a suitable construction input because it predates the buried patch-forward/runtime-override work, but it is **not** requirements-complete.
- Implementation must occur in `ui-v2-candidate.html`; production `ui-v2.html` remains untouched until the integrated candidate passes H0-H8 and the owner device gate.

## Item-by-item findings and remediation

| # | Requirement | Finding in clean baseline | Status | Required remediation / acceptance evidence |
|---|---|---|---|---|
| 1 | Focus chrome is canonical across Focus, Explore inspection, and Table | Focus has the canonical controls, but Explore/Table define separate surface controls rather than owning behavior through the actual Focus controls. | **FAIL** | H2: refactor inspection-state control ownership so the actual Focus stack selector, Details, image counter, heart and trash are the behavioral controls in Focus/Explore/Table inspection. Remove competing behavioral ownership; no fake/duplicate chrome. Verify DOM ownership and actions, not visual similarity. |
| 2 | Table has three configurable tag targets, not Inbox/Maybe and not permanently hard-coded YES/MAYBE/NO | Baseline Table has four stack destinations: KEEP/TRASH/INBOX/MAYBE. These are stack semantics, not configurable folder tag targets. | **FAIL** | H3: exactly three target definitions backed by folder-tag configuration, independent of working stack. YES/MAYBE/NO may be initial labels only. Assert exactly three active tag targets and no architectural dependency on stack IDs. |
| 3 | Long-press renames those tags | No target long-press rename behavior exists. | **FAIL** | H3: implement pointer/touch long-press with drag discrimination. Long-press opens minimal rename UI; commit persists; cancel changes nothing; normal drag still repositions target. |
| 4 | Tags are folder-specific and shared across that folder | Existing file `TagService` is reusable, but there is no three-target folder configuration shared by Explore and Table. | **PARTIAL** | H3: add folder-keyed tag-target configuration using existing storage conventions. Names and target positions persist per folder; Explore and Table read the same configuration; switching stacks does not redefine tags. |
| 5 | Table starts with current stack, and stack selector switches stacks | Current-stack handoff/foundation exists, but Table does not use the canonical Focus stack selector as required. | **PARTIAL** | H2/H3: Table opens from `state.currentStack`; actual Focus selector is available in Table and switches the working stack without changing folder tag definitions. Test multiple stack switches and return state. |
| 6 | Explore: sphere → medium → large, exact X hierarchy | Required three-state inspection hierarchy is absent in the clean baseline. | **FAIL** | H2: explicit state machine `sphere -> medium -> large`; medium X restores sphere selection/location; large X returns to medium; tapping medium image enters large. Verify exact transitions and no state reset. |
| 7 | Explore sorting/tagging activates at medium, not sphere-thumbnail state | Baseline exposes stack destinations on the sphere, the opposite of the final contract. | **FAIL / OPPOSITE** | H2/H3: sphere has zero tag targets. Medium creates/exposes exactly the three current-folder tag targets. Leaving medium removes/deactivates them. Harness asserts zero sphere targets. |
| 8 | Table permits fling-to-tag directly from thumbnails and medium | Baseline has thumbnail physical sorting to stacks; tag semantics and medium inspection fling are absent. | **PARTIAL** | H3/H5: convert destinations to folder tags while retaining thumbnail fling. Add the same tag fling in medium. Verify each gesture applies the tag exactly once and preserves current-stack semantics. |
| 9 | Medium Explore/Table adds Focus-style previous/next navigation | Medium inspection model and Focus-style sequential navigation are absent. | **FAIL** | H2: reuse Focus navigation semantics/handlers where possible. Previous/next changes by file identity within current stack and keeps chrome/tag context synchronized. Verify boundaries and reconciliation after mutation. |
| 10 | Large Explore/Table essentially behaves as Focus | Required large inspection state/parity is absent. | **FAIL** | H2: large uses canonical Focus chrome/actions/navigation; no tag fling required. X must not overlap Details and returns to medium with same file/state. Parity tests cover stack selector, Details, favorite, trash, previous/next. |
| 11 | Tag target → Grid with tag implicitly filtered | No tag-target-to-filtered-Grid route exists. | **FAIL** | H4: tapping a tag target opens normal Grid with implicit tag context. Grid capabilities remain available. Record origin context and verify filtered contents plus return to origin. |
| 12 | Stack selector → Grid for that stack | Canonical stack selector has no required direct Grid entry path. | **FAIL** | H4: minimally extend canonical selector with Grid entry for selected/current stack; do not add a parallel selector. Verify correct stack filter/context and origin capture. |
| 13 | Grid remembers Focus/Explore/Table origin and returns to exact surface, stack, reconciled image | `ModeNavigation` provides partial foundation, but the required complete origin object and file-identity reconciliation are absent. | **PARTIAL** | H4: origin object at minimum `{surface, folder, stack, fileId, tag, inspectionLevel}`. On exit reconcile by file ID after no-op/delete/move/tag/bulk, then return to exact originating surface/inspection state. Never restore only stale numeric index. |
| 14 | Shared thumbnail/cache architecture and explicit performance measurements | Explore/Table share an `ExploreThumbnailCache` precursor, but other surfaces differ and required metrics are absent. | **PARTIAL** | H1: instrument baseline first. Consolidate matching renditions behind one reusable thumbnail service/cache across Sort/Grid/Focus/Explore/Table. Visible/near-visible first; durable cache must not block first paint; movement must not refetch/recreate unchanged thumbnails. Record before/after first useful paint, Explore fill, Table fill, provider requests, cache hits/misses, movement refetches and recreation/redecode where measurable. |
| 15 | Google Drive idle/expired-thumbnail recovery | URL/fallback foundations exist, but expired temporary URL recovery by file identity is not proven. | **PARTIAL / FAIL** | H1: instrument stale/error path. On failed/expired Drive rendition, re-resolve by stable file identity, update shared cache/resource, and preserve visible/navigation state. Controlled stale-URL test plus real idle/provider gate; do not claim root cause without evidence. |
| 16 | Idle state restoration | Provider/folder/stack/file/Focus persistence foundations exist, but all-surface + inspection + Grid-origin restoration is incomplete. | **PARTIAL** | H6: persist/reconcile active surface, folder, stack, fileId, inspection level and Grid origin. Visibility/idle/auth refresh must not reset to folder selection then jump to image. Test Focus, Explore sphere/medium/large, Table thumbnail/medium/large, and Grid return context. |
| 17 | Sort desktop pills shortened and trash moved clear of footer | Baseline desktop pills use roughly 12px vertical padding / 18px type; bottom trash sits only 20px from viewport bottom and can conflict with footer. | **FAIL** | H7: desktop-only reduction of pill vertical height and geometry-based footer clearance for trash. Preserve Sort symmetry, positions of other targets, gestures and established behavior. Harness asserts no trash/footer intersection. |
| 18 | Rejected directions documented so they do not creep back in | `UI-V2-GRAVEYARD.md` documents the rejected approaches and veto rules. | **PASS** | H8: keep graveyard authoritative. Add automatable forbidden-structure checks where practical: no runtime stabilization observer, no fake Focus controls, no Inbox/Maybe-only Table, no immutable YES/MAYBE/NO architecture, no Explore sphere tag targets, no image-image collision resolver, no per-surface cache forks. |

## Remediation order / internal gates

The findings map to the integrated-candidate gate sequence already established in `ui-v2-plan.md`:

1. **H0 — Baseline integrity:** instantiate candidate from exact `a6de049`; prove startup/Sort/Focus/Grid/footer switcher and record baseline identity.
2. **H1 — Thumbnail/performance:** instrumentation first, shared cache/service, visible-first behavior, movement-refetch checks, Drive recovery.
3. **H2 — Inspection/Focus chrome:** canonical actual Focus controls; Explore and Table medium/large state machines; prev/next; exact X hierarchy.
4. **H3 — Folder tag targets:** exactly three configurable folder tags, shared Explore/Table, long-press rename, drag/persist, stack-independent.
5. **H4 — Grid round-trip:** tag->filtered Grid, stack->Grid, complete origin context and file-ID reconciliation.
6. **H5 — Table curation physics:** current-stack scatter; thumbnail + medium fling-to-tag; actual Sort trail; retain target/rim/bank/vacuum/capture; no image-image collisions.
7. **H6 — Resume integrity:** surface/folder/stack/file/inspection/Grid-origin restoration across idle/auth refresh.
8. **H7 — Sort desktop fit:** shorter desktop pills and footer-safe trash geometry only.
9. **H8 — Integrated regression:** all automatable gates green together; remaining real-device/provider gates explicitly MANUAL; then one owner-facing candidate.

## Implementation constraints

- Build from the approved clean baseline; do not patch forward from damaged later snapshots.
- Work only in `ui-v2-candidate.html` until owner PASS.
- Production `ui-v2.html` is immutable during candidate construction.
- Reuse actual Focus controls and actual Sort trail implementation; do not create visual lookalikes.
- Instrument unknown performance/Drive causes before changing architecture or claiming cause.
- A green automated harness means eligible for owner testing, not production approval.
- After H8 eligibility, verify the published candidate artifact itself and provide the cache-busted test URL automatically.
