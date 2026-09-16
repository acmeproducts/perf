# Prompt for the next session — Orbital8 ui-v2.html

Paste this whole file as your opening message.

---

## Ground rules (non-negotiable — every one of these was violated in the prior session and caused the mess you are inheriting)

1. **Do not push anything until you can explain the defect's mechanism end to end.** "Plausible from reading the code" is not a diagnosis. Every fix shipped on that basis failed on device.
2. **The local Playwright suite passing means nothing.** It passed before every single regression. It runs against synthetic instant-loading images and cannot see real latency, real provider behavior, or real device rendering.
3. **One change per push.** The owner tests on a real device; that is the only real gate. If you ship three changes and it breaks, nobody can tell which one did it. This happened repeatedly.
4. **Read `IMAGE-LIFECYCLE-MAP.md` in this repo before touching anything.** All the defects below route through one shared object. Fixing one surface in isolation breaks the others — that is the central lesson of the prior session.
5. **The owner is the tester, not the developer.** Do not ask them to choose an approach, pick between options, or decide architecture. Diagnose, decide, explain briefly, execute.
6. Do not offer "ship it with known defects" as a recommendation. There is a customer waiting.

## Current state

- `main` is at commit `a7c85e3` (pushed as `800f920`). **This is the only owner-confirmed-good build.** md5 of `ui-v2.html`: `1c39f0dc9e3773c69de1d91316896a00`
- It equals commit `3c8471d` (confirmed: taps faithful, globe builds correctly, not sparse) plus one clean fix: Table floating controls (CSS class swap only — `photo-table__controls` → `spatial-gallery__controls`). Owner confirmed these "work flawlessly."
- Everything else attempted in the prior session was rolled back. Do not resurrect any of it without re-deriving it yourself.

## Required reading, in this order

1. `IMAGE-LIFECYCLE-MAP.md` — the shared `SharedImageResources` layer, the six-field tap identity contract, the three separate generation clocks, and which surfaces share which load path. **The single most important fact: a failed tap does not error. It returns `false` and silently does nothing.** Any mismatch among `dataset.fileId`, `dataset.sharedResourceKey`, the binding object, `binding.loadedKey`, the surface's `generation`/`stackName`/`folderId`, or the canonical stack entry kills the tap invisibly.
2. `TURNOVER.md` — dated account of every attempt and failure, with commit IDs.
3. `UI-V2-GRAVEYARD.md` — catalogued dead approaches. Check before proposing anything.
4. `UI-V2-MASTER-PLAN.md` §123 — prior RCA/manager/red-team writeup. Treat its conclusions as **unproven**; several were wrong.

## Reference implementations already in this repo

- **`ui-v3.html`** — the behavioral gold standard. Owner: "this shows exactly how grid is supposed to work." It is snappy in Focus, correct in Grid, and has **no `SharedImageResources` at all** — it preloads into a detached `Image()`, keeps a small per-file cache, swaps `img.src` only on load, uses a per-call `loadId` token. Key functions: `Utils.setImageSrc` (~line 1888), `Grid.close()` (~line 6305), `Core.moveToStack` (~line 6138).
- **`ui.html`, `ui-v1.html`** — owner cites these as *contrast* (i.e. wrong behavior). Use to tell right from wrong.

**Study `ui-v3.html` properly before writing code.** The prior session claimed to match it without ever reading its actual implementation, and shipped something structurally different. Do not repeat that.

---

## The defects

### D1 — Focus: wrong image on tap, off by +1, with a double-paint
**Owner's exact report:** "first it shows the image that was their previous and then it switches to another image which is the wrong image because it's plus one on the stack."

Two distinct faults in one action:
- **(a)** the previously-viewed image paints first (stale frame), then
- **(b)** it settles on the wrong image — **one position further along the stack than the one tapped**.

The `+1` is the strongest clue in this entire document. Something is advancing the stack position during the tap→Focus handoff. Candidates to verify (none confirmed): `CurrentImage.set`, `state.currentStackPosition` mutation during transition, `Grid.syncSelectionWithFocus`, the Sort gesture layer receiving the same tap underneath Explore (see `updateGestureOverlayMode` — prior sessions suspected this and a fix for it was written and rolled back; its RCA is in the master plan but was never device-confirmed).

