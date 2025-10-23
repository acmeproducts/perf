import { expect, test } from '@playwright/test';

import {
  MAX_SEQUENCE_BASE,
  computeDeterministicSequenceCandidate,
  createSequenceTracker,
  ensureCanonicalSequence,
  StackSequenceHelpers
} from '../stack-sequence-helpers.js';

test.describe('Stack sequence canonicalization', () => {
  test('allocates deterministic fallback sequences', () => {
    const deterministicBase = MAX_SEQUENCE_BASE - 10;
    const tracker = createSequenceTracker({ deterministicBase });
    const queue: Array<Record<string, unknown>> = [];

    const fileA = { id: 'file-a' } as const;
    const metadataA: { stack: string; stackSequence: number } = { stack: 'in', stackSequence: 0 };
    const resultA = ensureCanonicalSequence(fileA, metadataA, {
      index: 0,
      tracker,
      deterministicBase,
      queue,
      reason: 'test'
    });

    expect(resultA.updated).toBe(true);
    expect(resultA.sequence).toBe(
      computeDeterministicSequenceCandidate({ deterministicBase, index: 0 })
    );
    expect(queue).toHaveLength(1);

    const fileB = { id: 'file-b' } as const;
    const metadataB: { stack: string; stackSequence: number } = { stack: 'in', stackSequence: 0 };
    const resultB = ensureCanonicalSequence(fileB, metadataB, {
      index: 0,
      tracker,
      deterministicBase,
      queue,
      reason: 'test'
    });

    expect(resultB.updated).toBe(true);
    expect(resultB.sequence).toBe(resultA.sequence - 1);
    expect(queue).toHaveLength(2);
  });

  test('respects existing canonical sequences without re-queuing', () => {
    const deterministicBase = MAX_SEQUENCE_BASE - 20;
    const tracker = createSequenceTracker({ deterministicBase });
    const queue: Array<Record<string, unknown>> = [];

    const existing = { id: 'seeded' };
    const metadata = { stack: 'priority', stackSequence: deterministicBase - 5 };
    const keepResult = ensureCanonicalSequence(existing, metadata, {
      index: 5,
      tracker,
      deterministicBase,
      queue,
      reason: 'test'
    });

    expect(keepResult.updated).toBe(false);
    expect(queue).toHaveLength(0);

    const newcomer = { id: 'newcomer' };
    const newcomerMetadata = { stack: 'priority', stackSequence: 0 };
    const newcomerResult = ensureCanonicalSequence(newcomer, newcomerMetadata, {
      index: 5,
      tracker,
      deterministicBase,
      queue,
      reason: 'test'
    });

    expect(newcomerResult.updated).toBe(true);
    expect(newcomerResult.sequence).toBeLessThan(metadata.stackSequence);
    expect(queue).toHaveLength(1);
  });

  test('exposes helpers on the global scope for browser usage', () => {
    const helpers = (globalThis as any).StackSequenceHelpers;
    expect(helpers).toBeDefined();
    expect(helpers).toBe(StackSequenceHelpers);
    expect(typeof helpers.createSequenceTracker).toBe('function');
  });
});
