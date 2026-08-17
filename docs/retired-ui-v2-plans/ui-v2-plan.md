<!-- UI-V2-PLAN v2.0.0 -->
# UI-V2 EXPLORER RELEASE PLAN — TARGET APP RELEASE v1.9

**Plan revision:** v2.0.0  
**Status:** PLAN ONLY — implementation is not yet authorized by this document update.  
**Production artifact:** `ui-v2.html`  
**Repository:** `acmeproducts/perf`  
**Locked restored baseline commit:** `60bb757728045dd09323c136bef1245ab5fb3fa5`  
**Locked restored `ui-v2.html` blob:** `aac15d26f5e7e6f415a3e15fdfde947fc91908ff`  
**Current static app marker:** `Orbital8 UI · v1.8 focus-standard`  
**Target app release:** `v1.9`  
**Graveyard:** `UI-V2-GRAVEYARD.md`

**Owner ruling for this release:** fix Explorer first, deliver the entire approved Explorer scope together in one release, reuse established behavior instead of inventing substitutes, and do not begin implementation until this plan is reviewed.

---

## 1 · RELEASE CONTRACT

This is a single, complete Explorer release. There are no partial owner-facing releases and no interim production patches.

1. Construction starts only from the locked restored `main` snapshot above.
2. The shipped application remains named **`ui-v2.html`**.
3. The application release identifier advances from **v1.8 → v1.9** only when the complete Explorer scope and all release gates pass.
4. Before implementation, enumerate every existing static build/release marker and every footer occurrence of the release identifier. At release time, update all of those existing locations consistently to `v1.9`; do not create a parallel version mechanism.
5. Do not invent replacement controls, navigation effects, Grid behavior, or inspection chrome. Reuse the existing implementations identified in this plan.
6. Explorer is the only feature surface being changed in this release except for the minimal shared/internal plumbing required to reuse existing Sort, Focus, Grid, cache, and version infrastructure without regression.
7. Table/tag-stack work described in §9 is roadmap context only and is explicitly **out of scope** for v1.9.
8. Any implementation failure that compromises the restored baseline follows the graveyard failure protocol rather than patching forward from a damaged result.

---

## 2 · NON-NEGOTIABLE REUSE RULES

The implementation must reuse existing application behavior rather than create lookalikes.

- **Comet navigation:** Medium and Large Explorer navigation must use the actual established Sort left/right tap-and-swipe comet-trail behavior. A similarly named or visually approximate effect does not satisfy this requirement.
- **Inspection controls:** reuse the actual Focus stack selector, Details behavior, favorite heart behavior, and trash behavior. Do not create Explorer-owned duplicate behavioral controls.
- **Grid:** reuse the existing Grid surface and its existing Grid→Sort exit/reconciliation behavior. Do not create an Explorer-specific Grid.
- **Stack selection:** reuse the existing stack model and stack switching behavior. Grid-entry chips are adjuncts to those existing stack rows, not a new stack system.
- **Image identity:** navigation and Grid return must reconcile by the application’s existing stable file/image identity rather than array position alone.
- **Thumbnail/cache plumbing:** use or extend the existing reusable thumbnail/cache path. Do not add another per-surface cache that duplicates provider work.

---

## 3 · EXPLORER SPHERE: THUMBNAIL CACHE AND PERFORMANCE

### E1 — Active thumbnail count is controlled by the existing floating image-count control

Let `N` be the number of images currently selected by the existing floating image-count control.

- Explorer’s active sphere set is exactly those `N` images selected by the existing control and existing ordering/filter rules.
- All `N` active thumbnails must be prepared through the cache path so sphere navigation does not wait on routine thumbnail acquisition.
- Increasing the control from `N` to `M` adds the newly required images to the cache without invalidating already cached images.
- Decreasing the control does **not** immediately discard thumbnails that were already prepared.

### E2 — LRU retention policy

The cache must behave as an LRU-backed working set:

- The current active `N` thumbnails are **pinned** and are not eviction candidates while they are part of the active Explorer set.
- Previously cached thumbnails outside the active set remain available as LRU entries so increasing the image count again can reuse them immediately.
- Eviction is permitted only from non-active entries and only when the cache reaches its established capacity/memory-pressure boundary.
- Changing the image-count control downward must not itself trigger a purge of the now-inactive thumbnails.
- Re-adding a still-resident LRU thumbnail must be a cache hit, not a provider refetch/redecode cycle.

No new arbitrary numeric cache multiplier is specified by product requirements. The implementation must use an evidence-based capacity appropriate to the existing cache/memory architecture while preserving the pin-active/LRU-inactive rule above.

### E3 — No thumbnail churn when the sphere moves

Sphere movement is positional navigation, not a thumbnail-loading event.

Once the active thumbnails are prepared:

- paging/panning the sphere left, right, up, or down must not recreate unchanged thumbnail elements merely because their screen positions changed;
- position changes must not re-resolve provider thumbnail URLs;
- position changes must not refetch unchanged thumbnails;
- position changes must not cause avoidable image decode/recreation work;
- cache identity must remain stable while images move on and off screen;
- the application should update geometry/composited position rather than rebuild the thumbnail population.

The performance target is immediate movement through an already prepared sphere. The browser compositor may of course paint changed pixels; the prohibited work is **application-level thumbnail reconstruction/refetch/redecode caused only by sphere movement**.

