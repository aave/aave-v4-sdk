import { chainId, submissionId } from '@aave/types';
import { describe, expect, it } from 'vitest';
import { SubmissionUnresolvedError, TimeoutError } from './errors';

describe(`Given a ${SubmissionUnresolvedError.name}`, () => {
  const error = SubmissionUnresolvedError.new({
    submissionId: submissionId('0x01'),
    chainId: chainId(1),
  });

  it(`Then it keeps the '${TimeoutError.name}' name`, () => {
    expect(error.name).toBe('TimeoutError');
    expect(error).toBeInstanceOf(TimeoutError);
  });

  it('Then it carries the submission id and chain id', () => {
    expect(error.submissionId).toBe('0x01');
    expect(error.chainId).toBe(1);
  });

  it(`Then '${SubmissionUnresolvedError.name}.is' tells it apart from a plain ${TimeoutError.name}`, () => {
    expect(SubmissionUnresolvedError.is(error)).toBe(true);
    expect(SubmissionUnresolvedError.is(TimeoutError.from('timeout'))).toBe(
      false,
    );
    expect(SubmissionUnresolvedError.is(null)).toBe(false);
  });

  it('Then it is recognised across duplicate package copies', () => {
    const copy = Object.assign(new Error('copy'), {
      isSubmissionUnresolved: true,
    });
    expect(SubmissionUnresolvedError.is(copy)).toBe(true);
  });
});
