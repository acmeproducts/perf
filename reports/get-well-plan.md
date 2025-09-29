# Orbital8 Recovery Plan (v9* and v2* Branches)

## 1. Objectives
- Establish a single "get well" baseline that keeps the mature sync and offline infrastructure from the v9* lineage while backfilling the stronger metadata/search ergonomics delivered in the v2* builds.
- Define a release-by-release path that can be executed manually (no Python tooling required) with copyable prompts and explicit test checklists so future threads can advance the plan without losing fidelity.
- Document the specific code touch-points in `ui-v9b.html` and `ui-v2.html` that motivate each step, enabling disciplined cherry-picking when we assemble the eventual `ui-v11` pilot.

## 2. Current Capabilities Snapshot
### 2.1 Strengths to Preserve from v9*
- **IndexedDB scaffolding already tracks manifests and folder state.** `ui-v9b.html` upgrades the database to version 4 and provisions `folderCache`, `metadata`, `syncQueue`, `folderState`, and `folderManifests` stores so we can resume background syncs without schema churn.【F:ui-v9b.html†L1900-L2213】
- **OneDrive metadata upsert flow is implemented.** The provider class performs a read/merge/PUT cycle against `approot` JSON blobs, giving us a working path to persist ratings, stacks, and tags back to Microsoft Graph.【F:ui-v9b.html†L2975-L3005】
- **Focus-mode gesture shell is in place.** The double-hub layout, pill counters, and large focus controls have already been wired for flick/tap flows, so gesture regressions are unlikely when we iterate on UI polish.【F:ui-v9b.html†L744-L808】

### 2.2 Gaps in v9*
- **Footer still shows a placeholder.** Every screen renders `<div class="app-footer">Synch</div>` instead of the required `<footer id="master-footer">` metadata block, so compliance work is outstanding.【F:ui-v9b.html†L462-L812】
- **Search text misses structured metadata breadth.** v9* stringifies the metadata object but lacks the recursive tokenization that v2* uses, so modifiers only land when the JSON happens to contain plain text matches.【F:ui-v9b.html†L5036-L5066】
- **Focus favorite tap target is oversized.** The current button keeps the 84px circular touch area; we still need to collapse it to the bare-heart control mandated in the checklist.【F:ui-v9b.html†L521-L542】

### 2.3 Strengths to Cherry-Pick from v2*
- **Recursive metadata tokenization for search.** v2* walks every nested value (including keys) to build a normalized search index, which is the fidelity we need for the 10-point scoring rubric.【F:ui-v2.html†L3168-L3244】
- **PNG metadata extractor already available.** The v2* `MetadataExtractor` handles partial PNG chunks and distinguishes Google Drive vs. OneDrive fetches, so we can reuse it when wiring permanent URLs and background workers.【F:ui-v2.html†L1813-L1879】
- **UX affordances for ratings and cues are battle-tested.** Visual and haptic managers persist intensity settings and vibration profiles across sessions, reinforcing the detail polish expected for the top-10 baseline.【F:ui-v2.html†L1769-L1812】

### 2.4 Gaps in v2*
- **Sync plumbing is mostly stubbed.** The IndexedDB schema stops at version 2 and the queue/worker classes are placeholders, so we cannot rely on v2* for cloud reconciliation without porting the v9* infrastructure.【F:ui-v2.html†L1683-L1766】
- **Footer and permanent-link work still missing.** Just like v9*, the footer is the static "Synch" div and exports still depend on transient links, so compliance tasks remain even after we merge branches.【F:ui-v2.html†L462-L812】

## 3. Release Roadmap
Each release below assumes `ui-v9b.html` is the working baseline. Apply changes to `ui-v9b.html` first, then reconcile `ui-v2.html` so both flagship branches stay in lockstep for evaluation. Every step lists a copy-ready prompt and a matching manual test checklist so a new session can execute without additional context.

### Release 1 — "Baseline Convergence"
**Goal:** Align shared infrastructure and eliminate obvious compliance blockers (footer metadata, shared helper modules) while preserving v9* sync advantages.

**Implementation Prompt**
```
Working file(s): ui-v9b.html, ui-v2.html
1. Replace every <div class="app-footer"> instance with a single <footer id="master-footer"> block that includes release name, timestamp, "View Sync Log", and "Reset from Cloud" links. Keep the markup identical across all screens.
2. Mirror the footer metadata with the top-of-file release comment (timestamp + change summary) in both files.
3. Extract the shared footer markup into a template string helper so modal renders stay DRY.
4. Copy the DBManager upgrades from ui-v9b into ui-v2 (stores, queue helpers, folder state/manifest accessors) so both builds share the same IndexedDB schema.
5. Document the new baseline metadata in a release notes comment at the top of each file.
```

