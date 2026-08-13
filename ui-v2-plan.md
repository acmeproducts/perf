<!-- UI-V2-PLAN v1.1.0 -->
# UI-V2 MASTER PLAN v1.1.0

**Location:** `ui-v2-plan.md` in `acmeproducts/perf`  
**Owner:** acmeproducts — sole product decision-maker and device-gate authority.  
**Builder:** ChatGPT/Codex when explicitly authorized.  
**Application:** `ui-v2.html` / Orbital8 UI.  
**Graveyard:** `UI-V2-GRAVEYARD.md`.

**Operating rule:** every UI-V2 turn starts by reading this plan + graveyard and ends by updating this plan with decisions, evidence, release state, open items, and next action. Conversation history is not durable project state.

---

## 1 · RELEASE CHAIN

The owner has authorized execution of this plan on 2026-08-12. Authorization does **not** waive gates or permit patch-forward work.

| # | Release | Input -> output | Scope | Gate | Status |
|---|---|---|---|---|---|
| R0 | Baseline recovery | repository history -> approved clean `ui-v2.html` input | Find the last clean lineage that preserves working Sort/Focus/Grid/provider behavior and the useful shared-cache/Table work without later failed override/snapshot experiments | History diff + static audit + owner-visible test candidate | **IN PROGRESS** |
| R1 | Performance foundation | R0 -> `v2.0-perf` | Shared thumbnail/cache/render path; Explore sphere + Table speed; no repaint/refetch on movement; Drive expired URL recovery; preserve UI state through provider refresh | Instrumented before/after metrics + syntax/runtime + provider smoke + owner device gate | BLOCKED ON R0 |
| R2 | Inspection foundation | R1 -> `v2.1-inspection` | Canonical Focus chrome; Explore sphere->medium->large; Table thumbnail->medium->large; previous/next; X hierarchy; stack switching | State-machine tests + no duplicate controls + Focus regression + owner device gate | BLOCKED ON R1 |
| R3 | Folder tag targets | R2 -> `v2.2-tags` | Exactly 3 renameable folder-specific tag targets shared by Explore medium + Table; long-press rename; persistent target positions; current stack remains independent | Persistence/reload/folder-isolation tests + touch/desktop gate | BLOCKED ON R2 |
| R4 | Grid round-trip | R3 -> `v2.3-grid-return` | Tag target -> filtered Grid; stack selector -> stack Grid; Grid origin context; return to exact Focus/Explore/Table surface and reconciled image | Mutation-return tests: delete/move/tag/bulk + origin restoration gate | BLOCKED ON R3 |
| R5 | Table fast curation | R4 -> `v2.4-table-physics` | Current-stack scatter; thumbnail + medium fling to tag; actual Sort comet trail; bank/rim/corner/vacuum/capture effects retained; image-image collisions removed | Physics behavior gate + no image collision regression + performance gate | BLOCKED ON R4 |
| R6 | Resume integrity | R5 -> `v2.5-resume` | Preserve surface/folder/stack/image/inspection level across idle/background/auth refresh | Idle/background/provider-refresh tests + device gate | BLOCKED ON R5 |
| R7 | Sort desktop fit | R6 -> `v2.6-sort-fit` | Shorter desktop stack pills; trash clears footer; no Sort redesign or symmetry change | Desktop visual gate + Sort behavior regression | BLOCKED ON R6 |
| R8 | Integrated candidate | R7 -> `v2.7-rc1` | No new features. Cross-surface regression, large-library performance, provider verification, deployment verification | Automated gates + published-artifact verification + owner physical/device gate | BLOCKED ON R7 |

**Green automated gates mean allowed to test, never “done.”** A release advances only after the owner passes its device gate.

---

## 2 · RELEASE REQUIREMENTS AND GATES

### R0 · Baseline recovery

**Purpose:** stop building on uncertain lineage.

