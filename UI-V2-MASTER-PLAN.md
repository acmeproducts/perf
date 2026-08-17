# UI-V2 MASTER PLAN — GOVERNED RECONSTRUCTION

**Plan status:** APPROVED — CANONICAL EXECUTION PLAN  
**Repository:** `acmeproducts/perf`  
**Production artifact:** `ui-v2.html`  
**Frozen reconstruction baseline commit:** `a6de049f8c8b9798c610984b35b9d8ade57d0fa5`  
**Frozen baseline `ui-v2.html` blob:** `1f3943655b157ccf10626d32bf4d1679e835867c`  
**Baseline identity:** `Orbital8- baseline V9b`  
**Production rule:** current production remains untouched during reconstruction  
**Release rule:** cumulative releases only; every release starts from the last passed release  
**Owner-facing test rule:** only coherent functional milestones are published for owner testing  
**Canonical plan:** `UI-V2-MASTER-PLAN.md`

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

## 3 · CONSTRUCTION RULE

Production `main/ui-v2.html` remains untouched until the final approved candidate.

Development occurs on one reconstruction line.

Each passed release becomes the immutable source for the next release.

No owner-facing Pages release is required for R1 or R2.

Owner-facing builds are produced only for coherent functional milestones:

- Explorer complete
- Table complete
- integrated continuity
- final application

This deliberately avoids repeated testing of architectural scaffolding.

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
- inspection level
- Grid context/filter
- Details-open state

Explicit user action always wins over previously cached state.

---

## 5 · FOUR PRIMARY SURFACES

UI-V2 contains four primary views:

**Sort · Focus · Explore · Table**

Grid is a secondary working surface invoked from those views.

Details is a modal/inspection overlay associated with the currently active image.

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

After deletion, movement, filtering, Grid mutation, or another operation that removes the active file from its current context:

1. attempt the next surviving neighbor in the post-operation ordering;
2. if none exists, use the nearest preceding surviving neighbor;
3. if only one file remains, use it;
4. if none remain, show the correct empty state.

Do not arbitrarily reset to index zero except where that is naturally the only surviving file.

This rule applies to:

- Sort
- Focus
- Explore Medium
- Explore Large
- Table thumbnails
- Table Medium
- Table Large
- Grid return

### 7.3 Canonical Focus inspection behavior

Focus is the behavioral standard for all inspection modes.

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

### 7.4 Real shared controls

Explore Medium/Large and Table Medium/Large must use the **actual canonical Focus control implementation**.

Not visually similar controls.

Not separately owned buttons that call approximately similar code.

One behavioral implementation.

### R1 gate

Must prove:

- Sort → Focus preserves exact `fileId`
- Focus navigation updates exact `fileId`
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
- inspection level
- navigation state

### 8.6 Resume

Resume restores the actual open state, including where applicable:

- surface
- folder
- stack
- `fileId`
- Medium/Large state
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

### 9.2 Exact tap behavior

A clean tap on any thumbnail opens **that exact thumbnail's `fileId`**.

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

## 10 · EXPLORER MEDIUM

Explorer progression begins:

**Sphere → Medium**

Medium is a persistent inspection state.

It uses canonical Focus behavior.

Medium displays:

- canonical stack selector
- Details
- image position/count
- favorite
- provider trash
- canonical Focus forward/back navigation
- canonical Focus swipes
- canonical comet behavior
- top-center X

### 10.1 Medium exit

Top-center X:

**Medium → Explorer sphere**

The current `fileId` and sphere context remain coherent.

### 10.2 Enter Large via center circle

Do **not** use an ordinary image tap to enter Large.

Restore/reuse the former Focus center-circle interaction concept specifically for Medium.

In Explorer Medium:

**center circle → Large**

The center circle has one job: enter Large for the current image.

This avoids collision with Focus's existing tap-navigation semantics.

The center circle is:

- present in Explorer Medium
- present in Table Medium
- not used in ordinary Focus
- not needed in Large

Focus's established left/right navigation semantics remain untouched around it.

---

## 11 · EXPLORER LARGE

