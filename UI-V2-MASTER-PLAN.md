# UI-V2 MASTER PLAN — GOVERNED RECONSTRUCTION

**Plan status:** APPROVED — CANONICAL EXECUTION PLAN  
**Repository:** `acmeproducts/perf`  
**Production artifact:** `ui-v2.html`  
**Frozen reconstruction baseline commit:** `a6de049f8c8b9798c610984b35b9d8ade57d0fa5`  
**Frozen baseline `ui-v2.html` blob:** `1f3943655b157ccf10626d32bf4d1679e835867c`  
**Baseline identity:** `Orbital8- baseline V9b`  
**Release rule:** cumulative releases only; every release starts from the last passed release  
**Owner-facing test rule:** only coherent functional milestones are published for owner testing  
**Canonical plan:** `UI-V2-MASTER-PLAN.md`  
**Product simplification amendment:** 2026-08-19 — Explore and Table have no Medium/Large inspection hierarchy. Both enter the one canonical Focus inspection directly; tag physics exists only on Table thumbnails.

---

## 0 · THE CHAIN IS THE LAW

There is one reconstruction chain.

No parallel Explorer branch.  
No parallel Table branch.  
No patch-forward compatibility track.  
No independent continuity branch.  
No feature is built on an unapproved candidate.

The chain is:

| Stage | Release | Purpose | Owner test? |
|---|---|---|---|
| B0 | Baseline audit | Select reconstruction source | COMPLETE |
| R1 | Core state + canonical inspection foundation | Internal gate | No |
| R2 | Shared thumbnail/cache + resume foundation | Internal gate | No |
| R3 | Explorer complete | Coherent functional milestone | **YES** |
| R4 | Table complete | Coherent functional milestone | **YES** |
| R5 | Grid/origin continuity + integrated curation | Coherent functional milestone | **YES** |
| R6 | Sort fit + full integrated regression | Internal gate | No |
| R7 | Final production candidate | Final acceptance | **YES** |

A release advances only when all of its gates pass.

If a release fails, fix that release. Do not start the next one.

The 2026-08-19 owner simplification removes obsolete intermediate inspection levels without changing the stage order.

---

## 1 · SOURCE-OF-TRUTH GOVERNANCE

This document is the single implementation plan.

The following documents are historical evidence and no longer independently govern execution:

- `ui-v2-plan.md`
- `UI-V2-CURATION-PLAN.md`
- `UI-V2-REQUIREMENTS-AUDIT-2026-08-13.md`
- `UI-V2-EXPLORER-V1.9-REFINEMENT-ADDENDUM.md`
- `UI-V2-TABLE-TAG-TARGET-PLAN.md`

Their original contents are preserved under `docs/retired-ui-v2-plans/`.

`UI-V2-GRAVEYARD.md` remains binding.

When an owner decision explicitly simplifies a governed behavior, this canonical plan is updated and the simplified rule supersedes conflicting historical requirements.

---

## 2 · FROZEN BASELINE

The reconstruction begins only from:

`a6de049f8c8b9798c610984b35b9d8ade57d0fa5`

with `ui-v2.html` blob:

`1f3943655b157ccf10626d32bf4d1679e835867c`

This baseline was selected because it contains the usable core application before later generations accumulated large appended override layers.

Later builds such as:

- `9a78d3c...`
- the v1.8 snapshots
- v1.9
- v1.9.1

are donor/reference implementations only.

Their proven behavior may be mechanically recovered.

Their appended architecture is not inherited wholesale.

---

## 3 · CONSTRUCTION AND OWNER-TEST RULE

Development occurs on one reconstruction line.

Each passed release becomes the immutable source for the next release.

No owner-facing Pages release is required for R1 or R2.

Owner-facing builds are produced only for coherent functional milestones:

- Explorer complete
- Table complete
- integrated continuity
- final application

The existing GitHub Pages deployment serves `main`. For owner testing, after a candidate has passed its engineering gate, `main/ui-v2.html` may be repointed directly to that exact candidate so the existing Pages URL can be used. This is an owner-authorized test publication mechanism, not a new deployment architecture.

Rules for that publication:

- use the existing `main`/Pages configuration only;
- replace only the intended application file unless a governed documentation update is part of the same release;
- no loader, wrapper, runtime reconstruction, third-party host, or alternate workflow;
- verify the exact committed blob after publication;
- use a cache-busted Pages URL for owner testing;
- the reconstruction branch remains the cumulative development lineage.

This deliberately avoids repeated testing of architectural scaffolding and avoids parallel preview infrastructure.

---

## 4 · ABSOLUTE ARCHITECTURAL RULE — FILE IDENTITY

The authoritative identity of an image everywhere is:

**stable `fileId`**

Indexes are derived values only.

No mode may restore an image by stale numeric index when a stable `fileId` exists.

All transitions operate from a state context containing the relevant subset of:

- provider
- folder
- normal stack
- active `fileId`
- surface
- inspection origin
- Grid context/filter
- Details-open state

Explicit user action always wins over previously cached state.

---

## 5 · FOUR PRIMARY SURFACES

UI-V2 contains four primary views:

**Sort · Focus · Explore · Table**

Grid is a secondary working surface invoked from those views.

Details is a modal associated with the currently active image.

There is one canonical full-image inspection behavior: **Focus**.

Explore and Table may enter Focus while preserving their origin context so Focus can return to the invoking surface.

There are no Explore Medium/Large or Table Medium/Large product states.

---

## 6 · NORMAL STACKS

Normal application stacks are exactly:

- **Inbox**
- **Keep**
- **Maybe**
- **Recycle**

These remain conceptually distinct from tags.

Internal historical IDs may remain where technically necessary, but user-visible terminology follows the names above.

### 6.1 Recycle versus trash icon

**Recycle** is an application stack.

The **trash icon** means deletion through the underlying storage provider.

Examples:

- Google Drive → provider trash/recycle facility
- OneDrive → provider recycle bin

UI-V2 does not permanently destroy provider files.

Restoration or permanent deletion remains the responsibility of the user through the provider's normal recycle/trash facility and policies.

### 6.2 Table never exposes normal-stack physics targets

Normal stacks may determine which population Table is working on, but Inbox/Keep/Maybe/Recycle are never physical Table destinations.

A Table fling never moves an image between normal stacks.

---

## 7 · R1 — STATE AND CANONICAL INSPECTION FOUNDATION

R1 repairs the state architecture before adding new feature behavior.

### 7.1 One current-image contract

All primary surfaces derive their current image from stable `fileId`.

Do not maintain competing authoritative states for:

- Focus
- Explorer
- Table
- Grid
- Sort

Local indexes may exist for rendering but cannot independently decide identity.

### 7.2 Universal mutation reconciliation

After deletion, movement, filtering, Grid mutation, tagging, or another operation that removes the active file from its current context:

1. attempt the next surviving neighbor in the post-operation ordering;
2. if none exists, use the nearest preceding surviving neighbor;
3. if only one file remains, use it;
4. if none remain, show the correct empty state.

Do not arbitrarily reset to index zero except where that is naturally the only surviving file.

This rule applies to:

- Sort
- Focus
- Explore sphere
- Explore-origin Focus
- Table thumbnails
- Table-origin Focus
- Grid return

### 7.3 Canonical Focus inspection behavior

Focus is the behavioral standard and the only full-image inspection mode.

Canonical Focus behavior owns:

- normal-stack selector
- Details
- image count / position
- favorite
- provider trash
- forward/back image navigation
- swipe semantics
- tap navigation semantics
- comet transition
- state reconciliation after mutation

Explore and Table do not create their own versions.

### 7.4 Origin-aware Focus entry and return

Explore and Table reuse the **actual canonical Focus implementation**.

Not visually similar controls.

Not separately owned buttons that call approximately similar code.

One behavioral implementation.

The only additional state is the invoking origin:

- Explore sphere → Focus → Explore sphere
- Table thumbnails → Focus → Table thumbnails

The exact current `fileId` is retained across entry and return whenever that file still exists in the working context.

There is no center-circle transition and no intermediate inspection level.

### R1 gate

Must prove:

- Sort → Focus preserves exact `fileId`
- Focus navigation updates exact `fileId`
- origin-aware Focus entry preserves exact `fileId`
- origin-aware Focus return restores the correct parent surface
- stack switching preserves coherent state
- favorite acts on displayed file
- trash acts on displayed file
- Details acts on displayed file
- mutation fallback is deterministic
- no duplicate Focus behavioral ownership remains active

---

## 8 · R2 — SHARED THUMBNAIL/CACHE AND RESUME FOUNDATION

R2 creates one reusable resource architecture before Explorer/Table reconstruction.

### 8.1 One thumbnail pipeline

A shared thumbnail/resource layer is reused wherever the same rendition is appropriate:

- Sort
- Focus
- Grid
- Explore
- Table

Do not create surface-specific provider fetching where a reusable resource already exists.

### 8.2 Explorer active cache

The Explorer **Images** control defines the active image set.

If Images = `N`:

- those `N` thumbnails are prepared/warmed;
- the active set is pinned;
- active entries are not evicted.

Increasing N:

- only prepares newly required entries;
- retains existing resident entries.

Decreasing N:

- does not immediately purge previously warmed entries;
- removed active entries become normal LRU candidates.

### 8.3 Movement never means reload

Changing only geometry must not:

- recreate image elements
- replace unchanged `src`
- resolve provider URLs again
- refetch thumbnails
- unnecessarily redecode resources

This applies particularly to:

- Explorer sphere movement
- Table physical movement

### 8.4 Visible-first

Visible and near-visible images take priority.

Background cache warming must not block first useful paint.

### 8.5 Expired-provider-resource recovery

Temporary provider thumbnail/resource URLs, particularly Google Drive URLs, may expire.

A failed rendition is recovered from stable `fileId` without destroying:

- current surface
- current image
- Focus origin
- navigation state

### 8.6 Resume

Resume restores the actual open state, including where applicable:

- surface
- folder
- stack
- `fileId`
- Focus origin when Focus was invoked from Explore or Table
- Grid
- Grid filter/origin context
- Details-open state

Authentication refresh may refresh credentials but cannot silently reset UI navigation state.

### R2 instrumentation

Measure:

- first useful thumbnail paint
- cache hits
- cache misses
- active/pinned count
- resident count
- eviction count
- provider resolution/request count
- source replacements during movement
- element recreations during movement
- Explore visible-fill time
- Table visible-fill time

---

## 9 · R3 — EXPLORER COMPLETE

R3 is the first owner-facing reconstruction milestone.

### 9.1 Sphere role

Explorer sphere is browse/inspect only.

It contains:

- thumbnails
- percentage control
- Images control

It contains **no physical normal-stack targets**.

It contains **no tag targets**.

Explorer will not receive tag targets in a later stage.

### 9.2 Exact tap behavior

