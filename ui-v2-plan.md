<!-- UI-V2-PLAN v1.2.0 -->
# UI-V2 MASTER PLAN v1.2.0

**Owner:** acmeproducts — sole product decision-maker/device-gate authority.  
**Builder:** ChatGPT/Codex when authorized.  
**Application:** `ui-v2.html` · **Graveyard:** `UI-V2-GRAVEYARD.md`.

**Every UI-V2 turn starts here + graveyard and ends by updating this file. Conversation is not project state.**

---

## 1 · EXECUTABLE RELEASE CHAIN

Owner authorized execution 2026-08-12. Gates remain mandatory; never patch forward.

| # | Release | Output | Changes | Gate | Status |
|---|---|---|---|---|---|
| R0 | Baseline recovery | clean baseline | Establish known lineage before feature work | history/static audit + owner device gate | **STATIC AUDIT COMPLETE — DEVICE GATE REMAINS** |
| R1 | Performance foundation | `v2.0-perf` | shared thumbnail/cache/render path; Explore/Table speed; Drive idle recovery | before/after instrumentation + provider smoke + device gate | BLOCKED ON R0 DEVICE GATE |
| R2 | Inspection foundation | `v2.1-inspection` | real Focus chrome; Explore sphere→medium→large; Table thumbnail→medium→large; prev/next; X hierarchy | transition/no-duplicate/Focus regression + device gate | BLOCKED ON R1 |
| R3 | Folder tag targets | `v2.2-tags` | exactly 3 renameable folder-specific tags shared by Explore medium + Table; drag/persist | rename/reload/stack/surface/folder isolation + touch/desktop | BLOCKED ON R2 |
| R4 | Grid round-trip | `v2.3-grid-return` | tag→filtered Grid; stack→Grid; exact origin return/reconciliation | delete/move/tag/bulk/no-op return tests | BLOCKED ON R3 |
| R5 | Table fast curation | `v2.4-table-physics` | current-stack scatter; thumbnail+medium fling; actual Sort trails; target physics retained; image collisions removed | physics + tag-once + performance + device gate | BLOCKED ON R4 |
| R6 | Resume integrity | `v2.5-resume` | preserve surface/folder/stack/image/inspection through idle/auth refresh | idle/background/provider-refresh gate | BLOCKED ON R5 |
| R7 | Sort desktop fit | `v2.6-sort-fit` | shorter PC pills; trash clears footer; symmetry unchanged | desktop visual + Sort regression | BLOCKED ON R6 |
| R8 | Integrated candidate | `v2.7-rc1` | no new features; cross-surface/provider/performance regression | automated + live artifact + desktop/touch owner gate | BLOCKED ON R7 |

Green automated checks mean **allowed to test**, not done.

---

## 2 · R0 BASELINE RECOVERY — CURRENT EXECUTION

### Candidate selected

`a6de049f8c8b9798c610984b35b9d8ade57d0fa5` — **Implement quick horizontal view switcher**.

Why this candidate:
- its application commit changes only `ui-v2.html` and implements the owner-approved lightweight horizontal footer-triggered view switcher;
- it predates the later cache/Table patch series that introduced workflow-carried patching and large append-only runtime blocks;
- it already contains the core provider, Sort, Focus, Grid, Explore, Table and view-state architecture needed as a clean lineage;
- it contains the actual Sort comet-trail implementation that later releases must reuse;
- it contains the existing tag service/Grid tag search and existing provider/cache/state infrastructure, so R1/R3 can evolve existing systems instead of inventing parallel ones.

### Donor history — audit only, never restore wholesale

- `7c1ac453...` — “Fix thumbnail caching and rebuild Table interactions.” Useful evidence/donor for R1, but reached through a workflow patch path and therefore not the clean baseline.
- `a8c6917f...` — “Implement shared cache and physics sorting.” Useful evidence/donor for R1/R5, but added 783 lines to `ui-v2.html` plus the buried workflow/base64 transport approach. Never restore wholesale.
- later v1.4–v1.9 iterations are requirements evidence only unless a specific implementation is proven independently useful.

