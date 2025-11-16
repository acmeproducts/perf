# ui-v8 Working Session Copy/Paste Instructions

Paste the following checklist into the next Codex session so it can deliver a mergeable `ui-v8.html` update that respects every prior decision and document.

---

## 0. Reference material to open first
1. `core-ui-rationalization.md` – grounding principles (“core before configuration,” immutable gestures, addition-by-subtraction).
2. `core-ui-release-plan.md` – B1–B5 bundle scope, readiness gate, QA checklist.
3. `core-first-release-execution-thread.md` – inline inventory requirement, single-PR doctrine, bundle-by-bundle marching orders.
4. `mergeable-pr-task.md` – the seven-task conflict-free PR template (must follow verbatim).
5. `tester-merge-guide.md` – confirms Codex owns rebases/refreshes.
6. `ui-v8-next-steps.md` – current `ui-v8.html` state, next-version goals, and concrete task stack.
7. `task.txt` – contains the P1 footer toggle bug entry plus the “ui-v8 next-version prep” reminder.

Keep all of these files open; every change must cite them inline where relevant (per the execution thread).

## 1. Branch setup (Task 1 from mergeable template)
- `git fetch origin main`
- `git checkout -b ui-v8-next` (or reuse the assigned feature branch)
- `git rebase origin/main`
- Confirm `git status -sb` is clean.

## 2. Implementation targets for this session
Follow the “Concrete task stack” in `ui-v8-next-steps.md`; unless the tester specifies otherwise, tackle them in order:
1. **Module defaults + telemetry**
   - Add a `CORE_MODULE_DEFAULTS` block near the existing `ChromeModules` definition in `ui-v8.html`.
   - Pipe defaults through the cartridge definitions so `ChromeModules.apply` no longer depends on scattered literals.
   - Emit telemetry via `ActionRecorder` (or console fallback) whenever modules change state.
2. **MLPUM batch restore prototype**
   - Enhance `MLPUModule.renderRecycleBin` so users can multi-select rows and restore in one action.
   - Keep the inline similarity-inventory comments that explain how the module replaces undo.
3. **Gesture tutorial cues**
   - Implement a transient visual hint tied to `CanonicalActionRegistry.codes` when a cartridge first activates.
4. **Footer auto-hide + safe area guardrail**
   - Use `--safe-area-bottom` + measured heights to toggle a `footer-auto-hidden` class when the chrome budget is exceeded.
   - Ensure `ChromeModules.toggleFooter` works on the active screen only (respecting the earlier bug fix).
5. **Persistence smoke-test harness**
   - Surface a dev-only panel (e.g., hidden behind `?devtools=1`) that displays the stored provider/folder/cartridge association so QA can verify without digging into storage.

If time does not allow completing all tasks, finish the highest-priority subset but leave inline TODO notes (with references to `ui-v8-next-steps.md`).

## 3. Inline documentation requirements
- Every shared widget/module touched must include a short `<!-- inventory: ... -->` comment that states which bundle or doc justified the change (per `core-first-release-execution-thread.md`).
- When removing chrome (undo banners, grid handles, etc.), mention the addition-by-subtraction doctrine from `core-ui-rationalization.md`.

## 4. Testing expectations (Task 3 from template)
Run and capture terminal output for:
1. `npm install` (if node_modules missing) – only once per session.
2. `npm run lint` – ensure HTML/JS style still passes.
3. `npm run test:ui` (or equivalent smoke test script; document the exact command used).
4. Manual verifications:
   - Toggle each chrome module (progress, tap zones, action bar, footer, MLPUM) in both cartridges.
   - Trigger the new MLPUM batch restore flow.
   - Confirm gesture tutorial cue appears once per activation.
   - Validate footer auto-hide at multiple viewport heights/mobile safe areas.
   - Check the persistence panel reflects provider/folder/cartridge changes without URL overrides.
Record outcomes in the PR body.

## 5. Commit & PR packaging
- Follow Tasks 4–7 in `mergeable-pr-task.md`.
- Commit message: `Implement next ui-v8 module stack` (unless scope changes).
- PR title: `Core-first UI – ui-v8 next stack`.
- PR body:
  - Summary bullets referencing each completed target (cite files inline).
  - Testing block listing the commands + manual checks above with ✅/⚠️/❌ prefixes.
  - Close with “Merge when ready – no follow-up required.”

## 6. Handoff notes for the tester
- The tester only needs to open the PR, review screenshots/video/gifs if provided, and merge once the banner says “This branch has no conflicts.”
- If conflicts ever appear, Codex repeats this checklist from Step 1.

---

End of copy/paste block.