### E4 — Visible result

With the active set warm, paging the sphere must not show routine blank-thumbnail flashes, loading placeholders, or progressive refilling caused by movement alone.

---

## 4 · EXPLORER SPHERE: INDEPENDENT SIZE CONTROLS

### E5 — Floating percentage control scales thumbnails

The existing floating percentage-size control controls **thumbnail rendered scale**.

- Changing the percentage changes the displayed size of Explorer thumbnails.
- It does not change which images are in the active set.
- It does not invalidate or repopulate the thumbnail cache merely because the rendered size changed, unless the existing rendition architecture genuinely requires a different source rendition; any such source change must be measured and justified rather than implicit.
- It does not act as the sphere zoom control.

### E6 — Pinch zoom scales the sphere

Pinch zoom independently changes the **overall sphere scale/radius/spatial extent**.

- Pinch zoom may make the sphere smaller or larger.
- The sphere is allowed to become larger than the viewport.
- When larger than the viewport, the user can page/pan through the sphere left/right/up/down using the established Explorer movement model.
- Pinch zoom does not change the floating thumbnail percentage setting.
- Pinch zoom does not change the active image count.
- Pinch zoom must not invalidate already prepared thumbnails merely because their positions change.

### E7 — Independence invariant

These controls are orthogonal:

- **image-count control → number of active/cached images;**
- **percentage control → thumbnail display scale;**
- **pinch → sphere spatial scale.**

Changing one must not silently rewrite the state owned by either of the other two.

---

## 5 · THUMBNAIL → MEDIUM → LARGE INSPECTION HIERARCHY

### E8 — Thumbnail → Medium

A single tap on an Explorer sphere thumbnail opens that exact image in **Medium** inspection.

Medium must provide:

- the existing stack selector;
- the existing favorite heart behavior;
- the existing trash behavior;
- the existing Details behavior;
- left/right image navigation by both tap and swipe using the actual Sort comet-trail implementation;
- stable selected-image identity as navigation advances backward/forward;
- a top-center **X** that returns to the Explorer thumbnail sphere with the corresponding image/context preserved.

Reuse existing Focus chrome/handlers. Required controls above must not be reimplemented as Explorer-specific lookalikes. Existing Focus chrome that is not contradicted by this plan may remain as part of the reused canonical control set.

### E9 — Medium → Large

Tapping the image while in Medium opens that image in **Large** inspection.

Large must:

- use the same image display size/format already established by Sort’s large image presentation;
- retain the same selected-image identity;
- support left/right tap navigation with the actual Sort comet trail;
- support left/right swipe navigation with the actual Sort comet trail;
- retain the existing stack selector, favorite, trash, and Details behaviors;
- provide a top-center **X** that returns to Medium on the same image.

### E10 — X hierarchy and placement

The inspection hierarchy is exactly:

`Explorer thumbnail sphere → Medium → Large`

and closes exactly:

`Large X → Medium`  
`Medium X → Explorer thumbnail sphere`

For both Medium and Large:

- X is top-center;
- X must remain readily tappable/clickable;
- X must not occlude or compete with the Details control;
- entering/exiting a level must not unnecessarily reacquire the displayed image.

---

## 6 · MEDIUM/LARGE STACK SELECTOR → GRID

### E11 — Grid chip beside every stack row

In both Medium and Large, opening the existing stack selector presents the existing stack list. Beside each stack name, provide the required Grid-entry chip.

The chip:

- represents **Grid for that stack in the current folder**;
- uses the existing Grid surface;
- does not create a new stack type;
- does not alter the stack simply by entering Grid;
- is available consistently from both Medium and Large.

### E12 — Grid return contract

When Grid is entered from an Explorer Medium/Large stack chip:

1. preserve enough file/folder/stack context to identify the corresponding image;
2. run the existing Grid for the selected stack/folder;
3. on Grid exit, return to **Sort**, not back to Explorer inspection;
4. use the established Grid→Sort reconciliation behavior so the appropriate corresponding image is at center stage, matching the existing Sort/Grid round-trip behavior.

Do not invent a second Explorer-specific return algorithm. If Grid actions changed/deleted/moved the originally selected file, the existing Grid→Sort reconciliation rule remains authoritative for choosing the resulting center image.

---

## 7 · RELEASE TEST GATES

No v1.9 production release is allowed until all applicable gates below pass together. A static/code gate permits device testing; it is not a substitute for device/provider behavior.

