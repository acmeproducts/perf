import { expect, test } from '@playwright/test';

const variants = [
  { name: 'ui-v1', file: 'ui-v1.html' },
  { name: 'ui-v4', file: 'ui-v4.html' },
  { name: 'ui-v8', file: 'ui-v8.html' },
  { name: 'ui-v10', file: 'ui-v10.html' },
] as const;

test.describe('Google Drive direct image URLs', () => {
  for (const variant of variants) {
    test(`constructs UC view URL for ${variant.name}`, async ({ page }) => {
      const pageUrl = new URL(`../${variant.file}`, import.meta.url).href;
      await page.goto(pageUrl);

      await page.waitForTimeout(500);

      const { driveUrl, directAssetUrl } = await page.evaluate(() => {
        const sampleFile = { id: 'sampleFileId123' };
        const stateRef = typeof state !== 'undefined' ? state : (window as any).state;
        const exportSystemRef = typeof ExportSystem !== 'undefined' ? ExportSystem : (window as any).ExportSystem;

        if (!stateRef || typeof exportSystemRef !== 'function') {
          throw new Error('Application globals not initialized');
        }

        stateRef.providerType = 'googledrive';
        if (!stateRef.export) {
          stateRef.export = new exportSystemRef();
        }

        const url = stateRef.export.getDirectImageURL(sampleFile);
        const passthroughUrl = DriveLinkHelper.normalizeToAssetUrl(
          'https://lh3.googleusercontent.com/some-direct-image'
        );

        return { driveUrl: url, directAssetUrl: passthroughUrl };
      });

      expect(driveUrl).toContain('https://drive.google.com/uc?id=sampleFileId123');
      expect(driveUrl).toContain('export=view');
      expect(directAssetUrl).toBe('https://lh3.googleusercontent.com/some-direct-image');
    });
  }
});
