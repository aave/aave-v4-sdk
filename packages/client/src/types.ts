import type {
  CancelError,
  SigningError,
  TransactionError,
  ValidationError,
} from '@aave/core-next';
import type {
  CancelSwapTypedData,
  ERC712Signature,
  ExecutionPlan,
  HasProcessedKnownTransactionRequest,
  InsufficientBalanceError,
  OperationType,
  PermitTypedDataResponse,
  SwapByIntentTypedData,
} from '@aave/graphql-next';
import type { ResultAsync, TxHash } from '@aave/types-next';

export type TransactionExecutionResult = {
  txHash: TxHash;
  operations: OperationType[] | null;
};

/**
 * @internal
 */
export function isHasProcessedKnownTransactionRequest(
  result: TransactionExecutionResult,
): result is HasProcessedKnownTransactionRequest {
  return result.operations !== null && result.operations.length > 0;
}

export type SendWithError =
  | CancelError
  | SigningError
  | TransactionError
  | ValidationError<InsufficientBalanceError>;

export type ExecutionPlanHandler<T extends ExecutionPlan = ExecutionPlan> = (
  result: T,
) => ResultAsync<TransactionExecutionResult, SendWithError>;

export type PermitHandler = (
  result: PermitTypedDataResponse,
) => ResultAsync<ERC712Signature, SigningError>;

export type SwapSignatureHandler = (
  result: CancelSwapTypedData | SwapByIntentTypedData,
) => ResultAsync<ERC712Signature, SigningError>;
