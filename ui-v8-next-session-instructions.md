# ui-v8 Working Session Copy/Paste Instructions

Copy everything between the “COPY/PASTE BLOCK” markers into the next Codex session. The steps explicitly walk Codex from branch setup to a mergeable PR that advances `ui-v8.html` to the next working version.

```
====================== COPY/PASTE BLOCK ======================
## 0. Open these references before coding
1. `core-ui-rationalization.md` – principles (“core before configuration,” immutable gestures, addition-by-subtraction).
2. `core-ui-release-plan.md` – B1–B5 bundle scope, readiness gate, QA checklist.
3. `core-first-release-execution-thread.md` – inline inventory + single-PR doctrine.
4. `mergeable-pr-task.md` – seven-task conflict-free PR template (must follow verbatim).
5. `tester-merge-guide.md` – confirms Codex owns rebases/refreshes.
6. `ui-v8-next-steps.md` – describes current `ui-v8.html` state and the concrete task stack.
7. `task.txt` – P1 footer toggle bug + “ui-v8 next-version prep” reminder.

## 1. Branch setup (Task 1 from mergeable template)
- `git fetch origin main`
- `git checkout -b ui-v8-next` (or reuse the assigned feature branch)
- `git rebase origin/main`
- Verify `git status -sb` shows a clean tree.

## 2. Implementation sprint (complete in this order)
1. **Module defaults + telemetry**
   - Add `CORE_MODULE_DEFAULTS` alongside `ChromeModules` in `ui-v8.html`.
   - Ensure every cartridge pulls from those defaults before calling `ChromeModules.apply`.
   - Emit `ActionRecorder` (or `console.info`) events when modules change state. Tag the log with `inventory: B4 core-first`.
2. **MLPUM batch restore prototype**
   - Upgrade `MLPUModule.renderRecycleBin` so users can multi-select rows and restore with a single button.
   - Add inline `<!-- inventory: addition-by-subtraction (undo removal) -->` comments explaining the linkage.
3. **Gesture tutorial cues**
   - On first cartridge activation, flash contextual hints bound to `CanonicalActionRegistry.codes`. Ensure hints auto-dismiss after the first interaction.
4. **Footer auto-hide + safe area guardrail**
   - Reuse `--safe-area-bottom` sizing to add/remove `footer-auto-hidden` whenever viewport height minus chrome budget drops below the threshold.
   - Confirm `ChromeModules.toggleFooter` still scopes to the active screen only.
5. **Persistence smoke-test harness**
   - Behind `?devtools=1`, expose a lightweight panel showing provider/folder/cartridge associations stored in persistence helpers so QA can verify without devtools.

_If time expires early, finish the highest-priority unfinished item, add inline `TODO (see ui-v8-next-steps.md)` notes, and stop._

## 3. Inline documentation requirements
- Add `<!-- inventory: ... -->` comments to every shared widget/module touched (cite bundle/doc name).
- When removing chrome (e.g., undo banners, grid handles), mention the addition-by-subtraction doctrine from `core-ui-rationalization.md`.

## 4. Testing expectations (Task 3 from template)
Run and capture terminal output for:
1. `npm install` (only if `node_modules` is missing).
2. `npm run lint`.
3. `npm run test:ui` (or the closest UI smoke command; document the exact command).
4. Manual checks (describe results in PR body):
   - Toggle each chrome module (progress, tap zones, action bar, footer, MLPUM) across both cartridges.
   - Walk through the MLPUM batch restore path.
   - Observe gesture tutorial cue on first activation, confirm it disappears afterward.
   - Resize viewport / simulate safe areas to prove footer auto-hide works.
   - Adjust provider/folder/cartridge combos and confirm the persistence panel reflects them without URL overrides.

## 5. Commit & PR packaging
- Follow Tasks 4–7 from `mergeable-pr-task.md`.
- Commit message: `Implement next ui-v8 module stack` (unless the scope changes drastically).
- PR title: `Core-first UI – ui-v8 next stack`.
- PR body format:
  - **Summary** – bullet per completed target (reference files inline).
  - **Testing** – list each command/manual check with ✅/⚠️/❌ and link to terminal chunks/screenshots.
  - Finish with “Merge when ready – no follow-up required.”

## 6. Tester handoff
- Tester only needs to review the PR description/media and press “Merge” once GitHub reports “This branch has no conflicts.”
- If conflicts reappear, Codex repeats this entire block starting from Step 1 (tester just comments “blocked – needs refresh”).

====================== END COPY/PASTE BLOCK ======================
```
