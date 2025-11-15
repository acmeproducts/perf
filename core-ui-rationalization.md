# Orbital8 Core UI Rationalization Plan

## Purpose
We need a shared plan for evolving `ui-v8.html` without locking ourselves into either the current baseline layout or the experimental paradigm overlay. Rather than designing an entirely new open-ended cartridge framework up front, this plan focuses on continuously consolidating everything that *already behaves the same* across builds into a single coherent core. Only the irreducible differences will remain configurable or parameterized.

## Guiding Principles
1. **Core before configuration** – Always attempt to merge overlapping behavior, structure, or logic into the shared core first. Reach for cartridge-specific flags only when a difference cannot be reconciled without harming a legitimate workflow.
2. **Immutable user controls** – The storage provider selection, authorization, folder selection UI, and the physical gesture layer (triangles + center hub for tap/swipe/double tap) are invariant. Cartridges can resize or remap actions, but the underlying controls and their responsiveness stay untouched.
3. **Smart config, “dumb” UI shell** – The UI surfaces whatever the cartridge tells it to do, but the cartridge should define *intent* (which action is bound to up/down/left/right/center) rather than bespoke DOM or business logic.
4. **Zero overlap, clear ownership** – A UI element either belongs to the core frame or to a feature module that the active cartridge explicitly enables. Nothing should render twice or be left hidden-but-active underneath another layer.
5. **Stateless-friendly, state-aware** – URL parameters can continue to offer quick cartridge overrides, but persistent associations (per user, per folder, per provider) must be maintained outside the URL so OAuth callbacks and bookmarks remain clean.

## Core Assimilation Strategy
1. **Inventory similarities** – Audit `ui-v7.html`, `ui-v8.html`, and other experimental files to list elements, gestures, data paths, and metadata flows that already behave identically. Move each confirmed match into a shared core module.
2. **Promote near-similar elements** – For features that differ only cosmetically (e.g., counter placement, focus toggle radius), extract shared structure and expose lightweight parameters (sizes, label text, icon choice) rather than duplicating entire components.
3. **Define canonical actions** – Establish one canonical action dictionary (e.g., `UP`, `DOWN`, `LEFT`, `RIGHT`, `CENTER`) and ensure serialization, undo history, and provider metadata use only those identifiers. Cartridges merely choose the labels and colors that express each action.
4. **Modularize the chrome** – Treat progress bars, tap-zone highlights, action bars, pill counters, focus overlays, etc., as discrete feature modules. Each module receives the canonical actions plus cartridge theme tokens and renders only when explicitly requested.
5. **Frame composition** – Maintain a minimal frame skeleton (gesture layer + content viewport). Cartridges can opt into pre-defined frame variants (baseline floaters, overlay rails, tabbed experiences), but every frame is assembled from the same module registry so there is no DOM overlap.
6. **Iterative convergence** – After each refactor, re-run the similarity inventory. If a previously “special” behavior now looks identical to the core, pull it back in. Over time the configuration surface should shrink as more behaviors become intrinsic to the shared layer.

## Handling Irreducible Differences
1. **Parameterize, don’t fork** – When a difference boils down to a value or label, expose a parameter (e.g., `hubRadius`, `progressPalette`).
2. **Feature toggles for true divergence** – Only when functionality genuinely diverges (e.g., paradigm-exclusive progress breakdown) should a module be gated by a feature toggle.
3. **Type metadata as a last resort** – Introduce distinct cartridge types only when their layout primitives fundamentally differ *and* cannot be expressed through module composition without harming clarity.

## Decision Flow
1. **Similarity check** – Can the behavior/UI be expressed using existing core primitives? If yes, merge it now.
2. **Parameter check** – If not identical, can the difference be expressed as a parameter or theme token? If yes, add a parameter.
3. **Module check** – If parameterization fails, can we encapsulate the behavior as a reusable feature module invoked by cartridges? If yes, add the module.
4. **Type check** – Only if all of the above fail do we define a new cartridge type/frame.

## Next Steps
1. Create the similarity inventory doc (baseline vs paradigm) and mark each element with its intended disposition (core, parameter, module, or type-specific).
2. Stand up the minimal core skeleton (gesture layer + viewport + provider plumbing) that every cartridge must consume.
3. Draft the canonical action dictionary and update serialization/persistence helpers to adopt it.
4. Prototype the module registry: render the same cartridge twice (baseline and paradigm) but with overlap eliminated via explicit module opt-ins.
5. Revisit cartridge persistence once the core/module boundary is firm, ensuring folder-level defaults survive OAuth callbacks without relying on URL params.

Following this “core-first” approach keeps us laser-focused on rationalizing existing similarities before inventing new abstractions, yielding a stable foundation for whatever configuration types we ultimately support.
