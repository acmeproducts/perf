<!-- UI-V2-PLAN v1.3.0 -->
# UI-V2 MASTER PLAN v1.3.0

**Owner:** acmeproducts — sole product decision-maker/device-gate authority.  
**Builder:** ChatGPT/Codex when authorized.  
**Production application:** `ui-v2.html`  
**Integrated candidate:** `ui-v2-candidate.html`  
**Harness:** `ui-v2-harness.html`  
**Graveyard:** `UI-V2-GRAVEYARD.md`.

**Every UI-V2 turn starts here + graveyard and ends by updating this file. Conversation is not project state.**

---

## 1 · EXECUTION MODEL — ONE CANDIDATE, INTERNAL GATES

Owner ruling 2026-08-13: **the owner will not test eight releases.** The prior R0–R8 owner-facing release chain is retired.

There is one integrated candidate built from the approved clean baseline `a6de049f8c8b9798c610984b35b9d8ade57d0fa5`.

### Working files

- `ui-v2.html` — production; do not replace until final owner device gate passes.
- `ui-v2-candidate.html` — integrated candidate rebuilt from the approved baseline; all authorized feature work accumulates here.
- `ui-v2-harness.html` — requirement harness. It reports every internal gate and blocks promotion when a required gate is red.

### Internal integration gates

These are **not releases** and do not require owner testing one by one. They are engineering gates inside the same candidate.

| Gate | Scope | Required evidence before integration may continue |
|---|---|---|
| H0 | Baseline integrity | provider/app startup; Sort; Focus; Grid; footer switcher; no fatal loop; baseline SHA recorded |
| H1 | Thumbnail/performance | shared service; instrumentation; first-paint/fill/request/cache/refetch metrics; zero avoidable movement refetch; Drive recovery path |
| H2 | Inspection/Focus chrome | actual Focus controls canonical; Explore sphere→medium→large; Table thumbnail→medium→large; prev/next; exact X hierarchy; no duplicate controls |
| H3 | Folder tag targets | exactly 3 folder-specific configurable tag targets; shared Explore/Table; long-press rename; drag/persist; stack-independent |
| H4 | Grid round-trip | tag→filtered Grid; stack→Grid; origin object; return to exact surface/stack/reconciled file after no-op/delete/move/tag/bulk |
| H5 | Table curation physics | current-stack scatter; thumbnail + medium fling-to-tag; actual Sort trail; target/rim/bank/vacuum/capture retained; image-image collisions absent |
| H6 | Resume integrity | surface/folder/stack/file/inspection/Grid origin restored after visibility/idle/auth refresh; provider refresh does not reset navigation |
| H7 | Sort desktop fit | pills shorter on desktop; trash clears footer; Sort symmetry and gestures unchanged |
| H8 | Integrated regression | all H0–H7 green together; desktop + touch; Google Drive; OneDrive smoke where available; published candidate identity matches repository exactly |

**Only H8 produces an owner-facing test candidate.** Internal gates may be executed repeatedly without publishing separate owner releases.

### Promotion rule

1. Build only in `ui-v2-candidate.html` from the approved clean baseline.
2. Run the harness after every coherent internal integration.
3. A red required gate stops further integration until corrected from the same clean candidate lineage; do not patch a damaged unknown snapshot.
4. When H0–H8 are green, publish/verify `ui-v2-candidate.html` and provide one cache-busted candidate URL.
5. Owner performs the device/UX gate once on the integrated candidate.
6. On PASS, copy the **exact verified candidate** to `ui-v2.html`; no additional functional edits during promotion.
7. Verify production artifact and provide production URL.

Green automation means **candidate eligible for owner testing**, not production approval.

---

## 2 · APPROVED CLEAN BASELINE

`a6de049f8c8b9798c610984b35b9d8ade57d0fa5` — **Implement quick horizontal view switcher**.

Why this baseline:
- application commit changes `ui-v2.html` directly and implements the approved lightweight horizontal footer-triggered view switcher;
- predates later workflow-carried patch experiments and append-only runtime overrides;
- contains provider, Sort, Focus, Grid, Explore, Table and view-state foundations;
- contains the actual Sort comet-trail implementation that must be reused;
- contains existing TagService/file tags and provider/storage infrastructure.

### Donor history — evidence only

