import {
  SigningError,
  TransactionError,
  UnexpectedError,
  ValidationError,
} from '@aave/core';
import type {
  CancelSwapTypedData,
  ExecutionPlan,
  PermitTypedDataResponse,
  SwapByIntentTypedData,
  TransactionRequest,
} from '@aave/graphql';
import {
  errAsync,
  nonNullable,
  okAsync,
  ResultAsync,
  signatureFrom,
  txHash,
} from '@aave/types';
import type { Signer, TransactionResponse } from 'ethers';
import type {
  ERC20PermitHandler,
  ExecutionPlanHandler,
  SwapSignatureHandler,
  TransactionResult,
} from './types';

/**
 * @internal
 */
export function sendTransaction(
  signer: Signer,
  request: TransactionRequest,
): ResultAsync<TransactionResponse, SigningError> {
  return ResultAsync.fromPromise(
    signer.sendTransaction({
      to: request.to,
      data: request.data,
      value: request.value,
      from: request.from,
    }),
    (err) => SigningError.from(err),
  );
}

/**
 * @internal
 */
export function waitForTransactionResult(
  request: TransactionRequest,
  response: TransactionResponse,
): ResultAsync<TransactionResult, TransactionError | UnexpectedError> {
  return ResultAsync.fromPromise(response.wait(), (err) =>
    UnexpectedError.from(err),
  ).andThen((receipt) => {
    const hash = txHash(nonNullable(receipt?.hash));

    if (receipt?.status === 0) {
      return errAsync(
        TransactionError.new({
          txHash: hash,
          request,
        }),
      );
    }
    return okAsync({
      txHash: hash,
      operations: request.operations,
    });
  });
}

function sendTransactionAndWait(
  signer: Signer,
  request: TransactionRequest,
): ResultAsync<
  TransactionResult,
  SigningError | TransactionError | UnexpectedError
> {
  return sendTransaction(signer, request).andThen((tx) =>
    waitForTransactionResult(request, tx),
  );
}

function executePlan(
  signer: Signer,
  result: ExecutionPlan,
): ReturnType<ExecutionPlanHandler> {
  switch (result.__typename) {
    case 'TransactionRequest':
      return sendTransactionAndWait(signer, result);

    case 'Erc20ApprovalRequired':
    case 'PreContractActionRequired':
      return sendTransactionAndWait(signer, result.transaction).andThen(() =>
        sendTransactionAndWait(signer, result.originalTransaction),
      );

    case 'InsufficientBalanceError':
      return errAsync(ValidationError.fromGqlNode(result));
  }
}

/**
 * Creates an execution plan handler that sends transactions using the provided ethers signer.
 */
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  signer: Signer,
): ExecutionPlanHandler<T>;
/**
 * Sends execution plan transactions using the provided ethers signer.
 */
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  signer: Signer,
  result: T,
): ReturnType<ExecutionPlanHandler<T>>;
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  signer: Signer,
  result?: T,
): ExecutionPlanHandler<T> | ReturnType<ExecutionPlanHandler<T>> {
  return result ? executePlan(signer, result) : executePlan.bind(null, signer);
}

function signERC20Permit(
  signer: Signer,
  result: PermitTypedDataResponse,
): ReturnType<ERC20PermitHandler> {
  return ResultAsync.fromPromise(
    signer.signTypedData(result.domain, result.types, result.message),
    (err) => SigningError.from(err),
  ).map((signature) => ({
    deadline: result.message.deadline,
    value: signatureFrom(signature),
  }));
}

/**
 * Creates an ERC20 permit handler that signs ERC20 permits using the provided ethers signer.
 */
export function signERC20PermitWith(signer: Signer): ERC20PermitHandler {
  return signERC20Permit.bind(null, signer);
}

function signSwapTypedData(
  signer: Signer,
  result: SwapByIntentTypedData | CancelSwapTypedData,
): ReturnType<SwapSignatureHandler> {
  const message = JSON.parse(result.message);
  return ResultAsync.fromPromise(
    signer.signTypedData(result.domain, result.types, message),
    (err) => SigningError.from(err),
  ).map((signature) => ({
    deadline: message.deadline,
    value: signatureFrom(signature),
  }));
}

/**
 * @internal
 * Creates a swap signature handler that signs swap typed data using the provided ethers signer.
 */
export function signSwapTypedDataWith(signer: Signer): SwapSignatureHandler;
/**
 * @internal
 * Signs swap typed data using the provided ethers signer.
 */
export function signSwapTypedDataWith(
  signer: Signer,
  result: SwapByIntentTypedData | CancelSwapTypedData,
): ReturnType<SwapSignatureHandler>;
export function signSwapTypedDataWith(
  signer: Signer,
  result?: SwapByIntentTypedData | CancelSwapTypedData,
): SwapSignatureHandler | ReturnType<SwapSignatureHandler> {
  return result
    ? signSwapTypedData(signer, result)
    : signSwapTypedData.bind(null, signer);
}
