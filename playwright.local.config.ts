/**
 * Kept for anyone with `-c playwright.local.config.ts` in their shell history.
 *
 * This used to hard-code `executablePath: '/tmp/chromium'`, which exists on no
 * machine in the repo's history, so the suite could not be run from the checked-in
 * config at all. Browser resolution now lives in playwright.config.ts, which finds
 * whatever Chromium is actually installed (see resolveChromium there) and honours
 * CHROMIUM_PATH as an override.
 *
 * Prefer `npm run test:e2e`.
 */
export { default } from './playwright.config';
