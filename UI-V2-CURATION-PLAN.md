# UI-V2 Curation Surfaces — Authoritative Requirements Plan

Status: REQUIREMENTS RECOVERY / SOURCE OF TRUTH FOR NEXT IMPLEMENTATION

This document records the requirements recovered from the UI-V2 design discussion. It is a plan only. It does not authorize implementation changes to `ui-v2.html`.

## 1. Core model

Focus, Explore, and Table are related curation surfaces. They should share the same canonical Focus decorations and navigation language instead of inventing surface-specific hearts, trash icons, details controls, counters, or stack selectors.

The organizing model has two separate concepts:

- **Stacks**: the current stack within the selected folder. The stack selector remains available on Focus, Explore, and Table so the user can switch the working stack without leaving the surface.
- **Tag stacks / tag targets**: fast-sort destinations shown in Explore medium mode and Table. They are actually tags, not permanent global stacks. Their names are user-editable and their definitions are specific to the current folder.

Tags are universal within their folder: a tag created/renamed for that folder is available consistently wherever tag-based curation is exposed for that folder. Tag definitions do not leak into unrelated folders.

## 2. Canonical Focus chrome

Focus is the UI-decoration standard for Focus, Explore inspection, and Table.

Canonical placement:

- top-left: stack selector
- top-right: Details
- bottom-left: current image position / image count
- bottom-center: the real Focus favorite/heart control
- bottom-right: the real Focus trash control/icon

Do not create fake or duplicate versions of these controls for Explore or Table.

The stack selector also provides a direct path into Grid for the selected stack. Grid must remember the originating surface and return to that surface at the correct stack/image after Grid operations.

## 3. Focus

Focus remains the dedicated sequential inspection surface.

Required behavior:

- previous/next image navigation
- stack switching through the canonical stack selector
- direct entry to Grid for the current stack
- Details
- favorite
- trash
- when Grid is opened from Focus, exiting Grid returns to Focus, to the correct stack and current image after any Grid changes

## 4. Explore — sphere + progressive inspection

### 4.1 Sphere state

Explore begins as the sphere/orbital thumbnail surface.

- Sphere thumbnails must load quickly and reuse the shared thumbnail/cache pipeline.
- No sorting/tag targets are shown while the image remains only a sphere thumbnail.
- Pinch/zoom remains available for sphere/thumbnail inspection as designed.
- A single tap on a thumbnail arms/selects it and opens medium inspection.

### 4.2 Medium inspection

Single tap from the sphere opens the selected image in a medium-size inspection state.

Medium inspection activates the canonical Focus chrome and fast-tagging behavior:

- stack selector
- Details
- image # / total
- favorite
- trash
- previous/next image navigation like Focus
- folder-specific tag targets
- fling to a tag target using the same comet-trail visual language as Sort
- direct Grid entry from a tag target

The medium image has an X. X returns from medium inspection to the Explore sphere at the correct sphere position/selection.

### 4.3 Large inspection

Tapping the medium image opens large/full-size inspection.

Large inspection behaves essentially like Focus:

- previous/next
- stack selector
- Details
- favorite
- trash
- no fling-to-tag action required in large inspection

Large has an X positioned so it never conflicts with Details. X returns large -> medium, preserving the current image and state.

Therefore Explore's size/state progression is:

`Sphere thumbnail -> tap -> Medium -> tap image -> Large`

and the reverse path is:

`Large -> X -> Medium -> X -> Sphere`

## 5. Table — fast physical triage + tagging

Table is not limited to Inbox or Maybe. The user enters Table in the stack they are currently in and may switch stacks at any time with the canonical stack selector.

### 5.1 Table source layout

- Images from the current stack are spread/scattered across the table in thumbnail form.
- Thumbnail loading must use the same shared high-performance thumbnail/cache path as Explore/Grid rather than a separate repaint/fetch system.
- Existing playful target physics remain: momentum, bank shots, rim/corner/vacuum/capture effects and capture animations.
- Image-to-image collisions are removed; they do not add useful behavior.
- Table uses the same comet trails as Sort when an image is flung.

### 5.2 Three tag targets

Table exposes exactly three active tag targets at a time.

These are **tags**, even if the UI presents them as physical stacks/targets.

- All three are draggable/repositionable.
- Their positions persist.
- Long-press a target to rename/redefine its tag.
- The three active tag names are folder-specific.
- Tag definitions are shared/universal inside that folder, so Explore and Table see the same folder tag model.
- Default names may be supplied for a new folder, but the architecture must not hard-code YES/MAYBE/NO as immutable semantic stacks.

The purpose is rapid sorting + rapid tagging of the current stack within the current folder.

### 5.3 Table thumbnail actions

Unlike Explore, Table permits fling-to-tag directly from thumbnail mode. This preserves the current fast physical sorting behavior.

A Table thumbnail can also be tapped into medium inspection.

### 5.4 Table medium inspection

Medium inspection in Table uses the same canonical Focus chrome and interaction model as Explore medium:

- previous/next
- stack selector
- Details
- image # / total
- favorite
- trash
- the same three folder-specific tag targets
- fling the medium image to a tag target
- same Sort comet trails

X returns medium -> the Table layout at the correct current stack/image/context.

### 5.5 Table large inspection

Tap medium -> large/full-size inspection.

Large behaves like Focus:

- previous/next
- stack selector
- Details
- favorite
- trash
- X returns large -> medium

No tag fling is required in large mode.

## 6. Tag target -> Grid

On either Explore or Table, tapping a tag target opens Grid immediately with that tag applied as an implicit filter.

