#!/usr/bin/env node
/**
 * Compare a Playwright JSON report against the recorded known-failure baseline.
 *
 * The ui-v2 gate suite has a large standing set of failures: gates written against
 * features that never landed in ui-v2.html, plus real bugs nobody has got to yet. A
 * plain `playwright test` therefore exits non-zero on every run, which means it
 * cannot answer the only question that matters day to day: did *my* change break
 * something?
 *
 * This script answers that. It exits non-zero only when the failure set moves:
 *
 *   NEW FAILURES   a test that was passing now fails  -> a regression, fix it
 *   NEWLY PASSING  a baselined failure now passes     -> good news, re-record so the
 *                                                        baseline cannot rot into
 *                                                        hiding a future regression
 *
 * Usage:
 *   node scripts/check-regressions.mjs [--report <path>] [--baseline <path>] [--update]
 *
 *   --update   rewrite the baseline from this report instead of checking against it
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const reportPath = path.resolve(flag('--report', 'test-results/results.json'));
const baselinePath = path.resolve(flag('--baseline', 'tests/known-failures.json'));
const update = args.includes('--update');

if (!existsSync(reportPath)) {
  console.error(`No Playwright report at ${reportPath}.`);
  console.error(`Run the suite first: npm run test:e2e`);
  process.exit(2);
}

// Read the baseline before anything else: --update has to carry the quarantine list
// forward rather than silently dropping it on every re-record.
const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, 'utf8'))
  : null;

/**
 * Quarantine: tests that are nondeterministic beyond what `retries` absorbs.
 *
 * Retries catch a test that fails once and passes on the second attempt. They do not
 * catch a test that fails *both* attempts on one run and passes both on the next --
 * and this suite has some, because ~197 fixed-duration sleeps mean a slower machine
 * changes the outcome rather than just the timing. Those tests flip the gate in both
 * directions: NEW FAILURE on one run, NEWLY PASSING on the next, neither caused by
 * anyone's change.
 *
 * A gate that cries wolf gets ignored, so these are reported and then skipped.
 * Quarantine is a to-fix list, not a hiding place: replace the sleeps with condition
 * waits and take the test back out.
 */
const quarantined = new Set(baseline?.quarantine ?? []);

const report = JSON.parse(readFileSync(reportPath, 'utf8'));

/**
 * Flatten Playwright's nested suites into one id per test.
 *
 * The id is `<file>::<full title>` so it survives reordering and renumbering of the
 * spec files, which this repo does often. Titles are the stable part.
 */
const collisions = [];
const collect = suites => {
  const out = new Map();
  const walk = (nodes, titlePath) => {
    for (const node of nodes ?? []) {
      // Playwright puts `file` on both the per-file root suite and on describe blocks
      // inside it, so "has no file" does not identify a describe. The root suite is
      // the one whose title *is* the file path; anything else with a title is a
      // describe and belongs in the id. Including it keeps these ids identical to
      // what the line reporter prints, which is where anyone copying a test name into
      // the quarantine list will get it from.
      const isDescribe = node.title && node.title !== node.file;
      const nextPath = isDescribe ? [...titlePath, node.title] : titlePath;
      for (const spec of node.specs ?? []) {
        const file = spec.file || node.file || '<unknown>';
        const id = `${file}::${[...nextPath, spec.title].join(' › ')}`;
        // Same title twice in one file would silently overwrite, quietly shrinking
        // the failure set and hiding a regression. Fail loudly instead.
        if (out.has(id)) collisions.push(id);
        // A test with retries has several results. It counts as failing only if the
        // final attempt failed; anything else passed on retry and is a flake.
        const results = (spec.tests ?? []).flatMap(t => t.results ?? []);
        const statuses = results.map(r => r.status);
        const last = statuses[statuses.length - 1];
        const failed = last === 'failed' || last === 'timedOut';
        const flaky = !failed && statuses.some(s => s === 'failed' || s === 'timedOut');
        if (statuses.length === 0 || last === 'skipped') continue;
        out.set(id, { failed, flaky });
      }
      walk(node.suites, nextPath);
    }
  };
  walk(suites, []);
  return out;
};

