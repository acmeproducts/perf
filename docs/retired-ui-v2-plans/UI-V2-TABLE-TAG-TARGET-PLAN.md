<!-- UI-V2 TABLE TAG-TARGET PLAN v1.0 -->
# UI-V2 TABLE TAG-TARGET PLAN — APPROVED ADDENDUM

**Status:** PLAN LOCKED — READY FOR IMPLEMENTATION AFTER EXPLORER v1.9 GATES.  
**Parent plan:** `ui-v2-plan.md` — Explorer v1.9 release plan.  
**Scope:** formal Table phase requirements and owner acceptance journey.  
**Application code changed by this document:** none.

This addendum is binding together with the parent plan. It turns the former Table roadmap into an implementation contract without folding Table into the Explorer v1.9 release.

---

## 9 · TABLE TAG-TARGET PHASE — FORMAL NEXT-PHASE CONTRACT

This phase follows the proven Explorer v1.9 foundation. It is **not folded into the Explorer v1.9 release**: Explorer v1.9 must pass its release gates first, then the same inspection/navigation/cache foundations are lifted into Table rather than rebuilt.

### T1 — Table inherits the proven inspection/navigation foundation

Table reuses the validated Explorer/Sort/Focus foundations wherever the behavior is common:

- stable current-file identity;
- selected/armed thumbnail continuity;
- thumbnail → Medium inspection;
- Medium top-center X;
- canonical stack selector, favorite, trash, and Details controls;
- canonical left/right tap-and-swipe navigation and comet behavior where inspection navigation is present;
- existing Grid surface and Grid→Sort reconciliation.

Table does not create a parallel inspection family.

### T2 — Initial configurable tag targets

For a folder's first Table configuration, create three tag targets:

- **Yes**
- **Maybe**
- **No**

These are **tag targets, not Sort stacks**. Applying one changes the file's tag state using the existing tagging system; it does not move the file between Inbox / Keep / Maybe / Trash stacks unless an existing explicit stack action is separately invoked.

Tag-target configuration is stored per folder and persists across Table exit/re-entry. Leaving Table and returning must **not** silently recreate deleted targets or reset deliberate customization.

### T3 — Preserve the existing stack-fling animation

When an image is flung to a Table tag target, reuse the actual existing stack-destination fling animation and completion behavior.

The Table change is destination substitution, not animation replacement:

`existing stack target + existing fling animation → tag target + same fling animation`

Preserve the established trajectory, timing, visual feedback, target hit feedback, and completion feel. Removing stack destinations from the Table curation surface must not remove or replace this animation family.

The same tag-fling behavior must be available from the Table thumbnail surface and from Table Medium when tag targets are presented there.

### T4 — Tag-target single tap → Grid

A **single tap** on a tag target opens the existing Grid surface filtered/scoped to files carrying that tag in the current folder.

- Reuse the existing Grid; do not create a tag-specific Grid implementation.
- The tag target itself remains configuration, not a new stack type.
- Grid exit follows the canonical existing Grid→Sort reconciliation contract.

### T5 — Tag-target double tap → context menu

A **double tap** on a tag target opens a small target context menu. It must not first trigger the single-tap Grid action. Use the application's established short tap-resolution delay/pattern so the second tap is consumed correctly.

The context menu permits:

1. **Rebind / rename the target using an existing tag** already available for the current folder.
2. **Create a new tag** using the application's existing tagging workflow, then bind the target to that new tag.
3. **Remove target from Table**. This removes only the fling destination/configuration. It does **not** delete the underlying tag from files or remove the tag from the folder's tag vocabulary.

The target label reflects the tag it is bound to. Existing tag creation/search/selection behavior is reused rather than reimplemented.

### T6 — Manage Tag Targets from empty Table space

A **long press on Table space that is not a thumbnail, tag target, control, or other active interactive element** opens **Manage Tag Targets**.

The manager provides:

- add a target bound to an existing folder tag;
- create a new tag using the existing tagging workflow and add it as a target;
- inspect/remove/rebind current targets;
- **Restore defaults: Yes / Maybe / No**.

Long press opens the manager; it does not immediately create a tag. This avoids accidental configuration changes.

### T7 — Zero-target recovery

If the user removes all tag targets:

- the empty configuration persists;
- exiting and re-entering Table does **not** restore Yes / Maybe / No automatically;
- Table shows a small unobtrusive **Add tag target** affordance/hint in the destination area;
- the affordance and long-press-empty-space gesture both open the same Manage Tag Targets flow;
- restoring Yes / Maybe / No occurs only through the explicit **Restore defaults** action.

