# Operational Validation Test Plan

This plan validates single-device baseline behavior for the Orbital8 web client. Steps are organized chronologically to reflect the expected reviewer flow from authentication through final verification.

## 1. Setup & Initial State
1.1 Authenticate with the selected storage provider.
1.2 Choose a parent folder and drill into a child folder that contains multiple images (OneDrive).
1.3 Choose a folder that contains multiple images (Google Drive).
1.4 Load the folder and confirm the first image appears on the main stage in the **In** stack.

## 2. Main View & Focus Mode Interaction
2.1 Confirm the initial sort order of the **In** stack.
2.2 Flick Image 1 upward into the **Keep** stack.
2.3 Flick Image 2 to the right into the **Maybe** stack.
2.4 Flick Image 3 downward into the **Trash** stack.
2.5 Flick Image 4 to the left to return it to the **In** stack.
2.6 Open the **In** stack grid view.
2.7 Enter Focus Mode from the grid.
2.8 Swipe left three times (advancing forward through images).
2.9 Exit Focus Mode.
2.10 Navigate sequentially to the **Keep**, **Maybe**, **Trash**, and back to the **In** stack.
2.11 Re-enter Focus Mode from the **In** stack.
2.12 Swipe right four times (navigating backward).
2.13 Press the delete control twice to remove two images while in Focus Mode.
2.14 Exit Focus Mode.

## 3. Details Panel Validation
3.1 Open the Details panel for the current image.
3.2 Switch to the **Tags** tab.
3.3 Create a new tag and verify the input renders black text.
3.4 Apply an existing tag from the "Tags in this Folder" list.
3.5 Remove a tag that was just applied.
3.6 Switch to the **Notes** tab.
3.7 Enter a note and verify the text renders in black.
3.8 Set Quality and Content ratings to three stars.
3.9 Change both ratings to five stars.
3.10 Change Quality to one star.
3.11 Switch to the **Info** tab and confirm the filename link opens the source image in a new tab.
3.12 Verify date, time, and size metadata render accurately.
3.13 Switch to the **Metadata** tab.
3.14 Confirm "Prompt" is the first row, followed by "Model", "Seed", and "Negative Prompt".
3.15 Verify all priority/keep fields expose functional orange copy buttons.
3.16 Confirm all remaining metadata fields display correctly.
3.17 Close the Details panel.

## 4. Grid Mode & Bulk Actions
4.1 Navigate through **In**, **Maybe**, **Keep**, and **Trash** stacks.
4.2 Open the grid for the **Trash** stack.
4.3 Confirm the sole image is outlined in blue.
4.4 Use **Move** to send the image back to the **In** stack.
4.5 Confirm the image disappears from the **Trash** grid.
4.6 Close the grid and switch to the **In** stack.
4.7 Confirm the moved image now appears on center stage.
4.8 Flick the current image into the **Keep** stack.
4.9 Open the **Keep** stack grid and confirm the moved image is first.
4.10 Select the second image in the grid.
4.11 Deselect the auto-selected first image.
4.12 Close the grid and confirm the second image is now on stage as the **Keep** stack leader.
4.13 Open the **In** stack grid.
4.14 Deselect the auto-selected first image.
4.15 Select the next three images.
4.16 Use **Move** to reinsert them into the **In** stack.
4.17 Confirm the three images now occupy the first three grid positions in alphabetical order.
4.18 Confirm the former first image moved to fourth position.
4.19 Search for the tag created in Section 3.
4.20 Confirm only the tagged image appears and is pre-selected.
4.21 Close the grid and confirm the tagged image appears on center stage.
4.22 Re-open the grid and run the same search.
4.23 Delete the matching image and confirm the provider request payload is correct.
4.24 Confirm the grid is empty after deletion.
4.25 Clear the search and select the first three **In** stack images.
4.26 Use the **Folder** control to move them to a different folder.
4.27 Navigate to the destination folder.
4.28 Confirm the moved images top the **In** stack grid.
4.29 Enter Focus Mode and confirm the ordering.
4.30 Select the next three images for export.
4.31 Launch the Export modal and verify a progress counter and percentage render.
4.32 Confirm the exported CSV includes all columns, a valid source URL, and parsed metadata.
4.33 Close the Export modal.
4.34 Select three images and confirm the selection pill shows "3 selected".
4.35 Click the pill close **X** and confirm the selection clears.
4.36 Click the pill itself and confirm the grid selects all images.
4.37 Move all images to the **Maybe** stack.
4.38 Confirm the "stack is empty" message renders for the originating stack.
4.39 Use the provided control to jump to the next clockwise non-empty stack.

## 5. Final Focus Mode Validation
5.1 Switch to the **Maybe** stack.
5.2 Enter Focus Mode.
5.3 Use the stack selector in the top-left to jump to the **Keep** stack.
5.4 Confirm the displayed image is the original "test" image that cycled through Trash back to **Keep**.
5.5 Exit Focus Mode.
5.6 Flick the current image to the **In** stack.
5.7 Switch to the **In** stack and confirm the same image now appears on center stage.