| Gate | Requirement coverage | Required evidence | Release blocker |
|---|---|---|---|
| **G0 — Baseline/identity** | Release contract | Build is derived from commit `60bb757…` / blob `aac15d26…`; source artifact remains `ui-v2.html`; no unrelated rollback/forward lineage | Yes |
| **G1 — Count/cache fill** | E1 | For multiple image-count values, active count exactly matches control; all active entries reach prepared cache state; increase adds only required new entries | Yes |
| **G2 — LRU retention** | E2 | Increase → decrease → increase sequence demonstrates retained non-active entries become cache hits; active entries are never evicted; eviction occurs only from non-active LRU entries at capacity/memory pressure | Yes |
| **G3 — Movement churn** | E3–E4 | Instrument provider requests, cache hits/misses, image element/source recreation and decode/recreation where measurable; warm left/right/up/down sphere movement produces zero movement-caused provider refetches and zero avoidable thumbnail population rebuilds | Yes |
| **G4 — Thumbnail percentage** | E5/E7 | Percentage control visibly scales thumbnails without changing active count or sphere pinch state; warm cache remains reusable | Yes |
| **G5 — Pinch/sphere scale** | E6/E7 | Pinch changes sphere extent independently; sphere can exceed viewport; left/right/up/down access remains usable; active count and thumbnail percentage remain unchanged | Yes |
| **G6 — Medium inspection** | E8/E10 | Single-tap selected thumbnail opens correct image; actual Focus controls work; tap/swipe left/right uses actual Sort comet behavior; top-center X returns to Explorer sphere | Yes |
| **G7 — Large inspection** | E9/E10 | Medium image tap opens Large at Sort-equivalent format; actual controls work; tap/swipe comet navigation works; X is top-center, clear of Details, and returns to Medium on same image | Yes |
| **G8 — Stack/Grid round-trip** | E11/E12 | Every Medium/Large stack row has working Grid chip; correct folder/stack Grid opens; exit lands in Sort with existing reconciliation and appropriate image centered | Yes |
| **G9 — Existing behavior regression** | Reuse rules | Sort comet behavior remains unchanged; Focus controls remain canonical; Grid normal entry/exit still works; favorite/trash/details/stack actions retain existing semantics | Yes |
| **G10 — Performance/device gate** | E1–E7 | On representative desktop and touch device with real provider data, warm sphere paging feels immediate and shows no routine movement-caused blank/refill cycle; pinch and independent sizing remain stable | Yes |
| **G11 — Release stamping** | Release contract | Enumerate all pre-existing release markers/footer locations before edit; all intended locations show `v1.9`; no stale `v1.8` remains in those release-identification contexts; static header identity is verifiable in shipped HTML | Yes |
| **G12 — Published artifact verification** | Release contract | Published `ui-v2.html` matches the gated production commit/blob and visibly reports the intended v1.9 identity; repository commit success alone is not accepted as runtime proof | Yes |

### Minimum cache/performance instrumentation for G1–G3

Capture at least:

- active image-count value;
- cache resident count;
- active/pinned count;
- cache hit count;
- cache miss count;
- LRU eviction count;
- provider thumbnail request/re-resolution count;
- movement-caused source replacement count;
- movement-caused thumbnail element recreation count;
- decode/recreation count where the browser/runtime exposes a reliable measurement.

Instrumentation may be development-only, but the measured behavior must be represented honestly. Do not claim “no repaint” from source inspection alone.

---

## 8 · IMPLEMENTATION ORDER — ONE RELEASE, INTERNAL SEQUENCE ONLY

These steps are engineering order, **not separate releases**.

1. **Baseline lock and inventory** — confirm restored v1.8 snapshot, locate existing Explorer count/percentage/pinch controls, cache path, Sort comet behavior, Focus controls, stack selector, Grid entry/exit, and all release/footer identifiers.
2. **Cache first** — implement/adjust active-set pinning, LRU retention, count-change behavior, and instrumentation. Prove G1–G3 before changing inspection UX.
3. **Independent sphere sizing** — wire percentage to thumbnail display scale and pinch to sphere scale without coupling or cache churn. Prove G4–G5.
4. **Medium** — thumbnail tap, canonical controls, actual Sort comet navigation, top-center X. Prove G6.
5. **Large** — Medium→Large, Sort-equivalent image format, canonical controls, actual comet navigation, X→Medium. Prove G7.
6. **Stack Grid chips** — expose chips in Medium/Large selector and reuse existing Grid→Sort round-trip. Prove G8.
7. **Integrated regression** — run G0–G10 together against the same candidate.
8. **Release identity** — only after functional gates are green, bump all existing release-identification locations from v1.8 to v1.9 and run G11.
9. **Publish exact gated `ui-v2.html`** — no post-gate functional edits. Verify the published artifact and run G12.
10. **Owner device review** — the v1.9 release is the single review build for this scope.

---

## 9 · ROADMAP CONTEXT — EXPLICITLY NOT PART OF v1.9

This section records direction so the Explorer architecture does not block the next phases. It does **not** authorize these changes in v1.9.

### R1 — Table follows a proven Explorer foundation

If Explorer v1.9 is as solid as expected, Table should reuse the proven Explorer foundations rather than start another implementation family: thumbnail/cache behavior, thumbnail sizing, inspection hierarchy, navigation reuse, and Grid integration should be candidates for direct reuse/copy of the validated patterns.

### R2 — Table tag-stack phase

The later Table phase is expected to:

- add the tag-stack curation destinations on the Table thumbnail surface;
- remove the Sort-stack destination treatment from that Table curation surface;
- keep Table thumbnails as the direct curation entry surface;
- preserve the reusable inspection/cache foundations proven in Explorer.

Exact Table requirements and gates will be written before that release; this paragraph is direction, not an implementation specification.

### R3 — Later Explorer tag-stack backport

Only after the Table tag-stack behavior is proven, backport those tag-stack destinations to **Explorer Medium only**.