This makes deletion meaningful while keeping recovery discoverable.

### T8 — Armed/current identity continuity

When entering Table from Sort, the current Sort file must become the selected/armed Table thumbnail when that file is present. After a delete/move/tag action, Table reconciles deterministically to the surviving neighboring/current file and carries that identity forward.

In particular, if an image was deleted in Keep immediately before returning through Explorer/Sort and then entering Table, the surviving image that became current after deletion is the image that Table must arm. Table must not reset arbitrarily to the first thumbnail.

### T9 — Stack selector remains canonical and independent of tag targets

Table still uses the canonical stack selector for Inbox / Keep / Maybe / Trash stack navigation. Tag targets do not replace stack selection.

- Selecting another stack keeps Table in Table and reconciles the current image by stable file identity/current-stack rules.
- Grid entry from a stack selector row uses the existing Grid for that stack.
- Grid exit returns to Sort using the existing Grid→Sort reconciliation.

### T10 — Later Explorer backport remains limited

Only after Table tag targets are proven may tag-target destinations be considered for **Explorer Medium**.

- Do not put tag targets on the Explorer sphere/thumbnail surface.
- Explorer sphere remains inspection-first.
- Any Explorer Medium backport gets its own gate against the proven Table behavior.

### TA1 — End-to-end acceptance journey

Use this owner journey as a mandatory integration test. Starting after folder selection, with images already distributed among Keep / Maybe / Trash and 10 images remaining in Inbox:

1. Enter **Explore** from Sort.
2. Open the current Explorer thumbnail in **Medium**.
3. Switch Medium to the **Maybe stack** using the canonical stack selector.
4. Favorite the current image and then page forward/favorite the next **three** images, using canonical comet navigation.
5. Switch to the **Keep stack**.
6. Page backward **three** images.
7. Delete the current image. The surviving neighboring image becomes the new current/armed identity.
8. X from Medium to the Explorer sphere, then exit Explorer to **Sort**, preserving that surviving image as current.
9. Enter **Table**. The same surviving image must be selected/armed.
10. Open that armed thumbnail in **Table Medium**.
11. Fling the image to the **Maybe tag target**, using the existing stack-fling animation. The operation applies the tag; it is not a stack move.
12. Exit Medium. The next valid Table image becomes selected/armed.
13. Fling that image to the **Yes tag target**, again using the same existing fling animation.
14. Reconcile to the next valid image and fling it to the **No tag target** with the same animation.
15. Open the canonical stack selector and switch to the **Trash stack**.
16. Enter **Grid** for Trash using the existing stack/Grid entry.
17. Exit Grid. The application returns to **Sort**, Trash remains the current stack, and the existing Grid→Sort reconciliation chooses the centered image.
18. No stale Explorer, Table Medium, tag-target manager, stack selector, or Grid state remains layered underneath.

The acceptance journey is primarily an identity/navigation contract: explicit actions may change the file or stack, but no transition may arbitrarily reset the current image.

### Table phase gates

| Gate | Requirement coverage | Required evidence | Blocker |
|---|---|---|---|
| **T-G1 — Defaults/persistence** | T2, T7 | New folder starts Yes/Maybe/No; customization persists; re-entry does not restore removed targets; explicit Restore defaults works | Yes |
| **T-G2 — Fling reuse** | T3 | Tag flings reuse the actual existing stack-fling animation/trajectory/timing and apply tags without unintended stack moves | Yes |
| **T-G3 — Tap resolution** | T4, T5 | Single tap opens tag-filtered Grid; double tap opens context without accidental Grid entry | Yes |
| **T-G4 — Tag binding** | T5 | Existing folder tag can be selected; new tag can be created through existing tagging flow; target rebind updates label/behavior | Yes |
| **T-G5 — Target removal/recovery** | T5-T7 | Removing target preserves underlying tag data; zero-target state is recoverable through manager/Add target; no automatic reset on re-entry | Yes |
| **T-G6 — Identity continuity** | T8, TA1 | Current/armed file survives Sort→Table and post-action reconciliation by stable identity | Yes |
| **T-G7 — Stack/Grid coexistence** | T9, TA1 | Stack selector still changes stacks; stack Grid opens existing Grid; exit returns to Sort correctly | Yes |
| **T-G8 — Journey** | T1-T9, TA1 | Entire owner journey passes on representative desktop and touch input without stale modal/mode state | Yes |

---
