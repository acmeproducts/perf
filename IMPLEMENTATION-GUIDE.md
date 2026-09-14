# Implementation Guide — Table controls, Explore rebuild, Focus behavior

For any agent (human or otherwise) picking this up. Written to be followable without this session's chat history. Every diff here is machine-verified to apply cleanly against the stated baseline and to pass `node --check` in isolation — that is not the same as device-confirmed. Confidence per item is stated explicitly and is not uniform.

## 1. Baseline

Start from commit `3c8471d`. This is the owner-confirmed baseline: taps faithful, sphere not sparse.

```
git show 3c8471d:ui-v2.html > baseline.html
md5sum baseline.html   # must be 8db03adb0b608f07e496c0afab2e68ce
```

`main` is currently reset to this exact commit. If it is not, that is itself a problem to fix before anything else.

## 2. Diffs

Four independent patches in `patches/`, each generated against `baseline.html` above and verified with `patch -p1 --dry-run` to apply cleanly on its own:

- `patches/item-1-explore-warm-resume.diff`
- `patches/item-2-table-controls-no-cap.diff`
- `patches/item-3-remove-small-large-transition.diff`
- `patches/item-4-focus-bypass-load-queue.diff`

**Composition note:** items 3 and 4 both touch `SharedImageResources.present()`. If applying both, apply item 3 first; item 4's patch will then fail one hunk (the `present()` edit) because item 3 already made that change — that failure is expected and correct, apply the remaining hunks (the `ensure()` rewrite) by hand or with `patch --merge`. Items 1 and 2 do not overlap with anything and can be applied in any order alongside 3 and/or 4.

## 3. Requirements, one item at a time

### Item 1 — Explore rebuilds instead of resuming (mode-switcher case only)
**Requirement:** switching from Explore to Sort and back to Explore, for the same stack and folder, must not re-fetch every image. It may switch to a genuinely different stack or folder and rebuild — that's correct — but returning to what was already built should be fast.
**Known gap, not covered by this patch:** leaving Explore to select a different folder, then returning to the *same original* folder, was also reported as a full rebuild. This patch does not address that — its trigger path (`App.returnToFolderSelection`) does not call `SpatialGallery.close()` at all, so this is not the same mechanism. Root cause for that specific case is not yet found.

### Item 2 — Table floating controls
**Requirement:** the `+`/`−` steppers for image size and image count must be visible and functional. Image count must have no upper limit enforced by the control itself.

### Item 3 — Thumbnail tap shows small image then swaps to large
**Requirement:** tapping a sphere card and opening Focus should show the final image directly, not a lower-resolution version that then gets replaced.
**Explicit tradeoff, not a defect:** if the full-resolution image is not yet cached, there will now be a brief interval with nothing shown (previously that interval showed the small image instead). This was the owner's stated preference over the previous behavior; it is not a bug in this patch.

### Item 4 — Focus forward/back stalls on rapid repeated clicks
**Requirement:** clicking next/previous in Focus three times quickly should not visibly stall.
**Confidence: unconfirmed on device.** The mechanism is real and traced to a specific commit (see below), but was never verified against the actual reported symptom on the owner's device before or after this patch. Treat this as the highest-risk item of the four.

## 4. Test gates

Local (must pass before any device test, not sufficient on its own):
```
npx playwright test --config=playwright.local.config.ts tests/focus-navigation.spec.ts tests/stack-sequence-regression.spec.ts tests/google-drive-url.spec.ts
```
Run at least 3 times consecutively. 3 failures in `google-drive-url.spec.ts` are pre-existing and unrelated to any of this work — present on unmodified `3c8471d` too. Any other failure blocks the patch.

