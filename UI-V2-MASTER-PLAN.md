# UI-V2 MASTER PLAN — GOVERNED RECONSTRUCTION

**Plan status:** APPROVED — CANONICAL EXECUTION PLAN  
**Repository:** `acmeproducts/perf`  
**Production artifact:** `ui-v2.html`  
**Frozen reconstruction baseline commit:** `a6de049f8c8b9798c610984b35b9d8ade57d0fa5`  
**Frozen baseline `ui-v2.html` blob:** `1f3943655b157ccf10626d32bf4d1679e835867c`  
**Baseline identity:** `Orbital8- baseline V9b`  
**Release rule:** cumulative releases only; every release starts from the last passed release  
**Canonical plan:** `UI-V2-MASTER-PLAN.md`  
**Regression recovery amendment:** 2026-08-22 — R4.8 is rejected. Reconstruction branch rolled back to R4.7 commit `743660c398db5e26269a06ac467ab191aa664afd`; recovery rebuilds exact Explore pointer continuity and smooth independent sphere zoom from that baseline, not from R4.8.

---

## 0 · GOVERNANCE

There is one reconstruction chain. No patch-forward compatibility track and no feature is built on a failed candidate.

Mandatory failure sequence:

**stop → identify last approved baseline → rollback → graveyard → amend this plan → rebuild from clean input → automated gates → publish → verify artifact → owner device gate**.

`UI-V2-GRAVEYARD.md` is binding. Historical plans are evidence only.

---

## 1 · ABSOLUTE FILE-IDENTITY RULE

The authoritative image identity everywhere is stable **`fileId`**. Indexes and rendered positions are derived values only.

An Explore thumbnail inspection is a **view-selection action**, not a data-order mutation. It must never change normal-stack order or persist a new `stackSequence` merely to make an image current.

The canonical active `fileId` must survive Explore thumbnail → Focus, Focus navigation, Focus X/outward → Explore, Explore/Focus → Grid, Grid return, and deterministic mutation fallback.

Explicit user action always wins over cached or previously selected state.

---

## 2 · PRIMARY SURFACES AND FOCUS

The four primary surfaces remain **Sort · Focus · Explore · Table**. Grid is secondary. Details belongs to the active image.

There is one canonical Focus implementation. Explore and Table enter it directly while preserving origin context.

When Focus is entered from Explore:

1. tapped Explore `fileId` becomes canonical before Focus renders;
2. Focus renders that exact file, never a nearest/armed/previous card;
3. Focus forward/back/swipe/tap navigation updates canonical `fileId`;
4. X/outward returns to Explore with the current Focus `fileId` as the Explore anchor;
5. sphere geometry is preserved when stack/population is unchanged;
6. removed files use deterministic next/previous surviving fallback.

---

## 3 · EXPLORE CONTRACT

Explore is browse/inspect only. It has thumbnails, Percentage, Images, and spatial zoom. No normal-stack targets and no tag targets.

### 3.1 Exact arbitrary thumbnail tap

A clean tap on **any visible thumbnail** opens that exact thumbnail's stable `fileId` directly in canonical Focus.

No arming. No center requirement. No nearest-card substitution. Drag/rotation never opens an image.

The tap may update view selection and `CurrentImage`; it may not rotate/rewrite the underlying normal stack or persist `stackSequence` changes.

### 3.2 Return anchor

On Focus X/outward return, Explore selects and centers the **current Focus `fileId`**, including after the user pages forward/back. The return anchor is the final Focus image, not necessarily the originally tapped image.

### 3.3 Grid top-left anchor

When Grid opens for the same stack from Explore or Explore-origin Focus, canonical active `fileId` renders in the **top-left Grid position** when present.

This is presentation ordering only: `[active file, all remaining files in their existing relative stack order]`. Opening Grid does not persist a normal-stack reorder. An explicit governed Grid reorder remains a real mutation.

### 3.4 Independent controls

- **Images** → active/warmed population count.
- **Percentage** → thumbnail/card rendered size.
- **Pinch / wheel** → sphere spatial radius/extent only.

Spatial zoom cannot rewrite Percentage, Images, stack order, selected `fileId`, or sphere orientation.