### R0 device gate

The candidate must prove:
1. provider screen loads;
2. selecting/authenticated provider reaches folders/app without browser lock;
3. Sort loads and basic sort gesture works;
4. double-tap Focus entry/exit works;
5. footer tap opens the quick horizontal Sort/Focus/Explore/Table switcher;
6. Grid opens/closes;
7. no fatal startup loop.

**R0 does not require Explore/Table to meet final requirements.** Those are R2–R5. It only proves the clean starting lineage.

---

## 3 · R1 PERFORMANCE FOUNDATION

Instrument before changing anything:
- first useful thumbnail paint;
- visible Explore sphere fill;
- visible Table fill;
- provider requests per visible item;
- cache hit/miss across surface changes;
- refetches while sphere/Table items move;
- image node recreation/redecode where measurable;
- Drive thumbnail behavior after idle/URL expiry.

Build:
- one shared thumbnail service/cache for reusable renditions;
- visible/near-visible first;
- durable persistence never blocks first paint;
- movement never recreates/refetches unchanged thumbnails;
- Drive temporary URL expiry recovers;
- provider refresh never resets navigation state.

Gate: measurable improvement vs R0; zero avoidable movement refetch; Drive recovery proven; Grid/Focus/Sort not regressed.

---

## 4 · R2–R5 CURATION CONTRACT

### Canonical Focus chrome
Top-left stack selector · top-right Details · bottom-left image #/total · bottom-center actual Focus heart · bottom-right actual Focus trash. **No fake duplicates.**

### Explore
Sphere: no tag targets; shared fast thumbnails; tap thumbnail→Medium.  
Medium: Focus chrome + prev/next + exactly 3 folder tags + fling-to-tag using actual Sort comet trail + tag tap→filtered Grid + X→Sphere.  
Tap Medium image→Large. Large behaves like Focus; X clear of Details; X→Medium. No tag fling required in Large.

### Table
Opens on current stack, not Inbox-only. Current-stack thumbnails scattered. Exactly 3 folder tag targets. Thumbnail may fling directly to tag. Tap thumbnail→Medium. Medium has Focus chrome/prev-next/three tags/fling. Tap Medium→Large. X hierarchy Large→Medium→Table.

### Folder tags
Three active targets are tags, not immutable stacks. Long press renames. Names and target positions persist per folder and are shared by Explore/Table in that folder. Switching stacks does not redefine folder tags. YES/MAYBE/NO may be defaults only, never architecture.

### Table physics
Keep momentum, bank, rim/corner, vacuum/capture and capture animation. Remove **only image-to-image collisions**. Reuse actual Sort comet trail implementation.

### Grid round trip
Tag target→Grid with implicit tag filter. Stack selector→Grid for current stack. Record origin surface/folder/stack/image/tag/inspection level. Exit returns to exact origin and reconciles after delete/move/tag/bulk changes; never restore stale numeric index.

---

## 5 · R6–R8 CONTRACT

### Resume
Persist/reconcile active surface, folder, stack, image, Explore/Table inspection level and Grid origin. Auth refresh must not reset UI to folder selection then jump to image.

### Sort desktop fit
Only: reduce desktop pill height and clear trash above footer. Preserve Sort symmetry/behavior.

### Integrated gate
Provider→app; Sort; Focus; Explore all 3 states; Table all 3 states; tag rename/persistence; tag/stack Grid round-trip; Details/favorite/trash; large-library performance; idle/resume; Drive expiry; OneDrive smoke where available; desktop+touch; published version matches repository exactly.

---

## 6 · REQUIREMENTS AUDIT — R0 `a6de049`

Static source audit performed 2026-08-13 against the approved final requirements. **This section describes what the clean baseline actually contains; it does not lower the final requirements.** Device behavior remains unproven until the R0 device gate.

