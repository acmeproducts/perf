# Orbital8 Refactor Construction Plan

## Module A – Core App State & Utilities (existing)
- Keep the shared state bag (`state`), constants (`STACKS`, `STACK_NAMES`), and DOM utility helpers (`Utils`).
- No behavioral changes; ensure all functions remain byte-for-byte identical to `ui-v10.html`.

## Module B – Tagging & Annotation Systems
- Group the session-level tag registry (`TagService`), bulk tag editor (`TagEditor`), and notes editor (`NotesEditor`).
- Preserve their public methods for managing chips, tag persistence, and note updates.

## Module C – Application Flow Orchestrators
- Cover the high-level controllers that coordinate data mutations (`App`, `Core`, and `Grid`).
- These modules manage stack transitions, metadata persistence, search/filter hydration, and grid/list synchronization.

## Module D – Detail & Modal Presentation
- Encapsulate the interfaces used for file-level inspection and modal lifecycle management (`Details`, `Modal`, `UI`, `DraggableResizable`).
- Maintain the existing interactions for draggable/resizable windows and metadata display.

## Module E – System Integrations & Event Wiring
- Collect the subsystems that integrate with external services and hardware feedback: `Gestures`, `Folders`, `Events`, the sync/logger/export classes (`SyncActivityLogger`, `VisualCueManager`, `HapticFeedbackManager`, `ExportSystem`, `DBManager`, `FolderSyncCoordinator`, `SyncManager`, `MetadataExtractor`).
- Ensure the boot sequence continues to instantiate and wire these components exactly as in `ui-v10.html`.

## Verification Checklist
- DOM structure and styling must remain identical to `ui-v10.html`.
- Every function or class present in `ui-v10.html` must exist with identical logic in `orbital8-refactor.html`.
- Expose modules A–E on `window.Orbital8Refactor` so downstream scripts can progressively migrate without altering runtime behavior.
