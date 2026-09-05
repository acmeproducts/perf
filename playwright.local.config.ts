import { defineConfig } from '@playwright/test';
export default defineConfig({
  workers: 1,
  use: {
    launchOptions: {
      executablePath: '/tmp/chromium',
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    }
  }
});
