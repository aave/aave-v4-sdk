import type { SendWithError } from '@aave/client';
import type {
  CancelError,
  SubmissionUnresolvedError,
  TimeoutError,
  TransactionError,
  UnexpectedError,
} from '@aave/core';
import { describe, expectTypeOf, it } from 'vitest';
import type { PendingTransactionError } from './writes';

describe('Given the PendingTransactionError type', () => {
  it('Then it is unchanged', () => {
    expectTypeOf<PendingTransactionError>().toEqualTypeOf<
      CancelError | TimeoutError | TransactionError | UnexpectedError
    >();
  });

  it('Then it accepts a SubmissionUnresolvedError', () => {
    expectTypeOf<SubmissionUnresolvedError>().toExtend<PendingTransactionError>();
  });
});

describe('Given the SendWithError type', () => {
  it('Then it includes TimeoutError', () => {
    expectTypeOf<TimeoutError>().toExtend<SendWithError>();
    expectTypeOf<SubmissionUnresolvedError>().toExtend<SendWithError>();
  });
});
