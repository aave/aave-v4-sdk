import type {
  CancelError,
  SigningError,
  TransactionError,
  UnexpectedError,
  ValidationError,
} from '@aave/core-next';
import type {
  CancelSwapTypedData,
  ERC20PermitSignature,
  ExecutionPlan,
  HasProcessedKnownTransactionRequest,
  InsufficientBalanceError,
  OperationType,
  PermitTypedDataResponse,
  SwapByIntentTypedData,
} from '@aave/graphql-next';
import type { ResultAsync, TxHash } from '@aave/types-next';

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

export type ERC20PermitHandler = (
  result: PermitTypedDataResponse,
) => ResultAsync<ERC20PermitSignature, SigningError>;

export type SwapSignatureHandler = (
  result: CancelSwapTypedData | SwapByIntentTypedData,
) => ResultAsync<ERC20PermitSignature, SigningError>;