- `7c1ac453...` — thumbnail caching/Table donor evidence; never restore wholesale.
- `a8c6917f...` — shared cache/physics donor evidence; never restore wholesale.
- later v1.4–v1.10 attempts are requirements/failure evidence only unless a specific implementation is independently audited and intentionally reused.

---

## 3 · FINAL CURATION CONTRACT

### Canonical Focus chrome

Focus owns the canonical chrome used by Focus and by Explore/Table inspection states:
- top-left stack selector;
- top-right Details;
- bottom-left image # / total;
- bottom-center actual Focus favorite/heart;
- bottom-right actual Focus trash.

No fake or duplicate surface-specific behavioral controls.

### Explore

**Sphere:** shared fast thumbnails; no tag targets; sphere remains navigable/zoomable; tap thumbnail → Medium.

**Medium:** actual Focus chrome + previous/next + exactly 3 current-folder tag targets + fling-to-tag using the actual Sort comet trail + target tap→tag-filtered Grid. Medium X → Sphere at the preserved location/selection.

Tap Medium image → Large.

**Large:** essentially Focus — previous/next, stack selector, Details, favorite, trash. No tag fling required. X is clear of Details and returns Large → Medium.

Exact state path: `Sphere → Medium → Large`; reverse: `Large X → Medium`, `Medium X → Sphere`.

### Table

- Opens on the current stack; stack selector switches working stacks.
- Current-stack thumbnails are scattered across the table.
- Exactly 3 current-folder tag targets are visible, draggable and persistent.
- Thumbnail mode permits direct fling-to-tag.
- Tap thumbnail → Medium; Medium uses Focus chrome/prev-next/three tags/fling.
- Tap Medium → Large; Large behaves as Focus; X hierarchy `Large → Medium → Table`.
- Keep momentum, bank, rim/corner, vacuum/capture and capture animation.
- Remove only image-to-image collisions.
- Reuse the actual Sort comet trail implementation.

### Folder tag targets

The three curation targets are **tags, not stacks**.
- long-press target to rename;
- target names persist per folder;
- target positions persist per folder;
- same folder definitions are shared by Explore and Table;
- switching stacks does not redefine the folder tags;
- YES/MAYBE/NO may be defaults only, never immutable architecture.

### Grid round-trip

Tag target → normal Grid with the tag applied as an implicit filter.

Canonical stack selector → Grid for the selected/current stack.

Grid records at minimum `{surface, folder, stack, fileId, tag, inspectionLevel}`. Exit returns to exact originating Focus/Explore/Table surface and reconciles against current data by file identity after delete/move/tag/bulk changes; never restore only a stale numeric index.

### Shared thumbnail/performance architecture

- one reusable thumbnail service/cache for matching renditions across Sort/Grid/Focus/Explore/Table;
- visible/near-visible first;
- durable persistence must not block first useful paint;
- moving/repositioning sphere/Table items must not refetch/recreate unchanged thumbnails;
- Google Drive temporary/expired URLs recover by file identity without losing visible/navigation state;
- instrument first useful paint, Explore visible fill, Table visible fill, provider requests, cache hits/misses, movement refetches and image recreation/redecode where measurable;
- record before/after numbers against the clean baseline.

### Resume

Persist/reconcile active surface, folder, stack, file, inspection level and Grid origin. Authentication/provider refresh must not reset to folder selection then jump to a remembered image.

### Sort desktop fit

Only reduce desktop pill height and move bottom trash clear of the footer. Preserve established Sort symmetry and interaction behavior.

---

## 4 · REQUIREMENTS AUDIT — CLEAN BASELINE `a6de049`

Static source audit 2026-08-13. This records baseline gaps; it does not lower final requirements.

