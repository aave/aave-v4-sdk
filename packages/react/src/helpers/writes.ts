import type { BatchUnavailable, TransactionResult } from '@aave/client';
import {
  CancelError,
  type SigningError,
  type TimeoutError,
  type TransactionError,
  UnexpectedError,
} from '@aave/core';
import type { TransactionRequest } from '@aave/graphql';
import type { ChainId, ResultAsync, Signature } from '@aave/types';
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
  R extends Signature | PendingTransaction | BatchUnavailable,
> = (
  plan: T,
  options: TransactionHandlerOptions,
) => ResultAsync<R, SendTransactionError>;

/**
 * A plan step that sends several transactions as one atomic batch.
 *
 * Only passed to the handler of a hook that was given `{ batch }`, when the wallet
 * supports atomic batching. Send it with `batch.send(plan)`.
 */
export type BatchRequest = {
  __typename: 'BatchRequest';
  /**
   * The transactions to execute atomically, in order: the approval or
   * pre-contract-action steps, then the original transaction.
   */
  requests: TransactionRequest[];
};

/**
 * Sends a {@link BatchRequest} through a wallet that supports atomic batching.
 *
 * Obtain one from the wallet adapter (e.g. `useSendCalls` in `@aave/react/viem`) and
 * pass it to a hook as `{ batch }`.
 */
export type BatchSender = {
  /**
   * @internal Whether the wallet can batch on the given chain. Used by the hooks.
   */
  readonly supports: (chainId: ChainId) => ResultAsync<boolean, never>;

  /**
   * Sends the batch. Resolves to a `PendingTransaction`, or to `BatchUnavailable`
   * when the wallet turned out not to support atomic execution (nothing was
   * submitted; the hook then sends the steps one by one). Return the result
   * unchanged from the handler.
   */
  readonly send: (
    plan: BatchRequest,
  ) => ResultAsync<PendingTransaction | BatchUnavailable, SendTransactionError>;
};

/**
 * Options for hooks that can batch approval steps with the original transaction.
 */
export type BatchOptions = {
  /**
   * Sends approval or pre-contract-action steps together with the original
   * transaction as one atomic batch when the wallet supports it. Omit (or pass
   * `undefined`) to always send the steps one by one.
   */
  batch: BatchSender | null | undefined;
};

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
