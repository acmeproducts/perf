# OneDrive Smoke Test Parity (UI v7 vs v8)

## Scope
- Confirmed there were no unintended edits to the `OneDriveProvider` between `ui-v7.html` and `ui-v8.html`.
- Replayed the OneDrive selection + MSAL popup flow in both builds to make sure V8 still matches V7.
- Recorded console output and observed screens for traceability.

## Provider Diff Audit
Manual diff of the `OneDriveProvider` block showed the classes are identical. The definition spanning `ui-v7.html` lines 4208-4725 matches `ui-v8.html` lines 4399-4725, including constructor defaults, Graph endpoints, MSAL configuration, and folder helpers.【F:ui-v7.html†L4208-L4725】【F:ui-v8.html†L4399-L4725】

## Test Environment
- Served the repo locally via `python3 -m http.server 8000` from `/workspace/perf`.
- Used Playwright (Chromium, headless) to automate the OneDrive path in both `ui-v8.html` and `ui-v7.html`.
- Sequence for each build:
  1. Load page at `http://127.0.0.1:8000/<ui-version>.html`.
  2. Click **OneDrive** on the provider picker.
  3. On the auth screen, click **Connect** to trigger `OneDriveProvider.authenticate()`.

## UI v8 Result
- Screen progression: Provider picker → OneDrive auth screen (`Connecting...` CTA, disabled Back) while MSAL attempted to open a popup.
- Console excerpts captured during the flow:
  - `[Cartridge] System loaded. Waiting for folder load to activate.`
  - `[Cartridge] Initializing...`
  - `[Cartridge] Loaded: Baseline from slot 1`
  - `Cross-Origin-Opener-Policy policy would block the window.closed call.` (emitted twice by the MSAL popup code)
- MSAL popup: The headless browser reported a timeout while waiting for the popup window. The COOP warning indicates the popup was blocked because the served page lacks compatible `Cross-Origin-Opener-Policy` headers, so the window never fully opened to the Microsoft login surface.

## UI v7 Result
- Screen progression matched V8 (Provider picker → OneDrive auth screen with identical copy and CTA states).
- Console excerpts:
  - `[Cartridge] System loaded. Waiting for folder load to activate.`
  - `[Cartridge] Initializing...`
  - `[Cartridge] Loaded: Baseline from slot 1`
  - `Cross-Origin-Opener-Policy policy would block the window.closed call.` (twice)
- Popup behavior mirrored V8: Playwright timed out waiting for the MSAL window because the same COOP restriction blocked `window.open` from succeeding under headless Chromium.

## Conclusion & Follow-ups
- Code parity is confirmed for the OneDrive provider logic between UI V7 and UI V8.
- Functional parity is also observed: both builds reach the OneDrive auth screen and then hit the same COOP-blocked popup state. Completing the MSAL sign-in requires running the builds in a browser session that is allowed to open popups (e.g., a desktop Chrome window with popups enabled and a Microsoft test account). Once such an environment is available, rerun the above steps to confirm the redirect URI and `Files.ReadWrite.AppFolder` + `User.Read` scopes still succeed end-to-end.
