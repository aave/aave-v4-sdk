import type { TransactionResult } from '@aave/client';
import {
  CancelError,
  type SigningError,
  type TimeoutError,
  type TransactionError,
  UnexpectedError,
} from '@aave/core';
import type { TransactionRequest } from '@aave/graphql';
import type { ResultAsync, Signature } from '@aave/types';
import { isSignature, okAsync } from '@aave/types';
import type { UseAsyncTask } from './tasks';

/**
 * The errors that could occur in the early stage of sending a transaction.
 */
export type SendTransactionError = CancelError | SigningError | UnexpectedError;

export type CancelOperation = (
  message: string,
) => ResultAsync<never, CancelError>;

/**
 * @internal
 */
export const cancel: CancelOperation = (message: string) =>
  CancelError.from(message).asResultAsync();

export type TransactionHandlerOptions = {
  cancel: CancelOperation;
};

/**
 * The errors that could occur in the late stages of a transaction.
 */
export type PendingTransactionError =
  | CancelError
  | TimeoutError
  | TransactionError
  | UnexpectedError;

export class PendingTransaction {
  constructor(
    /**
     * @internal Do NOT rely on this method. It's used internally by the SDK and may be subject to breaking changes.
     */
    public readonly wait: () => ResultAsync<
      TransactionResult,
      PendingTransactionError
    >,
  ) {}

  /**
   * @internal
   */
  static isInstanceOf(value: unknown): value is PendingTransaction {
    return value instanceof PendingTransaction;
  }

  /**
   * Narrows a value to PendingTransaction.
   * Only accepts types that include PendingTransaction in the union.
   *
   * @internal
   */
  static tryFrom<T>(
    value: PendingTransaction extends T ? T : never,
  ): ResultAsync<PendingTransaction, UnexpectedError> {
    if (PendingTransaction.isInstanceOf(value)) {
      return okAsync(value);
    }
    return UnexpectedError.from(value).asResultAsync();
  }
}

export type UseSendTransactionResult = UseAsyncTask<
  TransactionRequest,
  PendingTransaction,
  SendTransactionError
>;

/**
 * The Aave execution plan handler
 */
export type ExecutionPlanHandler<
  T,
  R extends Signature | PendingTransaction,
> = (
  plan: T,
  options: TransactionHandlerOptions,
) => ResultAsync<R, SendTransactionError>;

/**
 * Tries to create a Signature from an unknown value.
 *
 * @internal
 */
export function trySignatureFrom(
  value: unknown,
): ResultAsync<Signature, UnexpectedError> {
  if (isSignature(value)) {
    return okAsync(value);
  }
  return UnexpectedError.from(
    `Expected Signature, but got ${String(value)}`,
  ).asResultAsync();
}
