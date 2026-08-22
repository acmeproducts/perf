# UI-V2 MASTER PLAN — GOVERNED RECONSTRUCTION

**Plan status:** APPROVED — CANONICAL EXECUTION PLAN  
**Repository:** `acmeproducts/perf`  
**Production artifact:** `ui-v2.html`  
**Frozen reconstruction baseline commit:** `a6de049f8c8b9798c610984b35b9d8ade57d0fa5`  
**Frozen baseline `ui-v2.html` blob:** `1f3943655b157ccf10626d32bf4d1679e835867c`  
**Baseline identity:** `Orbital8- baseline V9b`  
**Release rule:** cumulative releases only; every release starts from the last passed release  
**Canonical plan:** `UI-V2-MASTER-PLAN.md`  
**Recovery amendment:** 2026-08-22 — R4.8/R4.9.1 are rejected as implementation foundations. R4.10 is rebuilt from the verified R4.7 application source while carrying forward only governed corrections: view-only fileId anchoring, exact visible sphere hit ownership, independent smooth sphere extent, and iPhone usability fixes.

---

## 0 · GOVERNANCE

There is one reconstruction chain. No patch-forward compatibility track and no feature is built on a failed candidate.

Mandatory failure sequence:

**stop → identify last approved baseline → rollback/rebuild → graveyard → amend this plan → implement from clean input → automated gates → publish → verify artifact → owner device gate**.

`UI-V2-GRAVEYARD.md` is binding. Historical plans and failed test wrappers are evidence only.

---

## 1 · ABSOLUTE FILE-IDENTITY RULE

The authoritative image identity everywhere is stable **`fileId`**. Indexes, DOM z-order, projected depth, nearest-center distance, and rendered positions are derived presentation values only.

There is one canonical current `fileId` across Explore → Focus → Focus navigation → Explore return → Grid.

An Explore thumbnail inspection is a **view-selection action**, not a data-order mutation. It must never change normal-stack order or persist a new `stackSequence` merely to make an image current.

Explicit user action always wins over cached, armed, centered, nearest, frontmost, or previously selected state.

---

## 2 · PRIMARY SURFACES AND FOCUS

The four primary surfaces remain **Sort · Focus · Explore · Table**. Grid is secondary. Details belongs to the active image.

There is one canonical Focus implementation. Explore and Table enter it directly while preserving origin context.

When Focus is entered from Explore:

1. tapped Explore `fileId` becomes canonical before Focus renders;
2. Focus renders that exact file;
3. Focus navigation updates canonical `fileId`;
4. X/outward returns to Explore with the final Focus `fileId` as the Explore anchor;
5. sphere geometry is preserved when stack/population is unchanged;
6. removed files use deterministic surviving fallback.

---

## 3 · EXPLORE CONTRACT

Explore is browse/inspect only. It has thumbnails, Percentage, Images, and spatial zoom. No normal-stack targets and no tag targets.

### 3.1 Exact visible thumbnail tap

A clean tap on **any visible thumbnail**, including a far-side thumbnail, opens that exact thumbnail's stable `fileId` directly in canonical Focus.

Input ownership rules:

- At pointer/touch start, capture the exact visible card under the deliberate contact and its `data-file-id`.
- Retain that `fileId` for the duration of the clean tap.
- Movement beyond the tap threshold cancels activation and becomes sphere rotation; it does not substitute another file.
- Pointer-up DOM target, z-order, projected-front card, centered card, nearest-center card, or previously selected card may not replace the captured `fileId`.
- A card element and its image resource must agree on the same `fileId` before activation.
- Blank/ambiguous space does not invent a nearest image.

### 3.2 Far-side presentation

Rear/far-side thumbnails remain clearly identifiable. Depth may change scale and layering, but valid rear thumbnails must not fade toward invisibility.

Opacity is a visual rule only; it is not the hit-testing solution.

### 3.3 Return anchor

On Focus X/outward return, Explore selects and centers the **current Focus `fileId`**, including after the user pages forward/back. The return anchor is the final Focus image, not necessarily the originally tapped image.

### 3.4 Grid top-left anchor

When Grid opens for the same stack from Explore or Explore-origin Focus, canonical active `fileId` renders in the **top-left Grid position** when present.

This is presentation ordering only: `[active file, all remaining files in their existing relative stack order]`. Opening Grid does not persist a normal-stack reorder.

### 3.5 Independent controls

- **Images** → active/warmed population count.
- **Percentage** → thumbnail/card rendered size.
- **Pinch / wheel** → sphere spatial radius/extent only.

