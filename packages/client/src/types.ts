import type {
  CancelError,
  SigningError,
  TransactionError,
  UnexpectedError,
  ValidationError,
} from '@aave/core';
import type {
  ExecutionPlan,
  HasProcessedKnownTransactionRequest,
  InsufficientBalanceError,
  OperationType,
  PermitTypedData,
  SwapTypedData,
} from '@aave/graphql';
import type { ResultAsync, TxHash } from '@aave/types';

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

export type SendWithError =
  | CancelError
  | SigningError
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
export type TypedData = PermitTypedData | SwapTypedData;
