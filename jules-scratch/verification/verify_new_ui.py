import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        file_path = os.path.abspath('performance-v1.html')
        await page.goto(f'file://{file_path}')
        await page.wait_for_load_state('domcontentloaded')

        # Bypass auth and load mock data
        await page.evaluate("() => { Utils.showScreen('app-container'); }")
        mock_files = [
            { 'id': 'file1', 'name': 'image1.png', 'stack': 'in', 'stackSequence': 1 },
            { 'id': 'file2', 'name': 'image2.png', 'stack': 'in', 'stackSequence': 2 },
            { 'id': 'file3', 'name': 'image3.png', 'stack': 'in', 'stackSequence': 3 },
        ]
        await page.evaluate(f"() => {{ state.imageFiles = {mock_files}; Core.initializeStacks(); Core.initializeImageDisplay(); }}")

        # Wait for the new UI to be initialized
        await page.wait_for_timeout(1000)

        # 1. Verify HUD is visible by default
        back_button = page.locator('#back-button')
        await expect(back_button).to_be_visible()
        await page.screenshot(path="jules-scratch/verification/hud-initial.png")

        # 2. Tap viewport to hide HUD
        await page.locator('#image-viewport').click()
        await page.wait_for_timeout(500)

        # 3. Verify HUD is now hidden
        await expect(back_button).not_to_be_visible()
        await page.screenshot(path="jules-scratch/verification/hud-hidden.png")

        # 4. Simulate a swipe up to move to 'priority'
        priority_pill = page.locator('#pill-priority')
        initial_priority_count = await priority_pill.inner_text()

        viewport = page.locator('#image-viewport')
        box = await viewport.bounding_box()
        if box:
            await page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
            await page.mouse.down()
            await page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 4, steps=5)
            await page.mouse.up()

        await page.wait_for_timeout(500)

        # 5. Verify priority pill count has increased.
        # First, we need to show the HUD again to see the pill.
        await page.locator('#image-viewport').click()
        await page.wait_for_timeout(500)

        await expect(priority_pill).to_be_visible()
        await expect(priority_pill).not_to_have_text(initial_priority_count)

        # 6. Take final screenshot
        await page.screenshot(path="jules-scratch/verification/final-state.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
