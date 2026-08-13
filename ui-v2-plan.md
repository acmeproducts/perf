<!-- UI-V2-PLAN v1.0.1 -->
# UI-V2 MASTER PLAN v1.0.1

**Location:** `ui-v2-plan.md` in `acmeproducts/perf`.
**Owner:** acmeproducts — sole decision-maker and device-gate authority.
**Builder:** ChatGPT/Codex as explicitly authorized by the owner — researches, plans, builds only when authorized, runs available gates, verifies deployment, maintains this plan and the graveyard.
**Application:** `ui-v2.html` / Orbital8 UI.
**Graveyard:** `UI-V2-GRAVEYARD.md`.

**This file is the project operating record.** Every UI-V2 turn starts by reading/updating it and ends by updating it with decisions, evidence, release state, open items, and next action. An owner ruling made in session must be written here in the same turn or it is not durable project state.

The previous development history became fragmented across devices/chat context. That is now treated as a governance failure, not a conversational inconvenience. This document replaces conversation memory as the source of truth.

---

## 1 · RELEASES

**Last known owner-approved application baseline:** UNRESOLVED. Must be established before the next implementation release. `v1.9 final-requirements` improved some behavior but was explicitly reported as not meeting requirements and is not an approved baseline.

| # | Release | Feature | Status |
|---|---|---|---|
| 0 | Baseline recovery | Establish exact owner-approved `ui-v2.html` input commit/file; audit current main and relevant history | OPEN — HARD BLOCKER |
| 1 | Governance + requirements recovery | Create authoritative plan, graveyard, requirements, authority order and gates | COMPLETE — owner accepted governance setup 2026-08-12 |
| 2 | Shared thumbnail performance | Profile and repair shared thumbnail/cache/render path for Explore sphere and Table; Drive idle recovery | NOT STARTED — requires R0 |
| 3 | Canonical inspection model | Focus chrome reuse; Explore sphere->medium->large; Table thumbnail->medium->large; navigation and X semantics | NOT STARTED — requires R0/R2 |
| 4 | Folder tag-target model | Three renameable folder-specific tag targets shared by Explore medium and Table; persistence | NOT STARTED |
| 5 | Grid round-trip | Stack->Grid and tag->filtered Grid; exact return to Focus/Explore/Table with reconciled stack/image | NOT STARTED |
| 6 | Table physics + fast curation | Current-stack scatter, thumbnail fling, medium fling, Sort comet trails, target physics retained, image collisions removed | NOT STARTED |
| 7 | Resume/state integrity | Preserve surface/folder/stack/image/inspection level across idle/provider refresh | NOT STARTED |
| 8 | Sort desktop fit | Shorter PC stack pills; trash clears footer; preserve symmetry | NOT STARTED |
| 9 | Integration/device gate | Cross-surface regression, large-library performance, Drive/OneDrive, deployment verification | NOT STARTED |

No release may be implemented from an unapproved baseline. Release numbers describe scope/order; they do not authorize work.

---

## 2 · CURRENT PRODUCT MODEL

Orbital8 is a curation environment for very large cloud image/video libraries. The immediate UI-V2 scope is image curation, with architecture that must not unnecessarily prevent later image+video use.

The product separates two concepts that previous iterations conflated:

1. **Stacks** — the user's current organizational stack within the selected folder. Focus, Explore and Table all retain stack context and can switch stacks.
2. **Tag targets** — three fast curation destinations used to apply folder-specific tags. They are not hard-coded semantic stacks. Their visible names are renameable by long press.

The goal is to make tens of thousands of items practical to cull, curate, group, rank and manage without turning every surface into a control panel.

---

## 3 · CANONICAL FOCUS CHROME

Focus is the decoration and action standard for Focus, Explore inspection, and Table inspection. There is one visual/behavioral language, not per-surface imitations.

Canonical placement:

| Position | Control |
|---|---|
| Top-left | Stack selector |
| Top-right | Details |
| Bottom-left | Current image # / total |
| Bottom-center | Actual Focus favorite/heart |
| Bottom-right | Actual Focus trash icon/control |

Rules:

- Reuse the actual canonical controls/handlers where architecture permits.
- No fake hearts, duplicate trash icons, alternate Details buttons, or decorative substitutes.
- Stack selector remains available in Focus, Explore inspection, and Table inspection.
- Previous/next navigation behavior is shared by Focus and medium/large inspection states.
- Large-format X must never be occluded by Details.

---

## 4 · FOCUS