| # | Final requirement | R0 finding | Status | Required remediation / release |
|---|---|---|---|---|
| A1 | Focus chrome canonical across Focus, Explore inspection, Table | Focus has canonical controls, but Explore and Table define their own `spatial-gallery-*` / `photo-table-*` folder, Details, count and trash controls. | **FAIL** | R2: make the actual Focus controls/handlers canonical in Explore medium/large and Table medium/large; remove competing behavioral ownership rather than creating lookalikes. |
| A2 | Table has exactly 3 configurable tag targets, not Inbox/Maybe and not immutable YES/MAYBE/NO | Baseline Table exposes **4 stack destinations**: KEEP/TRASH/INBOX/MAYBE backed by `priority/trash/in/out`. They are stacks, not configurable tags. | **FAIL** | R3: replace destination semantics with exactly three folder tag definitions/targets; default labels are presentation only. Preserve stack selector separately. |
| A3 | Long-press renames tag targets | No tag-target long-press rename behavior exists. | **FAIL** | R3: add pointer/touch long-press on each target, minimal rename editor, validation, persistence and cancellation; distinguish drag from long-press. |
| A4 | Tags folder-specific and shared across that folder | File tags and TagService exist, but there is no persisted three-target folder configuration shared by Explore/Table. | **PARTIAL FOUNDATION** | R3: add folder-keyed target-definition persistence using existing metadata/storage conventions; Explore/Table read the same folder record. |
| A5 | Table starts with current stack; stack selector switches stacks | `PhotoTable.open({stackName,...})` receives the current stack through ModeNavigation, but Table's visible folder control is not the canonical Focus stack selector and destination controls are conflated with stacks. | **PARTIAL** | R2/R3: retain current-stack entry; wire canonical stack selector in Table and prove switching stack refreshes scatter without redefining folder tags. |
| A6 | Explore sphere → medium → large with exact X return hierarchy | Baseline Explore is sphere/armed-card behavior; no required medium→large inspection hierarchy with X Large→Medium→Sphere exists. | **FAIL** | R2: explicit Explore state machine: sphere → medium → large; medium X→sphere; large X→medium; preserve selected file and sphere context. |
| A7 | Explore sorting/tagging activates at medium, not sphere | Baseline Explore has KEEP/TRASH/INBOX/MAYBE destination buttons directly on the sphere and sphere deal/fling logic. | **FAIL — OPPOSITE** | R2 removes all sphere destinations/sorting. R3 exposes exactly three folder tag targets only in medium. |
| A8 | Table fling-to-tag from thumbnail and medium | Baseline Table supports thumbnail directional sorting to stacks, but not tags; its examined/medium state is not the final medium model and does not implement tag-target fling. | **PARTIAL** | R3/R5: thumbnail fling assigns selected folder tag; R2 creates medium state; R5 enables same tag fling from medium while preserving target physics. |
| A9 | Medium Explore/Table has Focus-style prev/next | Required medium states do not exist; baseline keyboard prev/next applies to Focus, not Explore/Table medium. | **FAIL** | R2: reuse Focus prev/next semantics/handlers for medium inspection and reconcile current file after stack changes/deletes. |
| A10 | Large Explore/Table essentially behaves as Focus | Required large states do not exist. | **FAIL** | R2: large inspection reuses Focus navigation/Details/favorite/trash/stack selector; no tag fling; X returns to medium. |
| A11 | Tag target → Grid with implicit tag filter | Baseline destination clicks sort/deal into stacks. Existing Grid/tag infrastructure exists, but destination→tag-filtered Grid is absent. | **FAIL / FOUNDATION EXISTS** | R4: target tap opens normal Grid with implicit tag predicate and origin context; do not create a second Grid. |
| A12 | Stack selector → Grid for current stack | Canonical Focus stack selector exists, but direct stack-selector→Grid contract is not implemented as required. | **FAIL** | R4: minimally extend canonical selector with Grid affordance/action for selected stack. |
| A13 | Grid remembers Focus/Explore/Table origin and returns to correct surface/stack/reconciled image | ModeNavigation remembers some surface selection for direct mode switching, but Grid does not carry the required origin object/tag context/inspection level and reconciliation contract. | **FAIL / PARTIAL NAV FOUNDATION** | R4: explicit Grid origin object `{surface,folder,stack,fileId,tag,inspectionLevel}`; on exit resolve by file ID/current data, never stale numeric index. |
| A14 | Shared thumbnail/cache architecture + explicit performance measurements | Explore and Table already share `ExploreThumbnailCache`; Focus/Grid use other image paths. No single all-surface service and no required performance instrumentation/measurements. | **PARTIAL** | R1: profile first; consolidate reusable renditions behind one shared service; add first-paint/fill/request/cache/refetch/redecode measurements and compare to R0. |
| A15 | Google Drive idle/expired-thumbnail recovery | Drive URL construction exists; general image fallback/cache logic exists, but Explore/Table cache is URL-keyed and no proven expiry-refresh/rebind path or expiry instrumentation was found. | **FAIL / PARTIAL FOUNDATION** | R1: reproduce expiry, instrument errors, refresh/re-resolve Drive URL by file identity, update cache without losing visible state; device gate after idle. |
| A16 | Idle state restoration | Baseline persists provider/folder/stack/position/fileId/`isFocusMode` and restores on visibility lifecycle. It does **not** persist Explore/Table surface or inspection level/Grid origin required by final contract. | **PARTIAL** | R6: extend persisted context with active surface + inspection level + Grid origin; restore only after provider/folder data ready; reconcile by file ID. |
| A17 | Sort desktop pills shorter; trash clears footer | Baseline desktop `.pill-counter` is `padding:12px 20px;font-size:18px`; trash is `bottom:20px`, matching the reported footer conflict. | **FAIL** | R7 only: reduce desktop pill height and raise bottom trash clearance above footer; preserve horizontal/vertical symmetry and all Sort gestures. |
| A18 | Rejected directions documented | Graveyard explicitly vetoes fake Focus chrome, hard-coded semantic stacks, Inbox/Maybe-only Table, Explore sphere targets, image collisions, per-surface caches, forward patching, runtime observer stabilization and deployment inference. | **PASS — DOCUMENTED** | Maintain graveyard veto. Any revival requires explicit owner approval + plan update + regression gate. |