| # | Final requirement | Baseline finding | Status | Harness/remediation |
|---|---|---|---|---|
| A1 | Focus chrome canonical across Focus, Explore inspection, Table | Explore/Table define separate controls | FAIL | H2 verifies actual Focus elements own behavior; duplicate surface control ownership absent |
| A2 | Exactly 3 configurable Table tag targets | Table has 4 stack destinations KEEP/TRASH/INBOX/MAYBE | FAIL | H3 verifies exactly 3 target definitions backed by folder tags, not stack IDs |
| A3 | Long-press rename | Absent | FAIL | H3 pointer/touch long-press rename + cancel/commit + drag discrimination |
| A4 | Folder-specific tags shared Explore/Table | File TagService exists; three-target folder configuration absent | PARTIAL | H3 folder-keyed persistence and cross-surface equality tests |
| A5 | Table current stack + selector switching | current-stack handoff exists; canonical selector absent | PARTIAL | H2/H3 current-stack open + selector switch without altering tags |
| A6 | Explore sphere→medium→large | required hierarchy absent | FAIL | H2 state transition assertions and exact X return tests |
| A7 | Explore tags activate only at medium | baseline has stack destinations on sphere | FAIL/OPPOSITE | H2/H3 assert zero sphere targets and exactly 3 medium targets |
| A8 | Table fling-to-tag thumbnail + medium | thumbnail stack sorting exists, tag semantics/medium absent | PARTIAL | H3/H5 tag-once tests in both states |
| A9 | Medium prev/next | absent | FAIL | H2 uses Focus navigation semantics and file-ID reconciliation |
| A10 | Large behaves as Focus | absent | FAIL | H2 chrome/action/navigation parity tests |
| A11 | Tag target→filtered Grid | absent | FAIL | H4 filter/origin/return tests |
| A12 | Stack selector→Grid | absent | FAIL | H4 current-stack Grid entry tests |
| A13 | Grid exact origin return | partial ModeNavigation foundation only | PARTIAL | H4 origin object + no-op/delete/move/tag/bulk reconciliation tests |
| A14 | Shared cache + measurements | Explore/Table share `ExploreThumbnailCache`; other surfaces differ; no required metrics | PARTIAL | H1 metrics + all-surface service assertions |
| A15 | Drive expiry recovery | URL/fallback foundations exist; expiry recovery unproven | PARTIAL/FAIL | H1 controlled stale-URL/error instrumentation and re-resolve-by-file-ID test |
| A16 | Idle restoration | provider/folder/stack/file/Focus partial persistence exists | PARTIAL | H6 all-surface/inspection/Grid-origin restore tests |
| A17 | Sort desktop pill/footer | 12px vertical padding/18px type; trash bottom 20px | FAIL | H7 geometry + regression assertions |
| A18 | Rejected directions documented | Graveyard contains hard vetoes | PASS | H8 checks forbidden implementation markers/structures where automatable |

---

## 5 · HARNESS DESIGN

`ui-v2-harness.html` is the single test dashboard for the candidate.

### Harness layers

**Static/source contract checks**
- candidate version/build identity;
- no forbidden runtime stabilization/patch markers;
- no Explore sphere tag destinations;
- exactly three folder tag target definitions;
- canonical Focus-control references;
- Sort comet implementation reused, not duplicated cosmetically;
- no image-image collision resolver in active Table path;
- required Grid origin fields and persistence fields present.

**Browser structural/behavior checks**
- load candidate in same-origin iframe;
- startup exception capture;
- surface state transitions that can run without provider mutation;
- DOM count/visibility/ownership checks;
- geometry checks such as large X vs Details and Sort trash vs footer;
- state/persistence serialization checks.

**Instrumented runtime checks**
- thumbnail metrics exported by candidate test instrumentation;
- provider request/cache/refetch counters;
- Explore/Table fill timing;
- movement refetch count;
- Drive URL failure/recovery events;
- resume/reconciliation events.

**Manual/device-only gates**
Some behavior cannot be honestly proven by static automation: real Google Drive expiry after idle, touch feel, physics feel, auth refresh, and final cross-device UX. The harness lists these as explicit manual gates rather than pretending they passed.

### Harness result semantics

- `PASS` — evidence captured.
- `FAIL` — requirement violated; blocks candidate.
- `MANUAL` — requires owner/device/provider gate; does not masquerade as automated PASS.
- `NOT IMPLEMENTED` — candidate work incomplete; blocks candidate.

H8 becomes eligible only when every automatable required item is PASS and the only remaining items are explicitly marked final manual/device gates.

---

## 6 · OPEN ITEMS

