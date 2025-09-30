# Cross-Device Sync Test Plan

This companion plan verifies that Device A and Device B remain in sync through initial onboarding, subsequent edits, and revisit scenarios.

## 1. Baseline Setup
1.1 Authenticate Device A with the storage provider and open Folder X that contains multiple images.
1.2 Authenticate Device B with the same provider, but remain on the provider selection screen.
1.3 Ensure Folder X has no pending sync operations in either device's local state.

## 2. Device A: Initial Changes
2.1 On Device A, confirm Folder X loads on the **In** stack stage.
2.2 Apply unique tags to three different images (e.g., `#sync-a1`, `#sync-a2`, `#sync-a3`).
2.3 Add distinct notes to the same three images.
2.4 Mark one image as a favorite.
2.5 Move one image from **In** to **Keep** and another from **In** to **Maybe**.
2.6 Delete one image to send it to the provider recycle bin.
2.7 Export metadata for the modified items and confirm completion.
2.8 Verify Device A's sync queue is empty (no pending writes).

## 3. Device B: First-Time Load After Device A Changes
3.1 Authenticate Device B and open Folder X for the first time.
3.2 Confirm the stage reflects Device A's latest ordering (favorite, Keep, Maybe adjustments).
3.3 Verify the three tags from Section 2.2 are present on the corresponding images.
3.4 Confirm the associated notes from Section 2.3 are visible.
3.5 Verify the favorite state matches Device A's selection.
3.6 Confirm the deleted image no longer appears in any stack.
3.7 Review sync diagnostics/logs to ensure no errors were raised during hydration.

## 4. Device A: Additional Changes
4.1 On Device A, apply a new batch of tags (e.g., `#sync-a4`, `#sync-a5`).
4.2 Edit the note on one previously modified image.
4.3 Clear the favorite flag that was set earlier.
4.4 Restore the previously deleted image from the provider recycle bin.
4.5 Move two images between stacks to verify ordering churn.
4.6 Confirm the sync queue drains successfully after each change batch.

## 5. Device B: Return Visit After Additional Changes
5.1 Re-open Folder X on Device B after Device A completes Section 4.
5.2 Confirm new tags (`#sync-a4`, `#sync-a5`) appear on the correct images.
5.3 Verify the edited note reflects Device A's latest text.
5.4 Confirm the favorite flag is cleared.
5.5 Verify the restored image reappears in the expected stack position.
5.6 Ensure stack ordering matches Device A's latest moves.
5.7 Validate that no sync conflicts are reported in diagnostics.

## 6. Regression & Guardrail Checks
6.1 Ensure Device B can still enter Focus Mode and navigate without desynchronizing selections.
6.2 Confirm both devices can search for the new tags and receive consistent results.
6.3 Validate export operations continue to function on both devices post-sync.
6.4 Confirm neither device logs manifest version regressions.