Focus remains the dedicated sequential inspection surface.

Required behavior:

| # | Requirement | Status |
|---|---|---|
| F1 | Previous/next image navigation | Existing behavior — must baseline-audit |
| F2 | Stack switching with canonical selector | Existing concept — must baseline-audit |
| F3 | Direct Grid entry for current stack from stack selector | Required |
| F4 | Details | Existing — preserve |
| F5 | Favorite | Existing — preserve |
| F6 | Trash | Existing — preserve |
| F7 | Grid exit returns to Focus, correct stack and reconciled image after Grid edits | Required |

---

## 5 · EXPLORE

### 5.1 Sphere state

Explore begins as the sphere/orbital thumbnail surface.

- Sphere state is visually quiet.
- **No tag targets are shown in sphere state.**
- Sphere thumbnails use the shared thumbnail/cache service.
- Moving/rotating/repositioning the sphere must not recreate/refetch unchanged thumbnails.
- Pinch/zoom remains available for thumbnail inspection as designed.
- Tap thumbnail -> medium inspection.

### 5.2 Medium inspection

Medium is the active curation state.

Required:

- canonical Focus chrome;
- previous/next navigation;
- stack selector;
- Details;
- image # / total;
- favorite;
- trash;
- exactly three current-folder tag targets;
- fling image to a tag target;
- use the actual Sort comet-trail visual behavior;
- tap a tag target -> Grid filtered by that tag;
- X -> return to Explore sphere at the correct context.

### 5.3 Large inspection

Tap medium image -> large/full inspection.

Large behaves essentially as Focus:

- previous/next;
- stack selector;
- Details;
- favorite;
- trash;
- X clear of Details;
- X -> medium, preserving current image/context.

Tag fling is not required in large inspection.

### 5.4 Explore state machine

`Sphere -> tap thumbnail -> Medium -> tap image -> Large`

Reverse:

`Large -> X -> Medium -> X -> Sphere`

The return path is part of the feature, not incidental navigation.

---

## 6 · TABLE

Table is the fast physical triage/tagging surface.

### 6.1 Entry and source

- Table opens on **the current stack**.
- It is not restricted to Inbox, Maybe, or any special source stack.
- Stack selector can switch the working stack.
- Images from the current stack are scattered across the table as thumbnails.
- Table thumbnails use the same shared thumbnail/cache path as Explore/Grid/Focus where the rendition is reusable.

### 6.2 Three tag targets

Exactly three active tag targets are visible.

They are tags, not immutable stacks.

Required:

- three targets;
- draggable/repositionable;
- positions persist;
- long press target -> rename/redefine tag;
- tag names/definitions are folder-specific;
- the same folder's tag definitions are shared by Explore and Table;
- defaults may exist for a new folder, but `YES/MAYBE/NO` must not be baked in as immutable architecture.

### 6.3 Thumbnail behavior

Table uniquely permits fast fling directly from thumbnail state.

- Fling thumbnail -> tag target.
- Same actual comet trails as Sort.
- Target physics remain: momentum, bank shots, rim/corner interaction, vacuum/capture and capture animation.
- **Only image-to-image collisions are removed.**
- Tap thumbnail -> medium inspection.

### 6.4 Medium inspection

Medium uses canonical Focus chrome and remains taggable:

- previous/next;
- stack selector;
- Details;
- image # / total;
- favorite;
- trash;
- same three current-folder tag targets;
- fling medium image -> tag;
- same Sort comet trail;
- X -> Table at correct context.

### 6.5 Large inspection

Tap medium -> large.

- previous/next;
- stack selector;
- Details;
- favorite;
- trash;
- X -> medium;
- no tag fling required.

---

## 7 · GRID ROUND-TRIP CONTRACT

Grid is a powerful operational surface, not a dead-end mode switch.

### 7.1 Tag target -> Grid

Tapping a tag target in Explore medium or Table opens Grid with that tag already applied as an implicit filter.

The user should experience normal Grid capabilities — search, selection, tagging, notes/details as supported, and bulk operations — without needing a separate visible filter-management ceremony just to enter.

### 7.2 Stack selector -> Grid

Focus, Explore, and Table stack selectors provide a direct route to Grid for the selected/current stack.

### 7.3 Origin context

Every Grid entry from these surfaces records at minimum:

- origin surface: Focus / Explore / Table;
- folder;
- stack;
- current image or logical position where applicable;
- tag-filter context where applicable;
- originating inspection level where applicable.

### 7.4 Return