A clean tap on any thumbnail opens **that exact thumbnail's `fileId` directly in canonical Focus**.

No prior arming is required.

No center-of-sphere requirement exists.

No previously selected card may override the tap.

Drag/rotation never opens an image.

### 9.3 Independent Explorer controls

Exactly:

**Images**  
→ active/warmed image count

**Percentage**  
→ thumbnail/card rendered size

**Pinch**  
→ sphere spatial radius/extent

**Wheel/trackpad spatial zoom**  
→ sphere spatial radius/extent

These three state domains are independent.

Changing one cannot rewrite the others.

### 9.4 Sphere scale

Sphere spatial scale may become larger than the viewport.

The existing movement model allows navigating/panning the oversized sphere.

Sphere scaling must not trigger thumbnail cache churn.

---

## 10 · EXPLORER → CANONICAL FOCUS

Explorer progression is exactly:

**Sphere → Focus**

There is no Explorer Medium.

There is no Explorer Large product distinction.

There is no center-circle control.

Focus uses the canonical Focus implementation and displays its normal controls:

- canonical stack selector
- Details
- image position/count
- favorite
- provider trash
- canonical forward/back navigation
- canonical swipes
- canonical tap-navigation semantics
- canonical comet behavior

### 10.1 Return to Explorer

A single explicit outward/close action while Focus was invoked from Explore returns:

**Focus → Explorer sphere**

The current `fileId` and sphere context remain coherent.

If the current file was removed, the universal deterministic fallback chooses the surviving return image.

### 10.2 Stack switching during Explore-origin Focus

Changing the normal stack through canonical Focus controls does not create another inspection mode.

The user remains in canonical Focus with Explore recorded as the return origin.

Returning to Explore opens the sphere for the resulting working stack and current `fileId`.

---

## 11 · FOCUS NAVIGATION IS THE STANDARD

Do not reinterpret back/forward semantics separately for Explore or Table.

Whatever current canonical Focus does for:

- left
- right
- back
- forward
- swipe direction
- tap zones
- comet animation

is used unchanged when Focus was entered from:

- Sort/ordinary Focus
- Explore sphere
- Table thumbnails

Origin changes only where an explicit outward/close action returns. It does not fork the Focus navigation implementation.

---

## 12 · R3 FINAL EXPLORER CONTRACT

R3 is complete when all of the following are simultaneously true:

- the sphere remains browse-only;
- arbitrary exact thumbnail tap enters canonical Focus for that exact `fileId`;
- drag/rotation does not open images;
- Images, Percentage, and spatial zoom remain independent;
- movement does not recreate/refetch unchanged thumbnails;
- canonical Focus controls remain unique;
- Focus navigation remains exact by stable `fileId`;
- Focus invoked from Explore returns directly to the sphere;
- no Explore Medium DOM, state, center control, transition, acceptance requirement, resume state, or future tag-target backport remains.

---

## 13 · R4 — TABLE COMPLETE

Table is physical **tag curation** for images in the selected normal stack.

It is **not a physical normal-stack sorting surface**.

It is also not an inspection surface with its own Medium/Large levels.

### 13.1 Table working population

Table loads images from the current normal stack:

- Inbox
- Keep
- Maybe
- Recycle

The working normal stack is context, not a physical destination.

Changing normal stack through canonical controls keeps Table as the return/origin surface.

### 13.2 Table interaction model

There are only two primary thumbnail actions:

- **tap thumbnail** → canonical Focus for that exact `fileId`;
- **physical fling thumbnail to a tag target** → apply that tag.

No Table thumbnail gesture may move an image between normal stacks.

---

## 14 · TABLE TAG TARGET MODEL

Table tag targets are actual folder tags.

They never move a file between normal stacks.

Normal-stack targets are forbidden on the Table surface.

### 14.1 Defaults

For a folder with no prior configuration, create these initial targets:

- **Yes**
- **No**
- **Maybe**

This is the default set and ordering.

These names are not immutable semantic types.

They are ordinary folder tags bound to Table targets.

### 14.2 Maximum targets

A folder may have:

**0 through 5 active Table tag targets**

Never more than five.

The layout adapts to the active count.

### 14.3 Non-exclusive tags

Tags are not mutually exclusive at the data model level.

UI-V2 does not automatically remove another curation tag when one is assigned.

The user may later create combinations through other tagging tools if desired.

The system does not try to protect the user from contradictory tag combinations.

---

## 15 · TABLE CURATION POPULATION

Table is an exercise in tagging **untagged-for-this-target-set** images from the current normal stack.

An image is excluded from the Table curation population when it already carries **any tag represented by one of the currently active Table tag targets**.

Example:

Current stack = Keep.

Active targets:

- Yes
- No
- Maybe

A Keep image tagged Yes is no longer shown on the Table.

It remains in Keep.

It can still be viewed through:

- normal Grid
- Yes tag-target Grid
- Focus
- other applicable surfaces

If the active target configuration changes later, population is recalculated according to the newly active tags.

---

## 16 · TABLE PHYSICS

Retain the approved playful physical behavior:

- momentum
- trajectory
- target attraction
- bank behavior
- rim behavior
- corner interaction
- vacuum/capture
- successful capture animation
- Sort comet visual language

Permanently remove image-to-image collisions.

Physics exists on **Table thumbnails only**.

Focus inspection has no tag targets and no fling-to-tag behavior.

### 16.1 Successful tag fling

A successful fling:

1. follows the physical trajectory;
2. reacts with target/rim/capture behavior;
3. applies the target tag exactly once;
4. completes the successful animation;
5. animates the image away from the Table;
6. removes it from the current Table session/population;
7. continues with the remaining untagged population.

Because the tagged image is excluded by the active-target filter, it does not immediately reappear.

The image remains in its existing normal stack.

---

## 17 · RARE TABLE EFFECT VARIATIONS

Table may add a small number of cosmetic variations to make curation playful.

These are visual only.

They cannot affect:

- hit detection
- selected tag
- tag application
- `fileId`
- ordering
- next-image selection
- interaction availability

Rare successful-fling effects may include:

- additional spin
- stronger comet/spark accent
- target pulse
- exaggerated acceleration
- smoke puff / speed puff
- escape-and-capture effect

### 17.1 Escape-and-capture animation

Occasionally, during a valid successful capture:

1. image approaches target;
2. image becomes smaller as if being sucked in;
3. it briefly appears to resist/escape;
4. rapidly enlarges slightly;
5. target pulls it back in forcefully;
6. optional smoke/speed puff indicates sudden acceleration;
7. capture completes.

The sequence must remain quick and cartoon-like.

It cannot delay the application enough to feel broken.

Rare variations occur approximately **10–15% of successful flings** and are not triggered on consecutive successful flings.

---

## 18 · MANAGE TAG STACKS

The expert configuration system is deliberately discoverable but unobtrusive.

### 18.1 Entry gesture

Long press on **empty Table space only**.

The press must not originate on:

- thumbnail
- tag target
- control
- modal
- canonical Focus image
- interactive UI

Long-press empty space opens:

**Manage Tag Stacks**

No immediate mutation occurs.

### 18.2 Manager capabilities

The manager allows:

- add target
- bind target to an existing folder tag
- create a new folder tag using the existing tag workflow
- change/rebind an existing target
- delete a target
- restore defaults
- inspect current target configuration

Maximum active targets remains five.

### 18.3 Restore defaults

Restore defaults explicitly resets targets to:

- Yes
- No
- Maybe

It is never automatic.

### 18.4 Zero-target state

Deleting all targets is valid.

Zero active targets persists.

Table then shows a small unobtrusive `Add tag target` affordance.

That opens the same manager.

Long-press empty space also remains available.

No default targets are recreated unless the user explicitly chooses Restore defaults.

---

## 19 · DIRECT TAG-TARGET INTERACTION

Tag targets themselves have intentionally simple behavior.

### Tap target

→ open Grid filtered by that tag

### Drag target

→ reposition target

### Double tap target

→ no special behavior

### Long press target

→ no special behavior

Configuration is done only through Manage Tag Stacks.

This is deliberately an expert-discovery model.

---

## 20 · TARGET POSITION PERSISTENCE

Configuration is per folder.

Per-folder Table configuration includes:

- active target tag bindings
- target ordering
- Table target positions

There is one Table target-position set because tag targets exist only on the Table thumbnail surface.

Explore has no tag-target positions.

Focus has no tag-target positions.

Changing the working normal stack does not change the folder's Table target layout.

---

## 21 · TABLE THUMBNAILS

Images from the current working stack are physically scattered across the Table.

Only images not already carrying one of the active Table target tags appear.

A clean tap on any thumbnail opens that exact `fileId` directly in canonical Focus.

No prior arming is required.

Dragging/flinging remains distinct from tapping.

---

## 22 · TABLE → CANONICAL FOCUS

Table progression is exactly:

**Table thumbnails → Focus**

There is no Table Medium.

There is no Table Large.

Focus uses canonical Focus behavior:

- stack selector
- Details
- count
- favorite
- provider trash
- forward/back
- Focus swipe semantics
- Focus tap-navigation semantics
- comet effect

Focus contains **no Table tag targets** and supports **no tag fling**.

An explicit outward/close action returns:

**Focus → Table thumbnails**

using the exact current `fileId` when it remains eligible, or the universal deterministic fallback when it does not.

---

## 23 · TABLE TAGGING IS THUMBNAIL-ONLY

This rule is absolute:

> **All physical Table tag assignment happens on the Table thumbnail surface.**

Do not add tag targets to:

- Explore
- canonical Focus
- Grid
- Details
- any intermediate inspection surface

Do not create an intermediate Table inspection surface solely to support tagging.

---

## 24 · NO EXPLORE TAG-TARGET BACKPORT

The former plan to copy Table tag targets into Explore is retired.

Explorer remains browse/inspect only for the entire UI-V2 reconstruction.

The proven Table tag-target architecture stays Table-only.

This reduces duplication and keeps curation mechanics in one deliberately physical surface.

---

## 25 · R5 — GRID AND ORIGIN CONTINUITY

Grid must know exactly where it came from.

### 25.1 Origin context

Opening Grid records:

- invoking surface
- Focus origin when applicable
- folder
- normal stack
- current `fileId`
- tag filter if present
- other necessary display context

Possible origins include:

- Sort
- ordinary Focus
- Explore sphere
- Explore-origin Focus
- Table thumbnails
- Table-origin Focus

There are no Medium/Large origin variants.

---

## 26 · GRID TOP-LEFT RETURN LAW

The return image from Grid is defined by one simple rule:

> **The image occupying the top-left visible Grid position at the instant Grid exits is the return image.**

This rule supersedes older Grid-selection/armed-image return logic.

The authoritative return `fileId` is determined from Grid's current displayed ordering **after**:

