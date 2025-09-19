import type { TransactionResult } from '@aave/client-next';
import {
  CancelError,
  type SigningError,
  type TimeoutError,
  type TransactionError,
  type UnexpectedError,
} from '@aave/core-next';
import type { ApprovalRequired, TransactionRequest } from '@aave/graphql-next';
import type { ResultAsync } from '@aave/types-next';
import type { UseAsyncTask } from './tasks';

/**
 * The errors that could occur in the early stage of sending a transaction.
 */
export type SendTransactionError = CancelError | SigningError | UnexpectedError;

/**
 * @internal
 */
export function cancel(message: string): ResultAsync<never, CancelError> {
  return CancelError.from(message).asResultAsync();
}

export type TransactionHandlerOptions = {
  cancel: (message: string) => ResultAsync<never, CancelError>;
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
     * @internal Do NOT use this method. It's used internally by the SDK and may be subject to breaking changes.
     */
    public readonly wait: () => ResultAsync<
      TransactionResult,
      PendingTransactionError
    >,
  ) {}
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
  result: TransactionRequest | ApprovalRequired,
  options: TransactionHandlerOptions,
) => ResultAsync<PendingTransaction, SendTransactionError>;