Grid exit returns to the exact originating surface. It must reconcile state after Grid mutations rather than restoring a stale numeric index.

Examples:

- image deleted in Grid -> choose the appropriate surviving neighbor;
- image moved/tagged -> stack/tag context reflects the mutation;
- stack changed by bulk operation -> return state resolves against current data;
- origin was Explore medium -> return to Explore medium when still meaningful;
- origin was Table -> return to Table with current stack/layout context.

---

## 8 · SHARED THUMBNAIL PERFORMANCE

This is a structural release, not polish. Current Explore sphere and Table thumbnail loading is reported as too slow.

### 8.1 Required architecture

- One shared thumbnail service/cache for every surface that can reuse the same rendition.
- No duplicate provider fetch merely because the user changed surfaces.
- No refetch/repaint of unchanged thumbnail content merely because an item moved on the sphere/table.
- Visible and near-visible thumbnails get priority.
- Cache/database persistence must not block first useful paint.
- Reuse decoded/image resources where practical; avoid unnecessary image-node destruction/recreation.
- Google Drive signed/temporary URL expiry must recover without visible images becoming permanent "not found" after idle.
- Provider credential refresh must not reset navigation state.

### 8.2 Instrument first — hard stop

Before changing the cache/loading path, instrument and measure:

| Metric | Baseline required? |
|---|---|
| Time to first useful thumbnail | YES |
| Time to fill visible Explore sphere | YES |
| Time to fill visible Table | YES |
| Provider requests per visible item | YES |
| Cache hit/miss by surface transition | YES |
| Refetch count during sphere movement | YES |
| Refetch count during Table movement | YES |
| Decode/repaint/node recreation count where measurable | YES |
| Drive URL expiry/recovery path after idle | YES |

Do not claim a root cause until logs/profiling identify it.

### 8.3 Repository-history audit

Before inventing a new cache, search history for the previous performance/cache work the owner recalls. Recover working ideas when evidence supports them; do not blindly restore old code.

---

## 9 · RESUME / IDLE STATE

The application restores the screen the user actually left.

Required persisted/reconciled state:

- active surface;
- folder;
- current stack;
- current image/logical position;
- Explore/Table inspection level where appropriate;
- Grid origin context where appropriate.

Reported failure to prevent: after idle/background, app returns to folder selection and then jumps into the remembered image. That is incorrect. Authentication/provider refresh is infrastructure and must not overwrite UI navigation state.

---

## 10 · SORT DESKTOP FIT

Existing Sort behavior/symmetry is protected.

Only approved defect scope:

- stack pills are too tall on PC/desktop;
- trash pill overlaps/competes with the footer;
- reduce pill height and provide footer clearance;
- do not redesign Sort or disturb its established symmetry.

---

## 11 · OPEN ITEMS LEDGER

Nothing unresolved lives only in conversation.

| # | Open item | Why open | Needed decision/evidence | Status |
|---|---|---|---|---|
| O1 | Approved baseline commit/file | Current `main` lineage contains unapproved/failed iterations | Owner identifies baseline or repository audit proposes candidates for owner gate | HARD BLOCKER |
| O2 | Exact default names for the three folder tag targets | Architecture says renameable tags; defaults not yet owner-fixed | Owner ruling; may retain YES/MAYBE/NO only as defaults if desired | OPEN |
| O3 | Tag persistence representation | Folder-specific and shared across Explore/Table is fixed; storage schema is not | Audit existing metadata/tag model and provider constraints | OPEN |
| O4 | Long-press rename UX | Gesture is fixed; exact editor surface/validation is not | Design proposal after baseline audit | OPEN |
| O5 | Stack-selector gesture/control for direct Grid entry | Capability is fixed; exact gesture/menu affordance needs mapping to existing selector | Audit current selector and propose minimal addition | OPEN |
| O6 | Previous/next affordance in medium/large Explore/Table | Behavior fixed; whether invisible swipe/tap zones or visible Focus controls are canonical must be confirmed from current Focus | Baseline audit | OPEN |
| O7 | Explore sphere pinch semantics | Pinch remains; exact scale limits/interaction with rotation need current implementation audit | Baseline audit |
| O8 | Video scope in this release family | Product horizon includes video; current recovered requirements are image-centric | Owner decision after image curation stabilizes | DEFERRED |
| O9 | Existing Grid bulk move/tag capabilities | Owner recalls useful bulk operations; exact current behavior needs verification | Baseline audit/device test | OPEN |
| O10 | Thumbnail performance root cause | Shared cache exists in some historical builds, but actual bottleneck is unproven | Instrumentation/profile | OPEN |
| O11 | Google Drive idle disappearance root cause | Reported; not diagnosed | Reproduce with logs and provider/cache evidence | OPEN |
| O12 | Exact device/browser gate matrix | Chrome desktop is known; mobile/touch behavior is central | Owner confirms required devices; at minimum desktop + touch/mobile should gate | OPEN |
| O13 | Footer/version convention | Visible footer version is required; exact semantic version scheme can remain simple | Use plan release/build identity once baseline fixed | OPEN |
| O14 | AI-assisted modes / Venice.ai | Earlier horizon allowed separate low-cost/free AI modes, explicitly separated from normal/card modes | Not part of current curation release; revisit separately | DEFERRED |