- Do **not** put tag-stack targets on the Explorer sphere/thumbnail surface.
- Explorer sphere remains inspection-first.
- The later backport gets its own reviewed requirements and tests.

---

## 10 · TRACEABILITY MATRIX

| Requirement | Product decision | Test gate(s) |
|---|---|---|
| E1 | Floating image-count value defines active thumbnails and cache-fill target | G1 |
| E2 | Keep decreased-count thumbnails in LRU; active set pinned | G2 |
| E3 | Sphere movement does not trigger thumbnail rebuild/refetch/redecode churn | G3 |
| E4 | Warm movement has no routine blank/refill cycle | G3, G10 |
| E5 | Floating percentage scales thumbnails | G4 |
| E6 | Pinch scales sphere and may exceed viewport | G5 |
| E7 | Count / thumbnail % / pinch are independent | G4, G5 |
| E8 | Thumbnail → Medium; Focus controls; actual Sort comet nav; X→sphere | G6, G9 |
| E9 | Medium → Large; Sort-equivalent format; actual comet nav | G7, G9 |
| E10 | X is top-center; Large→Medium→sphere; Details not occluded | G6, G7 |
| E11 | Medium/Large stack selector has Grid chip beside each stack | G8 |
| E12 | Explorer-started Grid exits to Sort with appropriate image centered | G8, G9 |
| Release | One complete `ui-v2.html` v1.9 release with consistent static/footer identity | G0, G11, G12 |
| Roadmap | Table/tag-stack work deferred | Regression scope check |

---

## 11 · CURRENT EXECUTION STATE

**2026-08-13:** Plan rewritten after owner restored `ui-v2.html` to a known, usable v1.8 snapshot. No application code was changed in this planning step. Implementation remains blocked pending owner review of this plan.

**Next authorized action after plan approval:** implement the complete v1.9 Explorer scope above against the locked restored baseline, run G0–G12, then publish one exact `ui-v2.html` release.

---

## APPENDIX A · SUPERSEDED PREVIOUS PLAN — PRESERVED VERBATIM

The entire immediately preceding operative plan is retained below verbatim for historical traceability. It is **superseded** by the v2.0.0 Explorer plan above and does not authorize implementation where it conflicts with the current owner ruling.

<!-- UI-V2-PLAN v1.3.9 -->
# UI-V2 MASTER PLAN v1.3.9

**Owner:** acmeproducts — sole product decision-maker/device-gate authority.  
**Builder:** ChatGPT/Codex when authorized.  
**Production:** `ui-v2.html`  
**Integrated candidate:** `ui-v2-candidate.html`  
**Detailed requirements audit:** `UI-V2-REQUIREMENTS-AUDIT-2026-08-13.md`  
**Graveyard:** `UI-V2-GRAVEYARD.md`

**Every UI-V2 turn starts by reading this plan + graveyard and ends by updating this plan. Conversation is not project state.**

---

## 1 · EXECUTION MODEL — ONE OWNER-FACING CANDIDATE

Owner ruling 2026-08-13: **do not create eight owner-tested releases.** Build one integrated candidate and use an internal harness to gate each requirement group.

Approved clean input: `a6de049f8c8b9798c610984b35b9d8ade57d0fa5`.

- Production `ui-v2.html` is read as the deployment baseline and is not modified until the integrated candidate is frozen and validated locally.
- **All development, build, harness, syntax, responsive, simulated-sync and integration validation lives only in the builder VM. GitHub is the production patch/deployment endpoint, not a workspace.**
- No repository branches, candidate files, harnesses, manifests, staging files, temporary blobs, experimental commits or test surfaces are permitted.
- Internal H0-H8 gates run locally and are engineering checkpoints, not releases.
- After local H0-H8 validation freezes the candidate, GitHub receives only the exact production `ui-v2.html` replacement (plus governance-required plan updates).
- If production validation fails, fix and revalidate locally, then roll forward or roll back with a production commit; never improvise in the repository.
- Verify GitHub Pages is serving the exact production commit, then provide a cache-busted Pages URL automatically.

### Internal gates

| Gate | Scope | Required evidence |
|---|---|---|
| H0 | Baseline integrity | correct lineage; startup/provider smoke; Sort/Focus/Grid/footer switcher; no fatal loop |
| H1 | Thumbnail/performance | shared service; instrumentation; first-paint/fill/request/cache/refetch metrics; Drive recovery |
| H2 | Inspection/Focus chrome | actual Focus controls canonical; Explore sphere→medium→large; Table thumbnail→medium→large; prev/next; exact X hierarchy |
| H3 | Folder tags | exactly 3 configurable folder tags; shared Explore/Table; long-press rename; drag/persist; stack-independent |
| H4 | Grid round-trip | tag→filtered Grid; stack→Grid; origin context; exact reconciled return after no-op/delete/move/tag/bulk |
| H5 | Table curation | current-stack scatter; thumbnail+medium fling; actual Sort trails; target effects retained; image-image collisions absent |
| H6 | Resume | surface/folder/stack/file/inspection/Grid origin restored after idle/auth refresh |
| H7 | Sort desktop fit | pills shorter; trash clears footer; symmetry/gestures unchanged |
| H8 | Integrated regression | H0–H7 green together; published candidate verified; desktop+touch/provider manual gates explicit |

**H8 is the only owner-facing release gate.**

---