- search
- filtering
- reorder
- drag
- deletion
- tag changes
- bulk operations
- other Grid mutations

Bulk selection state does not determine return identity.

If no visible Grid image remains, use the universal mutation fallback against the underlying context.

If that context is empty, restore the invoking surface's proper empty state.

---

## 27 · GRID SELECTION SEMANTICS

Existing Grid selection/bulk-action behavior is preserved.

Do not redesign Grid's selection model merely to implement return continuity.

The top-left return law is independent from bulk selection.

---

## 28 · GRID RETURNS TO ITS INVOKER

Every Grid exits to the exact surface/context that invoked it.

Examples:

**Sort → Grid → Sort**

**Focus → Grid → Focus**

**Explore sphere → Grid → Explore sphere**

**Explore-origin Focus → Grid → Explore-origin Focus**

**Table thumbnails → Grid → Table thumbnails**

**Table-origin Focus → Grid → Table-origin Focus**

Older Grid→Sort-only requirements are superseded.

---

## 29 · STACK SELECTOR → GRID

The canonical stack selector presents normal stacks:

- Inbox
- Keep
- Maybe
- Recycle

Each stack can provide Grid entry where the canonical selector already permits it.

If the user opens Grid for another stack:

1. Grid opens on the chosen stack;
2. that stack becomes the working stack for the return;
3. top-left Grid image at exit becomes return `fileId`;
4. exact invoking surface/Focus origin is restored on that stack.

Example:

Explore-origin Focus on Keep  
→ stack selector  
→ Grid Recycle  
→ exit  
→ Explore-origin Focus on Recycle at the Grid top-left image.

---

## 30 · TAG TARGET → GRID

Tapping a **Table tag target** opens existing Grid with that tag implicitly filtered.

Explore has no tag targets.

Grid remains normal Grid.

On exit:

- tag-filter modal state closes
- Table is restored
- top-left visible Grid image is used when valid for restored context
- otherwise universal deterministic fallback applies

---

## 31 · DETAILS CONTINUITY

Details always describes the current stable `fileId`.

Resume must restore Details if it was actually open.

Grid or Focus transitions must never leave an obsolete Details modal layered underneath.

---

## 32 · R6 — SORT DESKTOP FIT

Sort receives only the approved desktop correction.

On desktop:

- reduce vertical bulk of Sort pills
- maintain symmetry
- preserve established interaction geometry
- ensure Recycle target clears the footer

Do not redesign Sort.

Do not distort the established layout merely to make pills smaller.

Touch/mobile layout remains unchanged unless required to avoid an actual regression.

---

## 33 · VERSIONING

Engineering plan stages may use:

B0, R1, R2, etc.

The visible application must always clearly identify the exact build being tested.

There must be **one authoritative version/build value in code**.

Every existing visible footer/build-identity location reads from that same authoritative value.

The implementation must inventory the actual visible occurrences rather than assume a fixed count.

Do not maintain independently edited version strings.

Every owner-facing candidate receives a distinct visible build identity.

Example conceptual progression:

- reconstruction-R3-explorer
- reconstruction-R4-table
- reconstruction-R5-continuity
- reconstruction-R7-final

Exact naming may be normalized in implementation, but one value controls all visible locations.

---

## 34 · OWNER-FACING RELEASES

The owner is not required to test internal architecture releases.

### Owner build 1 — R3

Explorer complete.

Test:

- sphere performance
- exact thumbnail identity
- independent scale controls
- direct thumbnail → canonical Focus
- canonical Focus controls
- Focus → sphere exact return
- no Medium/center-circle hierarchy

### Owner build 2 — R4

Table complete.

Test:

- active normal stack as working population only
- no physical normal-stack targets
- configurable tag targets
- Manage Tag Stacks
- physical tag fling
- disappearing processed images
- direct thumbnail → canonical Focus
- Focus → Table exact return
- tag-target Grid

### Owner build 3 — R5

Integrated continuity.

Test:

- Grid return from every surface/origin
- top-left Grid return law
- stack changes
- tag-filter Grid
- delete/mutation fallback
- resume continuity

### Owner build 4 — R7

Final production candidate.

Full acceptance.

---

## 35 · AUTOMATED/ENGINEERING GATES BEFORE OWNER TEST

Every owner-facing build must first pass:

- complete HTML structure
- inline JavaScript syntax
- `git diff --check`
- available repository tests
- browser runtime smoke tests
- no uncaught console exceptions
- duplicate-listener checks where practical
- state-transition harness
- exact `fileId` assertions
- cache instrumentation
- published artifact verification

A green automated gate means **eligible for owner testing**, not owner approval.

---

## 36 · REQUIRED EXPLORER ACCEPTANCE MATRIX

Must pass:

- tap arbitrary sphere thumbnail → exact canonical Focus image
- rotate → tap arbitrary image → exact canonical Focus image
- drag never opens image
- percentage changes thumbnail size only
- Images changes active/warmed count only
- pinch changes sphere spatial extent only
- wheel/trackpad changes sphere spatial extent only
- no movement-caused thumbnail reconstruction
- canonical Focus navigation exact
- canonical Focus controls unique
- Explore-origin Focus outward/close → sphere on same valid `fileId`
- stack change remains coherent and returns to the corresponding sphere context
- favorite exact
- provider trash exact
- Details exact
- no Explorer Medium state or DOM
- no center-circle/enter-Large control
- no Explorer tag targets
- resume from sphere exact
- resume from Explore-origin Focus exact

---

## 37 · REQUIRED TABLE ACCEPTANCE MATRIX

Must pass:

- Table opens current normal stack as working population
- stack selector changes working normal stack without exposing stack targets on Table
- no Inbox/Keep/Maybe/Recycle physical target appears on Table
- only unprocessed-for-active-target-set images appear
- default targets Yes / No / Maybe
- zero through five targets supported
- target drag works
- long-press target does nothing special
- double-tap target does nothing special
- target tap opens filtered Grid
- long-press empty space opens manager
- manager add/change/delete/rebind works
- Restore defaults works
- zero-target state persists
- tag remains intact if target is removed
- Table thumbnail fling applies tag without changing normal stack
- tag is applied exactly once
- tagged image completes animation then leaves Table
- image does not reappear while its tag remains an active target
- physics remain playful
- image-to-image collision remains absent
- rare effects remain cosmetic only
- exact thumbnail tap → canonical Focus
- canonical Focus controls exact
- Focus contains no Table tag targets
- Focus has no fling-to-tag behavior
- Focus outward/close → Table on same valid `fileId` or deterministic fallback
- no Table Medium or Table Large state exists

---

## 38 · REQUIRED GRID RETURN MATRIX

For each origin:

1. open Grid;
2. modify ordering/filter if applicable;
3. establish a known top-left tile;
4. exit Grid;
5. verify return surface/origin and exact `fileId`.

Required origins:

- Sort
- ordinary Focus
- Explore sphere
- Explore-origin Focus
- Table thumbnails
- Table-origin Focus

Repeat representative cases with:

- no-op
- reorder
- search
- tag filter where applicable
- delete
- bulk mutation

---

## 39 · REQUIRED RESUME MATRIX

Suspend/background and restore from:

- Sort
- Focus
- Focus + Details
- Explore sphere
- Explore-origin Focus
- Explore-origin Focus + Details
- Table thumbnails
- Table-origin Focus
- Table-origin Focus + Details
- Grid
- filtered Grid

The application returns to the actual state the user left open, subject only to deterministic reconciliation if provider/file data changed.

There are no Medium/Large resume states.

---

## 40 · FORBIDDEN IMPLEMENTATION APPROACHES

Do not:

- append another `v1.x fix` layer
- create `ContinuityV...`
- use MutationObserver stabilization
- create fake Focus controls
- create separate Explorer/Table inspection engines
- create separate per-surface image caches
- restore image identity by stale numeric index
- create Explore Medium or Table Medium as compatibility layers
- create Explorer Large/Table Large product states separate from canonical Focus
- create a center-circle enter-Large control
- make Table tags into normal stacks
- expose normal-stack targets on the Table physics surface
- expose tag targets anywhere except Table thumbnails
- introduce image-image collision physics
- silently restore deleted Table targets
- make tag values mutually exclusive
- change Grid bulk-selection UX just to implement return identity
- route all Grid exits through Sort
- create multiple competing plans
- introduce a loader/wrapper/runtime reconstruction deployment path
- use third-party hosting for owner test publication

---

## 41 · LATER-BUILD MINING RULE

Later builds are evidence repositories.

For each needed behavior:

1. inspect the later implementation;
2. identify whether it actually worked;
3. identify the smallest coherent implementation unit;
4. port that logic into the correct baseline architecture;
5. remove dependency on its historical override layer;
6. test it in the cumulative reconstruction.

Never copy an entire historical appended patch simply because one feature inside it worked.

---

## 42 · IMPLEMENTATION ORDER

### R1
State identity + canonical Focus inspection ownership.

### R2
Shared thumbnail/cache + provider recovery + resume.

### R3
Explorer sphere + independent scaling + direct canonical Focus inspection + exact return to sphere.

**Owner gate.**

### R4
Table tag-target architecture + manager + thumbnail physics + direct canonical Focus inspection + exact return to Table.

There is no Explore tag-target backport.

**Owner gate.**

### R5
Grid origin contract + top-left return law + complete cross-surface reconciliation.

**Owner gate.**

### R6
Sort desktop fit + consolidation + complete regression.

### R7
Exact final candidate, version stamp, final automated/device/provider gates.

**Owner final gate.**

Only after owner PASS is the final production candidate considered complete.

---

## 43 · PRODUCTION RELEASE RULE

Production release contains no new functional work.

The exact owner-approved final candidate becomes `ui-v2.html`.

During reconstruction, owner-test candidates may temporarily occupy `main/ui-v2.html` solely because the existing GitHub Pages configuration serves `main`; this does not waive the final-release rule.

After any owner-test or final publication:

- verify `main` commit
- verify exact `ui-v2.html` blob
- verify Pages serves the intended build
- verify visible version identity
- provide one cache-busted Pages test URL

No post-gate functional edit may be represented as the same passed candidate.

---

## 44 · PLAN APPROVAL EFFECT

Approval of this document authorizes repository documentation governance and execution according to this single plan.

1. `UI-V2-MASTER-PLAN.md` is the execution authority;
2. historical plans are retired from execution and preserved under `docs/retired-ui-v2-plans/`;
3. their root-level filenames contain retirement notices pointing to this master plan;
4. the reconstruction remains cumulative from the frozen baseline;
5. explicit owner simplifications recorded here supersede the retired Medium/Large and Explore-tag requirements.

---

## 45 · FINAL LOCKED PRODUCT RULES

