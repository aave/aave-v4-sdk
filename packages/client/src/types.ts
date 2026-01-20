import type {
  CancelError,
  SigningError,
  TransactionError,
  UnexpectedError,
  ValidationError,
} from '@aave/core';
import type {
  ERC20PermitSignature,
  ExecutionPlan,
  HasProcessedKnownTransactionRequest,
  InsufficientBalanceError,
  OperationType,
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

export type SendWithError =
  | CancelError
  | SigningError
  | TransactionError
  | ValidationError<InsufficientBalanceError>
  | UnexpectedError;

export type ExecutionPlanHandler<T extends ExecutionPlan = ExecutionPlan> = (
  result: T,
) => ResultAsync<TransactionResult, SendWithError>;

export type SignERC20PermitError = CancelError | SigningError;

export type ERC20PermitHandler = (
  data: PermitTypedData,
) => ResultAsync<ERC20PermitSignature, SignERC20PermitError>;

export type SignSwapTypedDataError = CancelError | SigningError;

export type SwapSignatureHandler = (
  data: SwapTypedData,
) => ResultAsync<Signature, SignSwapTypedDataError>;
