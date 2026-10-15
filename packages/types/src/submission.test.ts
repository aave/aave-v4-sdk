import { describe, expect, it } from 'vitest';
import { submissionId } from './submission';

describe(`Given the '${submissionId.name}' function`, () => {
  it('Then it accepts a tx hash', () => {
    const hash = `0x${'a'.repeat(64)}`;
    expect(submissionId(hash)).toBe(hash);
  });

  it('Then it accepts a non-hex EIP-5792 call id', () => {
    const id = `UserOperation:0x${'b'.repeat(64)}:pimlico`;
    expect(submissionId(id)).toBe(id);
  });

  it('Then it rejects an empty string', () => {
    expect(() => submissionId('')).toThrow();
  });
});