Center-circle activation from Medium produces:

**Medium → Large**

Large uses canonical Focus behavior:

- stack selector
- Details
- count
- favorite
- trash
- forward/back
- swipe
- comet behavior

Large has no tag-fling targets.

Top-center X:

**Large → Medium**

on the same `fileId`.

---

## 12 · FOCUS NAVIGATION IS THE STANDARD

Do not reinterpret back/forward semantics separately for Explorer or Table.

Whatever current canonical Focus does for:

- left
- right
- back
- forward
- swipe direction
- tap zones
- comet animation

is used unchanged by:

- Explorer Medium
- Explorer Large
- Table Medium
- Table Large

The only additional interactions are:

- top-center X to move outward one inspection level
- center circle in Medium to enter Large

---

## 13 · R4 — TABLE COMPLETE

Table is physical tag curation for images in the selected normal stack.

It is **not a physical normal-stack sorting surface**.

### 13.1 Table working population

Table loads images from the current normal stack:

- Inbox
- Keep
- Maybe
- Recycle

The canonical Focus stack selector remains available.

Changing normal stack keeps the user in Table.

---

## 14 · TABLE TAG TARGET MODEL

Table tag targets are actual tags.

They never move a file between normal stacks.

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
- inspection image
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

### Table

Per-folder configuration includes:

- active target tag bindings
- target ordering
- Table target positions

Table thumbnails and Table Medium use the **same Table positions**.

### Explore Medium

Explore Medium uses the same folder tag identities/bindings.

It stores **separate Explore-Medium target positions per folder** because its inspection geometry differs from Table.

Changing a normal stack does not change either target layout.

---

## 21 · TABLE THUMBNAILS

Images from the current working stack are physically scattered across the Table.

Only images not already carrying one of the active Table target tags appear.

A clean tap on any thumbnail opens that exact `fileId` in Table Medium.

No prior arming is required.

---

## 22 · TABLE MEDIUM

Table progression:

**Table thumbnails → Medium**

Medium uses canonical Focus behavior:

- stack selector
- Details
- count
- favorite
- trash
- forward/back
- Focus swipe semantics
- Focus tap-navigation semantics
- comet effect

Table Medium also displays the same current Table tag targets in the same Table positions.

The current Medium image may be flung to a tag target.

After successful tagging:

- animation completes
- image leaves the Table curation population
- deterministic next/surviving context is chosen

Top-center X:

**Medium → Table thumbnails**

---

## 23 · TABLE LARGE

The center circle in Table Medium enters:

**Medium → Large**

Large uses canonical Focus behavior.

Large has no tag targets and no fling-to-tag.

Top-center X:

**Large → Medium**

on the same current `fileId`.

---

## 24 · EXPLORE MEDIUM TAG TARGET BACKPORT

Only after Table's tag architecture passes R4 gates is the proven target model applied to Explore Medium.

Explorer sphere remains target-free.

Explorer Large remains target-free.

Explore Medium receives:

- the same folder tag bindings
- up to five active targets
- separate Explore-specific per-folder positions
- fling-to-tag
- tag-target tap → filtered Grid

This behavior is copied from the proven Table tag system, not independently invented.

---

## 25 · R5 — GRID AND ORIGIN CONTINUITY

Grid must know exactly where it came from.

### 25.1 Origin context

Opening Grid records:

- invoking surface
- invoking inspection level
- folder
- normal stack
- current `fileId`
- tag filter if present
- other necessary display context

Possible origins include:

- Sort
- Focus
- Explore sphere
- Explore Medium
- Explore Large
- Table thumbnails
- Table Medium
- Table Large

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

Every Grid exits to the exact surface and level that invoked it.

Examples:

**Sort → Grid → Sort**

**Focus → Grid → Focus**

**Explore sphere → Grid → Explore sphere**

**Explore Medium → Grid → Explore Medium**

**Explore Large → Grid → Explore Large**

**Table thumbnails → Grid → Table thumbnails**

**Table Medium → Grid → Table Medium**

**Table Large → Grid → Table Large**