## 2 · CURRENT EXECUTION STATE

### Completed

1. Retired the eight owner-facing release sequence.
2. Locked clean baseline `a6de049` and requirements audit A1-A18.
3. Restored VM-first development/test discipline; repository-hosted harness/manifest artifacts were removed.
4. Developed and fixture-tested H1 patch logic in the VM.
5. GitHub patch workflow rebuilt `ui-v2-candidate.html` from locked baseline and applied H1.
6. H1 static markers and inline JavaScript syntax gate passed.
7. Production `ui-v2.html` remains untouched.

### Current status

**Candidate is NOT owner-testable yet.** H1 code is integrated and static/syntax validation is green; H2-H7 remain internal work. Real provider/performance evidence stays explicit for the final integrated device gate.

### Active execution — VM-first patch discipline

Owner correction 2026-08-13: patching is the established delivery method; the mistake was using GitHub itself as the development/harness workspace. The corrected discipline is VM-first development/testing, GitHub patch application only.

H1 patch logic was developed and fixture-tested in the VM, then applied by GitHub to a candidate rebuilt from locked baseline `a6de049`. The patch workflow and inline JavaScript syntax validation passed. Production `ui-v2.html` remains untouched.

### Next internal execution

1. Continue H2 inspection/Focus-chrome work in the VM, then apply the tested patch to the same candidate lineage.
2. Continue H3-H7 internally using the same VM-first → tested patch → GitHub-apply method.
3. Keep H1 real-provider/expiry measurements explicit and collect them at the final integrated gate rather than creating an owner-facing H1 release.
4. Present only the fully integrated H8 candidate to the owner.

---

## 3 · FINAL CURATION CONTRACT

### A1 — Canonical Focus chrome
Focus is canonical across Focus and Explore/Table inspection: top-left stack selector; top-right Details; bottom-left image #/total; bottom-center actual Focus heart; bottom-right actual Focus trash. No fake duplicate behavioral controls.

### A2–A4 — Three folder tag targets
Exactly three active targets. They are configurable **tags**, not stacks. Long-press renames. Names and positions persist per folder and are shared by Explore/Table in the same folder. Switching stacks does not redefine them. YES/MAYBE/NO may be defaults only.

### A5 — Table current stack
Table opens on the current stack. Canonical stack selector switches stacks without altering folder tag definitions.

### A6–A7 — Explore state model
Sphere has no tag targets. Tap sphere thumbnail → Medium. Medium enables Focus chrome, prev/next, exactly three folder tags and fling-to-tag. Medium X → Sphere. Tap Medium image → Large. Large behaves essentially as Focus; X clear of Details; Large X → Medium.

### A8–A10 — Table inspection
Table thumbnail can fling directly to tag. Tap thumbnail → Medium. Medium uses Focus chrome, prev/next, three tags and fling. Tap Medium → Large. Large behaves as Focus. X hierarchy: Large → Medium → Table.

### A11–A13 — Grid integration
Tag target → normal Grid with implicit tag filter. Stack selector → Grid for current stack. Grid origin includes at minimum `{surface, folder, stack, fileId, tag, inspectionLevel}`. Exit returns to exact originating Focus/Explore/Table context and reconciles by file identity after no-op/delete/move/tag/bulk changes.

### A14 — Shared thumbnail/cache architecture
One reusable thumbnail service/cache for matching renditions across Sort/Grid/Focus/Explore/Table. Visible/near-visible first. Durable persistence does not block first useful paint. Moving sphere/Table items does not recreate/refetch unchanged thumbnails. Instrument first useful paint, Explore fill, Table fill, provider requests, cache hits/misses, movement refetches and image recreation/redecode where measurable.

### A15 — Google Drive idle/expired thumbnail recovery
On expired/failed Drive thumbnail URL, re-resolve by file identity and recover without destroying visible image/navigation state. Prove with instrumentation + real idle/device gate.

### A16 — Resume integrity
Persist/reconcile active surface, folder, stack, file, inspection level and Grid origin. Background/auth/provider refresh must not reset to folder selection and later jump to an image.

### A17 — Sort desktop fit
Reduce desktop pill height. Raise bottom trash clear of footer/safe area. Preserve established Sort symmetry and gestures.

### A18 — Rejected directions
Graveyard veto remains authoritative: no forward patching damaged snapshots; no workflow-embedded app payloads; no MutationObserver stabilization; no fake Focus chrome; no Inbox/Maybe-only Table; no immutable YES/MAYBE/NO architecture; no Explore sphere tag targets; no image-image Table collisions; no per-surface thumbnail caches; no deployment claims without live verification.

---

## 4 · CLEAN BASELINE AUDIT

Baseline `a6de049` findings:

| Requirement | Baseline | Remediation gate |
|---|---|---|
| A1 Focus canonical | FAIL — Explore/Table own separate controls | H2 |
| A2 three configurable tag targets | FAIL — four hard-coded stack destinations | H3 |
| A3 long-press rename | FAIL | H3 |
| A4 folder-specific shared tags | PARTIAL — TagService exists, target config absent | H3 |
| A5 Table current stack | PARTIAL — handoff exists, canonical selector absent | H2/H3 |
| A6 Explore 3-state hierarchy | FAIL | H2 |
| A7 Explore tags only at medium | FAIL/OPPOSITE — sphere has destinations | H2/H3 |
| A8 Table thumbnail+medium tag fling | PARTIAL — thumbnail stack sorting only | H3/H5 |
| A9 medium prev/next | FAIL | H2 |
| A10 large behaves as Focus | FAIL | H2 |
| A11 tag→filtered Grid | FAIL | H4 |
| A12 stack selector→Grid | FAIL | H4 |
| A13 exact Grid origin return | PARTIAL foundation only | H4 |
| A14 shared cache + measurements | PARTIAL — Explore/Table precursor cache; no required all-surface metrics | H1 |
| A15 Drive expiry recovery | PARTIAL/FAIL — foundation exists; recovery unproven | H1 |
| A16 idle restoration | PARTIAL — provider/folder/stack/file/Focus only | H6 |
| A17 Sort desktop fit | FAIL — pills too tall; trash too low | H7 |
| A18 graveyard/rejected directions | PASS | H8 regression veto checks |

**Detailed findings and remediation instructions:** `UI-V2-REQUIREMENTS-AUDIT-2026-08-13.md`.

Reusable foundations: actual Focus chrome; ModeNavigation/current-stack handoff; TagService/file tags; Grid; actual Sort comet trail; partial persistence/provider infrastructure.

Do not treat precursor Explore sphere destinations, Table four-stack destinations, or separate Explore/Table chrome as final architecture.

---

## 5 · HARNESS DISCIPLINE

Harness result semantics:
- **PASS** — automatable evidence captured.
- **TODO** — final requirement not integrated; blocks candidate.
- **FAIL** — regression/test failure; blocks candidate.
- **MANUAL** — real provider/device/UX behavior that cannot honestly be automated; remains explicit until final owner gate.

Harness must cover static/source contracts, browser structure/geometry, state transitions, persistence serialization and runtime instrumentation. Real Drive expiry, auth refresh, touch feel and final physics/UX remain manual gates.

No fake data may be presented as production proof. Deterministic harness fixtures are allowed only when isolated and explicitly labeled as fixtures.

---

## 6 · OPEN ITEMS

| # | Item | Status |
|---|---|---|
| O1 | Clean baseline | LOCKED: `a6de049...` / blob `1f394365...` |
| O2 | Candidate artifact | H1 candidate rebuilt from locked baseline by tested patch |
| O3 | Harness | VM-LOCAL; repository-hosted harness removed |
| O4 | Candidate lineage | Locked baseline SHA/blob recorded in plan; stale repository manifest removed |
| O5 | H1 performance integration | VM PATCH + STATIC/SYNTAX GATE PASS; real provider/performance evidence remains for integrated device gate |
| O6 | H2 inspection/Focus integration | PENDING H1 internal gate |
| O7 | H3 folder tags | PENDING |
| O8 | H4 Grid round-trip | PENDING |
| O9 | H5 Table curation physics | PENDING |
| O10 | H6 resume integrity | PENDING |
| O11 | H7 Sort desktop fit | PENDING |
| O12 | Default tag names | OPEN presentation choice only |
| O13 | Device matrix | desktop Chrome + touch/mobile minimum; Google Drive; OneDrive smoke where available |
| O14 | Video | DEFERRED |
| O15 | AI/Venice modes | DEFERRED separate family |

---

## 7 · IMMUTABLE WORKING RULES

1. Start every turn by reading plan + graveyard; end every turn by updating plan.
2. Authority: current owner ruling → graveyard → plan → approved baseline → audited donor → references → chat history.
3. On failure: **stop → clean approved input → graveyard → plan → rebuild → harness → publish candidate → verify → owner device gate. Never patch forward.**
4. Unknown cause: instrument first; never declare root cause from reasoning alone.
5. Verify, do not infer. Repository/Actions success does not prove live behavior.
6. Reuse actual controls/handlers/trails/cache patterns; no lookalikes.
7. Current authorization covers harness + integrated candidate. Production promotion requires candidate gate.
8. One owner-facing candidate; H0–H8 are internal engineering gates.
9. Static build identity must be visible and verifiable in candidate/production.
10. Any owner-testable build gets a cache-busted test URL automatically.
11. No stubs, fake controls, fake data or fake pass results.
12. Production `ui-v2.html` remains untouched until candidate PASS; promotion copies exact verified candidate without functional edits.

---

## 8 · TURN LEDGER

### 2026-08-13 · Frozen local candidate deployed to production
**Production patch:** replaced only `ui-v2.html` with the exact locally gated candidate. Commit `45fa45dea68107f5400abfbaddb855b54b64bedd`; production blob `e8ff4b19918bd55d668f5c84b11642f198af05ad`.  
**Repository verification:** default-branch `ui-v2.html` and commit-pinned `ui-v2.html` resolve to the same blob; integrated v2.0 marker is present.  
**Pages verification:** automated browser access was blocked by a dismissed browser security permission twice, so Pages runtime could not be independently inspected in-tool. Cache-busted owner test URL issued against the exact production commit.  
**Next action:** owner device/provider test; on failure fix and revalidate locally, then roll forward or back with a production commit only.


