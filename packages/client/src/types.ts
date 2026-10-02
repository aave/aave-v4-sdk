import type {
  CancelError,
  SigningError,
  TimeoutError,
  TransactionError,
  UnexpectedError,
  ValidationError,
} from '@aave/core';
import type {
  ExecutionPlan,
  HasProcessedKnownTransactionRequest,
  InsufficientBalanceError,
  OperationType,
  OrderTypedData,
  PermitTypedData,
  SwapTypedData,
} from '@aave/graphql';
import type { ResultAsync, Signature, TxHash } from '@aave/types';

/**
 * @internal
 */
export type TransactionResult = {
  txHash: TxHash;
  operations: OperationType[] | null;
};

/**
 * @internal
 */
export function isHasProcessedKnownTransactionRequest(
  result: TransactionResult,
): result is HasProcessedKnownTransactionRequest {
  return result.operations !== null && result.operations.length > 0;
}

export type TransactionReceipt = {
  __typename: 'TransactionReceipt';
  txHash: TxHash;
};

/**
 * @internal
 */
export function transactionReceipt(txHash: TxHash): TransactionReceipt {
  return { __typename: 'TransactionReceipt', txHash };
}

export type SendWithError =
  | CancelError
  | SigningError
  | TimeoutError
  | TransactionError
  | ValidationError<InsufficientBalanceError>
  | UnexpectedError;

export type ExecutionPlanHandler<T extends ExecutionPlan = ExecutionPlan> = (
  result: T,
) => ResultAsync<TransactionResult, SendWithError>;

export type SignTypedDataError = CancelError | SigningError;

/**
 * Union type for all EIP-712 typed data structures used in the SDK.
 */
export type TypedData = PermitTypedData | SwapTypedData | OrderTypedData;

export type TypedDataHandler = (
  data: TypedData,
) => ResultAsync<Signature, SignTypedDataError>;

/**
 * Returned instead of a Calls ID when the wallet turns out not to support
 * atomic execution of a Batch. Nothing was submitted; the steps should be sent
 * one by one instead.
 *
 * @internal
 */
export type BatchUnavailable = { readonly __typename: 'BatchUnavailable' };

/**
 * @internal
 */
export const batchUnavailable: BatchUnavailable = Object.freeze({
  __typename: 'BatchUnavailable',
});

/**
 * @internal
 */
export function isBatchUnavailable(value: unknown): value is BatchUnavailable {
  return value === batchUnavailable;
}