The user does not need to see a special filter-management surface just to enter this mode. Grid should feel like normal Grid with the tag context already applied.

While there, normal Grid capabilities remain available, including search, selection, tagging, metadata/notes/details as supported, and bulk operations.

Grid must preserve an origin context object containing at minimum:

- originating surface: Focus / Explore / Table
- folder
- stack
- image/current position where applicable
- tag-filter context where applicable

On Grid exit, return to the exact originating surface. Reconcile the current stack/image against any changes made in Grid rather than blindly restoring a stale index.

## 7. Stack selector -> Grid

Focus, Explore, and Table all use the canonical stack selector.

In addition to switching stacks, it must provide a direct route to Grid for the selected/current stack.

When Grid is entered from the stack selector:

- Grid opens on that stack
- Grid records the originating surface
- exiting Grid returns to the originating Focus/Explore/Table surface
- the correct stack remains selected
- the correct current image/position is restored/reconciled after Grid edits

## 8. Shared thumbnail performance requirement

Explore sphere and Table thumbnail performance is currently unacceptable and is a first-class requirement, not cosmetic cleanup.

Required architectural direction:

- one shared thumbnail service/cache for Sort, Grid, Explore, Table, and Focus wherever the same rendition can be reused
- no per-surface duplicate thumbnail fetching when a reusable rendition is already available
- movement/repositioning of Explore sphere or Table items must not cause thumbnail repaint/refetch
- provider URLs, especially Google Drive URLs that can expire, must be recoverable without making visible thumbnails disappear after idle time
- visible/near-visible thumbnails should be prioritized
- cache work must not block first useful paint
- preserve decoded/reusable image resources where practical instead of recreating image nodes unnecessarily
- measure before/after: first useful thumbnail paint, time to fill visible Explore sphere, time to fill visible Table, cache-hit behavior, and repaint/refetch counts during movement

Implementation must begin with profiling the current path and locating the previous thumbnail/cache work in repository history before inventing a replacement.

## 9. Sort desktop pill defect

Separate existing defect to preserve during implementation planning:

- Sort stack pills need reduced height on desktop/PC.
- The trash pill currently overlaps/competes with the footer.
- Fix vertical sizing/clearance without disturbing Sort symmetry or its established interaction layout.

## 10. State restoration / idle behavior

The application must preserve the surface the user actually left open.

After idle/background/resume it must not reset to folder selection and then jump to a remembered image.

Restore/reconcile:

- active surface
- folder
- stack
- current image/position
- Explore/Table inspection level where appropriate
- Grid origin context where appropriate

Provider authentication refresh must not destroy UI navigation state.

## 11. Explicit non-requirements / rejected directions

Do not reintroduce these unless separately approved:

- fake Explore/Table versions of Focus heart/trash/details/counter
- Table restricted to Inbox + Maybe
- hard-coded permanent YES/MAYBE/NO stacks as the final tag architecture
- image-to-image collision physics in Table
- Explore sorting targets while only in sphere-thumbnail state
- a separate thumbnail/cache implementation for each surface
- runtime MutationObserver stabilization patches
- forward patching an uncertain/damaged snapshot instead of establishing the correct baseline

## 12. Implementation governance for this plan

This plan is requirements documentation only. Before implementation:

1. Establish the approved baseline commit/file.
2. Reconcile this plan against project governance.
3. Audit repository history for prior implementations of thumbnail caching, Explore inspection, Table physics, Grid return context, and Focus chrome reuse.
4. Produce an implementation plan mapped to existing functions/modules and identify what is reused, removed, or changed.
5. Do not modify `ui-v2.html` until implementation is explicitly approved.
6. Version every approved application build visibly in the footer.
7. After every approved deployment, verify the published artifact and provide the cache-busted test URL automatically.

## 13. Acceptance tests

### Explore
- Sphere loads thumbnails without avoidable refetch/repaint.
- Sphere shows no tag targets.
- Tap thumbnail -> medium.
- Medium shows real Focus chrome and three current folder tag targets.
- Medium supports previous/next and fling-to-tag with Sort comet trail.
- Medium X -> sphere.
- Tap medium -> large.
- Large shows Focus actions/navigation and X does not overlap Details.
- Large X -> medium.
- Tap tag target -> Grid filtered by that tag; exit -> Explore at reconciled stack/image.

### Table
- Opens on the current stack, not an Inbox-only special case.
- Current-stack thumbnails are scattered on table.
- Exactly three folder tag targets are shown.
- Targets drag and persist.
- Long press target -> rename tag.
- Renamed folder tag is reflected in Explore for the same folder.
- Thumbnail can fling directly to tag with Sort comet trail.
- Target physics/capture effects remain; image-image collisions do not.
- Tap thumbnail -> medium; medium supports Focus chrome/navigation and fling-to-tag.
- Medium X -> Table.
- Tap medium -> large; large X -> medium.
- Tap tag target -> Grid filtered by tag; exit -> Table at reconciled stack/image.

### Focus / Grid return
- Stack selector can switch stacks.
- Stack selector can enter Grid for current stack.
- Grid exit returns to the exact originating Focus/Explore/Table surface.
- Stack and current image are reconciled after bulk Grid changes.

### Performance / resume
- Explore and Table visible thumbnails materially improve versus current baseline.
- Moving sphere/table items does not refetch/repaint unchanged thumbnails.
- Google Drive thumbnails recover from expired URLs after idle.
- Returning after idle preserves the surface and inspection context.

### Sort
- Desktop pills are shorter.
- Trash pill clears the footer.
- Sort symmetry is otherwise unchanged.
