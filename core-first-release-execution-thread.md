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
- **Single PR covering B1–B5.** The branch that updates `ui-v8.html` must also
  carry the rest of the core-first bundles so QA can validate baseline
  regression coverage and paradigm parity at once.
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
- A single PR titled **"Core-first UI bundle (B1–B5)"** containing:
  - Updated `ui-v8.html` that reflects the shared core, canonical actions, and
    chrome modules without overlap.
  - Companion updates in `ui-v7.html`, `codex-storage.js`, and other existing
    script sections, each documenting inventory details inline per the decision
    above.
  - Reference links back to this release instruction file in the PR
    description, so future threads can trace the execution context quickly.

Once this file is committed, it becomes the authoritative reference for the
next implementation thread, ensuring we never revisit the previous merge
conflicts and keeping the scope laser-focused on the core-first release.
