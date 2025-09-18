import re
from playwright.sync_api import Page, expect

def test_new_gesture_ui(page: Page):
    """
    Tests the new gesture-based UI functionality.
    1. Hides the HUD on tap.
    2. Moves an image to a different stack on swipe.
    """
    # Go to the page
    page.goto("http://localhost:8000/performance-v1.html")

    # This script bypasses the setup UI by injecting dummy data
    # and calling the app's internal functions to render the main view.
    bootstrap_script = """
        // 1. Create dummy data to simulate a loaded folder
        state.imageFiles = [
            { id: 'dummy1', name: 'dummy-image-1.png', stack: 'in', metadataStatus: 'loaded', favorite: false },
            { id: 'dummy2', name: 'dummy-image-2.png', stack: 'in', metadataStatus: 'loaded', favorite: false },
            { id: 'dummy3', name: 'dummy-image-3.png', stack: 'in', metadataStatus: 'loaded', favorite: false },
        ];

        // 2. Force the main app screen to be visible
        Utils.showScreen('app-container');

        // 3. Initialize the core UI components with the dummy data
        Core.initializeStacks();
        Core.initializeImageDisplay();
    """
    page.evaluate(bootstrap_script)

    # Now that the UI is bootstrapped, we can test it.
    # Wait for the main image to be visible
    expect(page.locator("#center-image")).to_be_visible(timeout=10000)

    # Get the initial count of the 'out' stack
    out_pill = page.locator("#pill-out")
    initial_out_count_text = out_pill.inner_text()
    initial_out_count = int(initial_out_count_text) if initial_out_count_text.isdigit() else 0

    # Get the initial count of the 'in' stack to ensure we have something to move
    in_pill = page.locator("#pill-in")
    expect(in_pill).to_have_text("3")

    # The viewport is where gestures are registered
    viewport = page.locator("#image-viewport")

    # 1. Test HUD toggle on tap
    # HUD should be HIDDEN by default to align with the code review feedback.
    expect(page.locator("#app-container")).to_have_class(re.compile(r'hud-hidden'))
    expect(page.locator("#pill-in")).not_to_be_visible()
    expect(page.locator("#back-button")).not_to_be_visible()

    # Tap the center of the viewport to SHOW the HUD
    # Use a position that is unlikely to be over any other element
    viewport.click(position={'x': 250, 'y': 250})

    # Wait for the class to be removed and check that HUD elements are visible
    expect(page.locator("#app-container")).not_to_have_class(re.compile(r'hud-hidden'))
    expect(page.locator("#pill-in")).to_be_visible()
    expect(page.locator("#back-button")).to_be_visible()

    # Tap again to HIDE the HUD
    viewport.click(position={'x': 250, 'y': 250})
    expect(page.locator("#app-container")).to_have_class(re.compile(r'hud-hidden'))

    # 2. Test swipe gesture
    # Perform a swipe from center-left to center-right
    viewport.drag_to(target=viewport,
                      source_position={'x': 200, 'y': 250},
                      target_position={'x': 400, 'y': 250})

    # The 'out' pill count should have incremented
    expected_out_count = initial_out_count + 1
    expect(out_pill).to_have_text(str(expected_out_count))

    # The 'in' pill count should have decremented
    expect(in_pill).to_have_text("2")

    # Take a screenshot for visual confirmation
    page.screenshot(path="tests/v2_test_screenshot.png")
