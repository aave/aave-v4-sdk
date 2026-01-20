import {
  CancelError,
  SigningError,
  TransactionError,
  UnexpectedError,
  ValidationError,
} from '@aave/core';
import type {
  ERC20PermitSignature,
  ExecutionPlan,
  PermitTypedData,
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
  type TypedDataDomain,
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
      return sendTransactionAndWait(
        signer,
        result.approval.byTransaction,
      ).andThen(() =>
        sendTransactionAndWait(signer, result.originalTransaction),
      );

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

export type PermitWithError = CancelError | SigningError;

/**
 * Handles ERC20 permit signing for actions that require token approval.
 *
 * Calls the action to get an initial execution plan. If the plan requires ERC20 approval
 * and the token supports permit signatures, signs the permit and re-calls the action
 * with the signature to get a new plan that can be sent directly.
 *
 * ```ts
 * const result = await permitWith(signer, (permitSig) =>
 *   supply(client, {
 *     reserve: reserve.id,
 *     amount: { erc20: { value: amount, permitSig } },
 *     sender: evmAddress(await signer.getAddress()),
 *   })
 * )
 *   .andThen(sendWith(signer))
 *   .andThen(client.waitForTransaction);
 * ```
 *
 * @param signer - The ethers signer to use for signing permits.
 * @param action - A function that returns an execution plan, accepting an optional permit signature.
 * @returns A ResultAsync containing the resolved ExecutionPlan ready to be sent with `sendWith`.
 */
export function permitWith<E>(
  signer: Signer,
  action: (permitSig?: ERC20PermitSignature) => ResultAsync<ExecutionPlan, E>,
): ResultAsync<ExecutionPlan, E | PermitWithError> {
  return action().andThen((result) => {
    if (
      result.__typename === 'Erc20ApprovalRequired' &&
      result.approval.bySignature
    ) {
      return signERC20Permit(signer, result.approval.bySignature).andThen(
        (permitSig) => action(permitSig),
      );
    }
    return okAsync(result);
  });
}

interface TypedDataLike {
  domain: TypedDataDomain;
  types: Record<string, TypedDataField[]>;
  message: Record<string, unknown>;
}

function signTypedData(
  signer: Signer,
  data: TypedDataLike,
): ResultAsync<string, CancelError | SigningError> {
  return ResultAsync.fromPromise(
    signer.signTypedData(data.domain, data.types, data.message),
    (err) => {
      if (isError(err, 'ACTION_REJECTED')) {
        return CancelError.from(err);
      }
      return SigningError.from(err);
    },
  );
}

function signERC20Permit(
  signer: Signer,
  data: PermitTypedData,
): ReturnType<ERC20PermitHandler> {
  return signTypedData(signer, data).map((signature) => ({
    deadline: data.message.deadline,
    value: signatureFrom(signature),
  }));
}

/**
 * Signs ERC20 permit typed data using the provided ethers signer.
 */
export function signERC20PermitWith(
  signer: Signer,
  data: PermitTypedData,
): ReturnType<ERC20PermitHandler> {
  return signERC20Permit(signer, data);
}

function isTypedDataTypesField(
  value: unknown,
): value is Record<string, TypedDataField[]> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function signSwapTypedData(
  signer: Signer,
  data: SwapTypedData,
): ReturnType<SwapSignatureHandler> {
  invariant(isTypedDataTypesField(data.types), 'Invalid types');

  return signTypedData(signer, {
    domain: data.domain,
    types: data.types,
    message: data.message,
  }).map(signatureFrom);
}

/**
 * Signs swap typed data using the provided ethers signer.
 */
export function signSwapTypedDataWith(
  signer: Signer,
  data: SwapTypedData,
): ReturnType<SwapSignatureHandler> {
  return signSwapTypedData(signer, data);
}
