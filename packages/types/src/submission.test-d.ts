import { describe, expectTypeOf, it } from 'vitest';
import type { TxHash } from './hex';
import { type SubmissionId, submissionId } from './submission';

describe('Given the SubmissionId type', () => {
  it('Then submissionId() returns a SubmissionId', () => {
    expectTypeOf(submissionId('0x01')).toEqualTypeOf<SubmissionId>();
  });

  it('Then it is not interchangeable with TxHash', () => {
    expectTypeOf<SubmissionId>().not.toExtend<TxHash>();
    expectTypeOf<TxHash>().not.toExtend<SubmissionId>();
  });
});