| # | Item | Status |
|---|---|---|
| O1 | Clean baseline | APPROVED INPUT `a6de049f8c8b9798c610984b35b9d8ade57d0fa5` |
| O2 | Integrated candidate | BUILD IN `ui-v2-candidate.html`; production untouched until owner PASS |
| O3 | Harness | BUILD/MAINTAIN `ui-v2-harness.html`; H0–H8 single dashboard |
| O4 | Default tag names | OPEN presentation choice; may default YES/MAYBE/NO but architecture is configurable folder tags |
| O5 | Tag persistence schema | use existing storage conventions; must be folder-keyed and shared Explore/Table |
| O6 | Long-press rename appearance | minimal existing UI convention; behavior more important than ornamental design |
| O7 | Stack-selector Grid affordance | minimal extension of canonical selector; no parallel selector |
| O8 | Exact prev/next affordance | reuse current Focus semantics |
| O9 | Performance baseline numbers | MUST be captured by H1 before claiming improvement |
| O10 | Drive expiry reproduction | instrument/reproduce; do not guess cause |
| O11 | Device matrix | desktop Chrome + touch/mobile minimum; real Google Drive; OneDrive smoke where available |
| O12 | Video | DEFERRED after image curation |
| O13 | AI/Venice modes | DEFERRED separate mode family |

---

## 7 · IMMUTABLE WORKING RULES

1. Start every turn by reading plan + graveyard; end every turn by updating plan.
2. Authority: current owner ruling → graveyard → this plan → approved baseline → audited donor → reference docs → chat history.
3. On failure: **stop → clean approved input → graveyard → plan → rebuild → harness → publish candidate → verify → owner device gate. Never patch forward.**
4. Unknown cause: instrument first; never declare root cause from reasoning alone.
5. Verify, do not infer. Repository/Actions success does not prove live behavior.
6. Reuse actual proven controls/handlers/trails/cache patterns; no lookalikes.
7. Current authorization: build harness + integrated candidate. Production `ui-v2.html` promotion requires successful candidate gate; no unrelated writes.
8. One owner-facing candidate. Internal H0–H8 are engineering gates, not owner releases.
9. Version identity is static in shipped candidate/production HTML/footer and verified live.
10. Every build requiring owner testing gets a cache-busted test URL automatically.
11. No stubs, fake controls or fake pass results. Harness may use deterministic test fixtures only when explicitly isolated from production/provider data and labeled as harness fixtures.
12. Do not modify provider flows, Sort symmetry, Focus core, Grid core, footer navigation or metadata semantics except where the final contract explicitly requires integration.
13. `ui-v2.html` remains untouched while candidate is under construction. Promotion copies the exact verified candidate; no last-minute functional edits.

---

## 8 · GRAVEYARD VETO SUMMARY

Never reuse without explicit owner revival: workflow-embedded app payloads; forward patching damaged snapshots; broad MutationObserver stabilization; fake Focus chrome; Inbox/Maybe-only Table; immutable YES/MAYBE/NO stacks; Explore tag targets on sphere; image-image Table collisions; per-surface thumbnail caches; deployment inference without live verification.

Full log: `UI-V2-GRAVEYARD.md`.

---

## 9 · TURN LEDGER

### 2026-08-12 · Release/governance recovery
Owner required an executable plan; baseline history was audited and `a6de049` selected as clean candidate input. Graveyard established failed approaches and no-patch-forward discipline.

### 2026-08-13 · Final-requirements audit
Audited clean baseline against A1–A18. Most final curation requirements are absent or precursor behavior; reusable foundations include actual Focus chrome, ModeNavigation/current-stack handoff, TagService, Grid, actual Sort comet trail and partial persistence. Performance remains unmeasured.

### 2026-08-13 · Harness/integrated-candidate ruling
**Owner ruling:** owner will not test eight releases; create a harness that tests each requirement group and integrate all work into one candidate for testing.  
**Decision:** retire R0–R8 as owner-facing releases. Adopt H0–H8 internal gates and one `ui-v2-candidate.html`. Production `ui-v2.html` remains untouched until the integrated candidate passes automated gates and owner device gate.  
**Work authorized:** create/maintain harness and build integrated candidate from `a6de049`.  
**Next action:** instantiate candidate from the clean baseline, create harness, run H0, then integrate requirements behind H1–H7; publish only when H8 is candidate-eligible.

---

## 10 · CHANGE LOG

**v1.3.0 · 2026-08-13.** Replaced eight owner-facing releases with one integrated candidate plus H0–H8 internal harness gates. Defined candidate/harness files, promotion rule, harness layers/result semantics, and production immutability during candidate construction.

**v1.2.0 · 2026-08-13.** Published item-by-item audit of clean baseline against all final requirements.

**v1.1.x · 2026-08-12.** Baseline history audit and initial release chain.

**v1.0.x · 2026-08-12.** Governance, graveyard and recovered requirements established.
