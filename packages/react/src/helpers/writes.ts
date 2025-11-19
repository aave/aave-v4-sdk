import type { TransactionResult } from '@aave/client';
import {
  CancelError,
  type SigningError,
  type TimeoutError,
  type TransactionError,
  type UnexpectedError,
} from '@aave/core';
import type {
  Erc20ApprovalRequired,
  PreContractActionRequired,
  TransactionRequest,
} from '@aave/graphql';
import type { ResultAsync } from '@aave/types';
import { invariant } from '@aave/types';
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
  static ensure<T>(value: T): PendingTransaction & T {
    invariant(
      value instanceof PendingTransaction,
      'Expected PendingTransaction',
    );
    return value as PendingTransaction & T;
  }
}

export type UseSendTransactionResult = UseAsyncTask<
  TransactionRequest,
  PendingTransaction,
  SendTransactionError
>;

/**
 * The handler for sending Aave transactions.
 */
export type TransactionHandler = (
  result:
    | TransactionRequest
    | Erc20ApprovalRequired
    | PreContractActionRequired,
  options: TransactionHandlerOptions,
) => ResultAsync<PendingTransaction, SendTransactionError>;
