# Image Lifecycle Map — the shared layer every surface depends on

Written because every fix attempted in isolation this week broke a different surface. All four reported problem areas (globe build, tap fidelity, Focus paging, Table/Grid controls) route through one object: `SharedImageResources`. This document maps it so the next change is made against the whole system rather than one symptom.

Baseline for all line numbers: commit `1201f20` (currently live as `a22d488`).

## The one shared object

`SharedImageResources` (~line 2517) owns all image state:

| Field | What it holds | Who depends on it |
|---|---|---|
| `entries` (Map) | one record per (fileId, rendition): URL, `readyState`, failure count, retry backoff | every surface |
| `bindings` (WeakMap) | `<img> element -> { key, fileId, surface, loadedKey }` — **the identity contract** | Explore tap, Table tap, Focus handoff, identity regression tests |
| `activeExplorerKeys` | pinned keys protected from cache eviction | Explore only |
| `presentationToken` | monotonic counter, cancels superseded Focus paints | Focus only |
| `loadQueue` / `loadSlotLimit: 16` | bounded FIFO for concurrent fetches | Explore sphere, Table, Grid |
| `focusLoadQueue` / `focusLoadSlotLimit: 4` | separate bounded FIFO | Focus only (added this week) |

## Three different load paths, not one

This is the core structural fact. Three functions do overlapping-but-different work, and changing one does not change the others:

**`attach(img, file, rendition, options)`** (~2704) — used by Explore sphere, Table, Grid.
Sets `img.src` on the live on-screen element. Builds a `binding`, then guards every write behind `isCurrent()`, which checks: element still connected, `dataset.fileId` matches, `dataset.sharedResourceKey` matches, binding still the same object, and — surface-specific — that `generation`, `stackName`, and `folderId` all still match the live surface state, plus for Explore that the element is still inside its `.spatial-gallery__card` with the right fileId.

**`present(img, file, options)`** (~2785) — used by Focus only, via `Utils.setImageSrc`.
Two-stage by design: paints a cached frame immediately if available, then swaps in the `display` rendition when it loads. Uses `presentationToken` (not generation/stack/folder) for cancellation.

**`ensure(file, rendition, options)`** (~2589) — the actual network fetch, called by both of the above and by `warm()`. This is where the slot queues live. **Everything funnels through here** — which is why a queue change made for the sphere changed Focus's behavior too.

## The identity contract — why taps break

Tap-to-open reads `bindings` to decide whether it can hand a already-loaded image straight to Focus (`immediateResource`):

- **Explore tap** (~12149): requires `binding.fileId`, `binding.key`, `img.dataset.sharedResourceKey`, AND `binding.loadedKey` to all agree, and separately requires `card.element.dataset.fileId`, `card.fileId`, `img.dataset.fileId` and the canonical stack entry to agree. Any mismatch → returns `false` → **tap silently does nothing**.
- **Table tap** (~11440): same shape, `thumb` rendition.

This is the mechanism behind "taps do not occur faithfully." A tap does not fail loudly — it returns `false` and nothing happens. Anything that leaves a DOM element's dataset, its binding, or the surface's `generation`/`stackName`/`folderId` out of sync with each other silently kills tapping on that card.

**This is exactly what the multi-stack cache (`5bbf82c`) did wrong**: it retained card elements across stack switches, so elements carried bindings and dataset values from the previous stack context while `SpatialGallery.stackName`/`loadGeneration` had moved on. `isCurrent()` then failed, `immediateResource` came back null, and taps stopped resolving.

## Generation invalidation — three separate clocks

Three independent counters decide whether in-flight work is still valid. They are not synchronized with each other:

- `SpatialGallery.loadGeneration` — bumped on Explore close and on population changes
- `PhotoTable.folderGeneration` — Table's equivalent
- `SharedImageResources.presentationToken` — Focus's equivalent

`attach()`'s `isCurrent()` checks the first two. `present()` checks only the third. So a change to how Explore bumps its generation has no effect on Focus's staleness handling, and vice versa — but both still share `ensure()` and the same `entries` cache underneath.

## Where each reported problem actually lives

1. **Globe rebuilds on re-entry** — `SpatialGallery.close()` unconditionally clears `cards`/`files`/`stackName`/`folderId`, so `open()`'s existing reconcile check can never match. Fixing this means preserving that state **without** letting retained elements go stale against `isCurrent()` — the trap that broke taps in `5bbf82c`.
2. **Taps unfaithful** — the identity contract above. Not a hit-testing problem; a state-agreement problem.
3. **Focus paging slow** — every Focus fetch goes through the shared `ensure()`. `ui-v3.html` (the reference build that is snappy) has **no `SharedImageResources` at all** — it preloads into a detached `Image()`, keeps a small per-file cache, and swaps `img.src` only on load, with a per-call `loadId` token. It has no queue, no bindings, no generations.
4. **Table/Grid controls** — the only genuinely independent problem (CSS class mismatch, `photo-table__controls` vs `spatial-gallery__controls`). Fixed cleanly before because it touches nothing in this layer.

## What this means for any future change

- A change to `ensure()` or the slot queues affects **all four surfaces** simultaneously.
- A change that retains or reuses DOM elements must also keep `dataset.fileId`, `dataset.sharedResourceKey`, the binding object, and the surface's `generation`/`stackName`/`folderId` mutually consistent — or taps die silently on those elements.
- A change to Focus loading is the **only** one that can be made in isolation, and only if it stops calling `present()`/`ensure()` entirely (the `ui-v3.html` approach).
- Testing any change to this layer requires exercising tap-to-open on Explore **and** Table, not just the surface being changed. Every regression this week was caught by the user, not by the test suite, because the tests check each surface's own behavior rather than the shared contract between them.
