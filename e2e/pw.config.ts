import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: '.', testMatch: /e2e\.spec\.ts/, workers: 1, reporter: 'line', timeout: 300000,
  use: { launchOptions: { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-gpu', '--host-resolver-rules=MAP *.msauth.net 127.0.0.1:9, MAP *.googleapis.com 127.0.0.1:9, MAP *.google.com 127.0.0.1:9, MAP *.gstatic.com 127.0.0.1:9'] } } });
