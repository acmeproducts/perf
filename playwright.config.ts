import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

/**
 * Resolve a Chromium binary.
 *
 * Playwright normally finds its own browser, but this repo is run in sandboxes that
 * pre-install Chromium under PLAYWRIGHT_BROWSERS_PATH at a revision that may not match
 * the pinned @playwright/test. When that happens Playwright fails with "Executable
 * doesn't exist at .../chromium_headless_shell-<rev>". Rather than hard-coding a path
 * (the old playwright.local.config.ts pointed at /tmp/chromium, which exists nowhere),
 * pick up whatever revision is actually installed and let Playwright's own lookup win
 * when it is correct.
 *
 * Override explicitly with CHROMIUM_PATH=/path/to/chrome when neither applies.
 */
const resolveChromium = (): string | undefined => {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;

  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;

  const candidates = readdirSync(root)
    .filter(name => name.startsWith('chromium'))
    // Prefer the full browser over headless_shell: the sphere's hit-testing and
    // layout gates read real compositor geometry.
    .sort((a, b) => Number(b.startsWith('chromium-')) - Number(a.startsWith('chromium-')))
    .flatMap(name => [
      path.join(root, name, 'chrome-linux', 'chrome'),
      path.join(root, name, 'chrome-linux', 'headless_shell')
    ]);

  return candidates.find(existsSync);
};

const executablePath = resolveChromium();

export default defineConfig({
  // Specs live both at the repo root (gate-*.spec.ts and friends) and under tests/.
  testDir: '.',
  testMatch: ['**/*.spec.ts'],
  testIgnore: ['node_modules/**', 'test-results/**'],

  // Serial by default. Every browser spec drives the same singleton app object graph
  // through window globals; parallel workers do not share state, but they do contend
  // for CPU, and these gates assert frame-accurate paint and rotation values.
  workers: process.env.CI ? 1 : 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,

  timeout: 60_000,
  expect: { timeout: 10_000 },

  // Retries are on everywhere, not just CI, because the regression gate depends on
  // them: scripts/check-regressions.mjs classifies a test that failed and then passed
  // as flaky and counts it as neither a regression nor a fix. With retries off, the
  // ~197 fixed-duration sleeps in these specs make a flake indistinguishable from a
  // real break, and a flake would get baked into the baseline as a known failure.
  //
  // Observed: `focus-navigation.spec.ts › warm resume restarts exactly one moving
  // Explorer loop` flips between otherwise identical full runs.
  retries: 1,

  reporter: [
    ['line'],
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT || 'test-results/results.json' }]
  ],

  use: {
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    }
  }
});