Spatial zoom cannot rewrite Percentage, Images, stack order, selected `fileId`, or sphere orientation.

### 3.6 Smooth pinch

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

Rotation and pinch are mutually exclusive gesture states: entering pinch cancels single-pointer rotation cleanly; ending pinch does not inject rotational velocity.

Wheel/trackpad spatial zoom follows the same independence rule.

---

## 4 · IPHONE USABILITY CONTRACT

### 4.1 Details close control

On narrow iPhone viewports the Details X must remain reachable inside the visual/safe-area viewport. The modal may scroll internally, but its close control is fixed/sticky to the modal's visible top edge and cannot be pushed offscreen by content.

### 4.2 Minimum readable maintenance text

For iPhone/narrow touch layouts, Table text, long-press menus, and tag-stack maintenance controls use a minimum readable text size of **16 CSS px** for interactive labels and editable fields, with adequate line height and touch target height. Desktop/tablet typography remains unchanged unless necessary for the same component.

---

## 5 · MOVEMENT / RESOURCE RULE

Geometry-only movement must not recreate image elements, replace unchanged image sources, resolve provider URLs again, or refetch thumbnails.

This applies to rotation, pinch, wheel zoom, return centering, and Grid presentation anchoring.

---

## 6 · PRESERVED BEHAVIOR

The R4.7 Table count reconciliation and Table tag-target behavior are outside this regression repair and must remain unchanged except for narrow-screen typography/readability CSS. Sort behavior, provider integration, Pages configuration, workflows, tag semantics, and unrelated UI are out of scope.

---

## 7 · GOVERNED RECOVERY RELEASE — R4.10

### Source

Rebuild application behavior from:

- R4.7 commit `743660c398db5e26269a06ac467ab191aa664afd`
- R4.7 `ui-v2.html` blob `5b753ed5539948409bf16a723c9f55f23f0deaa7`

R4.8 is evidence for the correct no-stack-mutation correction only; R4.9.1 wrapper code is not an implementation source.

### Scope

R4.10 changes only:

1. exact Explore visible-card hit ownership by stable `fileId`;
2. Focus navigation → Explore return anchor;
3. same-stack Grid top-left presentation anchor;
4. far-side thumbnail legibility;
5. smooth independent Explore pinch/wheel spatial zoom;
6. iPhone Details close reachability;
7. iPhone Table/long-press/tag-maintenance text readability;
8. automated regression gates for the above.

### Automated gates

R4.10 cannot publish unless assertions prove:

- tapped card `data-file-id` = captured requested `fileId` = Focus current `fileId`;
- overlap cannot substitute a different front/projected/nearest card;
- Explore tap does not change stack order or `stackSequence`;
- Focus navigation changes canonical `fileId` and Explore return centers it;
- same-stack Grid first rendered file equals canonical active `fileId` without persistent reorder;
- far-side minimum opacity remains readable;
- pinch changes sphere extent continuously while card Percentage remains unchanged;
- pinch preserves rotation and selected `fileId`;
- zoom geometry causes no source replacements or element recreations;
- iPhone Details close button intersects the safe visual viewport;
- iPhone interactive Table/maintenance text computes to at least 16px;
- R4.7 Table count reconciliation still passes;
- existing R3/R4 gates remain green except checks explicitly superseded here.

### Owner device gate

1. Tap front-side arbitrary thumbnails: exact images open.
2. X immediately: same image is centered/selected.
3. Navigate several Focus images, X: final Focus image is centered/selected.
4. Open same stack Grid: canonical image is top-left; stack order remains unchanged.
5. Rotate a clearly visible rear thumbnail into view and tap it: that exact rear image opens; no front card steals the tap.
6. Confirm rear thumbnails remain identifiable.
7. Pinch slowly, quickly, reverse direction, and repeat: extent follows fingers smoothly without jumps or card-size changes.
8. Confirm pinch does not change selection and rotation remains correct afterward.
9. On iPhone, open Details: X is reachable without impossible scrolling.
10. On iPhone, inspect Table, long-press menu, and tag-stack maintenance: text is readable.
11. Confirm existing Table and Sort/Focus behavior outside scope did not regress.

A green automated gate means **allowed to test**, not done.

---

## 8 · RELEASE STATUS

- **R4.7:** verified application baseline / source anchor.
- **R4.8:** rejected as a release; no-stack-mutation concept retained only as governed requirement.
- **R4.9.1:** rejected wrapper/nearest-hit test path; buried.
- **R4.10:** authorized clean recovery build under this plan.
- **Main/Pages:** do not publish R4.10 until automated gates pass and candidate blob is verified.