Actions:
1. Audit `ui-v2.html` history around the known navigation/cache/Table commits and the later failed stabilization/snapshot period.
2. Reject any candidate containing buried approaches from the graveyard.
3. Compare candidates for preservation of provider selection, Sort, Focus, Grid, footer/nav drawer, stack state, and useful cache work.
4. Select the cleanest candidate as the proposed R0 input; do not combine candidates by patching forward.
5. Publish/test the candidate only if needed to establish behavior; label it baseline-candidate, not a release.

**R0 gate:** application loads after provider selection; Sort/Focus/Grid basic behavior works; no browser lock; no fake/duplicate chrome architecture; lineage is known. Owner device approval establishes the baseline.

### R1 · Shared thumbnail performance

**Instrument first. No diagnosis by intuition.**

Measure before changing:
- first useful thumbnail paint;
- visible Explore sphere fill time;
- visible Table fill time;
- provider requests per visible item;
- cache hits/misses across surface changes;
- refetches during sphere rotation/movement;
- refetches during Table movement;
- image-node recreation/redecode where measurable;
- Drive image behavior after idle/URL expiry.

Build requirements:
- one shared thumbnail service/cache wherever the same rendition can be reused;
- visible/near-visible work prioritized;
- durable-cache work cannot block first useful paint;
- moving an item does not recreate/refetch its unchanged thumbnail;
- Google Drive temporary URL expiry recovers without permanent broken images;
- provider/auth refresh does not reset UI navigation state.

**R1 gate:** measurable improvement over R0, zero avoidable refetch on movement, Drive recovery proven, Grid/Focus/Sort image loading not regressed.

### R2 · Canonical inspection model

**Focus is the decoration standard.** Actual Focus controls/handlers, not imitations:
- top-left stack selector;
- top-right Details;
- bottom-left image # / total;
- bottom-center real Focus heart;
- bottom-right real Focus trash.

Explore:
- Sphere: thumbnails only; no tag targets.
- Tap thumbnail -> Medium.
- Medium: Focus chrome + previous/next + stack selector + Details/favorite/trash + X.
- Tap medium image -> Large.
- Large: Focus-like sequential inspection; X clear of Details.
- Large X -> Medium; Medium X -> Sphere at correct context.

Table:
- Table thumbnail state remains physical/scattered.
- Tap thumbnail -> Medium.
- Medium/large use the same Focus inspection model and X hierarchy.

**R2 gate:** no duplicate/fake hearts/trash/details/counters; every transition and reverse transition preserves current image/stack; Focus itself unchanged.

### R3 · Folder-specific tag targets

Exactly three active tag targets.

They are **tags**, not semantic stacks:
- renameable by long press;
- folder-specific definitions;
- shared between Explore medium and Table for that folder;
- positions draggable and persistent;
- defaults may exist, but YES/MAYBE/NO are not immutable architecture;
- switching folders loads that folder's tag definitions;
- switching stacks does not redefine the folder's tags.

Explore sphere has no tag targets. Explore medium has the three targets. Table has the three targets in thumbnail and medium states.

**R3 gate:** rename one target, reload, switch stacks, switch surfaces, switch folders, return — correct names/positions must persist only where intended.

### R4 · Grid round-trip

Tag target tap:
- Explore medium or Table target tap -> Grid with that tag implicitly filtered.

Stack selector:
- Focus/Explore/Table -> Grid for current/selected stack.

Origin context records:
- origin surface;
- folder;
- stack;
- current image/logical position;
- tag filter if any;
- inspection level if applicable.

Exit Grid:
- return to exact origin surface;
- reconcile against current data after delete/move/tag/bulk operations;
- never restore a stale numeric index blindly.

**R4 gate:** test delete current image, move current image, tag selection, bulk operation, and no-op Grid visit from each origin surface.

### R5 · Table fast curation / physics

Table opens on the **current stack**, never Inbox-only.

