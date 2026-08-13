<!-- UI-V2-PLAN v1.3.2 -->
# UI-V2 MASTER PLAN v1.3.2

**Owner:** acmeproducts — sole product decision-maker/device-gate authority.  
**Builder:** ChatGPT/Codex when authorized.  
**Production:** `ui-v2.html`  
**Integrated candidate:** `ui-v2-candidate.html`  
**Harness:** `ui-v2-harness.html`  
**Candidate manifest:** `ui-v2-candidate-manifest.json`  
**Detailed requirements audit:** `UI-V2-REQUIREMENTS-AUDIT-2026-08-13.md`  
**Graveyard:** `UI-V2-GRAVEYARD.md`

**Every UI-V2 turn starts by reading this plan + graveyard and ends by updating this plan. Conversation is not project state.**

---

## 1 · EXECUTION MODEL — ONE OWNER-FACING CANDIDATE

Owner ruling 2026-08-13: **do not create eight owner-tested releases.** Build one integrated candidate and use an internal harness to gate each requirement group.

Approved clean input: `a6de049f8c8b9798c610984b35b9d8ade57d0fa5`.

- `ui-v2.html` stays production and is not modified during candidate construction.
- `ui-v2-candidate.html` is instantiated from the exact clean baseline blob and is the only integration target.
- `ui-v2-harness.html` evaluates requirement contracts and exposes explicit PASS / TODO / FAIL / MANUAL results.
- `ui-v2-candidate-manifest.json` records candidate lineage independently of runtime code.
- Internal harness gates are engineering checkpoints, not releases.
- Only the fully integrated candidate is presented to the owner for one device/UX gate.
- On owner PASS, the exact verified candidate is promoted to `ui-v2.html` with no additional functional edits.

### Internal gates

| Gate | Scope | Required evidence |
|---|---|---|
| H0 | Baseline integrity | correct lineage; startup/provider smoke; Sort/Focus/Grid/footer switcher; no fatal loop |
| H1 | Thumbnail/performance | shared service; instrumentation; first-paint/fill/request/cache/refetch metrics; Drive recovery |
| H2 | Inspection/Focus chrome | actual Focus controls canonical; Explore sphere→medium→large; Table thumbnail→medium→large; prev/next; exact X hierarchy |
| H3 | Folder tags | exactly 3 configurable folder tags; shared Explore/Table; long-press rename; drag/persist; stack-independent |
| H4 | Grid round-trip | tag→filtered Grid; stack→Grid; origin context; exact reconciled return after no-op/delete/move/tag/bulk |
| H5 | Table curation | current-stack scatter; thumbnail+medium fling; actual Sort trails; target effects retained; image-image collisions absent |
| H6 | Resume | surface/folder/stack/file/inspection/Grid origin restored after idle/auth refresh |
| H7 | Sort desktop fit | pills shorter; trash clears footer; symmetry/gestures unchanged |
| H8 | Integrated regression | H0–H7 green together; published candidate verified; desktop+touch/provider manual gates explicit |

**H8 is the only owner-facing release gate.**

---

## 2 · CURRENT EXECUTION STATE

### Completed

1. Retired the eight owner-facing release sequence.
2. Created `ui-v2-harness.html` as the single requirements dashboard.
3. Instantiated `ui-v2-candidate.html` from the exact clean baseline blob from `a6de049`, not current production and not a later damaged snapshot.
4. Created `ui-v2-candidate-manifest.json` recording baseline commit/blob and integration status.
5. Published the item-by-item A1-A18 audit as `UI-V2-REQUIREMENTS-AUDIT-2026-08-13.md`.
6. Production `ui-v2.html` was not modified by the audit turn.

### Current status

**Candidate is NOT owner-testable yet.** It is still in integration. The clean baseline audit is PASS 1; PARTIAL/PARTIAL-FAIL 6; FAIL/FAIL-OPPOSITE 11. These are baseline findings, not claims about completed candidate behavior.

### Next internal execution

Integrate H1–H7 into `ui-v2-candidate.html`, running the harness after each coherent integration. Do not publish separate owner releases. Stop on failed internal gates. When automatable H0–H8 requirements are green, verify Pages and provide one candidate URL for the owner device gate.

---

## 3 · FINAL CURATION CONTRACT

### A1 — Canonical Focus chrome
Focus is canonical across Focus and Explore/Table inspection: top-left stack selector; top-right Details; bottom-left image #/total; bottom-center actual Focus heart; bottom-right actual Focus trash. No fake duplicate behavioral controls.

### A2–A4 — Three folder tag targets
Exactly three active targets. They are configurable **tags**, not stacks. Long-press renames. Names and positions persist per folder and are shared by Explore/Table in the same folder. Switching stacks does not redefine them. YES/MAYBE/NO may be defaults only.

### A5 — Table current stack
Table opens on the current stack. Canonical stack selector switches stacks without altering folder tag definitions.

