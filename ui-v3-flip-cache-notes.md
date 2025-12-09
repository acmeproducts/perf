# UI v3 image flipping performance notes

## Assessment of proposed optimizations
The proposed prefetch-and-cache approach should **improve focus- and sort-mode flipping** rather than hurt it:

- **Neighbor prefetching**: Preloading next/previous images (2–3 item window) behind the scenes reduces initial latency when the user taps or flicks, because the bitmap is already resolved. The cost is bounded by the small window size and cancels out once caches evict idle entries.
- **Reusable image object cache**: Reusing already-loaded `Image` objects avoids redundant network requests and decode costs when users oscillate between adjacent items. A capped Map (e.g., LRU) keeps memory growth predictable.
- **Fallback-aware caching**: Holding both preferred and fallback variants lets the UI choose the smaller asset in constrained bandwidth scenarios while still keeping the higher-res option available for slower, steady viewing. This trims repeated large downloads during rapid flips.

## Safeguards to prevent regressions
To keep the changes net-positive:

- **Cap cache size** (small, e.g., 10–20 items) and use LRU eviction to avoid unbounded memory use.
- **Abort/skip prefetch** when the user changes stacks or filters mid-flight so work stays relevant.
- **Surface errors gracefully** and ensure current-image rendering does not block on prefetch completion.
- **Profile** with real datasets to tune window size and eviction limits based on observed memory and latency.

With these guardrails, the suggestions are expected to reduce visible flip latency without a detrimental effect on performance.

## Minimal implementation sketch
- Add a tiny **`imageObjectCache` (Map)** keyed by file ID storing `{ image, quality }` so `setImageSrc` can reuse the loaded bitmap instead of refetching URLs on oscillating flips.
- Implement **`prefetchNeighborImages`** to warm a ±2 window; reuse the cache for already-loaded entries and bail out if the active stack changes mid-flight.
- Make **`trimImageObjectCache`** enforce an **LRU cap (~10–20 items)** and evict both preferred and fallback variants together to prevent leaks.
- In **`displayCurrentImage`**, look up the preferred object first; if missing, fall back to a cached lower-res object before issuing new network requests, so rapid alternations stay instant.
- Ensure **prefetch runs off the critical path**: render the current image immediately, start prefetch in a microtask/`requestIdleCallback`, and ignore failures.

## Verification checklist
- **Benchmarks**: capture median and p95 flip latency (tap-to-render) for focus and sort modes on slow 3G and Wi‑Fi before/after the change.
- **Memory**: log cache size over 2–5 minute stress flips; confirm the LRU cap holds and GC churn stays stable.
- **Correctness**: verify that exiting a stack cancels in-flight prefetch; confirm fallback/primary swaps still honor provider rules (Drive vs OneDrive URLs).
- **UI smoothness**: profile main-thread blocking during prefetch to ensure images decode off-thread and do not hitch gesture handlers.

## Rollout guidance
- Guard the new code behind a **feature flag** to allow quick disable if latency or memory regressions surface.
- **Sample metrics** (e.g., 5–10% of sessions) during the first rollout week to avoid noisy aggregates and to spot worst-case devices.
- Keep **logging lightweight**: count cache hits/misses and prefetch aborts; avoid per-image debug spam in production builds.

## Comparison with ui-v9b.html
- **Current behavior in v9b**: Each flip calls `displayCurrentImage`, which resets transforms and awaits `setImageSrc` to download the preferred 1000px thumbnail (fallback on error) before rendering. There is **no prefetch or reuse of loaded images**, and every navigation repeats the network request and decode, even when bouncing between adjacent items.
- **Impact vs. the cache/prefetch plan**: The proposed UI v3 hooks would serve repeat flips from memory and warm neighbors in the background, avoiding redundant fetches and reducing tap-to-render latency. Memory overhead is bounded by the small LRU cache, so the cached-path still outperforms v9b's fresh fetches for rapid focus/sort toggling while keeping resource usage predictable.