---

## 12 · IMMUTABLE WORKING RULES

These are operating rules, not suggestions.

### 12.1 Every UI-V2 turn starts here

Before analysis, planning, or implementation:

1. Read `ui-v2-plan.md`.
2. Read `UI-V2-GRAVEYARD.md`.
3. Update this plan's **Turn Ledger** with the incoming owner request and current state before substantive project work.
4. State internally whether the turn is READ-ONLY, PLAN-AUTHORIZED, or BUILD-AUTHORIZED. Do not infer build permission from frustration, bug reports, screenshots, or requirements discussion.

### 12.2 Every UI-V2 turn ends here

Before the final response:

1. Update decisions made this turn.
2. Update release/open-item status.
3. Add graveyard entries for newly disproven approaches.
4. Record evidence/verification performed.
5. Record the exact next action and whether it requires owner authorization.
6. Commit the plan update.

This rule applies even when no application code changes.

### 12.3 Authority order

When sources disagree, stop at the first source that answers:

1. Owner ruling in the current session — but it must be written into this plan before the turn ends.
2. `UI-V2-GRAVEYARD.md` — vetoes buried implementation approaches.
3. `ui-v2-plan.md` — scope, sequence, requirements, release state, open items.
4. Approved baseline `ui-v2.html` — existing behavior that must be preserved unless explicitly changed.
5. `UI-V2-CURATION-PLAN.md` — recovered requirements precursor; subordinate to this master plan.
6. `vid-v1.html` and other owner-designated references — inspiration/reference, not automatic requirements.
7. Conversation history — useful evidence, never the durable source of truth.

### 12.4 Never patch forward after a failed gate

On material failure:

**rollback/re-establish clean approved input -> graveyard -> plan -> rebuild -> automated gates -> publish -> verify -> owner device gate.**

Never stack another override on an uncertain build merely because it is faster.

### 12.5 No application edits without explicit authorization

Requirements capture, diagnosis, audit, review, and planning are read-only unless the owner explicitly authorizes implementation.

### 12.6 Instrument first when cause is unknown — HARD STOP

Do not diagnose thumbnail performance, Drive expiry, resume state, physics bugs, or rendering loops from reasoning alone when runtime evidence can be collected. Add scoped instrumentation or use existing logs, reproduce, then state what evidence proves.

### 12.7 Verify, do not infer

- Repository commit != deployed application.
- Workflow green != deployed application.
- Static marker != runtime correctness.
- Automated tests green != owner/device approval.

State only what the evidence proves.

### 12.8 Published artifact verification is mandatory

After an authorized push:

1. Read back the exact committed blob.
2. Verify expected version/requirements markers in that blob.
3. Verify GitHub Pages/deployment is serving the intended commit/artifact when tooling permits.
4. Open/fetch the public artifact where possible.
5. Provide a cache-busted test URL automatically.

The owner should never need to ask for the test URL.

### 12.9 Green means allowed to test, never done

Automated syntax/structure/unit checks are preconditions. The owner/device gate determines approval.

### 12.10 One coherent behavior slice per release

Do not combine unrelated redesigns because they are nearby in one HTML file. A release should be independently testable and have a clear rollback boundary.

### 12.11 Preserve working behavior by construction

Prefer reusing/wrapping canonical behavior over duplicating/reimplementing it. When changing shared code, enumerate downstream surfaces and regression-test them.

### 12.12 Assert downstream effects

Tests must verify the user-visible consequence, not only that a handler returned or a class was added.

### 12.13 Mutation-test critical gates

For critical automated gates, deliberately reproduce the defect or violate the invariant and confirm the gate fails. A test that cannot catch its named regression is not a gate.