### A6–A7 — Explore state model
Sphere has no tag targets. Tap sphere thumbnail → Medium. Medium enables Focus chrome, prev/next, exactly three folder tags and fling-to-tag. Medium X → Sphere. Tap Medium image → Large. Large behaves essentially as Focus; X clear of Details; Large X → Medium.

### A8–A10 — Table inspection
Table thumbnail can fling directly to tag. Tap thumbnail → Medium. Medium uses Focus chrome, prev/next, three tags and fling. Tap Medium → Large. Large behaves as Focus. X hierarchy: Large → Medium → Table.

### A11–A13 — Grid integration
Tag target → normal Grid with implicit tag filter. Stack selector → Grid for current stack. Grid origin includes at minimum `{surface, folder, stack, fileId, tag, inspectionLevel}`. Exit returns to exact originating Focus/Explore/Table context and reconciles by file identity after no-op/delete/move/tag/bulk changes.

### A14 — Shared thumbnail/cache architecture
One reusable thumbnail service/cache for matching renditions across Sort/Grid/Focus/Explore/Table. Visible/near-visible first. Durable persistence does not block first useful paint. Moving sphere/Table items does not recreate/refetch unchanged thumbnails. Instrument first useful paint, Explore fill, Table fill, provider requests, cache hits/misses, movement refetches and image recreation/redecode where measurable.

### A15 — Google Drive idle/expired thumbnail recovery
On expired/failed Drive thumbnail URL, re-resolve by file identity and recover without destroying visible image/navigation state. Prove with instrumentation + real idle/device gate.

### A16 — Resume integrity
Persist/reconcile active surface, folder, stack, file, inspection level and Grid origin. Background/auth/provider refresh must not reset to folder selection and later jump to an image.

### A17 — Sort desktop fit
Reduce desktop pill height. Raise bottom trash clear of footer/safe area. Preserve established Sort symmetry and gestures.

### A18 — Rejected directions
Graveyard veto remains authoritative: no forward patching damaged snapshots; no workflow-embedded app payloads; no MutationObserver stabilization; no fake Focus chrome; no Inbox/Maybe-only Table; no immutable YES/MAYBE/NO architecture; no Explore sphere tag targets; no image-image Table collisions; no per-surface thumbnail caches; no deployment claims without live verification.

---

## 4 · CLEAN BASELINE AUDIT

Baseline `a6de049` findings:

| Requirement | Baseline | Remediation gate |
|---|---|---|
| A1 Focus canonical | FAIL — Explore/Table own separate controls | H2 |
| A2 three configurable tag targets | FAIL — four hard-coded stack destinations | H3 |
| A3 long-press rename | FAIL | H3 |
| A4 folder-specific shared tags | PARTIAL — TagService exists, target config absent | H3 |
| A5 Table current stack | PARTIAL — handoff exists, canonical selector absent | H2/H3 |
| A6 Explore 3-state hierarchy | FAIL | H2 |
| A7 Explore tags only at medium | FAIL/OPPOSITE — sphere has destinations | H2/H3 |
| A8 Table thumbnail+medium tag fling | PARTIAL — thumbnail stack sorting only | H3/H5 |
| A9 medium prev/next | FAIL | H2 |
| A10 large behaves as Focus | FAIL | H2 |
| A11 tag→filtered Grid | FAIL | H4 |
| A12 stack selector→Grid | FAIL | H4 |
| A13 exact Grid origin return | PARTIAL foundation only | H4 |
| A14 shared cache + measurements | PARTIAL — Explore/Table precursor cache; no required all-surface metrics | H1 |
| A15 Drive expiry recovery | PARTIAL/FAIL — foundation exists; recovery unproven | H1 |
| A16 idle restoration | PARTIAL — provider/folder/stack/file/Focus only | H6 |
| A17 Sort desktop fit | FAIL — pills too tall; trash too low | H7 |
| A18 graveyard/rejected directions | PASS | H8 regression veto checks |

**Detailed findings and remediation instructions:** `UI-V2-REQUIREMENTS-AUDIT-2026-08-13.md`.

Reusable foundations: actual Focus chrome; ModeNavigation/current-stack handoff; TagService/file tags; Grid; actual Sort comet trail; partial persistence/provider infrastructure.

Do not treat precursor Explore sphere destinations, Table four-stack destinations, or separate Explore/Table chrome as final architecture.

---

## 5 · HARNESS DISCIPLINE

Harness result semantics:
- **PASS** — automatable evidence captured.
- **TODO** — final requirement not integrated; blocks candidate.
- **FAIL** — regression/test failure; blocks candidate.
- **MANUAL** — real provider/device/UX behavior that cannot honestly be automated; remains explicit until final owner gate.

Harness must cover static/source contracts, browser structure/geometry, state transitions, persistence serialization and runtime instrumentation. Real Drive expiry, auth refresh, touch feel and final physics/UX remain manual gates.

No fake data may be presented as production proof. Deterministic harness fixtures are allowed only when isolated and explicitly labeled as fixtures.