### 3.5 Smooth pinch

Pinch is continuous geometry, not repeated layout commits.

During pinch:

- capture initial two-finger distance and sphere extent once;
- derive extent continuously from the distance ratio;
- coalesce visual updates with `requestAnimationFrame`;
- preserve `rotationX`, `rotationY`, selected `fileId`, cards, and thumbnail sources;
- do not reconcile population;
- do not recalculate Percentage/card scale from sphere extent;
- do not persist settings or log layout on every touch sample;
- do not jump when the second finger enters or leaves;
- settle labels/persistence once when pinch ends.

Wheel/trackpad spatial zoom follows the same independence rule.

---

## 4 · MOVEMENT / RESOURCE RULE

Geometry-only movement must not recreate image elements, replace unchanged image sources, resolve provider URLs again, or refetch thumbnails.

This applies to rotation, pinch, wheel zoom, return centering, and Grid presentation anchoring.

---

## 5 · PRESERVED R4.7 BEHAVIOR

The R4.7 Table count reconciliation and Table tag-target behavior are outside this regression repair and must remain unchanged. Sort behavior, provider integration, Pages configuration, workflows, tag semantics, and unrelated UI are also out of scope.

---

## 6 · GOVERNED RECOVERY RELEASE — R4.9

### Source

Rebuild application code only from:

- R4.7 commit `743660c398db5e26269a06ac467ab191aa664afd`
- R4.7 `ui-v2.html` blob `5b753ed5539948409bf16a723c9f55f23f0deaa7`

Documentation commits made after rollback may accompany the branch but must not import R4.8 application code.

### Scope

R4.9 changes only:

1. Explore exact thumbnail → Focus pointer path;
2. Focus navigation → Explore return anchor;
3. same-stack Grid top-left presentation anchor;
4. Explore pinch/wheel spatial zoom smoothness and independence;
5. automated regression gates for these behaviors.

### Implementation requirements

- Remove R4.7 `promoteFileId()` data-order mutation from Explore activation.
- Replace it with stable view anchoring keyed by `fileId`.
- `CurrentImage` remains canonical; `SpatialGallery.selectedIndex` is derived rendering state.
- Explore-origin Focus navigation keeps the current/referrer `fileId` synchronized.
- Return uses `SpatialGallery.open(... preserveGeometry: true)` and centers current `fileId` without changing stack order.
- Grid derives temporary active-first presentation without persisting reorder.
- Pinch changes only `sphereScale`; Percentage/card scale is independent.
- Persist/log zoom at gesture completion, not every move.

### Automated gates

R4.9 cannot publish unless assertions prove:

- tapped card `data-file-id` = requested `fileId` = Focus current `fileId`;
- Explore tap does not change stack order or `stackSequence`;
- Focus navigation changes canonical `fileId` and Explore return centers it;
- same-stack Grid first rendered file equals canonical active `fileId` without persistent reorder;
- pinch changes sphere extent while Percentage/card scale remains unchanged;
- pinch preserves rotation and selected `fileId`;
- zoom geometry causes no source replacements or element recreations;
- R4.7 Table count reconciliation still passes;
- existing R3/R4 gates remain green except checks explicitly superseded here.

### Owner device gate

1. Tap several arbitrary visible sphere thumbnails, including off-center cards: each exact image opens.
2. X immediately: same image is centered/selected on sphere.
3. Enter Focus, page forward/back several images, X: final Focus image is centered/selected.
4. Open same stack Grid: final canonical image is top-left.
5. Pinch slowly, quickly, reverse direction, repeat: sphere extent follows fingers smoothly without jumps or card-size changes.
6. Rotate before/after pinch: orientation and selected image remain coherent.
7. Confirm Table counts/tag behavior did not regress.

A green automated gate means **allowed to test**, not done.

---

## 7 · RELEASE STATUS

- **R4.7:** rollback baseline / application source for recovery.
- **R4.8:** rejected; patch-on-patch regression, buried.
- **R4.9:** authorized recovery build under this plan.
- **Main/Pages:** do not publish R4.9 until automated gates pass and candidate blob is verified.