Thumbnail state:
- current-stack thumbnails scattered across the table;
- fling directly to any of the three tag targets;
- actual Sort comet-trail implementation reused;
- target physics retained: momentum, bank shots, rim/corner interaction, vacuum/capture and capture animation;
- image-to-image collisions removed only.

Medium state:
- same three tag targets;
- fling medium image to tag;
- same comet trail;
- Focus chrome remains canonical.

**R5 gate:** target capture effects remain fun/visible; image-image collisions do not occur; fling applies the intended tag once; target tap still opens filtered Grid.

### R6 · Resume / idle integrity

Persist/reconcile:
- active surface;
- folder;
- stack;
- current image/logical position;
- Explore/Table inspection level;
- Grid origin context when applicable.

Provider authentication refresh is infrastructure and must not overwrite navigation state.

**R6 gate:** leave each surface idle/backgrounded, resume after provider refresh opportunity, and verify the exact surface/context remains instead of folder-selection reset + image jump.

### R7 · Sort desktop fit

Only approved Sort changes:
- reduce stack-pill height on desktop/PC;
- lift/size trash pill so it clears footer;
- preserve Sort symmetry and behavior.

**R7 gate:** desktop screenshot/device check at representative viewport widths; no overlap; no movement of unrelated Sort controls; touch layout unchanged unless required for clearance.

### R8 · Integrated candidate

No feature work.

Gate matrix:
- provider screen -> application load;
- Sort;
- Focus;
- Explore sphere/medium/large;
- Table thumbnail/medium/large;
- tag rename/persistence;
- tag -> Grid -> return;
- stack -> Grid -> return;
- Details/favorite/trash;
- large-library thumbnail performance;
- idle/resume;
- Google Drive expiry/recovery;
- OneDrive smoke where available;
- desktop + touch/mobile;
- published artifact version matches repository release exactly.

---

## 3 · PRODUCT MODEL

Two concepts must never be conflated again:

1. **Stacks** — current organizational stack inside the selected folder. Focus, Explore and Table retain stack context and can switch stacks.
2. **Tag targets** — three fast curation destinations applying folder-specific tags. They are renameable and shared across Explore/Table inside that folder.

---

## 4 · CANONICAL FOCUS CHROME

| Position | Canonical control |
|---|---|
| Top-left | Stack selector |
| Top-right | Details |
| Bottom-left | Current image # / total |
| Bottom-center | Actual Focus favorite/heart |
| Bottom-right | Actual Focus trash |

No fake/duplicate Explore or Table versions.

---

## 5 · OPEN ITEMS LEDGER

| # | Item | Resolution path | Status |
|---|---|---|---|
| O1 | Exact clean baseline | R0 repository-history audit; propose one candidate for owner gate | IN PROGRESS |
| O2 | Default names for three tags | Defaults are presentation only; implementation must support rename immediately | OPEN — does not block architecture |
| O3 | Tag persistence schema | Audit existing tag/metadata/storage model during R3 | OPEN |
| O4 | Long-press rename editor appearance | Minimal editor using existing UI conventions; decide in R3 plan-before-build update | OPEN |
| O5 | Stack-selector Grid affordance | Map to existing selector without changing its core interaction | OPEN |
| O6 | Previous/next affordance | Reuse current Focus behavior; verify exact gesture/control during R2 audit | OPEN |
| O7 | Video | Outside current release chain; architecture must not gratuitously block later image+video | DEFERRED |
| O8 | AI/Venice modes | Separate future mode family; never mixed into normal/card curation releases | DEFERRED |
| O9 | Device matrix | Desktop Chrome + touch/mobile minimum; owner may add devices | OPEN |

---

## 6 · IMMUTABLE WORKING RULES

### 6.1 Start every turn here
Read this plan and `UI-V2-GRAVEYARD.md`. Record the owner request and authorization state before substantive project work.

### 6.2 End every turn here
Record decisions, evidence, release/open-item state, exact next action, and whether owner action is required. Commit the plan update before final response.