**Baseline:** `a6de049f8c8b9798c610984b35b9d8ade57d0fa5`  
**Baseline blob:** `1f3943655b157ccf10626d32bf4d1679e835867c`  
**Normal stacks:** Inbox / Keep / Maybe / Recycle  
**Current image:** stable `fileId`  
**Inspection behavior:** one canonical Focus implementation  
**Explore:** Sphere → canonical Focus → Sphere  
**Explore Medium:** does not exist  
**Explore tag targets:** never  
**Table:** tag-curation thumbnails → canonical Focus → Table thumbnails  
**Table Medium/Large:** do not exist  
**Table tagging location:** thumbnail surface only  
**Table physical normal-stack targets:** never  
**Table targets:** configurable folder tags, not stacks  
**Default tags:** Yes / No / Maybe  
**Maximum active tag targets:** 5  
**Tag exclusivity:** none  
**Processed Table image:** tagged, animated away, excluded while it carries any currently active target tag  
**Normal stack after Table tag fling:** unchanged  
**Target tap:** filtered Grid  
**Target drag:** reposition  
**Target long press:** nothing special  
**Target double tap:** nothing special  
**Empty Table long press:** Manage Tag Stacks  
**Table target positions:** one per-folder Table layout  
**Focus tag targets:** none  
**Grid return surface:** exact invoker/origin  
**Grid return image:** top-left visible Grid tile at exit  
**Delete/missing fallback:** next neighbor → prior neighbor → empty state  
**Resume:** exact open surface/Focus-origin/modal context, including Grid and Details  
**Recycle stack:** logical app stack  
**Trash icon:** provider deletion/recycle-bin action  
**Owner-test publication:** existing `main`/GitHub Pages only; exact candidate blob; no alternate deployment mechanism  
**Final production:** exact final owner-approved candidate

---

## 46 · R4.13 — FOCUS EXIT GUARD RELEASE (2026-09-04)

**Defect (graveyard G16).** After entering Focus from Sort via the double-tap mode chooser and exiting with the Focus X, `CanonicalInspection`'s exit-pointer guard is never released: its clear routine re-reads `referrer.surface` on a `setTimeout(0)` after the exit click has already cleared the referrer. The leaked `ModeNavigation.transitionGuard` then suppresses every document click. Symptoms: Sort stack taps inert; the mode chooser still opens (pointer-event path) but no mode can ever be selected again (click path).

**Rollback record.** `12e45d8` (coordinate-authoritative Explorer picking) was reverted to `02ccb84` per Failure Protocol when the symptom was first observed on device. A/B reproduction subsequently showed the identical failure on the pre-`12e45d8` build; `12e45d8` is cleared as the cause. Its revert stands; re-landing it is a separate owner decision after R4.13 ships and passes the device gate.

**Required implementation (smallest complete change).**
1. On Focus-X pointer-down, snapshot the release decision into the guard itself: `{ pointerId, returnsToSort }`, where `returnsToSort` is true unless the referrer surface at that moment is `explore` or `table`.
2. In the pointer-up release path, decide from the captured guard object, never from post-exit state: clear when Explore or Table is visible **or** `guard.returnsToSort` is true. Guard identity must be checked so a stale timeout cannot clear a newer guard.
3. No other change to the guard's purpose (swallowing the exit tap's own click) or to Explore/Table return semantics.

**Gates.**
- New browser-driven regression in `tests/focus-navigation.spec.ts`: repeated Sort → chooser → Explore → X → Sort and Sort → chooser → Focus → X → Sort round trips using trusted pointer input; after every round trip the chooser's mode buttons must still work and `ModeNavigation.transitionGuard` must be null.
- Existing "one Focus X pointer sequence cannot also close the revealed Explorer" assertion must remain green unweakened (Explore-return guard semantics unchanged).
- Full `tests/focus-navigation.spec.ts` suite green; `git diff --check`; build; inline-JS syntax gate.
- Publish to `main`, verify commit/blob/Pages per §43, provide the owner test URL.

---

## 47 · R4.14 — DEVICE GATE FIXES + COORDINATE-PICKING RE-LAND (2026-09-04)

Owner device test of `f51c469` reported three failures. Dispositions:

1. **Explorer tap opens the wrong image.** This is the original pointer-selection regression; its fix (`12e45d8`) had been reverted during the G16 incident and the defect was live again. The owner's device report authorizes the re-land. `12e45d8` is reapplied on top of R4.13; the coordinate-authority regression test returns with it.
2. **Grid tiles all show the word "Focus".** The per-tile Focus button keeps its behavior, class, and accessible name but renders as a compact 30px "⤢" glyph instead of a text label. No interaction change.
3. **Explore X feels dead / laggy.** The X exited only on the synthetic `click`, which Safari can delay or drop after taps on a busy 3D scene; repeated missed taps also spun the sphere. The X now exits on `pointerup` of a tap that started on the button (≤24px slop), with the `click` handler retained for keyboard/AT and suppressed for 700ms after a pointer exit; the exit-pointer guard is respected on both paths. The visual button is unchanged; its touch target is enlarged 12px on every side via an `::after` overlay.

Gates: full `tests/focus-navigation.spec.ts` green including the restored coordinate-authority test and the R4.13 guard-release test; diff/build/syntax gates; publish and verify per §43.

---

## 48 · R4.15 — ENGINE-INDEPENDENT POINTER PICKING (2026-09-04)

**Defect.** After R4.14 the owner still saw every sphere tap open the wrong image on device. The coordinate authority was correct but its implementation — `document.elementsFromPoint` — relies on DOM hit-testing, which WebKit resolves unreliably for 3D-transformed compositor layers (`translate3d` + `will-change: transform`) inside a `perspective` scene. Chromium (the automated gate) hit-tests these correctly, so the suite stayed green while iPad taps resolved wrongly.

**Required implementation.** `SpatialGallery.cardAtPoint` picks from computed geometry, never DOM hit-testing: each card's `getBoundingClientRect()` (transform-inclusive and engine-consistent) filtered to rects containing the point, winner by the inline z-index that `render()` painted, later DOM order breaking ties to match paint order. No change to the pointer-down/up authority contract from §46's re-land.

**Gates.** New live-sphere regression: a trusted tap at the visual center of the painted frontmost card (winner derived independently from rects + inline z-index) must put exactly that stable fileId into Focus, including the rendered `#center-image`. All prior pointer, guard, isolation, and population tests remain green unweakened.

**Discipline.** Explorer input decisions must never depend on browser hit-testing APIs over the 3D card field; painted geometry recomputed from the gallery's own state (or browser-computed rects) is the only acceptable source.

---

## 49 · R4.18 — IMMEDIATE POP-BACK RESUME + SPHERE RENDER ECONOMY (2026-09-04)

**Owner requirement.** Exiting Focus back to Explore must render the globe immediately — a POP — even when the population changed while in Focus (delete, move, writeback). Stack writebacks are applied to the retained sphere as inserts/removals, never a full re-write.

**Implementation.**
1. `resumeFromFocus` now separates context validity (folder/generation/stack/layout) from membership equality. Same context with changed membership routes through `reconcilePopulation` on the retained scene — every surviving card element is reused, only the delta is created/removed — inside the strict warm-resume ordering (Focus paint removed only after the scene is fully restored). A full `open()` happens only when the context itself changed or the stack emptied.
2. Render economy: per-card style writes (transform/opacity/z-index/far class) happen only when the value changed, eliminating most main-thread style churn each frame; far-hemisphere cards (depth < 0.22, never the selected card) are visibility-culled, roughly halving live compositor layers; cards below depth 0.45 drop their box-shadow; `will-change` reduced to transform. `cardAtPoint` skips culled cards.

**Gates.** New regressions: (a) delete-in-Focus round trip pops back with every surviving card element identical (insert/remove, not rebuild) and no loading overlay; (b) with 40 cards, culling hides some far cards, never the selected card, applies the far shadow class, and culled cards are unpickable. Full suite green; the culling gate fails on the prior renderer.

---

## 50 · R4.23 — SPHERE MEMORY AND LOAD DISCIPLINE (2026-09-04)

**Defect (owner device report, R4.22).** Sphere taps inaccurate again; sphere population slow; the app crashes and restarts repeatedly. All three share one cause (graveyard G17): sphere cards fetched the 800px "small" thumbnail for a ~112×148px card, and the shared image cache kept every decoded preload `Image` alive after load. Hundreds of oversized decoded bitmaps exceeded iPad Safari's per-tab memory budget (tab jetsam = the crash/restart), decode work janked the main thread (the slowness), and under that jank the painted frame lagged the layout the rect-picker reads, so taps resolved against positions newer than the pixels on screen (the inaccuracy).

**Implementation.**
1. New `sphere` rendition in `SharedImageResources.source`: Google Drive resolves `buildThumbnailUrl(id, 300)` (covers 2× DPR for the card size); other providers prefer `thumbnails.small`. `SpatialGallery.createCard` and `pinExplorer` use it; Focus/Grid/Table keep `thumb`/`display` unchanged.
2. `ensure()` releases `entry.preload` after a successful decode. On-screen `<img>` elements own their pixels; re-attachment is served by the HTTP cache. (Failure path already released it.)
3. Preload traffic runs through a bounded FIFO slot queue (16 concurrent). Card `<img>` src assignment stays direct and eager per §R4.17 — the cap governs warm/preload only, so population never trickles.
4. `clear()` flushes the pending slot queue so folder/stack switches don't run stale loads.

**Gates.** Three new regressions, each proven failing on R4.22: sphere rendition URL contains `sz=w300`; a loaded entry has `preload === null`; 60 simultaneous ensures never exceed 16 in flight. Existing identity test updated to the `sphere` binding key (fileId identity assertions unweakened). Full suite 33/33 green; diff/syntax gates; publish and verify per §43.

**Discipline.** Renditions are sized to their painted surface; nothing retains decoded bitmaps beyond the elements that display them; unbounded parallel preloading is buried alongside unbounded lazy trickling — both extremes fail on tablets.

---

## 51 · R4.24 — GLIDING-SPHERE TAP CATCH (2026-09-04)

**Defect (owner device report).** Tapping a sphere thumbnail opens the wrong image; the owner reports it worked three releases earlier. Reproduced in a real WebKit engine with pixel-level ground truth (screenshot color at the tap point mapped to fileId, real WebDriver touch input): with the sphere at rest, 6/6 taps opened exactly the tapped image; while gliding on momentum, 6/6 opened the wrong one. The picking implementation is correct — the sphere keeps rotating between the frame the person reacted to and the pointer-down, so the right answer to "what is under this point now" is the wrong answer to "what did I tap." R4.19's free-trackball momentum lengthened glides, promoting this from occasional to constant. Graveyard G18.

