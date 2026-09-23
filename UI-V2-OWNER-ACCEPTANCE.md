# UI-V2 Owner Acceptance — what "working" means

Owner's own words, captured 2026-09-23. This is the pass/fail list for any `ui-v2.html` release.
Every item must pass on **real mobile Chrome (Android)** and **desktop Chrome**, not just a desktop test run. A release that passes some items but breaks others is a failed release.

## One rule underneath all of it
There is one stack order. The image on top of the stack is the same image in Sort, Grid, Explore, Focus and Table. No surface keeps its own private idea of what is on top.

## Globe (Explore)
1. **Tight globe.** Spinning is smooth and responsive. Cards do not fade or drop in and out while spinning.
2. **Never sparse.** No missing cards and no holes. Every image in the stack, up to the first 500, is on the globe and can be reached.
3. **No rebuild on return.** Leave a stack's globe, switch stacks, come back: the globe is already there. No pop, no rebuild from scratch. The same applies when leaving and returning to a folder.

## Taps
4. **Tap opens exactly the tapped image**: in Explore and in Table, on mobile and on desktop. Never one ahead, never one behind.
5. **Same behavior on mobile and desktop.** A fix that works on only one of them is not a fix.

## Stack order across surfaces
6. **Grid exit shows the correct top image.** The image on top after leaving Grid is the one Grid's order says is on top.
7. **Explore → Focus shows the top-of-stack image,** and matches the image that is on top everywhere else.
8. **Grid search carries through.** Search in Grid, exit Grid, open Explore: the search results are the first images on the globe, in Grid's order.
9. **Grid drag-reorder carries through.** Reorder in Grid, exit: Explore, Table, Focus and Sort all show the new order.
10. **Table obeys the same order** as items 8 and 9.

## Focus
11. **Focus next/back is fast.** Several quick taps do not stall.
12. **No small-then-large flash** when opening Focus.

## Table
13. **Size and count controls are visible and work.** No cap on the count.

## Reference points in history (from commit messages)
- `d4144fb` / `3c8471d`: the owner confirmed "globe stability, tap faithful" on these. This is the tight-globe reference.
- `91e3033`: fixed Android taps landing one image ahead (duplicate synthetic click).
- PRs #623 and #625 were both reverted for making the globe sparse or unstable on mobile with large stacks.