### 6.3 Authority order
1. Current owner ruling, written into this plan in the same turn.
2. Graveyard vetoes.
3. This master plan.
4. Owner-approved baseline behavior.
5. `UI-V2-CURATION-PLAN.md` recovered precursor.
6. Owner-designated references such as `vid-v1.html`.
7. Conversation history.

### 6.4 Never patch forward after a failed gate
Failure sequence is mandatory:

**stop -> clean approved input -> graveyard -> plan -> rebuild -> automated gates -> publish -> verify published artifact -> owner device gate.**

### 6.5 Instrument first when cause is unknown
Do not declare root cause from reasoning. Add measurements/logging, reproduce, then diagnose.

### 6.6 Verify, do not infer
Repository state, Actions green, or a commit SHA does not prove the live application. Verify the published artifact.

### 6.7 Reuse proven implementation
Use existing controls, handlers, trails, cache services, and patterns where they satisfy the requirement. Do not create lookalike parallel systems.

### 6.8 No unauthorized implementation
READ/PLAN requests do not permit application writes. This turn explicitly authorizes execution of the release plan.

### 6.9 One release has one testable purpose
Do not bundle later release work merely because the same file is open.

### 6.10 Green means testable, not done
Only the owner passes the physical/device gate.

### 6.11 Version every application build
Version identity must be static in shipped HTML/footer and verified after publish. Every build requiring owner action gets a cache-busted test URL automatically.

### 6.12 No stubs / fake controls / fake data
A release must deliver real cumulative behavior.

---

## 7 · FIXED / DO-NOT-TOUCH BEHAVIOR

Unless a release explicitly names it:
- provider selection/auth flows;
- Sort interaction/symmetry;
- Focus core behavior;
- Grid search/selection/bulk behavior;
- footer/nav drawer mode switching;
- storage-provider data semantics;
- existing favorite/trash/details semantics.

Any regression here fails the release.

---

## 8 · GRAVEYARD SUMMARY

Full veto list: `UI-V2-GRAVEYARD.md`.

Never reuse without explicit owner revival:
- application payloads embedded in workflow YAML;
- forward patching damaged snapshots;
- broad MutationObserver stabilization;
- fake Explore/Table Focus controls;
- Inbox/Maybe-only Table;
- immutable YES/MAYBE/NO semantic stacks;
- Explore tag targets in sphere state;
- image-image Table collisions;
- separate per-surface thumbnail caches;
- deployment inference without live verification.

---

## 9 · TURN LEDGER

### 2026-08-12 · Turn 3
**Owner request:** The plan lacked an executable release sequence despite requirements being repeatedly enumerated. Owner directed: put the releases, changes, updates and gates into the plan and execute it.  
**Authorization:** BUILD-AUTHORIZED for the release chain, subject to its gates.  
**Decision:** Replace the vague feature list with R0-R8, each with explicit input/output, scope and gate. Baseline recovery executes first; no feature implementation may skip R0.  
**Evidence at start:** repository history includes known useful commits `a6de049` (quick horizontal view switcher), `7c1ac45` (thumbnail caching/Table interactions), `a8c6917` (shared cache/physics sorting), followed by later failed/contested iterations. Exact approved baseline still requires R0 audit.  
**Current release:** R0 IN PROGRESS.  
**Next action:** audit candidate commits and select/prove the clean R0 baseline; then execute R1 instrumentation/performance work.

---

## 10 · CHANGE LOG

**v1.1.0 · 2026-08-12.** Owner required an actual executable release plan. Added R0-R8 with explicit release outputs, requirements and gates; recorded build authorization; made baseline recovery the first executing release rather than an indefinite planning blocker.

**v1.0.1 · 2026-08-12.** Governance/requirements recovery completed; initial feature ledger created.

**v1.0.0 · 2026-08-12.** Master plan created from TalkBridge governance structure and recovered UI-V2 requirements.
