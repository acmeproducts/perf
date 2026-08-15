<!-- UI-V2 EXPLORER v1.9 REFINEMENT ADDENDUM v1.0 -->
# UI-V2 EXPLORER v1.9 REFINEMENT ADDENDUM — APPROVED

**Status:** PLAN LOCKED — READY FOR IMPLEMENTATION.  
**Parent plan:** `ui-v2-plan.md` v2.0.0.  
**Scope:** owner-approved refinements that supersede/complete the corresponding Explorer v1.9 requirements in the parent plan.  
**Application code changed by this document:** none.

This addendum is binding together with `ui-v2-plan.md` and `UI-V2-TABLE-TAG-TARGET-PLAN.md`.

## E13 — Medium/Large top-center close and status zone

- Explorer inspection hierarchy remains `thumbnail sphere → Medium → Large`.
- Medium has a top-center X; X returns to the Explorer sphere on the same image/context.
- Large has a top-center X; X returns to Medium on the same image.
- The same top-center area is reserved for short-lived loading/status messages.
- Normal state keeps X present and usable. Status may appear adjacent/below X; it may temporarily replace X only when interaction is genuinely blocked.
- The zone must not collide with Details or other canonical controls.

## E14 — Large navigation is mandatory

Large supports both left/right tap and left/right swipe navigation using the actual established Sort comet-trail behavior, not an approximation.

## E15 — Stack selector is a modal, not a history level

In Explorer Medium and Large:

- opening the stack selector creates a temporary modal layer only;
- Back/Escape while the selector is open closes only the selector and restores the exact underlying inspection level;
- selecting another stack updates the stack, closes the selector automatically, and returns to the same inspection level;
- stack selection does not create a history entry that causes Back to reopen the selector;
- preserve the same image by stable identity when valid in the selected stack; otherwise use the application's existing current-image reconciliation.

## E16 — Modal-first Back hierarchy

Back/Escape resolves the topmost temporary UI first:

1. open Details/stack selector/other inspection modal → close that modal only;
2. otherwise Large → Medium on the same image;
3. otherwise Medium → Explorer sphere on the same image/context;
4. otherwise Explorer-level exit uses the established mode exit behavior.

X follows the inspection hierarchy directly (`Large X → Medium`, `Medium X → sphere`); Back adds modal-first semantics before that hierarchy.

## E17 — Stack selector Grid entry

- The canonical stack selector remains the stack-navigation control.
- Each stack row in Medium and Large includes a Grid entry/chip for that stack.
- Grid is a real mode transition, not a modal.
- Reuse the existing Grid surface; do not create Explorer-specific Grid.
- Grid exit returns to Sort and uses the existing Grid→Sort stable-image reconciliation.

## E18 — Acceptance continuity

Across `Sort → Explore sphere → Medium → Large → Medium → sphere → Sort`, stable current-file identity is preserved unless an explicit action deletes/moves/reconciles the file. After deletion, the surviving neighboring/current image selected by existing reconciliation becomes the identity carried forward.

## Explorer refinement gates

- **ER-G1:** Medium X top-center returns to sphere; Large X top-center returns to Medium; status zone does not obstruct X/Details.
- **ER-G2:** Large left/right tap and swipe both use actual Sort comet behavior.
- **ER-G3:** Stack selector Back/Escape closes selector only; selecting another stack auto-closes and does not enter navigation history.
- **ER-G4:** Back hierarchy is modal-first, then Large→Medium→sphere.
- **ER-G5:** Every Medium/Large stack row exposes working existing-Grid entry; Grid exit returns to Sort with canonical reconciliation.

---