### 2026-08-13 · H1-H7 integrated locally; static/syntax/startup gates green
**VM implementation:** rebuilt from locked clean blob `1f394365...`; added shared file-identity image service and metrics/Drive recovery; Explore/Table medium→large inspection using actual Focus chrome; exactly three folder-scoped renameable tag targets; tag/stack Grid origin and filtered return context; Table current-stack tag fling with Sort comet trails and no image collisions; exact surface/inspection/Grid-origin persistence; desktop Sort pill/trash clearance.  
**Local gates:** H0-H7 source contracts PASS; combined inline JavaScript `node --check` PASS; local browser startup PASS with no fatal screen and no console warnings/errors; exactly 3 Table targets present; 0 legacy Explore destinations; 0 legacy Table stack destinations; desktop trash computed bottom = 76px.  
**Not yet proven:** provider-backed interaction, real thumbnail performance/Drive expiry recovery, authenticated idle refresh, and visible target geometry within an active folder. Those remain required H8/manual evidence.  
**Production:** untouched. No candidate/harness artifacts, branches, staging files, blobs or experimental commits were written to GitHub.  
**Next action:** run authenticated provider/device gates against the local candidate, fix locally if needed, freeze exact HTML, replace only production `ui-v2.html`, verify Pages exact commit, and return cache-busted URL.


### 2026-08-13 · Local baselines acquired; production patch withheld
**VM evidence:** copied current production `main/ui-v2.html` locally (GitHub blob `aac15d26f5e7e6f415a3e15fdfde947fc91908ff`, 729,285 bytes) and independently copied locked clean baseline `a6de049.../ui-v2.html` locally (blob `1f3943655b157ccf10626d32bf4d1679e835867c`, 615,179 bytes).  
**Audit finding:** current production contains later patch-forward v1.2-v1.8 layers, including hard-coded Inbox/YES/MAYBE/NO behavior prohibited by A2-A5 and graveyard G2/G5/G6. It is donor evidence, not approved construction input.  
**Decision:** build continues locally from the locked clean baseline; no application file was written to GitHub and no Pages URL is issued because the integrated H0-H8 candidate is not yet frozen or validated.  
**Next action:** integrate H1-H7 into the local clean candidate, run syntax/runtime/responsive/simulated-sync gates, then replace only production `ui-v2.html` and verify Pages serves that exact commit.


### 2026-08-13 · Integrated local execution started under production-only GitHub governance
**Owner ruling:** all development/build/harness/syntax/responsive/simulated-sync validation is VM-local; GitHub receives no candidate, branch, harness, manifest, staging, temporary or experimental artifact.  
**Start evidence:** read plan v1.3.5 and graveyard v1.0.0; recovered H0-H8/A1-A18 scope; local project mirror contains no working candidate, so production `ui-v2.html` will be copied into the VM as the only application baseline.  
**Authorized repository writes:** this start/end plan ledger and, only after the integrated candidate is locally frozen and validated, the actual production `ui-v2.html`.  
**Next action:** build and validate H0-H8 locally, patch production once, then verify the exact Pages artifact and return a cache-busted URL.


### 2026-08-13 · VM-first patch workflow restored
**Owner correction:** GitHub is the patch/deployment endpoint only; development, harness work and patch testing belong in the builder VM. Patching itself is the tried-and-true delivery method.  
**VM work:** created and fixture-tested the H1 shared-thumbnail patch locally; Python compile + fixture gate passed.  
**GitHub patch:** workflow rebuilt `ui-v2-candidate.html` from locked baseline `a6de049`, applied the tested patch, verified required H1 markers and ran `node --check` on inline JavaScript. Workflow run `31727704851` passed.  
**Repository cleanup:** removed repository-hosted harness; candidate remains only as patched test artifact; stale candidate manifest is removed by this workflow.  
**Production:** untouched.  
**Next action:** continue H2–H7 using the same VM-first → tested patch → GitHub-apply discipline; no owner-facing release until integrated candidate.


### 2026-08-13 · H1 execution started; connector blocked code writes
**Owner instruction:** stop repeating the plan and execute.  
**Work performed:** read plan/graveyard; inspected candidate source around persistence, `ExploreThumbnailCache`, Table thumbnail loading, Explore thumbnail loading and current Grid/Drive image paths; designed H1 as a file-identity keyed shared thumbnail service with visible-first loading, cache/request metrics and Drive recovery.  
**Write attempts:** two normal repository source-file writes were attempted through the connected GitHub write API. Both were rejected by the connector safety layer before commit.  
**Application result:** no H1 application code landed; production and candidate remain unchanged from the prior scaffold state.  
**Decision:** do not circumvent with buried workflow payloads or runtime patches. Treat this as a repository write-path/tooling blocker and resume H1 through an approved code-write path.  
**Next action:** write H1 source through a working repository code-write path, rebuild candidate deterministically from `a6de049`, run harness, then continue H2–H7.

### 2026-08-13 · Harness/integrated candidate execution
**Owner ruling:** no eight releases; use a harness to test each requirement group and integrate them into one candidate.  
**Plan change:** v1.3.0 retired owner-facing R0–R8 releases and adopted H0–H8 internal gates.  
**Repository work:** created `ui-v2-harness.html`; instantiated `ui-v2-candidate.html` using the exact clean-baseline blob; created `ui-v2-candidate-manifest.json`. Production was not touched.  
**Evidence:** candidate instantiation blob = baseline blob `1f3943655b157ccf10626d32bf4d1679e835867c`.  
**Current state:** harness/candidate infrastructure complete; candidate deliberately not owner-facing yet because H1–H7 implementation remains.  
**Next action:** integrate H1 performance/instrumentation into candidate first, run harness, then continue H2–H7 internally. Owner receives one URL only after integrated H8 eligibility.