**Implementation.** `SpatialGallery.onPointerDown`: if `|velocityX| + |velocityY| > catchThreshold` (0.0006 rad/frame ≈ visually perceptible glide), the pointer-down zeroes momentum and suppresses card picking for that pointer sequence — the tap catches the globe, exactly like grabbing a spinning physical one. Selection only ever resolves against a still sphere. Below the threshold (imperceptible drift) taps select normally, so a settled sphere never feels dead. The sequence can still become a drag. Also: `activateFileId`'s warm first-frame key updated from `thumb` to the `sphere` rendition the cards bind since §50, restoring the instant Focus first paint.

**Gates.** New regressions, catch case proven failing on unfixed code: (a) trusted tap on a gliding sphere kills momentum, does not enter Focus, and the follow-up tap opens exactly the independently derived painted front card; (b) a below-threshold sphere selects on the first tap. The touch-jitter test updated to assert on a still sphere per the new contract (its slop-tolerance assertions unweakened). Full suite 35/35 green; WebKit pixel-ground-truth verification 12/12 (6 settled select, 6 catch-then-select); diff/syntax gates; publish per §43.

**Discipline.** Selection input against a moving 3D field is never resolved at the moment of contact; motion must be stopped (or provably imperceptible) before a pick may bind to a fileId.

---

## 52 · R4.25 — TAP-CHECK DIAGNOSTIC (2026-09-04)

**Purpose.** The owner reports wrong-image taps on a still sphere on Chrome for iPhone and Android; every churn flow reproducible in automation (fresh sphere, stack switches, writeback resume, rapid flips, Sort-origin round trips) passes with pixel-source invariants on both engine families, so the discriminating variable is the owner's live data/flow. Diagnostic-only release, zero behavior change without the flag (precedent: §R4.20 `?debug=1`).

**Implementation.** `?tapcheck=1` overlays, on every sphere tap: a clone of the tapped card's exact pixels with its file name/id; on Focus entry, the opened file's name/id with SAME/DIFFERENT verdict and whether the Focus image src was set; on rejection, the exact guard that refused (busy, not-in-stack, population mismatch, identity chain). `activateFileId`'s guard returns route through `TapCheck.reject` (returns `false`, behavior identical when disabled).

**Gates.** Full suite + churn spec 36/36 green; syntax/diff; publish per §43.

---

## 53 · R4.26 — FILE IDENTITY INTEGRITY (2026-09-05)

**Defect (owner tap-check evidence).** Sphere taps opened a different photo than the tapped card showed, on Chrome for iPhone and Android, with every id-based identity check green. The R4.25.1 probes proved the record itself was crossed: one file object carried its own id and thumbnailLink but another file's name and identity-bearing display URL. Root class (graveyard G19): the metadata store saved full `{ ...file }` snapshots and hydration `Object.assign`ed rows wholesale onto live files, so one wrong row Frankensteined two files; `{ ...cached, ...cloud }` merges and pure cache hydration then preserved the corruption in IndexedDB indefinitely on every device.

**Implementation.**
1. Metadata store boundary: a USER_METADATA_FIELDS whitelist (stack, tags, ratings, notes, stackSequence, favorite, extractedMetadata, metadataStatus, prompt, localUpdatedAt) is enforced on write (schedule + direct save) and on read (hydration assign). Identity and URL fields can no longer enter or leave the store.
2. `mergeCloudWithCache`: merged record = cloud record + sanitized user metadata from cache. Provider identity always comes from the cloud.
3. `repairDriveIdentityFields`, run at every hydration point (cache-first paint, pure cache mode, post-merge): rebuilds targetFileId and all id-derivable URLs strictly from the file's own id (shortcuts from shortcutDetails.targetId), drops thumbnailLinks embedding a different id, logs, resaves the folder cache, and clears the image cache — healing already-poisoned devices automatically on next load.

**Gates.** New regressions, poisoned-row and repair cases proven failing on unfixed code: a full-snapshot row under another file's key cannot alter identity/URLs while user metadata still flows; repair rebuilds crossed fields, respects shortcut targets, and leaves clean records untouched; merge preserves only user metadata from cache. Full suite + churn + relist + identity: 40/40 green; syntax/diff; publish per §43. Tap-check overlay retained for on-device verification.

**Discipline.** Identity-bearing fields (ids, names, provider URLs) have exactly one source of truth — the provider — and never round-trip through local persistence.

---

## 54 · R4.27 — 500-SCALE SPHERE INTEGRITY (2026-09-05)

**Defect (owner report at 500+ items).** Sparse sphere with thumbnails appearing then disappearing; spins leaving blanks that slowly repaint; taps sometimes opening an image nowhere near the tapped one. Cause (graveyard G20): the population fired all ~500 thumbnail requests at once, tripping provider rate limiting — failed cards paint as near-invisible blanks that trickle back through R4.21 backoff — and blank cards remained pickable, so an invisible failed card in front stole taps aimed at the painted photo beneath.

**Implementation.**
1. Paced population: sphere card `<img>` fetches run through the R4.23 16-slot queue via a `paced` attach mode (slot held from src assignment to load/error, single request per card, 20s failsafe release). Explorer pinning now pins cache entries without preloading, eliminating the parallel duplicate fetch of the same URLs.
2. Picking honesty: `cardAtPoint` skips cards whose image has no painted pixels (no src, incomplete, or zero naturalWidth) — only what the person can see is tappable.
3. `maxResident` raised to 1400 so a full 500-card sphere's pinned entries plus display/thumb renditions fit without eviction churn (entries are cheap: decoded preloads already release on settle).

**Gates.** New regressions, both proven failing on unfixed code: a blank frontmost card cannot steal the pick from the painted card beneath; a 120-card population never exceeds the slot limit in flight and fully paints. The R4.17 anti-trickle test updated to poll for full src coverage (eager, no lazy/idle deferral — pacing is bounded concurrency, not trickling). Full suite 42/42 green; syntax/diff; publish per §43.

**Discipline.** Request concurrency to providers is always bounded, exactly one in-flight fetch exists per rendition key, and pointer picking only ever resolves to painted content.

---

## 55 · R4.28 — OWNER-ORDERED ROLLBACK TO R4.21 + IDENTITY INTEGRITY (2026-09-05)

**Owner ruling.** On 500+ item device testing of R4.27 (slow load, >90% wrong tap targets, Focus round-trip lag), the owner ordered the current line trashed and a return to the pre-neon-spinner build — R4.21 — as the best-performing version. Complied in full with one retained exception: the §53/G19 file-identity fixes (metadata-store whitelist both directions, cloud-authoritative merge, per-hydration identity repair), because the owner device-confirmed them fixing the crossed-record wrong-image defect, and a pure R4.21 would re-apply the poisoned local rows on every load and bring that defect straight back.

**Rolled back (implementations buried by owner order; graveyard knowledge entries G17, G18, G20 stand, revival per §3):** R4.22 spinner recolor, R4.23 sphere rendition/preload-release/slot queue, R4.24 gliding tap catch, R4.25/R4.25.1 tap-check diagnostics, R4.27 paced population and painted-only picking. Tests restored to the R4.21 suite; identity, churn, and relist regressions retained.

**Gates.** ui-v2.html = R4.21 blob + G19 edits only (verified by construction); R4.21 suite + churn + relist + identity: 35/35 green; syntax/diff; publish per §43.

---

## 56 · R4.29 — RESTORE THE AUG-29 STABLE + IDENTITY INTEGRITY (2026-09-05)

**Owner ruling.** The app worked correctly at 500+ scale over a week ago; the entire R4.13–R4.28 line was regression-chasing on top of it. Restored ui-v2.html to `b47b602` (2026-08-29, "Speed up UI-V2 sorting and preserve focus identity"), the last commit before the Aug-30 pointer-targeting churn began, with exactly one addition: the G19 file-identity fixes (metadata-store whitelist both directions, cloud-authoritative merge, per-hydration identity repair). The wrong-image symptom that kicked off the whole chase was G19 record corruption, not picking — the Aug-29 code was never the problem, but pure restoration would re-apply the poisoned local rows, so the guards ride along.

**Gates.** Base = b47b602 blob + G19 edits only (all anchors matched verbatim); Aug-29 build's own suite 11/11 green against it; identity regressions 3/3 green; boot/populate smoke green with zero page errors; syntax/diff; publish per §43.

**Discipline going forward (owner-directed).** No speculative rewrites of working subsystems: device symptoms get diagnosed to a proven root cause (probe or counter-proof) before any implementation, and fixes are minimal deltas against the known-good base, one at a time.

---

## 57 · R4.30 — OWNER-PINNED R4.10 RESTORED + IDENTITY INTEGRITY (2026-09-05)

**Evidence-based candidate selection (owner-directed).** Full history survey of ui-v2.html. The decisive fact: on 2026-08-25 the owner personally committed `6383573` ("Add snapshot of ui-v2.html"), which restored ui-v2.html to exactly the R4.10 blob `fa9c0fb` (a7b472d, Aug 22) — the owner's own recorded judgment discarding the Aug 23–24 sphere fix storm. Everything after (Aug 26–29 "Focus identity" stabilizations, the Sep 4–5 R4.13–R4.29 line) was layered on top of that pin while chasing a symptom later proven to be G19 data corruption, not code. R4.29's failure on device is consistent: it restored Aug 29, which already carried four days of post-pin changes.

**Shipped.** ui-v2.html = the owner-pinned R4.10 blob plus exactly two additions: (1) the device-confirmed G19 identity fixes (metadata-store whitelist both directions, cloud-authoritative merge, per-hydration repair) — the corruption machinery predates Aug 24, so the guard is required on any candidate; (2) a one-time purge of persisted explore/table layout settings, because the discarded R4.13–R4.29 builds wrote layout values (sphere scale, card scale, limits) into the same storage keys this build reads, and replaying them degrades the restored layout.

**Gates.** Blob verified: base = `fa9c0fb` + the two additions only; era suite: focus-navigation + stack-sequence 7/8 green — the single failure ("picks visible pixels by depth") reproduces identically on the pristine owner-pinned blob, i.e., it is an inherited era mismatch between the Aug-25 test file and the owner's chosen Aug-22 code, not a regression introduced here (verified by A/B run); identity regressions 3/3; boot smoke clean; syntax/diff; publish per §43.

---

## 58 · R4.31 — PINNED BASE + THE TWO PROVEN INPUT FIXES (2026-09-05)

**Owner device report on R4.30.** Sphere builds quickly and correctly (pin + settings purge confirmed working); two defects remain, both pre-dating the pin and both already root-caused on device earlier in this project: (1) taps open the wrong image — the pinned code picks the containing card whose CENTER is nearest the finger, not the card painted on top, so overlapping cards (most of a populated sphere) routinely resolve to the one underneath (§48's subject, engine-independent in this form); (2) the Focus X exits only on the delayed synthetic click — it feels dead, and an impatient second tap fires a second exit that falls through to Sort, destroying the retained sphere and forcing a full repaint (§47/G16's subject).

