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
