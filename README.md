<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Rlag5HDS4Wav5vrVq_GIS0mfCAPNnyo_

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Verifying Google Drive download URLs

To confirm that every HTML template maps Google Drive downloads through API links (falling back to UC links when needed) instead of the shareable view URLs, run the following search from the repository root:

```bash
rg "downloadUrl: viewUrl"
```

The command should produce no matches. Any future regression where a template assigns a `downloadUrl` directly to the `viewUrl` will show up in this search so it can be corrected immediately.

## Playwright test suite

Run the Playwright checks that load representative UI variants and assert they construct Google Drive asset URLs using the UC view form:

```bash
npm run test:playwright
```