Reproduce this first. **Do not attempt any other defect until D1 is understood**, because a stale-then-wrong paint means both the identity contract and the stack pointer are implicated, and everything else depends on those.

### D2 — Globe rebuilds unnecessarily
Exiting Explore and re-entering the same stack/folder rebuilds the whole sphere and refetches every thumbnail.

Mechanism (verified by reading, but the fix has failed twice): `SpatialGallery.close()` unconditionally clears `cards`/`files`/`stackName`/`folderId` and bumps `loadGeneration`, so `open()`'s existing `sameSession`/`canResume` reconcile can never match.

**Both prior attempts to fix this broke taps.** The trap: retaining card DOM elements while `loadGeneration` moves on strands any still-loading card blank; a blank card never gets `binding.loadedKey`; its tap then silently fails the identity contract. Any fix must keep all six identity fields mutually consistent for **every** retained card, including ones mid-load.

Two sub-cases, possibly different mechanisms:
- **D2a** leave to the folder selector, come back to the same folder. Note: `App.returnToFolderSelection` does **not** call `SpatialGallery.close()` at all — so this is likely a *different* mechanism from D2b. Not yet root-caused.
- **D2b** switch stacks (in/out/priority/trash) and return to one already built. Note `SurfaceStackSelector.switchStack` calls `SpatialGallery.open()` directly without `close()`.

### D3 — Focus forward/back paging stalls
Rapidly tapping next/prev three times stalls. Owner: "used to be snappy and clean." `ui-v3.html` is snappy and shares none of this machinery.

Mechanism (traced, unconfirmed): `ensure()` gained a bounded 16-slot FIFO queue in commit `152829d` (R4.23) to stop the *sphere* from crashing Safari. Focus shares `ensure()`, so it was pulled into the same queue as a side effect. Before that commit Focus was never queued.

Two fixes were attempted and **both failed on device**: (i) letting Focus bypass the queue entirely, (ii) giving Focus its own separate 4-slot pool. Neither worked, which means the queue may not be the real cause. Treat the mechanism as unproven and re-diagnose.

### D4 — Grid: search-result reordering and exit-to-center-stage
**This is the least investigated defect and has never been attempted. `ui-v3.html` implements it correctly — study it.**

Required behavior, per owner:
- Moving image(s) from a **search result** to the **top of the stack** must work correctly.
- On **exiting Grid**, the image currently in the **top-left of the grid** must be the one displayed on center stage.

In `ui-v3.html`: `Grid.close()` (~6305) re-finds the selected image's index *after* any reorder and displays that; `Core.moveToStack` (~6138) uses `state.stacks[targetStack].unshift(item)` to place at top. Compare against ui-v2's equivalents.

Related and unresolved: **stack order integrity**. Explore selection is supposed to be a view anchor only and must never mutate stack order or `stackSequence` (there is an explicit comment to this effect in `activateFileId`). Verify this actually holds — D1's `+1` symptom suggests something *is* mutating position during selection.

### D5 — Table floating controls — **ALREADY FIXED, DO NOT REBREAK**
Owner confirmed working in the current build. The fix is a CSS class swap only. Several prior rollbacks accidentally discarded it. If you roll back, verify it survives: `#photo-table-controls` must carry `spatial-gallery__chrome spatial-gallery__controls`, and the toggle `spatial-gallery__button spatial-gallery__controls-toggle`.

Owner also requires **no cap** on the Table image count stepper (literal removal of the ceiling, not a raised number). Verify current state; this was implemented and rolled back at least once.

---

## Suggested sequence

1. Read the map and `ui-v3.html`. Budget real time here.
2. **D1 first.** It is the worst symptom, the clearest clue (`+1`), and implicates the two subsystems everything else depends on.
3. D4 next — `ui-v3.html` gives you a working reference to compare against, which no other defect has.
4. D2 and D3 last. Both have failed multiple fixes; both need genuinely new diagnosis, not another variation on what has already failed.

Ship one at a time. State plainly what you know versus what you are assuming.