### 2026-08-13 · Published A1-A18 requirements audit
**Owner request:** audit every enumerated final requirement and publish findings plus remediation instructions where needed.  
**Evidence:** clean baseline `a6de049`; final curation contract; graveyard vetoes; candidate manifest/harness state.  
**Published:** `UI-V2-REQUIREMENTS-AUDIT-2026-08-13.md`.  
**Findings:** PASS 1; PARTIAL/PARTIAL-FAIL 6; FAIL/FAIL-OPPOSITE 11. The clean baseline is suitable construction input but is not requirements-complete.  
**Remediation:** A1/A6/A9/A10→H2; A2/A3/A4→H3; A5→H2/H3; A7→H2/H3; A8→H3/H5; A11-A13→H4; A14-A15→H1; A16→H6; A17→H7; A18→H8 regression veto checks.  
**Application writes:** none in this audit turn.

---

## 9 · CHANGE LOG

**v1.3.9 · 2026-08-13.** Recorded exact production deployment commit/blob, repository identity verification, Pages security-check limitation, and owner test handoff.


**v1.3.9 · 2026-08-13.** Recorded local H1-H7 implementation, green static/syntax/startup gates, exact remaining provider/device H8 evidence, and continued production hold.


**v1.3.9 · 2026-08-13.** Recorded exact local production/clean-baseline blobs and sizes, rejected current patch-forward production as construction input, and withheld production deployment pending local H0-H8 validation.


**v1.3.9 · 2026-08-13.** Recorded production-only GitHub governance: all candidate and harness work is VM-local; only the frozen `ui-v2.html` production patch and required plan ledger updates may be written to GitHub.


**v1.3.9 · 2026-08-13.** Removed stale repository-harness/manifest references, recorded H1 static/syntax PASS, and advanced internal execution to H2.

**v1.3.4 · 2026-08-13.** Restored VM-first/test-first patch discipline; H1 tested patch and candidate syntax gate passed; GitHub reclassified as patch/deployment endpoint only.

**v1.3.3 · 2026-08-13.** Started H1 execution, inspected the actual cache/thumbnail paths, recorded two connector-rejected normal source writes, and documented the code-write tooling blocker without falsely marking implementation progress.

**v1.3.2 · 2026-08-13.** Linked and recorded the published A1-A18 detailed requirements audit and remediation map.

**v1.3.1 · 2026-08-13.** Recorded actual harness/candidate/manifest creation, locked exact candidate baseline blob, made production immutability explicit, and set H1 as next internal integration step.

**v1.3.0 · 2026-08-13.** Replaced eight owner-facing releases with one integrated candidate plus H0–H8 internal gates.

**v1.2.0 · 2026-08-13.** Item-by-item final-requirements audit against clean baseline.

**v1.1.x · 2026-08-12.** Baseline history audit and initial release planning.

**v1.0.x · 2026-08-12.** Governance, graveyard and recovered requirements established.


### 2026-08-13 · Owner correction audit and production replacement
**Owner-reported regressions fixed:** removed the errant Explore trash control; disabled hidden sphere sorting; added discrete left/right tap + swipe navigation with comet/touch feedback; removed the per-frame Explore blur/brightness/contrast hot path and reduced initial sphere page pressure; retained medium/large Focus chrome while adding touch navigation/fling; made the three folder tag targets draggable/reorderable with persisted order and long-press rename; added a Grid chip beside every stack in the Focus/Explore/Table stack selector; made tag targets enter filtered Grid; added Table image-image collision avoidance; and changed Grid close to return to Sort per the owner’s latest explicit ruling.
**A13 contract resolution:** the owner’s 2026-08-13 instruction that Grid exit drops directly to Sort supersedes the earlier exact-origin-return sentence for this release. Grid still captures origin fields for reconciliation/resume before entering Grid.
**Construction lineage:** corrected the last integrated clean-lineage production release `45fa45dea68107f5400abfbaddb855b54b64bedd`, whose integrated candidate originated from locked clean baseline `a6de049...`; no older damaged patch-forward snapshot was used as construction input.
**Automated gates:** A1-A18 source-contract matrix PASS; known-regression checks PASS; owner-correction JavaScript `node --check` PASS; donor application JavaScript retains its prior clean-lineage syntax gate.
**Evidence boundary:** authenticated provider/device timing, real Drive URL-expiry recovery, and physical touch performance remain device/provider evidence and are not falsely claimed by the static runner.


### 2026-08-13 · Owner correction placement revalidation
Post-publication verification caught that the preceding owner-correction release inserted at a literal `</body>` inside the Sync Activity Log template. That release is superseded. This replacement is rebuilt again from clean-lineage commit `45fa45dea68107f5400abfbaddb855b54b64bedd`, inserts before the document-final `</body>`, and gates placement after the v2.0 donor layers. A1-A18, all owner-reported regression checks, placement, and owner-correction JavaScript syntax PASS before publication.
