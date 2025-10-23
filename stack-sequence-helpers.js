export const MAX_SEQUENCE_BASE = Number.MAX_SAFE_INTEGER;

const toFiniteNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const computeDeterministicSequenceCandidate = (options = {}) => {
  const base = Number.isFinite(options?.deterministicBase)
    ? Number(options.deterministicBase)
    : MAX_SEQUENCE_BASE;
  const index = Number.isFinite(options?.index) ? Number(options.index) : 0;
  return base - index;
};

export const createSequenceTracker = (options = {}) => {
  const deterministicBase = Number.isFinite(options?.deterministicBase)
    ? Number(options.deterministicBase)
    : MAX_SEQUENCE_BASE;
  const assigned = new Set();
  return {
    deterministicBase,
    assigned,
    register(sequence) {
      const numeric = toFiniteNumber(sequence, null);
      if (numeric == null) return;
      assigned.add(numeric);
    },
    allocate(index, candidate) {
      const fallbackIndex = Number.isFinite(index) ? Number(index) : 0;
      let value = Number.isFinite(candidate) ? Number(candidate) : deterministicBase - fallbackIndex;
      while (assigned.has(value)) {
        value -= 1;
      }
      assigned.add(value);
      return value;
    }
  };
};

export const ensureCanonicalSequence = (file, metadata, context = {}) => {
  if (!metadata || typeof metadata !== 'object') {
    return { updated: false, sequence: null };
  }
  const tracker = context?.tracker || null;
  const index = Number.isFinite(context?.index) ? Number(context.index) : 0;
  const deterministicBase = Number.isFinite(context?.deterministicBase)
    ? Number(context.deterministicBase)
    : tracker?.deterministicBase;
  const stack = metadata.stack || 'in';
  const numericSequence = Number(metadata.stackSequence);
  if (Number.isFinite(numericSequence) && numericSequence !== 0) {
    tracker?.register?.(numericSequence);
    return { updated: false, sequence: numericSequence };
  }

  const candidate = computeDeterministicSequenceCandidate({ deterministicBase, index });
  const sequence = tracker?.allocate?.(index, candidate) ?? candidate;

  metadata.stackSequence = sequence;
  if (file && typeof file === 'object') {
    file.stackSequence = sequence;
  }

  if (Array.isArray(context?.queue)) {
    context.queue.push({
      fileId: file?.id ?? null,
      stack,
      stackSequence: sequence,
      index,
      reason: context?.reason || 'metadata:canonicalize'
    });
  }

  return { updated: true, sequence };
};

export const StackSequenceHelpers = {
  MAX_SEQUENCE_BASE,
  computeDeterministicSequenceCandidate,
  createSequenceTracker,
  ensureCanonicalSequence
};

if (typeof globalThis !== 'undefined') {
  if (globalThis.StackSequenceHelpers) {
    Object.assign(globalThis.StackSequenceHelpers, StackSequenceHelpers);
  } else {
    globalThis.StackSequenceHelpers = StackSequenceHelpers;
  }
}

export default StackSequenceHelpers;
