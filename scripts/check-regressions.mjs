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

const report = JSON.parse(readFileSync(reportPath, 'utf8'));

/**
 * Flatten Playwright's nested suites into one id per test.
 *
 * The id is `<file>::<full title>` so it survives reordering and renumbering of the
 * spec files, which this repo does often. Titles are the stable part.
 */
const collect = suites => {
  const out = new Map();
  const walk = (nodes, titlePath) => {
    for (const node of nodes ?? []) {
      const nextPath = node.title && !node.file ? [...titlePath, node.title] : titlePath;
      for (const spec of node.specs ?? []) {
        const file = spec.file || node.file || '<unknown>';
        const id = `${file}::${[...nextPath, spec.title].join(' › ')}`;
        // A test with retries has several results. It counts as failing only if the
        // final attempt failed; anything else passed on retry and is a flake.
        const results = (spec.tests ?? []).flatMap(t => t.results ?? []);
        const statuses = results.map(r => r.status);
        const last = statuses[statuses.length - 1];
        const failed = last === 'failed' || last === 'timedOut';
        const flaky = failed === false && statuses.some(s => s === 'failed' || s === 'timedOut');
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

const failing = [...results].filter(([, v]) => v.failed).map(([id]) => id).sort();
const flaky = [...results].filter(([, v]) => v.flaky).map(([id]) => id).sort();

if (update) {
  mkdirSync(path.dirname(baselinePath), { recursive: true });
  writeFileSync(baselinePath, `${JSON.stringify({
    note: 'Known-failing gates in ui-v2.html. Regenerate with: npm run test:baseline. '
        + 'Shrinking this list is the goal; check-regressions fails if it grows, and '
        + 'also if it shrinks without being re-recorded.',
    recordedAt: new Date().toISOString(),
    total: results.size,
    knownFailures: failing
  }, null, 2)}\n`);
  console.log(`Recorded ${failing.length} known failures out of ${results.size} tests -> ${path.relative(process.cwd(), baselinePath)}`);
  process.exit(0);
}

if (!existsSync(baselinePath)) {
  console.error(`No baseline at ${baselinePath}. Record one with: npm run test:baseline`);
  process.exit(2);
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const known = new Set(baseline.knownFailures ?? []);

const regressions = failing.filter(id => !known.has(id));
// Only count a baselined failure as fixed if this run actually executed it. A
// filtered run (a single spec file) must not look like it fixed everything else.
const fixed = [...known].filter(id => results.has(id) && !results.get(id).failed).sort();

const rel = id => id.replace(/^.*?([\w./-]+\.spec\.ts)::/, '$1 › ');

console.log(`Ran ${results.size} tests: ${failing.length} failing, ${known.size} baselined.`);

if (flaky.length) {
  console.log(`\nFlaky (failed then passed on retry) — these are not counted either way:`);
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
