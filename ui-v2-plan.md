<!-- UI-V2-PLAN v1.1.1 -->
# UI-V2 MASTER PLAN v1.1.1

**Owner:** acmeproducts — sole product decision-maker/device-gate authority.  
**Builder:** ChatGPT/Codex when authorized.  
**Application:** `ui-v2.html` · **Graveyard:** `UI-V2-GRAVEYARD.md`.

**Every UI-V2 turn starts here + graveyard and ends by updating this file. Conversation is not project state.**

---

## 1 · EXECUTABLE RELEASE CHAIN

Owner authorized execution 2026-08-12. Gates remain mandatory; never patch forward.

| # | Release | Output | Changes | Gate | Status |
|---|---|---|---|---|---|
| R0 | Baseline recovery | clean baseline | Establish known lineage before feature work | history/static audit + owner device gate | **CANDIDATE SELECTED — DEVICE GATE** |
| R1 | Performance foundation | `v2.0-perf` | shared thumbnail/cache/render path; Explore/Table speed; Drive idle recovery | before/after instrumentation + provider smoke + device gate | BLOCKED ON R0 GATE |
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

## 6 · OPEN ITEMS

| # | Item | Status |
|---|---|---|
| O1 | R0 baseline | **Candidate `a6de049`; awaiting owner device gate** |
| O2 | Default tag names | OPEN; presentation only, does not block architecture |
| O3 | Tag persistence schema | R3 audit existing tag/metadata model |
| O4 | Long-press rename editor appearance | R3 minimal existing-UI convention |
| O5 | Stack-selector Grid affordance | R4 map to existing selector minimally |
| O6 | Exact prev/next affordance | R2 reuse current Focus behavior |
| O7 | Video | DEFERRED after image curation |
| O8 | AI/Venice modes | DEFERRED separate mode family |
| O9 | Device matrix | Desktop Chrome + touch/mobile minimum |

---

## 7 · IMMUTABLE WORKING RULES

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

## 8 · GRAVEYARD VETO SUMMARY

Never reuse without explicit owner revival: workflow-embedded app payloads; forward patching damaged snapshots; broad MutationObserver stabilization; fake Focus chrome; Inbox/Maybe-only Table; immutable YES/MAYBE/NO stacks; Explore tag targets on sphere; image-image Table collisions; per-surface thumbnail caches; deployment inference without live verification.

Full log: `UI-V2-GRAVEYARD.md`.

---

## 9 · TURN LEDGER

### 2026-08-12 · Turn 3
Owner required the missing release plan with changes and gates and explicitly authorized execution. Plan v1.1.0 created R0–R8.

### 2026-08-12 · Turn 4
**Work:** Executed R0 history audit. Compared the clean quick-switcher point with the later cache/Table series.  
**Evidence:** `a6de049` changes the application directly and precedes the later patch-transport experiments; `7c1ac45` adds 124 application lines through a patch workflow; `a8c6917` adds another 783 application lines plus base64/workflow transport.  
**Decision:** R0 candidate = `a6de049f8c8b9798c610984b35b9d8ade57d0fa5`. Later cache/physics commits are donors/evidence only.  
**Release state:** R0 CANDIDATE SELECTED — owner device gate required before R1 modifies application.  
**Next action:** owner runs R0 candidate smoke gate; on PASS, R1 begins with instrumentation against that exact baseline. On FAIL, record failure and select the preceding clean candidate; do not patch candidate forward.

---

## 10 · CHANGE LOG

**v1.1.1 · 2026-08-12.** Executed R0 history audit; selected `a6de049` as clean baseline candidate and documented donor commits and exact R0 device gate.

**v1.1.0 · 2026-08-12.** Replaced vague feature list with executable R0–R8 releases, outputs and gates; recorded owner build authorization.

**v1.0.x · 2026-08-12.** Governance, graveyard and recovered requirements established.