Device (required, not optional — this is the gate that was skipped repeatedly this session and is the actual cause of most of the rework documented in `TURNOVER.md`):
- **Item 1:** build Explore for a stack, switch to Sort, switch back. Confirm no full re-fetch (watch `?debug=1`'s "image requests" counter — it should not increase on the return).
- **Item 2:** open Table controls, click both steppers repeatedly, confirm they move and the count has no ceiling.
- **Item 3:** tap a sphere thumbnail, confirm no visible small-then-large step.
- **Item 4:** in Focus, click next three times fast, confirm no visible stall. This is the one item where a negative result should be expected as a live possibility, not treated as surprising.

**Ship one item at a time, device-confirmed, before the next.** This is not a preference, it's a requirement — every multi-item combined push this session either got rejected as a whole with no way to isolate which item caused it, or was never actually confirmed as multiple separate things at once. See `TURNOVER.md` for the specific dated instances.

## 5. Approach for each item, and why it should work

**Item 1:** `SpatialGallery.close()` unconditionally wiped `cards`/`files`/`stackName`/`folderId` on every call. `open()` already has correct logic to reuse existing cards when returning to the same stack/folder (`sameSession` check) — but that logic can never fire if `close()` already destroyed what it needs to compare against. The fix adds a `preserve` option to `close()` (mirroring the option `PhotoTable.close()` already has) and passes it from the mode-switcher's close call specifically. This works because it removes the actual obstacle to already-correct logic, not because it adds new reconciliation behavior.

**Item 2:** the stepper buttons were `display: none` because Table's controls panel used a CSS class (`photo-table__controls`) that was never wired to the stylesheet rule that makes those buttons visible (`.spatial-gallery__controls .spatial-gallery__adjust`). The click handlers were already correctly attached in JS. Swapping to the classes Explore's own (working) panel uses fixes this because it's the exact same markup pattern already proven to work, applied to Table's DOM instead of Explore's.

**Item 3:** `present()` deliberately painted a cached low-res thumbnail first, then separately fetched and swapped in the full-resolution image. Removing the thumbnail-first branch means only the full-resolution fetch path executes. This works because there is no other place in `present()` that decides what to show — removing the one alternate path is sufficient by construction, not inference.

**Item 4:** confirmed by reading `git log -S "acquireLoadSlot(start)"` that Focus's image-loading function (`ensure()`) had no request queue at all before commit `152829d` (R4.23) — that queue was added specifically to stop the sphere from crashing Safari with hundreds of simultaneous requests. Focus only ever has a handful of images in flight (current plus a couple of prefetched neighbors), never hundreds, and was never the reason that queue was added — it was pulled into sharing it only because `ensure()` is shared code. Giving Focus's own fetches a bypass (`options.surface === 'focus'`) restores its pre-R4.23 behavior specifically, while the sphere keeps the exact bound that's proven to prevent the crash. This is the one item where "should work" rests on a plausible, traced mechanism rather than a confirmed reproduction of the reported symptom — stated as such in Section 3 above.

## 6. Learnings — what didn't work this session, and why

Full dated account with commit IDs: [`TURNOVER.md`](https://github.com/acmeproducts/perf/blob/main/TURNOVER.md). Full project history before this session: [`UI-V2-MASTER-PLAN.md`](https://github.com/acmeproducts/perf/blob/main/UI-V2-MASTER-PLAN.md). Catalogued failed approaches, check before proposing anything new that touches Table/Explore/Focus image loading or gesture handling: [`UI-V2-GRAVEYARD.md`](https://github.com/acmeproducts/perf/blob/main/UI-V2-GRAVEYARD.md).

Short version:
- Multiple changes were stacked and pushed before the prior one was device-confirmed. When something broke, there was no way to know which change caused it without guessing. This happened at least three separate times (commits `25c1825`→`5fe0f20`, and again in the combined four-item push `1f53a76`).
- A local Playwright suite passing was repeatedly treated as sufficient grounds to push. It never was. The suite runs against synthetic data with instant-loading fake images — it cannot see real network latency, real provider throttling, or real device rendering behavior, and this was demonstrated concretely more than once (a slot-concurrency change that passed every local test made things measurably worse on-device).
- Item 4's own written plan (`UI-V2-MASTER-PLAN.md` §123.5/§123.6) explicitly said not to implement a fix without device instrumentation first. It was implemented anyway. That specific instruction should be treated as still valid until it's actually followed.
- "RCA" was, in practice, reading the specific function involved and tracing one call path — not verifying the mechanism against the actual reported symptom end-to-end, and not consistently checking the existing graveyard for related, already-documented failure patterns before proposing a new one.
