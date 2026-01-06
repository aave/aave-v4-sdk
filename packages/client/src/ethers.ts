import {
  CancelError,
  SigningError,
  TransactionError,
  UnexpectedError,
  ValidationError,
} from '@aave/core';
import type {
  ExecutionPlan,
  PermitTypedDataResponse,
  SwapTypedData,
  TransactionRequest,
} from '@aave/graphql';
import {
  chainId,
  errAsync,
  invariant,
  nonNullable,
  okAsync,
  ResultAsync,
  signatureFrom,
  txHash,
} from '@aave/types';
import {
  isError,
  type Signer,
  type TransactionResponse,
  type TypedDataField,
} from 'ethers';
import type {
  ERC20PermitHandler,
  ExecutionPlanHandler,
  SwapSignatureHandler,
  TransactionResult,
} from './types';

function ensureChain(
  signer: Signer,
  request: TransactionRequest,
): ResultAsync<Signer, UnexpectedError> {
  invariant(
    signer.provider,
    'Detached signer, the signer MUST have a provider',
  );

  return ResultAsync.fromPromise(signer.provider.getNetwork(), (err) =>
    UnexpectedError.from(err),
  ).andThen((network) => {
    if (chainId(network.chainId) === request.chainId) {
      return okAsync(signer);
    }
    return errAsync(
      new UnexpectedError(
        `Signer is on chain ${chainId(network.chainId)} but the request is for chain ${request.chainId}.`,
      ),
    );
  });
}

function sendEip1559Transaction(
  signer: Signer,
  request: TransactionRequest,
): ResultAsync<TransactionResponse, CancelError | SigningError> {
  return ResultAsync.fromPromise(
    signer.sendTransaction({
      to: request.to,
      data: request.data,
      value: request.value,
      from: request.from,
    }),
    (err) => {
      if (isError(err, 'ACTION_REJECTED')) {
        return CancelError.from(err);
      }
      return SigningError.from(err);
    },
  );
}

/**
 * @internal
 */
export function sendTransaction(
  signer: Signer,
  request: TransactionRequest,
): ResultAsync<
  TransactionResponse,
  CancelError | SigningError | UnexpectedError
> {
  return ensureChain(signer, request).andThen((_) =>
    sendEip1559Transaction(signer, request),
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
  CancelError | SigningError | TransactionError | UnexpectedError
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

function isTypedDataTypesField(
  value: unknown,
): value is Record<string, TypedDataField[]> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function signSwapTypedData(
  signer: Signer,
  result: SwapTypedData,
): ReturnType<SwapSignatureHandler> {
  invariant(isTypedDataTypesField(result.types), 'Invalid types');

  return ResultAsync.fromPromise(
    signer.signTypedData(result.domain, result.types, result.message),
    (err) => SigningError.from(err),
  ).map(signatureFrom);
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
  result: SwapTypedData,
): ReturnType<SwapSignatureHandler>;
export function signSwapTypedDataWith(
  signer: Signer,
  result?: SwapTypedData,
): SwapSignatureHandler | ReturnType<SwapSignatureHandler> {
  return result
    ? signSwapTypedData(signer, result)
    : signSwapTypedData.bind(null, signer);
}