### 12.14 No fake interfaces, duplicate controls, stubs, or TODO releases

Every authorized release is cumulative and real. No placeholder tag targets, fake Focus controls, mock provider data, or partial UX shipped as if complete.

### 12.15 No workflow source-payload experiments

GitHub Actions may orchestrate established build/test/deploy commands. Do not embed large application patches inside workflow YAML.

### 12.16 Source lineage is explicit

Before building, record:

- input commit/file;
- output version;
- exact release scope;
- files allowed to change.

If input lineage is uncertain, stop.

### 12.17 Cosmetic work stays scoped

Cosmetic fixes may ship when explicitly scoped (e.g. Sort pill height/footer clearance), but must not become an excuse to restructure unrelated surfaces.

### 12.18 Response discipline

For implementation turns, report result, version, evidence, known limitations/open items, and test URL. Do not bury whether the owner must act.

---

## 13 · FIXED INFRASTRUCTURE / PRACTICALITIES

| Thing | Rule / value |
|---|---|
| Repository | `acmeproducts/perf` |
| Application | `ui-v2.html` |
| Public Pages app | `https://acmeproducts.github.io/perf/ui-v2.html` |
| Plan | `ui-v2-plan.md` |
| Graveyard | `UI-V2-GRAVEYARD.md` |
| Requirements precursor | `UI-V2-CURATION-PLAN.md` |
| Primary providers | Google Drive, OneDrive |
| Deployment branch | `main` unless owner changes it |
| Application form | Single HTML file currently; do not assume a modular rewrite is authorized |
| Verification | Fresh GitHub read at exact commit + published artifact verification + cache-busted URL |
| Build identity | Visible in footer, not comment-only and not dependent solely on late runtime rewrite |

Do not change provider credentials, OAuth configuration, storage semantics, Pages configuration, or deployment infrastructure as incidental work.

---

## 14 · DO-NOT-TOUCH INVARIANTS

Until a release explicitly scopes them, preserve:

- cloud provider selection/authentication paths;
- existing Sort interaction symmetry and physics except specifically approved desktop pill fit;
- canonical Focus Details/favorite/trash behavior;
- folder and stack semantics outside the tag-target additions;
- Grid search/bulk capabilities that already work;
- provider data integrity — curation actions must not silently destroy originals;
- existing mode drawer/navigation behavior unless a release explicitly changes it;
- double-tap Focus entry/exit behavior previously retained by owner direction, subject to baseline confirmation;
- touch and desktop input support.

---

## 15 · RELEASE GATES

### 15.1 R0 — baseline recovery gate

- Candidate baseline identified by commit SHA.
- Owner can open it with a cache-busted URL or local historical artifact.
- Core provider login works.
- Owner explicitly declares it the baseline.
- Plan records the approval and exact SHA.

No implementation release proceeds before this gate.

### 15.2 R2 — performance gate

Automated evidence plus owner test:

- baseline and new measurements recorded;
- Explore first useful paint materially improved;
- visible sphere fill materially improved;
- Table fill materially improved;
- movement does not refetch unchanged thumbnails;
- cross-surface cache reuse demonstrated;
- Drive idle/expiry recovery demonstrated or remaining provider limitation explicitly proven;
- no provider-selection hang.

### 15.3 R3/R4 — inspection/tag gate

Explore:

- sphere has no tag targets;
- tap -> medium;
- medium has canonical Focus chrome + 3 tag targets + previous/next;
- medium X -> sphere;
- tap medium -> large;
- large X -> medium;
- Details/favorite/trash/stack switching work at appropriate inspection states.

Table:

- opens current stack;
- three renameable draggable folder tag targets;
- thumbnail fling works;
- tap -> medium; medium fling works;
- medium -> large; X hierarchy works;
- canonical Focus chrome, no duplicates.

### 15.4 R5 — Grid round-trip gate

- tag target -> tag-filtered Grid;
- stack selector -> stack Grid;
- Grid mutations performed;
- exit returns to exact origin surface;
- stack/image context reconciled correctly after deletion/move/tagging.

### 15.5 R6 — Table physics gate

- Sort comet trail is actual shared/reused behavior or verified exact canonical implementation;
- bank/rim/corner/vacuum/capture effects remain;
- image-image collisions absent;
- target dragging persists;
- fling capture is reliable enough for fast curation.

### 15.6 R7 — resume gate