**Test Checklist**
- Load each screen (provider, auth, folder picker, loading, app container) and confirm the footer shows the synchronized release metadata and working links.
- Disconnect/reconnect providers to ensure the shared DB schema still initializes without version errors.
- Verify cached folder data persists across reloads in both builds (confirm IndexedDB `folderManifests` entries exist).

### Release 2 — "Search & Metadata Fidelity"
**Goal:** Bring the exhaustive v2* search behavior and PNG metadata extraction into the v9* baseline so filters, tags, and notes score correctly.

**Implementation Prompt**
```
Working file(s): ui-v9b.html, ui-v2.html
1. Port the collectMetadataTokens/buildSearchIndex helpers from ui-v2 into ui-v9b and update searchImages to rely on the cached normalized tokens before modifiers/inclusions/exclusions run.
2. Ensure createdTime and modifiedTime ISO strings are appended to the token list so date-range queries match.
3. Share the MetadataExtractor implementation between branches and confirm fetch paths use permanent thumbnails/original URLs when available.
4. Normalize tag chip rendering so assigned tags appear immediately in both detail and bulk editors after search-driven updates.
5. Add regression notes to the top-of-file comment summarizing the search/tokenization changes.
```

**Test Checklist**
- Tag an image, open grid search, and confirm `#tag` modifiers filter correctly in both builds.
- Search for partial metadata keywords (e.g., model name from PNG metadata) and confirm results display with the blue selection outline intact.
- Toggle between created/modified date queries (`2024-` prefix) and ensure both fields participate in matching.
- Run the metadata extractor against a PNG and verify the parsed values populate the detail panel without console errors.

### Release 3 — "UI Polish & Interaction Guardrails"
**Goal:** Satisfy the detailed UI checklist (focus favorite control, pill counters, selection persistence) while keeping gesture flows stable.

**Implementation Prompt**
```
Working file(s): ui-v9b.html, ui-v2.html
1. Replace the focus favorite button container with the minimal heart icon target, keeping the same keyboard focus handling but shrinking padding per spec.
2. Update CSS for .tag-input to render black text across detail/bulk editors outside modal overrides.
3. Confirm selection pills retain the blue outline state after search or stack switches and fix any regressions discovered.
4. Add unitless helpers that keep grid/stage ordering synchronized when modifiers or search pills are active.
5. Refresh release header comments describing the UI adjustments.
```

**Test Checklist**
- Enter focus mode and confirm the heart icon is the only tap target; toggle favorite status and ensure metadata updates persist after reload.
- Create/remove tags in both detail and bulk editors and verify text color stays black with consistent chips.
- Use search filters and confirm the selected image retains the blue outline in grid mode even after stack toggles.
- Flick through stacks to ensure pill counters update without regressions.

### Release 4 — "Sync & Export Completion"
**Goal:** Finish the long-haul sync and export requirements so the combined baseline can graduate to the `ui-v11` build document.

**Implementation Prompt**
```
Working file(s): ui-v9b.html, ui-v2.html
1. Wire the sync queue processing from ui-v9b into a background worker that debounces metadata batching (~750ms) and marks pending flush entries before committing.
2. Implement manifest version guards so each flush increments the cloud version prior to persisting manifests.
3. Replace export log panels with running success/failed counters fed by in-memory state.
4. Emit toast + console diagnostics when SyncDiagnostics is invoked, exposing the JSON report through a footer link.
5. Update release headers with the completed sync/export milestone and document remaining known gaps.
```

**Test Checklist**
- Edit metadata rapidly and confirm the queue batches changes (inspect IndexedDB `syncQueue` timestamps) before sending network calls.
- Trigger a manual flush and validate manifests record incremented cloud versions in `folderManifests`.
- Run an export and verify the modal shows live counters without scrolling logs; inspect the CSV for permanent URLs.
- Invoke the diagnostics link from the footer and confirm the JSON payload appears without developer tools.

## 4. Acceptance Criteria for the Plan
The roadmap is considered successful when:
1. `ui-v9b.html` and `ui-v2.html` share identical footer metadata, search/token helpers, and sync schemas.
2. Manual tests for each release pass without needing automation.
3. The combined branch is ready for a dedicated `build-v11.md` that references these releases as prerequisites.

## 5. Next Deliverables
- Execute Release 1 in a dedicated change set and capture evidence (screenshots/checklists) so the baseline is trustworthy.
- After Release 4, author `build-v11.md` with the consolidated prompts/tests as executable instructions for the pilot build.