const results = collect(report.suites);
if (results.size === 0) {
  console.error('Report contained no test results. Did the run crash before starting?');
  process.exit(2);
}
if (collisions.length) {
  console.error(`Two or more tests share an id, so the failure set cannot be trusted:`);
  for (const id of [...new Set(collisions)]) console.error(`  ${id}`);
  console.error(`Rename one of each pair, or give them distinct describe blocks.`);
  process.exit(2);
}

const failing = [...results].filter(([, v]) => v.failed).map(([id]) => id).sort();
const flaky = [...results].filter(([, v]) => v.flaky).map(([id]) => id).sort();

const rel = id => id.replace(/^.*?([\w./-]+\.spec\.ts)::/, '$1 › ');

if (update) {
  mkdirSync(path.dirname(baselinePath), { recursive: true });
  writeFileSync(baselinePath, `${JSON.stringify({
    note: 'Known-failing gates in ui-v2.html. Regenerate with: npm run test:baseline. '
        + 'Shrinking knownFailures is the goal; check-regressions fails if it grows, and '
        + 'also if it shrinks without being re-recorded. quarantine lists tests that flip '
        + 'between runs regardless of the code; they are reported but never counted, and '
        + 'the fix is to replace their fixed-duration sleeps with condition waits.',
    recordedAt: new Date().toISOString(),
    total: results.size,
    quarantine: [...quarantined].sort(),
    knownFailures: failing.filter(id => !quarantined.has(id))
  }, null, 2)}\n`);
  const recorded = failing.filter(id => !quarantined.has(id)).length;
  console.log(`Recorded ${recorded} known failures out of ${results.size} tests (${quarantined.size} quarantined) -> ${path.relative(process.cwd(), baselinePath)}`);
  process.exit(0);
}

if (!baseline) {
  console.error(`No baseline at ${baselinePath}. Record one with: npm run test:baseline`);
  process.exit(2);
}

const known = new Set(baseline.knownFailures ?? []);

const regressions = failing.filter(id => !known.has(id) && !quarantined.has(id));
// Only count a baselined failure as fixed if this run actually executed it. A
// filtered run (a single spec file) must not look like it fixed everything else.
const fixed = [...known]
  .filter(id => !quarantined.has(id))
  .filter(id => results.has(id) && !results.get(id).failed)
  .sort();

const quarantineSeen = [...quarantined]
  .filter(id => results.has(id))
  .map(id => ({ id, failed: results.get(id).failed }))
  .sort((a, b) => a.id.localeCompare(b.id));

console.log(`Ran ${results.size} tests: ${failing.length} failing, ${known.size} baselined, ${quarantined.size} quarantined.`);

if (quarantineSeen.length) {
  console.log(`\nQuarantined — nondeterministic, not counted either way. Fixing their waits removes them from this list:`);
  for (const { id, failed } of quarantineSeen) console.log(`  ${failed ? '✗' : '✓'} ${rel(id)}`);
}

if (flaky.length) {
  console.log(`\nFlaky (failed then passed on retry) — also not counted either way:`);
  for (const id of flaky) console.log(`  ~ ${rel(id)}`);
}

if (regressions.length) {
  console.log(`\nNEW FAILURES (${regressions.length}) — not in the baseline, so your change likely caused them:`);
  for (const id of regressions) console.log(`  ✗ ${rel(id)}`);
}

if (fixed.length) {
  console.log(`\nNEWLY PASSING (${fixed.length}) — re-record the baseline so these stay protected:`);
  for (const id of fixed) console.log(`  ✓ ${rel(id)}`);
  console.log(`\n  npm run test:baseline`);
}

if (!regressions.length && !fixed.length) {
  console.log('\nNo movement against the baseline.');
  process.exit(0);
}

process.exit(1);