Older Grid→Sort-only requirements are superseded.

---

## 29 · STACK SELECTOR → GRID

The canonical stack selector presents normal stacks:

- Inbox
- Keep
- Maybe
- Recycle

Each stack can provide Grid entry.

If the user opens Grid for another stack:

1. Grid opens on the chosen stack;
2. that stack becomes the working stack for the return;
3. top-left Grid image at exit becomes return `fileId`;
4. exact invoking surface/level is restored on that stack.

Example:

Explore Medium Keep  
→ stack selector  
→ Grid Recycle  
→ exit  
→ Explore Medium Recycle at Grid top-left image.

---

## 30 · TAG TARGET → GRID

Tapping a Table or Explore Medium tag target opens existing Grid with that tag implicitly filtered.

Grid remains normal Grid.

On exit:

- tag-filter modal state closes
- invoking surface/level is restored
- top-left visible Grid image is used when valid for restored context
- otherwise universal deterministic fallback applies

---

## 31 · DETAILS CONTINUITY

Details always describes the current stable `fileId`.

Resume must restore Details if it was actually open.

Grid or inspection transitions must never leave an obsolete Details modal layered underneath.

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

There appear historically to be approximately five visible occurrences; the implementation must inventory the actual number rather than assume five.

Do not maintain five independently edited version strings.

Every owner-facing candidate receives a distinct visible build identity.

Example conceptual progression:

- reconstruction-R3-explorer
- reconstruction-R4-table
- reconstruction-R5-continuity
- reconstruction-R7-final

Exact naming may be normalized in the implementation plan, but one value controls all visible locations.

---

## 34 · OWNER-FACING RELEASES

The owner is not required to test internal architecture releases.

### Owner build 1 — R3

Explorer complete.

Test:

- sphere performance
- exact thumbnail identity
- independent scale controls
- Medium
- center-circle → Large
- Focus controls
- X hierarchy

### Owner build 2 — R4

Table complete.

Test:

- active normal stack
- configurable tag targets
- Manage Tag Stacks
- physical fling
- disappearing processed images
- Medium
- Large
- tag-target Grid

### Owner build 3 — R5

Integrated continuity.

Test:

- Grid return from every surface
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

- tap arbitrary sphere thumbnail → exact Medium image
- rotate → tap arbitrary image → exact Medium image
- drag never opens image
- percentage changes thumbnail size only
- Images changes active/warmed count only
- pinch changes sphere spatial extent only
- wheel/trackpad changes sphere spatial extent only
- no movement-caused thumbnail reconstruction
- Medium Focus navigation exact
- Medium center circle → Large
- Large Focus navigation exact
- Large X → Medium
- Medium X → sphere
- stack change remains in same inspection level
- favorite exact
- trash exact
- Details exact
- Explore Medium target fling after R4
- Explore target → filtered Grid → exact return

---

## 37 · REQUIRED TABLE ACCEPTANCE MATRIX

Must pass:

- Table opens current normal stack
- stack selector changes working normal stack without exiting Table
- only unprocessed-for-active-target-set images appear
- default targets Yes / No / Maybe
- zero through five targets supported
- target drag works
- long-press target does nothing special
- double-tap target does nothing special
- target tap opens filtered Grid
- long-press empty space opens manager
- manager add/change/delete works
- Restore defaults works
- zero-target state persists
- tag remains intact if target is removed
- Table thumbnail fling applies tag without changing normal stack
- tagged image completes animation then leaves Table
- image does not reappear while its tag remains an active target
- physics remain playful
- rare effects remain cosmetic only
- exact thumbnail tap → Medium
- Medium Focus controls exact
- Medium tag fling works
- Medium center circle → Large
- Large Focus controls exact
- Large X → Medium
- Medium X → Table

---

## 38 · REQUIRED GRID RETURN MATRIX

For each origin:

1. open Grid;
2. modify ordering/filter if applicable;
3. establish a known top-left tile;
4. exit Grid;
5. verify return surface and exact `fileId`.

Required origins:

- Sort
- Focus
- Explore sphere
- Explore Medium
- Explore Large
- Table thumbnails
- Table Medium
- Table Large

