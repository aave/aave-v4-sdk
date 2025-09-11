import {
  CancelError,
  type SigningError,
  type TimeoutError,
  type TransactionError,
  type UnexpectedError,
} from '@aave/core-next';
import type {
  ApprovalRequired,
  ERC712Signature,
  SwapApprovalRequired,
  SwapByIntent,
  SwapByIntentWithApprovalRequired,
  SwapByTransaction,
  SwapReceipt,
  SwapTransactionRequest,
  TransactionRequest,
} from '@aave/graphql-next';
import type { ResultAsync, TxHash } from '@aave/types-next';
import type { UseAsyncTask } from './tasks';

export type SendTransactionError =
  | CancelError
  | SigningError
  | TimeoutError
  | TransactionError
  | UnexpectedError;

export type UseSendTransactionResult = UseAsyncTask<
  TransactionRequest,
  TxHash,
  SendTransactionError
>;

/**
 * @internal
 */
export function cancel(message: string): ResultAsync<unknown, CancelError> {
  return CancelError.from(message).asResultAsync();
}

export type TransactionHandlerOptions = {
  cancel: (message: string) => ResultAsync<unknown, CancelError>;
};

/**
 * A handler for complex transactions that can require approval beforehand.
 */
export type ComplexTransactionHandler = (
  result: TransactionRequest | ApprovalRequired,
  options: TransactionHandlerOptions,
) => ResultAsync<TxHash, SendTransactionError>;

/**
 * A handler for simple transactions that do not require approval.
 */
export type SimpleTransactionHandler = (
  result: TransactionRequest,
  options: TransactionHandlerOptions,
) => ResultAsync<TxHash, SendTransactionError>;

export type SwapIntent =
  | SwapByIntent
  | SwapByTransaction
  | SwapByIntentWithApprovalRequired
  | SwapTransactionRequest
  | SwapApprovalRequired;

/**
 * A handler for swap transactions.
 */
export type SwapHandler = (
  intent: SwapIntent,
) => ResultAsync<
  ERC712Signature | SwapReceipt,
  SendTransactionError | UnexpectedError
>;