**Shipped (minimal deltas on the pinned base, re-landing only device-proven remedies).** `cardAtPoint` = §48 rect + inline-z-index frontmost winner, later DOM order breaking ties; Focus X = §47 finger-lift exit with 700ms trailing-click suppression and single-fire until the next Focus enter re-enables it.

**Gates.** New regressions: overlapping-cards pick resolves the top card over the nearest-center card; a second impatient X tap plus the trailing click cannot fire a second exit. Both green; identity 3/3; smoke clean; era suite unchanged — its two failures reproduce identically on the pristine pinned blob (A/B verified, inherited test/code mismatch). Syntax/diff; publish per §43.

---

## 59 · R4.32 — SECOND-TAP AUTHORITY: KILLING THE GHOST ACTIVATION PATH (2026-09-05)

**Owner correction accepted.** The recurring wrong-image and X-to-Sort symptoms were never new bugs — they were one never-removed mechanism the fixes kept dancing around. On the pinned base, three cooperating defects: (1) a fingertip's natural wobble exceeds the mouse-sized 3px tap slop, so the sphere rejected most real touch taps; (2) after any successful activation, `focusTransitionFileId` never cleared on success, silently disabling the sphere's tap path; (3) every rejected/disabled tap fell through to `Gestures.toggleFocusMode`, which opens the CURRENT image (not the tapped one) with a Sort referrer — the wrong picture, whose X exits to Sort and destroys the retained sphere. First tap sometimes right, later taps wrong, X to Sort, full repaint: the owner's report verbatim.

**Shipped (minimal deltas).** Touch-aware tap slop (12px touch / 8 pen / 3 mouse; re-land of 31314ca); the transition flag clears on success; `toggleFocusMode` is inert while Explore or Table is live — those surfaces own their taps.

**Gates.** New regressions: a real touch tap with 9px wobble activates exactly the tapped card with an Explore referrer; a second tap after a Focus round trip succeeds with an Explore referrer; the gesture toggle is inert on a live sphere (this and the wobble test proven failing on R4.31). Full relevant suites green (12 passed); the two era-suite failures remain A/B-verified as inherited from the pristine pin. Syntax/diff; publish per §43.

**Discipline.** Exactly one activation authority per surface: any fallback path that can open Focus with a different file or referrer than the person's tap is a defect, not a safety net.

---

## 60 · R4.34 — THE LIVE SESSION IS SACRED (2026-09-05)

**Root cause, finally proven end-to-end.** A real-input WebKit harness driving the full user loop (screenshot pixel ground truth → real tap → Focus → real X tap → sphere) stayed green on every build — until it simulated the one thing only the owner's devices have: **`refreshFolderInBackground` landing mid-session.** That refresh fires seconds after every load and, on real Drive, always finds changes (the app's own writebacks guarantee it). It then (a) rebuilt the stacks mid-gesture — cards remap under a finger between down and up, so an up-time pick resolves a different card; (b) **unconditionally called `Core.displayCurrentImage()`**, and when the merge flips the viewed file's stack (cloud lagging the app's own recent writeback), the ID lookup misses and position fallback silently replaces the photo on screen — "tap A, get B" while the tap itself was correct; (c) disturbed surface/referrer state so the X fell to Sort and destroyed the retained sphere. Invisible to every previous gate because no harness had a Drive backend. This mechanism has stomped every build all night; the input-layer fixes were aimed at innocent code.

**Shipped (R4.33 + R4.34, minimal deltas on the pinned base).** Down-point pick authority (the card under the finger at pointer-down is what a tap opens; no up-time re-pick); `SpatialGallery.open` never clears a live Focus referrer, and `exit()` restores the referrer from the inspection record if anything cleared it; the background refresh applies DATA only during a live session — stacks re-anchored to the current image by ID across stacks, and `displayCurrentImage`/empty-state repaints suppressed whenever Focus, Explore, or Table is live.

**Gates.** WebKit full-loop churn harness (wk-flow.mjs): 5/5 rounds green — mid-gesture re-render between down and up, refresh applied between tap and X, tapped image still on screen after the refresh, X returns to the live sphere. Stack-flip stomp regression (refresh-stomp.spec.ts) green; input, identity, smoke, era suites green (2 known inherited era failures unchanged). Syntax/diff; publish per §43.

**Discipline.** Background synchronization may refresh data, never presentation: while any surface is live, nothing repaints, remaps, or re-anchors what the person is looking at, and the current image binds by ID across stacks, never by position.

---

## 61 · R4.35 — PROVIDER-TRUTH REBUILD (2026-09-05)

**Owner directive: apply the diagnostics' own conclusion.** The R4.25.1 tap-check evidence showed local file records stitched from two different files — potentially including crossed ids, which per-field repair cannot even detect. Wrong thumbnails persist because the poisoned records themselves persist. Field repair was treating symptoms in data that cannot be trusted record-by-record.

**Shipped.** One-time (per device, flag-guarded) discard of the entire local file-record cache (`folderCache`, all folders), forcing a clean full rebuild from the provider listing — which is keyed correctly at the source. The sanitized store boundary and cloud-authoritative merge (§53) guarantee the corruption cannot re-form. User sorting data (stacks, favorites, notes, ratings) lives in the separate metadata store and is untouched; identity repair remains as a standing guard for any record that slips through.

**Gates.** Full suites green (14 passed incl. refresh-stomp); WebKit full-loop churn harness 5/5; syntax/diff; publish per §43.

---

## 62 · R4.36 — INSTANT X RETURN (2026-09-05)

**Owner device report on R4.35.** Correct images now appear (provider-truth rebuild working), but the X sometimes lands in Sort instead of the globe, and X / Focus round trips lag badly. Cause, in the pinned exit path: `exitToReferrer` reopened the sphere on `state.currentStack` — which a background merge can re-anchor to a different stack mid-view (different sphere rebuilt, or empty path falling to Sort) — and any membership change defeated `preserveGeometry`'s exact-match test, forcing a full teardown-and-rebuild behind a loading state on nearly every X (the lag, the Sort flash, the repaint).

**Shipped.** Explore exits return to the sphere's OWN stack (referrer stackName), with the current image re-anchored into it; same-context returns with changed membership route through a new `reconcilePopulation` (keyed element reuse, delta create/remove, sphere never hidden, no loading state) instead of `buildCards`. Full rebuild remains only for genuine context changes.

**Gates.** New regression (proven failing on R4.35): after an in-Focus membership change plus a cross-stack re-anchor, the X returns to the visible sphere on its own stack with ≥10 of 12 card elements reused. All suites green (14 passed); WebKit full-loop churn harness 5/5; syntax/diff; publish per §43.

---

## 63 · R4.38 — DETERMINISTIC BY CONSTRUCTION (2026-09-05)

**Owner architectural ruling, accepted in full.** Trapping and patching races is wrong; behavior not determined mathematically will never be right. The night's recurring defects were all the same shape: multiple independent systems answering one input (sphere pointer path, Sort gesture screens, mode toggles, background refresh) and truth resolved through mutable position instead of identity. Guards referee races; refereed races are non-deterministic by definition. The owner's "off by one position" report was the proof: the Sort layer's advance handler fired on the same tap that opened Focus.

**The three functions now enforced by construction:**
1. **Input → surface.** Exactly one surface owns pointer input, decided structurally in `updateGestureOverlayMode`: while Explore or Table is live, the Sort gesture screens are hidden and pointer-inert — they do not exist for input. No handler-level guards; racing is impossible, not policed.
2. **Id → display.** While Focus is live, `displayCurrentImage` renders `state.inspection.fileId` — a pure lookup over `imageFiles` — and position is derived FROM the id. Position-based subject resolution (mutated concurrently by merges/gestures/sorting) is gone from the Focus path; the off-by-one class cannot exist.
3. **Enter → exit.** `enter()` computes a frozen `exitDestination` once; `exit()` consumes only it. Nothing re-derives the destination at exit time, so no mid-session mutation can route the X anywhere but where the person came from.

**Gates.** Three new regressions, all proven failing on R4.37: gesture screens structurally inert with the sphere live; concurrent position/currentFileId mutation during and after enter cannot change the displayed subject; clobbering the referrer and current stack after enter cannot send the X to Sort. Full suites 16 green; WebKit full-loop churn harness 5/5; syntax/diff; publish per §43.

**Discipline (constitutional, owner-directed).** Every user-visible outcome must be a pure function of the user's input and pinned session state: one input owner per surface, identity over position everywhere, single-assignment session constants. Any conditional guard added to referee concurrent writers is prima facie evidence of an architecture defect and is rejected at review.

---

## 64 · R4.38 FAILURE ANALYSIS, LAST-KNOWN-GOOD DECLARATION, AND THE ONE PATCH (2026-09-05)

**Process violation acknowledged.** R4.38 regressed on device (Focus navigation frozen; X to Sort) and a forward patch was begun without stopping for root cause, graveyard, and plan. That work was halted by the owner and is discarded. This section executes the protocol.

**Root cause (G21).** R4.38 shipped half a state machine: the Focus subject was pinned by id with no transition owner, so next/back (legitimate subject transitions writing position) are ignored by the pinned display; and the frozen exit destination was not session-scoped, so era swipe gestures consumed or bypassed it mid-session.

**Last known good, declared.** No fully green build exists tonight. The ratified foundation is the owner's own Aug-25 pin of the Aug-22 build. Device-confirmed on top of it: sphere builds fast and correct (R4.30 stack: identity guard, settings purge, provider-truth rebuild) and tap→image correct (R4.38 determinism). R4.38 stands as the working base because rolling it back restores a worse device-confirmed defect (non-deterministic tap subject) while its own regression is smaller and fully root-caused.

**The one patch (R4.39), defined before implementation.** Complete the state machine, nothing else:
1. `CanonicalInspection.setSubject(fileId)` — the single lawful writer of the pinned subject: updates `inspection.fileId`, derives `currentFileId`/stack/position FROM the id, then displays.
2. `Gestures.nextImage`/`prevImage` become subject transitions: neighbor computed BY ID in the canonical stack from the current pin (`stack[indexOf(pin) ± 1]`), then `setSubject`. No positional arithmetic on mutable counters.
3. `exitDestination` is write-once per session: assigned at enter only when no session holds one; cleared only by completed exit. Nothing else may read or write it.

**Binary gate (pass = publish, fail = discard the patch, stop, and return to this section).** One end-to-end regression driving the full loop: tap a specific card → exactly that image in Focus → next shows exactly the id-neighbor → prev returns → X lands on the visible globe on its own stack. Plus: all existing suites green and the WebKit full-loop churn harness 5/5. Any red = the patch is discarded unshipped.

---

## 65 · R4.40 — ROLLBACK TO R4.38 AND THE RATIFICATION RULE (2026-09-05)

