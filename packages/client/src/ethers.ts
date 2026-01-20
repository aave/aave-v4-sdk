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
  ExecutionPlanHandler,
  SignTypedDataError,
  TransactionResult,
  TypedData,
  TypedDataHandler,
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

function signTypedData(
  signer: Signer,
  data: TypedData,
): ResultAsync<string, CancelError | SigningError> {
  // Cast to ethers types since TypedData uses JsonObject for types/domain/message
  const domain = data.domain as unknown as TypedDataDomain;
  const types = data.types as unknown as Record<string, TypedDataField[]>;
  const message = data.message as unknown as Record<string, unknown>;

  return ResultAsync.fromPromise(
    signer.signTypedData(domain, types, message),
    (err) => {
      if (isError(err, 'ACTION_REJECTED')) {
        return CancelError.from(err);
      }
      return SigningError.from(err);
    },
  );
}

/**
 * Creates a function that signs EIP-712 typed data (ERC-20 permits, swap intents, etc.) using the provided ethers signer.
 *
 * @param signer - The ethers signer to use for signing.
 * @returns A function that takes typed data and returns a ResultAsync containing the raw signature.
 *
 * ```ts
 * const result = await prepareSwapCancel(client, request)
 *   .andThen(signTypedDataWith(signer));
 * ```
 */
export function signTypedDataWith(signer: Signer): TypedDataHandler;

/**
 * Signs EIP-712 typed data (ERC-20 permits, swap intents, etc.) using the provided ethers signer.
 *
 * @param signer - The ethers signer to use for signing.
 * @param data - The typed data to sign.
 * @returns A ResultAsync containing the raw signature.
 *
 * ```ts
 * const result = await signTypedDataWith(signer, typedData);
 * ```
 */
export function signTypedDataWith(
  signer: Signer,
  data: TypedData,
): ReturnType<TypedDataHandler>;

export function signTypedDataWith(
  signer: Signer,
  data?: TypedData,
): TypedDataHandler | ReturnType<TypedDataHandler> {
  if (data === undefined) {
    return (typedData: TypedData) =>
      signTypedData(signer, typedData).map(signatureFrom);
  }
  return signTypedData(signer, data).map(signatureFrom);
}

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
): ResultAsync<ExecutionPlan, E | SignTypedDataError> {
  return action().andThen((result) => {
    if (
      result.__typename === 'Erc20ApprovalRequired' &&
      result.approval.bySignature
    ) {
      const permitTypedData = result.approval.bySignature;
      // Sign and wrap with deadline
      return signTypedDataWith(signer, permitTypedData)
        .map((signature) => ({
          deadline: permitTypedData.message.deadline,
          value: signatureFrom(signature),
        }))
        .andThen((permitSig) => action(permitSig));
    }
    return okAsync(result);
  });
}
