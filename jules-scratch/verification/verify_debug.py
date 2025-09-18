import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        file_path = os.path.abspath('performance-v1.html')
        await page.goto(f'file://{file_path}')

        await page.wait_for_timeout(2000) # Give page time to load

        print("--- PAGE CONTENT ---")
        print(await page.content())
        print("--- END PAGE CONTENT ---")

        await page.screenshot(path="jules-scratch/verification/debug-screenshot.png")

        await browser.close()

if __name__ == '__main__':
    import os
    asyncio.run(main())