**Owner report on R4.39.** Tap→image regressed (the function R4.38 had device-confirmed), Focus stuck, exit misrouted — despite the §64 gate passing in full. Pages deployment verified current (build commit = pushed commit; owner tested clean-cache), eliminating staleness. Graveyard G22: a passing lab gate is not ratification; the lab has repeatedly mispredicted the device.

**Action.** Clean revert of R4.39 (no diagnosis-in-place, no forward patch). The working base returns to R4.38 — the last owner-ratified state for tap→image — with its two KNOWN defects standing documented (G21: Focus next/back frozen; X can fall to Sort via era swipe gestures). Known defects in a ratified build outrank unknown regressions in a gated one.

**Standing rule (constitutional).** Every release is a candidate until ratified on the owner's device. Device regression ⇒ immediate rollback to the last ratified state, then G-entry, then plan, then at most one defined patch with a binary gate — whose pass still only makes the next candidate.

**Next patch: not defined until the owner ratifies that R4.40 restores R4.38's device behavior (tap→image correct).** Then §64's state-machine completion gets re-attempted as a new, smaller definition informed by whatever the R4.39 device failure teaches.

---

## 66 · R4.41 — THE ONE PATCH: NAVIGATION FOLLOWS THE PIN (2026-09-05)

**Owner ratified R4.40** (tap→image correct on device). Per §65, one patch is now defined.

**Definition (before implementation).** Two one-line insertions, nothing else: in `Gestures.nextImage` and `Gestures.prevImage`, after the era's own position advance and `CurrentImage.set`, when a Focus session is live, update the pinned subject to the file just navigated to (`state.inspection.fileId`). The era's arithmetic, ordering, and side effects are untouched. No new functions, no re-anchoring, no persistence calls, no destination changes — every element R4.39 added and the device rejected is excluded. The known X-to-Sort defect (G21) remains open for a separate future patch.

**Binary gate.** Tap → exactly that image; next → the adjacent image displayed; prev → back to the tapped image; all suites; WebKit churn harness. Pass ⇒ publish as CANDIDATE (per G22, only owner device ratification makes it good). Fail ⇒ discard, return here.

**§66 EXECUTION RESULT: GATE FAILED — PATCH DISCARDED UNSHIPPED.** The two pin-follow lines broke six suite regressions: era flows treat `inspection.fileId` as the session's ENTRY file (canonicality across Focus transitions, trash handling, display-race guards), so mutating it on navigation violates their contract — the R4.38 pin overloaded a field that already had era semantics. Lesson for the next definition: the pinned subject needs its OWN session field (e.g. `inspection.subjectFileId`), read by the display pin, written only by navigation, leaving `inspection.fileId` with its era meaning untouched. Published build remains R4.40 (owner-ratified). Next patch will be defined against this lesson only after explicit go-ahead.

---

## 67 · OWNER-IDENTIFIED GROUND LEVEL: R4.22 (bcb9af7) — 2026-09-05

**Owner finding, from a full-lineage device survey (207-entry lineage scan, `ui-v2-lineage.json`, committed to the repo).** The ground level is **R4.22 (`bcb9af7`, blob `41af69c`)**: works sometimes but not always. This supersedes all prior last-known-good declarations, including the Aug-25 pin.

**Action.** `main` now carries the byte-identical bcb9af7 blob for ui-v2.html (hash-verified `41af69c`) and that era's own test suite (30/30 green against it). No restamp, no riders, zero deltas — what is live is exactly what the owner measured.

**"Sometimes but not always" — the known candidate causes already root-caused this session, queued as one-at-a-time patches, each requiring definition → binary gate → owner device ratification before the next:**
1. **G19 record corruption** (proven by the owner's tap-check screenshots; its store-boundary fix was owner-ratified on device at R4.26): metadata-store whitelist both directions, cloud-authoritative merge, one-time provider-truth rebuild.
2. **Mid-glide taps** (proven 6/6 wrong vs 6/6 right at rest in the WebKit pixel-truth harness).
3. **Background refresh stomping the live session** (proven in the churn harness).

**No patch is implemented until the owner says go on patch 1.**

---

## 68 · PATCH 1 OF §67 — G19 RECORD-INTEGRITY BOUNDARY ON THE GROUND (2026-09-05)

**Definition (before implementation; owner-ratified fix from R4.26/R4.35, re-landed verbatim on the bcb9af7 ground).**
1. Metadata store carries USER metadata only: whitelist enforced on write (scheduled + direct) and on read (hydration assign).
2. Cache merge is cloud-authoritative: merged record = cloud record + sanitized user metadata from cache.
3. `repairDriveIdentityFields` at every hydration point.
4. One-time (new flag) discard of the local file-record cache, forcing a clean rebuild from the Drive listing.
Nothing else — no input, presentation, or session changes.

**Binary gate.** Identity regressions (poisoned row cannot rewrite identity/URLs; repair rebuilds crossed fields, respects shortcut targets; merge preserves only user metadata) + the ground's own 30-test suite + syntax. Pass ⇒ publish as CANDIDATE. Fail ⇒ discard, return here.

**Owner check for ratification.** The specific photos that opened wrong images: tap them. Each must open exactly the picture on its thumbnail. First load per phone is slower once (the rebuild).

**§68 GATE RESULT: PASSED** (identity 3/3, ground suite 30/30, syntax clean). Published as CANDIDATE; awaiting owner device ratification per G22.

---

## 69 · §68 CANDIDATE FAILED RATIFICATION — ANALYSIS AND REVISED PATCH 1 (2026-09-05)

**Owner device evidence on the §68 candidate.** (a) Quick taps: right image at LOW probability; **tap-and-hold: right image EVERY time** — device confirmation of the mid-glide mechanism (§67 item 2; harness had shown 6/6 wrong gliding vs 6/6 right at rest): a held finger stops the sphere before release. (b) Spin makes painted thumbnails vanish and repaint (pre-existing G17-class memory behavior, worsened by this candidate). (c) X exit lags hugely, sphere does not pop — worse than the ground.

**Root cause of the candidate's regression (G23).** `repairDriveIdentityFields` ran at every hydration and called `SharedImageResources.clear()` whenever any field changed — on live Drive that is nearly always, so it repeatedly nuked the image cache: recurring thumbnail wipes and a cold cache at every Focus exit.

**Action.** Reverted to the pure ground (blob 41af69c).

**Revised patch 1 (defined before implementation).** Identical store-boundary fixes (whitelist both directions, cloud-authoritative merge, one-time record purge + rebuild), with two corrections: identity repair runs ONLY as part of the one-time purge cycle (same flag), and it never touches presentation caches. Zero recurring work; zero cache clears.

**Gate.** Identity regressions + ground suite + syntax; plus a new regression: a second hydration after the purge performs no repair and no cache clear. Pass ⇒ candidate. Owner check unchanged: the previously-wrong photos must open correctly, and the app must feel no worse than the ground.

**§69 GATE RESULT: PASSED** (poisoned-row and merge boundaries hold, user metadata flows, purge one-time; ground suite 30/30; syntax clean; zero recurring repair, zero added cache clears — grep-verified). Published as CANDIDATE; awaiting owner device ratification.

---

## 70 · PATCH 2 OF §67 — SINGLE INPUT OWNER (THE ±1 GHOST PATH) — 2026-09-05

**Owner ruling confirmed in source.** The wrong image is off by ±1 and it is the code: `updateGestureOverlayMode` hides Sort's gesture screen only during Focus, so while Explore is live the Sort layer receives the same taps and its directional handlers fire `prevImage()`/`nextImage()` — position ±1, sign = tap side. The sphere's own activation is id-verified and correct; the ±1 bump wins the display. Tap-and-hold is immune because gesture classifiers reject holds as taps — the owner's discriminator, explained exactly.

**Definition.** While Explore or Table is live, Sort's gesture screen is hidden AND pointer-inert — structural absence from input, no handler guards. Two lines in `updateGestureOverlayMode`, re-evaluated on surface open/close. Nothing else.

**Gate.** With the sphere live: the gesture screen is hidden/pointer-inert and a synthetic directional tap through it changes nothing (position and currentFileId unmoved); a sphere tap opens exactly the tapped id; ground suite green. Applied on top of the live §69 candidate (both independent, both awaiting one ratification pass).

**§70 GATE RESULT: PASSED** (sort layer hidden + pointer-inert with the sphere live and directional taps through it change nothing; sphere tap opens exactly the tapped id; layer restored on sphere close; §69 boundary gates and ground suite all green — 35/35). Published as CANDIDATE with §69; one ratification pass covers both.

---

## 71 · PATCH 3 OF §67 — INSTANT X RETURN + EIGHT-DIRECTION DRAG GUARANTEE (2026-09-05, owner-ordered for this release)

**Exit lag root cause.** `resumeFromFocus`'s same-context test compares `folderGeneration`, a churn counter the background sync bumps on nearly every merge — so the suspended sphere is discarded and fully rebuilt (~500 cards + ~500 thumbnail fetches ≈ the owner's "7 count") on almost every X. Fix: context identity = folderId + stackName + layout; the generation counter is dropped from the test (membership deltas are already handled by the retained-scene reconcile path).

**Drag guarantee.** The trackball math already composes pitch+yaw freely (all 8 directions). Hardening: `touch-action: none` + `overscroll-behavior: contain` on the sphere scene so no browser gesture can claim an axis on device. The 8 directions become a GATED contract: each of L→R, R→L, T→B, B→T, and all four diagonals must rotate the orientation with the correct axis signs.

**Gate.** Eight-direction drag regression (per-direction orient axis-sign assertions); exit regression: with the sphere suspended and the generation bumped mid-Focus, X returns with card elements reused, no population-loading state; §69/§70 gates and ground suite green. Pass ⇒ candidate.

**§71 GATE RESULT: PASSED** (all eight drag directions rotate with the sphere-scene hardened against browser axis theft; X after a mid-Focus generation bump returns to the visible sphere with 100% of card elements reused and no loading state — that exit case proven failing on the prior candidate; §69/§70 gates and ground suite green, 37/37). Published as CANDIDATE (p1R + p2 + p3); one ratification pass covers all three.

**§71 CORRECTION (honesty entry).** The "proven failing on the prior candidate" claim for the exit regression was WRONG: with an unchanged harness population, the prior code's rebuild path also resumes, so the counter-proof does not discriminate. The generation-comparison removal is retained on its merits (it deletes a comparison that live-Drive churn defeats), but the 7-count fix is ratifiable only by the owner's device, where mid-Focus membership churn actually occurs. Gates remain necessary-not-sufficient (G22).

---

## 72 · PATCH 4 — REPEATABLE NAVIGATION: THE NO-ROLL TURNTABLE (2026-09-05, owner requirement)

**Owner requirement.** The eight directions are a precision browsing contract: the sphere is an efficient way to scan many images at once ONLY if the navigation path is repeatable. The free trackball fails it by construction — 3D rotations do not commute, so mixed drags accumulate roll: the view spirals and no path retraces.