### Audit conclusions

1. **R0 is correctly a baseline, not a near-final build.** Most curation requirements are intentionally absent or represented by older precursor behavior.
2. **Do not patch the precursor behavior into compliance.** R1–R7 replace/evolve it release-by-release from the clean baseline under gates.
3. Existing reusable foundations worth preserving are: actual Focus chrome, ModeNavigation/current-stack handoff, TagService/file tags, Grid, Sort comet trail, `ExploreThumbnailCache` as donor evidence, and persisted file-ID/stack context.
4. Existing behavior that must not define the final architecture: Explore sphere stack destinations; Table's four stack destinations; surface-specific fake chrome; stack-based Table sorting semantics.
5. Performance claims are currently **unmeasured**. R1 begins with instrumentation before cache changes.

---

## 7 · OPEN ITEMS

| # | Item | Status |
|---|---|---|
| O1 | R0 baseline | **Candidate `a6de049`; static audit complete; awaiting owner device gate** |
| O2 | Default tag names | OPEN; presentation only, does not block architecture |
| O3 | Tag persistence schema | R3 audit existing tag/metadata model; must be folder-keyed and shared Explore/Table |
| O4 | Long-press rename editor appearance | R3 minimal existing-UI convention |
| O5 | Stack-selector Grid affordance | R4 map to existing selector minimally |
| O6 | Exact prev/next affordance | R2 reuse current Focus behavior |
| O7 | Video | DEFERRED after image curation |
| O8 | AI/Venice modes | DEFERRED separate mode family |
| O9 | Device matrix | Desktop Chrome + touch/mobile minimum |
| O10 | R1 performance baseline numbers | OPEN — must be captured before implementation changes |
| O11 | Drive expiry reproduction interval/path | OPEN — instrument and reproduce in R1; do not guess cause |

---

## 8 · IMMUTABLE WORKING RULES

