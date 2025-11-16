# Core-First Release Execution Thread

## Purpose
Provide a clean, conflict-free set of instructions that the new implementation
thread can reference while modifying `ui-v8.html` (and companions) according to
our core-first plan. This replaces the conflicted release draft and captures the
"keep the inventory and changes in the code" decision in a durable place.

## Decision recap
- **Inventory lives inline.** As each bundle lands, document the similarity
  inventory and resulting changes directly inside the existing HTML/JS files
  (`ui-v7.html`, `ui-v8.html`, cartridge helpers) via structured comments or
  inline JSON snippets—no new standalone modules.
- **Conflict-free, developer-managed increments.** Each bundle (or tight pair of
  bundles) now lands as its own PR so the solo tester only needs to click
  "Merge" in the GitHub UI. Engineering owns all rebases, conflict resolution,
  and verification before handing a PR off for review.
- **No metadata migration.** All current data is disposable test content, so
  engineering can reset as needed while introducing the canonical action layer.

## Execution checklist
1. **Bootstrap the similarity inventory in code (B1).**
   - Promote shared DOM/templates from both `ui-v7.html` and `ui-v8.html` into
     clearly marked sections within the existing files (e.g., shared `<template>`
     blocks or script helpers).
   - Annotate each promoted widget with inline inventory notes (what changed,
     which cartridge used it) so future reviewers see the provenance directly.
2. **Implement the canonical action layer (B2).**
   - Define the immutable action dictionary (`UP/DOWN/LEFT/RIGHT/CENTER`) inside
     the current script blocks and wire it into `ui-v8.html`, `ui-v7.html`, and
     `codex-storage.js`.
   - Ensure the serializer/deserializer paths only emit these canonical codes.
3. **Consolidate the triangle/hub controller (B3).**
   - Render the gesture skeleton once via shared markup in the existing HTML and
     bind cartridge behaviors through configuration rather than duplicate DOM.
4. **Add frame-safe chrome modules plus MLPUM (B4).**
   - Convert pill counters, progress bars, tap zones, footer, and the new
     multi-layer popup menu into opt-in modules defined inside the current files
     with explicit activation guards (no standalone JS files).
   - Enforce the addition-by-subtraction doctrine: remove undo UI, drop visible
     grid handles, and freeze footer height while introducing the modules.
5. **Refactor cartridge persistence (B5).**
   - Move cartridge selection off query parameters (except explicit overrides)
     and into folder-level/localStorage settings handled by the existing
     cartridge manager block.
   - Verify `ui-v8.html` respects the stored slot before enabling paradigm
     overlays.
6. **QA handoff.**
   - Attach the consolidated QA checklist (baseline regression + paradigm
     parity) when opening the PR so testers can execute it verbatim.

## Output expectations
- A sequence of conflict-free PRs, each tied to one bundle (or at most two)
  with:
  - Updated `ui-v8.html` plus any companion files needed for that bundle.
  - Inline similarity-inventory comments that explain what merged into the
    shared core during that PR.
  - A short “handoff note” summarizing how QA can exercise the feature with no
    local setup beyond opening the deploy preview.

## Handling upstream changes and merge conflicts
- **Keep refreshing the active PR.** When `main` advances during review, pull
  the latest baseline into the same branch, resolve conflicts locally, and push
  the updated diff so the tester never has to start a fresh PR just to stay
  current.
- **Resolve, then re-run quick audits.** After fixing conflicts, re-check the
  similarity inventory comments and chrome-module guards to confirm no
  duplicate DOM snuck back in from `main`.
- **Document tricky merges.** If a conflict requires reinterpretation (e.g.,
  choosing between two footer treatments), capture the decision inline next to
  the affected module so reviewers understand why the resolution favors the
  core-first contract.
- **Smoke-test the shared skeleton.** Run at least a fast local validation of
  gesture bindings and the MLPUM toggle after each conflict resolution to catch
  regressions before re-pushing the branch.

## Solo tester-friendly workflow
- **Developers do the rebases.** When `main` moves, engineering rebases or
  merges locally, reruns the overlap checks, and force-pushes the updated
  branch. The tester should never see a “Resolve conflicts” banner.
- **Small, serial deliveries.** Ship the bundles in order (B1 → B5) as separate
  PRs. Wait for QA sign-off on the currently-open PR before opening the next so
  the tester always has a single clean branch to validate.
- **Plain-language release notes.** Each PR description must include a “How to
  test this with just the GitHub UI” section with links to the deploy preview or
  attached video/screenshot. Assume no local dev tools.
- **Link the tester instructions.** Drop a quick reference to
  `tester-merge-guide.md` in every PR description so the reviewer knows exactly
  what to do when it is time to merge.
- **Escalate blockers quickly.** If the tester reports that a PR shows merge
  conflicts or the deploy preview is missing, treat it as a P0: engineering must
  refresh the branch immediately and confirm in writing that the UI is ready
  again.

Once this file is committed, it becomes the authoritative reference for the
next implementation thread, ensuring we never revisit the previous merge
conflicts and keeping the scope laser-focused on the core-first release.
