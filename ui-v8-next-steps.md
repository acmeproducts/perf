# ui-v8 Next-Step Assessment

## Current snapshot
`ui-v8.html` already carries the consolidated gesture skeleton, Chrome module registry, canonical action logging, and contextual recycle (MLPUM) overlay. The file binds progress/tap/action/footer modules through `ChromeModules.apply`, routes stack changes through `ActionRecorder` + `CanonicalActionRegistry`, and relies on `state.stacks.delete` for the recycle preview grid.

Key structural pieces:
1. **Screen stack:** Multiple `.app-screen` elements (provider auth, folder picker, app container) rely on the `screen` class and `hidden` flag.
2. **Chrome modules:** `progressBar`, `tapZones`, `actionBar`, `footer`, and `mlpum` nodes managed by `ChromeModules` with feature toggles per cartridge.
3. **Gesture/stack engines:** `Core.navigateImage`, `Core.moveToStack`, and `ActionRecorder.record` enforce canonical action codes.
4. **Contextual recycle:** `MLPUModule` exposes deleted items via `#mlpum-overlay` and `#mlpum-recycle-grid`, replacing inline undo.
5. **Grid/drag mode:** Grid drag handles are removed; pointer cues and threshold logic drive reordering.

## Next-version goals
1. **Chrome module polish**
   - Expose per-cartridge defaults through a shared config block so toggling modules no longer depends on scattered literals.
   - Add telemetry to `ChromeModules.apply` that records which modules are active per session.
2. **Recycle experience v2**
   - Extend `MLPUModule.renderRecycleBin` to support batch restore + provider recycle-bin launch, keeping inline documentation inside `ui-v8.html` per the release plan.
3. **Focus and gesture parity**
   - Audit tap-zone bindings to ensure cartridges that override labels still inherit `CanonicalActionRegistry.codes`.
   - Provide a visual tutorial pulse when a new cartridge activates (ties into the immutable gesture skeleton rule).
4. **Footer discipline follow-through**
   - Use the safe-area measurements (`--safe-area-bottom`) to cap footer height and auto-hide when the chrome budget is exceeded.
   - Ensure `ChromeModules.toggleFooter` reacts to cartridge persistence so switching folders replays the stored preference.
5. **Persistence hardening**
   - Double-check that `CartridgeManager` reads/writes storage outside the URL, honoring manual `?cartridge=` overrides but defaulting to folder-level memory.
   - Log persistence events via `ActionRecorder` for QA verification (baseline vs paradigm parity).

## Concrete task stack
1. **Module defaults + telemetry** – normalize `CORE_MODULE_DEFAULTS`, add structured logging, and document any cartridge overrides inline.
2. **MLPUM batch restore prototype** – add select/restore controls inside the overlay and update `Core.updateUserMetadata` calls accordingly.
3. **Gesture tutorial cues** – implement transient hints tied to the canonical action dictionary.
4. **Footer auto-hide** – calculate available vertical space and toggle a `footer-auto-hidden` class when the height guardrail trips.
5. **Persistence smoke test harness** – add a simple dev-only panel that surfaces the current cartridge/folder/provider association for QA.

Each task can be implemented as an incremental PR that updates `ui-v8.html` plus any helper scripts, keeping inline inventory comments up to date and preventing the tester from dealing with conflicts.