**Definition.** Orientation becomes a pure function of exactly two scalars: `orient = Rx(pitch) · Ry(yaw)`. Horizontal drag ⇒ yaw only; vertical ⇒ pitch only; diagonal ⇒ both, proportionally. Pitch clamps just past the poles (±88°) so over-the-pole inversion cannot occur. Momentum decays per-axis in the same two scalars. Roll is not damped or corrected — it is unrepresentable. `center()` derives yaw/pitch from the target vector (its existing math) and the same function produces the orientation. `applyViewRotation` matrix composition and `orthonormalizeOrient` are removed from the drag path.

**Gate (with counter-proof).** (1) Retrace invariant: the drag sequence right→down→left→up returns the orientation to identity within 1e-6 — MUST FAIL on the current trackball candidate (non-commutativity) and pass on the turntable. (2) No-roll invariant: after arbitrary mixed drags, the orientation's roll component is exactly zero (m[1] ≈ 0). (3) All eight direction axis-sign checks. (4) Ground suite + §69/§70/§71 gates green.

**§72 GATE RESULT: PASSED, with discriminating counter-proof.** Retrace invariant (right→down→left→up = identity within 1e-6) and no-roll invariant (roll component < 1e-9 after arbitrary mixed drags): both FAIL on the trackball candidate and pass on the turntable — the spiral is gone by construction. The era's R4.19 unclamped-trackball test is superseded by owner order to the §72 contract (pole clamp + exact retrace) — recorded as a contract change, not a weakening. Full suites 39/39 green. Published as CANDIDATE (p1R+p2+p3+p4).

---

## 73 · §72 REJECTED ON DEVICE — ROLLBACK; REQUIREMENT REMAINS OPEN (2026-09-05)

**Owner rejection.** The turntable candidate traded the spiral for ghost cards, a sparse globe, and repaint-storm performance on turns. Rolled back to the p1R+p2+p3 candidate (record integrity + single input owner + instant-X/8-way hardening) — the turntable and its test-contract change are fully reverted; the era's unclamped-spin test is restored with the code it describes.

**Root cause: not proven (G24).** Inspection rules out competing orientation writers. Ghosting is a rendering/compositing behavior invisible to DOM-level gates, which is exactly why the gate passed and the device failed.

**The repeatable-navigation requirement (owner: "a real need") remains OPEN.** Precondition for any re-attempt, now constitutional: a rendering-level gate in the WebKit screenshot harness that scripts turns and diffs successive frames, asserting zero ghost artifacts, must exist and must FAIL on the rejected §72 build before a new navigation model is defined. Requirement work resumes only on owner go-ahead.

---

## 74 · BASELINE RESET TO p1R+p2 (8fabb49) + THE ONE FIX: GRID EXIT PRESERVES THE CURRENT IMAGE (2026-09-05)

**Owner ruling.** The p3 build is rejected (G25); baseline = 8fabb49 (ground + record integrity + single input owner). One fix, break nothing: exiting Grid to Sort must keep the person's current image on center stage — it was selecting the top-left image, and the hijacked stack counter is the owner-identified recurring corruption that later surfaces as globe thumbnail misses (G26).

**Definition.** In `Grid.close()`: capture the current image id and its stack UNCONDITIONALLY before any reorder; restore it first in the resolution chain (same stack, by id); fall back to the grid entry id and then the grid stack's first item ONLY when the prior id no longer exists in its stack. No other line changes.

**Gate (counter-proofs required on 8fabb49).** (a) Same-stack: current = a mid-stack image, grid opened, dirtied, reordered, closed ⇒ center stage still that id. (b) Cross-stack: current in 'in', grid opened for 'out', closed ⇒ current id AND current stack unchanged. (c) Removal: current moved out via the grid ⇒ clean fallback, no crash. Plus §69/§70 gates and the ground suite. Pass ⇒ candidate.

**§74 SEMANTICS NOTE.** Verified behavior: when the current image was MOVED via the grid, the session follows it to its new stack (identity over position — the era's `CurrentImage.set` locates across stacks); fallback engages only on outright deletion. Gate updated to assert exactly that.

**§74 GATE RESULT: PASSED, discriminating counter-proof.** Cross-stack case (§74b) FAILS on the 8fabb49 baseline — the top-left crowning proven — and passes on the fix; same-stack preservation and moved/deleted semantics green; §69/§70 gates and ground suite green (38/38). Published as CANDIDATE (p1R+p2+p5).

---

## 75 · §74 REJECTED — THE ORDERING DISCIPLINE RESTORED (2026-09-05, owner-declared)

**Owner correction.** §74 misread the spec and is reverted (G26 rewritten). The discipline, restored from the era when image order was perfect: **the grid authors the stack order; closing the grid commits it; Sort begins at the top of the stack (the grid's top-left); a search's results go to the top of the stack on close.** Table and Explore consume the same committed order.

**Definition.** In `Grid.close()`, for the Sort destination: after the order commit, the current image becomes the TOP of the committed stack (`stacks[gridStack][0]`), stack = gridStack, counter = 0, displayed on center stage — deterministically, every grid→sort exit. Origin-routed closes (table/explore/focus) are untouched. The commit machinery (`reorderStackOnClose`: filtered/search results to the head, then selected, sequences rewritten) is already correct and unchanged.

**Gate (counter-proof on 8fabb49 required).** (a) Search → close ⇒ stack head = the results in grid order, current = stack top, counter 0, center stage shows it. (b) Selection-reorder → close ⇒ same. (c) Clean close to Sort ⇒ current = stack top. (d) Explore/table-origin closes route unchanged. Ground suite + §69/§70 gates green.

**§75 GATE RESULT: PASSED, discriminating counter-proofs.** Search-to-top-with-top-selected (§75a) and clean-close-to-top (§75c) both FAIL on the 8fabb49 baseline and pass on the discipline build; explore-origin routing unchanged (§75d green on both); ground suite + §69/§70 gates green — 38/38. Published as CANDIDATE (p1R+p2+p6).

---

## 76 · THREE OWNER-ORDERED CHANGES + BACKLOG (2026-09-05)

**Definition (one candidate, do not break anything).**
1. **Grid X single-tap close; resizable, persistent grid window.** The X currently needs two taps (first tap shifts the window). Fix: finger-lift single-fire close (§47 pattern) with trailing-click suppression. The grid content becomes user-resizable; its size persists per device and restores on open.
2. **Sort-mode speed favoriting.** A heart toggle in the top-right corner of the Sort center-stage image; identical write path to the Focus favorite (optimistic toggle + provider metadata update + rollback on failure); state synced on every image change; hidden while Focus is open (Focus keeps its own button). Chosen explicitly to avoid the footer-wrap layout redesign, which is BACKLOGGED.
3. **Table floating controls with persistence.** The existing image-size (%) and image-count steppers persist per device (no more reset to 24) and restore on Table init.

**BACKLOG (owner-ordered):** footer wrap taking two rows and occluding trash-stack controls (Sort) and favorite/trash (Focus) — full responsive layout reconciliation across desktop/tablet/phone.

**Gate.** (1) Grid: one synthetic pointerup on the X closes; a second tap and the trailing click are inert; size persists across close/open. (2) Sort heart: toggles the current file's favorite via the standard path, reflects state after image change, hidden in Focus. (3) Table: adjust scale/limit, re-init, values restored. Ground suite + §69/§70/§75 gates green.

**§76 GATE RESULT: PASSED** (grid X single finger-lift close with repeats/trailing-click inert; grid window resizable + size persisted/restored; sort heart toggles current file via the standard favorite path, follows image changes, hidden in Focus; table scale+limit persist and restore on init — no more reset to 24). Ground suite + §69/§70/§75 gates green (42/42). Backlog recorded: footer-wrap responsive layout reconciliation. Published as CANDIDATE (p1R+p2+p6+p7).

---

## 77 · §76 REJECTED — FULL ROLLBACK TO §75 (2026-09-05)

**Owner rejection.** §76 broke Focus and anchored the Sort heart to the image VIEWPORT (top-right, behind the row-1 Detail button) instead of inside the IMAGE. Rolled back whole to the ratified §75 candidate (blob 4e5f608, `ground-bcb9af7-p1R-p2-p6-grid-order-discipline-CANDIDATE`). No forward patch. G27 recorded.

**The three §76 requirements remain OPEN, re-attempted only on owner go-ahead, each with the G27 lessons:** the heart anchors to the image element's own top-right corner (not the viewport, clear of Detail); any change to `updateFavoriteButton`/the favorite path must gate Focus favoriting with a counter-proof; grid single-tap-close and table persistence re-land independently so a failure in one cannot force a rollback of the others.

---

## 78 · RE-LAND OF THE THREE REQUIREMENTS, INDEPENDENT + G27-CORRECT (2026-09-05)

**Owner: go.** Re-landed on the ratified §75 base, each independent, with G27 applied.
- **Heart anchored INSIDE the image:** `#center-image` is wrapped in a shrink-to-fit `.center-image-frame`; the heart pins to that frame's top-right — the image's own corner, structurally clear of the row-1 Detail button (gated: heart.parentElement === frame AND no geometric overlap with #details-button).
- **Focus untouched (G27 counter-proof):** the heart has its OWN handler and `SortFavorite.refresh()`; the Focus favorite button, handler, and `updateFavoriteButton` are unchanged. Gate proves Focus favoriting still toggles.
- **Grid X single-tap** and **table persistence** re-land as independent blocks so any one failing cannot force a rollback of the others.

**Gate: PASSED** — heart-in-frame + clears Detail; heart toggles via own path, follows image changes, hidden in Focus; Focus favoriting still works (counter-proof); grid single-tap close with repeats inert; table scale/limit persist and restore. All prior gates + ground suite green (41/41). Published as CANDIDATE (p1R+p2+p6+p8).

---

## 79 · HEART CHROMELESS + GRID ALWAYS EXITS TO SORT (2026-09-05)

**Owner.** (1) The Sort heart needs no border/background — grey (#9ca3af) off, red (#ef4444) on, exactly like Focus. (2) The grid always exits to Sort.

**Shipped.** (1) Heart CSS stripped to transparent bg / no border / grey→red color, matching #focus-favorite-btn. (2) `Grid.close()` forces `origin = null` (no table/explore/focus resume) AND tears down any live Explore/Table surface before displaying Sort — the grid can be opened over a live sphere, so closing must close it.

**Gate.** Chromeless heart (computed color grey off / red on, transparent bg, 0 border); grid opened over a live Explore sphere closes with the sphere hidden and focus off — both proven failing on the §78 candidate; heart-in-frame, own-path toggle, Focus counter-proof, grid single-tap, table persistence, §75/§70/§69 and ground suite all green (40/40). Published as CANDIDATE.