- leave app idle/backgrounded on Focus, Explore sphere, Explore medium, Table, and Grid;
- resume each;
- no folder-selection reset;
- surface/folder/stack/image/inspection context preserved or correctly reconciled;
- provider refresh does not hijack navigation state.

### 15.7 R8 — Sort fit gate

- desktop pills visibly shorter;
- trash clears footer;
- symmetry and existing Sort behavior unchanged.

### 15.8 Final integration gate

At minimum test:

- desktop Chrome;
- touch/mobile browser/device designated by owner;
- Google Drive;
- OneDrive where available;
- a meaningfully large folder/stack, not only tiny test data.

---

## 16 · GRAVEYARD SUMMARY

Full veto details live in `UI-V2-GRAVEYARD.md`.

Currently buried:

- application payloads embedded in workflow YAML;
- patch-forward development from damaged/uncertain snapshots;
- broad MutationObserver stabilization loops;
- fake/parallel Explore and Table chrome;
- hard-coded Table semantic stacks as final architecture;
- Inbox/Maybe-only Table;
- Explore tag targets on sphere state;
- Table image-image collisions;
- per-surface thumbnail caches;
- deployment claims without published-artifact verification;
- runtime-only version identity;
- unauthorized application changes;
- building from fragmented conversation memory;
- claiming shared effects without actual reuse/parity;
- CSS-hiding duplicate architecture as the final solution.

---

## 17 · FUTURE / OUT OF CURRENT RELEASE TRAIN

| # | Idea | Status |
|---|---|---|
| FUT1 | Video-only curation modes beyond the card metaphor | Future |
| FUT2 | Unified image+video curation modes | Future |
| FUT3 | AI-assisted modes using Venice.ai free/low-cost models | Future — must remain explicitly separate from normal/card modes |
| FUT4 | Additional named modes beyond Heart/Diamond/Club/Spade metaphor | Future |
| FUT5 | Ranking/grouping games for very large libraries | Future |

These do not enter the current release train without owner scheduling.

---

## 18 · TURN LEDGER

Every project turn appends one row before substantive work and closes it before final response.

| Date/time | Turn | Authorization | Incoming request / decision | Work/evidence | Plan/graveyard change | End state / next action |
|---|---|---|---|---|---|---|
| 2026-08-12 | T001 | PLAN-AUTHORIZED only | Recover missing Explore/Table/Focus/tag/Grid requirements into a durable plan; determine whether governance existed | Created `UI-V2-CURATION-PLAN.md`; repo search found no current UI-V2 governance document | Requirements precursor created | Owner supplied TalkBridge governance template next |
| 2026-08-12 | T002 | PLAN-AUTHORIZED only | Adopt TalkBridge plan structure/conventions/disciplines for UI-V2; capture lessons; create graveyard; always start/end turns in plan | Read `talkbridge/TALKBRIDGE-PLAN-v9.md`; extracted release table, immutable rules, authority order, graveyard discipline, failure protocol, verification/device-gate discipline; created UI-V2 graveyard and this master plan | `UI-V2-GRAVEYARD.md` v1.0.0 and `ui-v2-plan.md` v1.0.0 created | Next: owner reviews plan. No application implementation authorized. R0 baseline recovery remains hard blocker |
| 2026-08-12 | T003 | READ-ONLY | Owner asks TL;DR: what is next? | Re-read master plan. R1 governance accepted; R0 baseline recovery remains the hard blocker before any implementation | Plan v1.0.1; R1 marked COMPLETE | Next: perform repository-history baseline audit and present candidate baseline(s) with test links for owner selection. This is read-only and does not modify `ui-v2.html` |

---

## 19 · CHANGE LOG

**v1.0.1 · 2026-08-12.** Owner accepted governance setup. R1 marked complete. Next action fixed as read-only R0 baseline recovery: audit repository history, identify candidate clean/known-good `ui-v2.html` baselines, and present testable candidates to the owner. No application implementation authorized.

**v1.0.0 · 2026-08-12.** Initial governed master plan. Structure and discipline adapted from the owner-designated TalkBridge working plan to UI-V2 scope. Incorporated recovered Focus/Explore/Table/tag/Grid requirements, shared thumbnail performance requirements, Drive idle recovery, resume-state requirement, Sort desktop pill defect, release gates, open-item ledger, authority order, fixed infrastructure, do-not-touch invariants, graveyard discipline, no-patch-forward rule, explicit authorization boundary, published-artifact verification, and mandatory per-turn start/end plan updates. R0 baseline recovery is a hard blocker before application implementation.