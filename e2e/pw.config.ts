import { defineConfig } from '@playwright/test';
import { resolveChromium } from '../playwright.config';

// Browser resolution is shared with the root config so this suite does not break when
// the installed Chromium revision moves. It used to hard-code
// /opt/pw-browsers/chromium-1194/..., which is correct on exactly one machine image.
// Override with CHROMIUM_PATH.
const executablePath = resolveChromium();

export default defineConfig({ testDir: '.', testMatch: /e2e\.spec\.ts/, workers: 1, reporter: 'line', timeout: 300000,
  use: { launchOptions: { ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox', '--disable-gpu', '--host-resolver-rules=MAP *.msauth.net 127.0.0.1:9, MAP *.googleapis.com 127.0.0.1:9, MAP *.google.com 127.0.0.1:9, MAP *.gstatic.com 127.0.0.1:9'] } } });