1. Start every turn by reading plan + graveyard; end by updating plan.
2. Authority: current owner ruling → graveyard → this plan → approved baseline → recovered precursor → references → chat history.
3. On failure: **stop → clean approved input → graveyard → plan → rebuild → automated gates → publish → verify → owner device gate. Never patch forward.**
4. Unknown cause: instrument first; never declare root cause from reasoning.
5. Verify, do not infer. Actions/repository success does not prove live behavior.
6. Reuse actual proven controls/handlers/trails/cache patterns; no lookalikes.
7. No application writes without build authorization. Current release chain is authorized.
8. One release, one testable purpose. Do not smuggle later scope into earlier releases.
9. Version identity is static in shipped HTML/footer and verified live.
10. Every build requiring owner testing gets a cache-busted test URL automatically.
11. No stubs, fake controls or fake data.
12. Do not touch provider flows, Sort symmetry, Focus core, Grid core, footer navigation or metadata semantics unless the active release explicitly requires it.

---

## 9 · GRAVEYARD VETO SUMMARY

Never reuse without explicit owner revival: workflow-embedded app payloads; forward patching damaged snapshots; broad MutationObserver stabilization; fake Focus chrome; Inbox/Maybe-only Table; immutable YES/MAYBE/NO stacks; Explore tag targets on sphere; image-image Table collisions; per-surface thumbnail caches; deployment inference without live verification.

Full log: `UI-V2-GRAVEYARD.md`.

---

## 10 · TURN LEDGER

### 2026-08-12 · Turn 3
Owner required the missing release plan with changes and gates and explicitly authorized execution. Plan v1.1.0 created R0–R8.

### 2026-08-12 · Turn 4
**Work:** Executed R0 history audit. Compared the clean quick-switcher point with the later cache/Table series.  
**Evidence:** `a6de049` changes the application directly and precedes the later patch-transport experiments; `7c1ac45` adds 124 application lines through a patch workflow; `a8c6917` adds another 783 application lines plus base64/workflow transport.  
**Decision:** R0 candidate = `a6de049f8c8b9798c610984b35b9d8ade57d0fa5`. Later cache/physics commits are donors/evidence only.  
**Release state:** R0 CANDIDATE SELECTED — owner device gate required before R1 modifies application.  
**Next action:** owner runs R0 candidate smoke gate; on PASS, R1 begins with instrumentation against that exact baseline. On FAIL, record failure and select the preceding clean candidate; do not patch candidate forward.

### 2026-08-13 · Turn 5 — final-requirements static audit
**Work:** Audited R0 candidate `a6de049` against all 18 final requirements supplied by owner. No application code changed.  
**Evidence:** Baseline contains real Focus chrome; separate Explore/Table chrome; four stack-based Explore/Table destinations; current-stack handoff into Table; Explore/Table shared `ExploreThumbnailCache`; existing TagService/file tags; actual Sort comet trail; partial view-context persistence; desktop Sort pills at 12px vertical padding/18px type and trash 20px from bottom. No required three-target folder-tag model, medium/large state machine, tag→Grid origin contract, all-surface cache instrumentation, or proven Drive expiry recovery.  
**Decision:** Keep R0 as clean baseline candidate. Findings map directly to R1–R7; do not attempt a monolithic remediation or forward patch.  
**Release state:** R0 STATIC AUDIT COMPLETE — DEVICE GATE remains before R1 application work.  
**Next action:** complete R0 device smoke. On PASS, execute R1 instrumentation first, capture baseline measurements, then implement only the performance foundation and run its gate.

---

## 11 · CHANGE LOG

**v1.2.0 · 2026-08-13.** Published item-by-item audit of R0 against all final requirements, with PASS/PARTIAL/FAIL findings and release-specific remediation instructions. Added R1 measurement/Drive-expiry open items.

**v1.1.1 · 2026-08-12.** Executed R0 history audit; selected `a6de049` as clean baseline candidate and documented donor commits and exact R0 device gate.

**v1.1.0 · 2026-08-12.** Replaced vague feature list with executable R0–R8 releases, outputs and gates; recorded owner build authorization.

**v1.0.x · 2026-08-12.** Governance, graveyard and recovered requirements established.