---

## 6 · OPEN ITEMS

| # | Item | Status |
|---|---|---|
| O1 | Clean baseline | LOCKED: `a6de049...` / blob `1f394365...` |
| O2 | Candidate scaffold | COMPLETE: exact baseline blob in `ui-v2-candidate.html` |
| O3 | Harness scaffold | COMPLETE: `ui-v2-harness.html` |
| O4 | Candidate manifest | COMPLETE: `ui-v2-candidate-manifest.json` |
| O5 | H1 performance integration | NEXT |
| O6 | H2 inspection/Focus integration | PENDING H1 internal gate |
| O7 | H3 folder tags | PENDING |
| O8 | H4 Grid round-trip | PENDING |
| O9 | H5 Table curation physics | PENDING |
| O10 | H6 resume integrity | PENDING |
| O11 | H7 Sort desktop fit | PENDING |
| O12 | Default tag names | OPEN presentation choice only |
| O13 | Device matrix | desktop Chrome + touch/mobile minimum; Google Drive; OneDrive smoke where available |
| O14 | Video | DEFERRED |
| O15 | AI/Venice modes | DEFERRED separate family |

---

## 7 · IMMUTABLE WORKING RULES

1. Start every turn by reading plan + graveyard; end every turn by updating plan.
2. Authority: current owner ruling → graveyard → plan → approved baseline → audited donor → references → chat history.
3. On failure: **stop → clean approved input → graveyard → plan → rebuild → harness → publish candidate → verify → owner device gate. Never patch forward.**
4. Unknown cause: instrument first; never declare root cause from reasoning alone.
5. Verify, do not infer. Repository/Actions success does not prove live behavior.
6. Reuse actual controls/handlers/trails/cache patterns; no lookalikes.
7. Current authorization covers harness + integrated candidate. Production promotion requires candidate gate.
8. One owner-facing candidate; H0–H8 are internal engineering gates.
9. Static build identity must be visible and verifiable in candidate/production.
10. Any owner-testable build gets a cache-busted test URL automatically.
11. No stubs, fake controls, fake data or fake pass results.
12. Production `ui-v2.html` remains untouched until candidate PASS; promotion copies exact verified candidate without functional edits.

---

## 8 · TURN LEDGER

### 2026-08-13 · Harness/integrated candidate execution
**Owner ruling:** no eight releases; use a harness to test each requirement group and integrate them into one candidate.  
**Plan change:** v1.3.0 retired owner-facing R0–R8 releases and adopted H0–H8 internal gates.  
**Repository work:** created `ui-v2-harness.html`; instantiated `ui-v2-candidate.html` using the exact clean-baseline blob; created `ui-v2-candidate-manifest.json`. Production was not touched.  
**Evidence:** candidate instantiation blob = baseline blob `1f3943655b157ccf10626d32bf4d1679e835867c`.  
**Current state:** harness/candidate infrastructure complete; candidate deliberately not owner-facing yet because H1–H7 implementation remains.  
**Next action:** integrate H1 performance/instrumentation into candidate first, run harness, then continue H2–H7 internally. Owner receives one URL only after integrated H8 eligibility.

### 2026-08-13 · Published A1-A18 requirements audit
**Owner request:** audit every enumerated final requirement and publish findings plus remediation instructions where needed.  
**Evidence:** clean baseline `a6de049`; final curation contract; graveyard vetoes; candidate manifest/harness state.  
**Published:** `UI-V2-REQUIREMENTS-AUDIT-2026-08-13.md`.  
**Findings:** PASS 1; PARTIAL/PARTIAL-FAIL 6; FAIL/FAIL-OPPOSITE 11. The clean baseline is suitable construction input but is not requirements-complete.  
**Remediation:** A1/A6/A9/A10→H2; A2/A3/A4→H3; A5→H2/H3; A7→H2/H3; A8→H3/H5; A11-A13→H4; A14-A15→H1; A16→H6; A17→H7; A18→H8 regression veto checks.  
**Application writes:** none in this audit turn.  
**Next action:** H1 performance instrumentation/integration in `ui-v2-candidate.html`, then continue internal gates toward the single H8 owner-facing candidate.

---

## 9 · CHANGE LOG

**v1.3.2 · 2026-08-13.** Linked and recorded the published A1-A18 detailed requirements audit and remediation map. No production/candidate application changes in this audit turn.

**v1.3.1 · 2026-08-13.** Recorded actual harness/candidate/manifest creation, locked exact candidate baseline blob, made production immutability explicit, and set H1 as next internal integration step.

**v1.3.0 · 2026-08-13.** Replaced eight owner-facing releases with one integrated candidate plus H0–H8 internal gates.

**v1.2.0 · 2026-08-13.** Item-by-item final-requirements audit against clean baseline.

**v1.1.x · 2026-08-12.** Baseline history audit and initial release planning.

**v1.0.x · 2026-08-12.** Governance, graveyard and recovered requirements established.