Repeat representative cases with:

- no-op
- reorder
- search
- tag filter
- delete
- bulk mutation

---

## 39 · REQUIRED RESUME MATRIX

Suspend/background and restore from:

- Sort
- Focus
- Focus + Details
- Explore sphere
- Explore Medium
- Explore Large
- Explore Medium + Details
- Table thumbnails
- Table Medium
- Table Large
- Table Medium + Details
- Grid
- filtered Grid

The application returns to the actual state the user left open, subject only to deterministic reconciliation if provider/file data changed.

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
- make Table tags into normal stacks
- expose normal-stack targets on the Table physics surface
- expose tag targets on Explorer sphere
- introduce image-image collision physics
- silently restore deleted Table targets
- make tag values mutually exclusive
- change Grid bulk-selection UX just to implement return identity
- route all Grid exits through Sort
- modify production during construction
- create multiple competing plans

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

After this plan is approved:

### R1
State identity + canonical Focus inspection ownership.

### R2
Shared thumbnail/cache + provider recovery + resume.

### R3
Explorer sphere + independent scaling + Medium/Large.

**Owner gate.**

### R4
Table tag-target architecture + manager + physics + Medium/Large.

Then backport proven tag targets to Explore Medium.

**Owner gate.**

### R5
Grid origin contract + top-left return law + complete cross-surface reconciliation.

**Owner gate.**

### R6
Sort desktop fit + consolidation + complete regression.

### R7
Exact final candidate, version stamp, final automated/device/provider gates.

**Owner final gate.**

Only after owner PASS is production repointed.

---

## 43 · PRODUCTION RELEASE RULE

Production release contains no new functional work.

The exact owner-approved final candidate becomes `ui-v2.html`.

After publishing:

- verify production commit
- verify exact blob
- verify Pages serves that blob
- verify visible version identity
- provide one cache-busted production test URL

No post-gate functional edit is permitted.

---

## 44 · PLAN APPROVAL EFFECT

Approval of this document authorizes repository documentation governance only:

1. `UI-V2-MASTER-PLAN.md` is the execution authority;
2. historical plans are retired from execution and preserved under `docs/retired-ui-v2-plans/`;
3. their root-level filenames contain retirement notices pointing to this master plan;
4. application code remains untouched by the plan-governance commit.

Application reconstruction starts only after this canonical plan file exists and its recorded baseline/requirements are re-read mechanically.

---

## 45 · FINAL LOCKED PRODUCT RULES

**Baseline:** `a6de049f8c8b9798c610984b35b9d8ade57d0fa5`  
**Baseline blob:** `1f3943655b157ccf10626d32bf4d1679e835867c`  
**Normal stacks:** Inbox / Keep / Maybe / Recycle  
**Current image:** stable `fileId`  
**Inspection behavior:** canonical Focus  
**Explore:** Sphere → Medium → Large  
**Table:** Thumbnails → Medium → Large  
**Medium → Large:** center circle  
**Large → Medium:** top-center X  
**Medium → parent surface:** top-center X  
**Table targets:** configurable folder tags, not stacks  
**Default tags:** Yes / No / Maybe  
**Maximum active tag targets:** 5  
**Tag exclusivity:** none  
**Processed Table image:** tagged, animated away, excluded while it carries any currently active target tag  
**Target tap:** filtered Grid  
**Target drag:** reposition  
**Target long press:** nothing special  
**Target double tap:** nothing special  
**Empty Table long press:** Manage Tag Stacks  
**Table/Explore positions:** shared tag identities; Table positions shared across Table thumbnail/Medium; Explore Medium has separate per-folder positions  
**Grid return surface:** exact invoker and level  
**Grid return image:** top-left visible Grid tile at exit  
**Delete/missing fallback:** next neighbor → prior neighbor → empty state  
**Resume:** exact open surface/modal context, including Grid and Details  
**Recycle stack:** logical app stack  
**Trash icon:** provider deletion/recycle-bin action  
**Production:** untouched until final approved candidate
