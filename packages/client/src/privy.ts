import {
  type CancelError,
  SigningError,
  type TransactionError,
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
  errAsync,
  okAsync,
  ResultAsync,
  signatureFrom,
  type TxHash,
  txHash,
} from '@aave/types';
import type { PrivyClient } from '@privy-io/server-auth';
import { createPublicClient, http } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions';
import type {
  ERC20PermitHandler,
  ExecutionPlanHandler,
  SwapSignatureHandler,
  TransactionResult,
} from './types';
import { supportedChains, transactionError } from './viem';

async function sendTransaction(
  privy: PrivyClient,
  request: TransactionRequest,
  walletId: string,
): Promise<TxHash> {
  const { hash } = await privy.walletApi.ethereum.sendTransaction({
    walletId,
    caip2: `eip155:${request.chainId}`,
    transaction: {
      from: request.from,
      to: request.to,
      value: `0x${BigInt(request.value).toString(16)}`,
      chainId: request.chainId,
      data: request.data,
    },
  });
  return txHash(hash);
}

function sendTransactionAndWait(
  privy: PrivyClient,
  request: TransactionRequest,
  walletId: string,
): ResultAsync<TransactionResult, SigningError | TransactionError> {
  // TODO: verify it's on the correct chain, ask to switch if possible
  // TODO: verify if wallet account is correct, switch if possible
  const publicClient = createPublicClient({
    chain: supportedChains[request.chainId],
    transport: http(),
  });

  return ResultAsync.fromPromise(
    sendTransaction(privy, request, walletId),
    (err) => SigningError.from(err),
  )
    .map(async (hash) =>
      waitForTransactionReceipt(publicClient, {
        hash,
        pollingInterval: 100,
        retryCount: 20,
        retryDelay: 50,
      }),
    )
    .andThen((receipt) => {
      const hash = txHash(receipt.transactionHash);

      if (receipt.status === 'reverted') {
        return errAsync(
          transactionError(supportedChains[request.chainId], hash, request),
        );
      }
      return okAsync({
        txHash: hash,
        operations: request.operations,
      });
    });
}

function executePlan(
  privy: PrivyClient,
  walletId: string,
  result: ExecutionPlan,
): ReturnType<ExecutionPlanHandler> {
  switch (result.__typename) {
    case 'TransactionRequest':
      return sendTransactionAndWait(privy, result, walletId);

    case 'Erc20ApprovalRequired':
      return sendTransactionAndWait(
        privy,
        result.approval.byTransaction,
        walletId,
      ).andThen(() =>
        sendTransactionAndWait(privy, result.originalTransaction, walletId),
      );

    case 'PreContractActionRequired':
      return sendTransactionAndWait(
        privy,
        result.transaction,
        walletId,
      ).andThen(() =>
        sendTransactionAndWait(privy, result.originalTransaction, walletId),
      );

    case 'InsufficientBalanceError':
      return errAsync(ValidationError.fromGqlNode(result));
  }
}

/**
 * Creates an execution plan handler that sends transactions using the specified Privy wallet.
 */
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  privy: PrivyClient,
  walletId: string,
): ExecutionPlanHandler<T>;
/**
 * Sends execution plan transactions using the specified Privy wallet.
 */
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  privy: PrivyClient,
  walletId: string,
  result: T,
): ReturnType<ExecutionPlanHandler<T>>;
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  privy: PrivyClient,
  walletId: string,
  result?: T,
): ExecutionPlanHandler<T> | ReturnType<ExecutionPlanHandler<T>> {
  return result
    ? executePlan(privy, walletId, result)
    : executePlan.bind(null, privy, walletId);
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
 * const result = await permitWith(privy, walletId, (permitSig) =>
 *   supply(client, {
 *     reserve: reserve.id,
 *     amount: { erc20: { value: amount, permitSig } },
 *     sender: evmAddress(walletAddress),
 *   })
 * )
 *   .andThen(sendWith(privy, walletId))
 *   .andThen(client.waitForTransaction);
 * ```
 *
 * @param privy - The Privy client for signing permits.
 * @param walletId - The ID of the Privy wallet to use.
 * @param action - A function that returns an execution plan, accepting an optional permit signature.
 * @returns A ResultAsync containing the resolved ExecutionPlan ready to be sent with `sendWith`.
 */
export function permitWith<E>(
  privy: PrivyClient,
  walletId: string,
  action: (permitSig?: ERC20PermitSignature) => ResultAsync<ExecutionPlan, E>,
): ResultAsync<ExecutionPlan, E | PermitWithError> {
  return action().andThen((result) => {
    if (
      result.__typename === 'Erc20ApprovalRequired' &&
      result.approval.bySignature
    ) {
      return signERC20Permit(
        privy,
        walletId,
        result.approval.bySignature,
      ).andThen((permitSig) => action(permitSig));
    }
    return okAsync(result);
  });
}

type TypedDataLike = {
  domain: Record<string, unknown>;
  types: Record<string, unknown>;
  message: Record<string, unknown>;
  primaryType: string;
};

function signTypedData(
  privy: PrivyClient,
  walletId: string,
  data: TypedDataLike,
): ResultAsync<string, SigningError> {
  return ResultAsync.fromPromise(
    privy.walletApi.ethereum.signTypedData({
      walletId,
      typedData: {
        domain: data.domain,
        types: data.types,
        message: data.message,
        primaryType: data.primaryType,
      },
    }),
    (err) => SigningError.from(err),
  ).map((response) => response.signature);
}

function signERC20Permit(
  privy: PrivyClient,
  walletId: string,
  data: PermitTypedData,
): ReturnType<ERC20PermitHandler> {
  return signTypedData(privy, walletId, data).map((signature) => ({
    deadline: data.message.deadline,
    value: signatureFrom(signature),
  }));
}

/**
 * Signs ERC20 permit typed data using the specified Privy wallet.
 */
export function signERC20PermitWith(
  privy: PrivyClient,
  walletId: string,
  data: PermitTypedData,
): ReturnType<ERC20PermitHandler> {
  return signERC20Permit(privy, walletId, data);
}

function signSwapTypedData(
  privy: PrivyClient,
  walletId: string,
  data: SwapTypedData,
): ReturnType<SwapSignatureHandler> {
  return signTypedData(privy, walletId, data).map(signatureFrom);
}

/**
 * Signs swap typed data using the specified Privy wallet.
 */
export function signSwapTypedDataWith(
  privy: PrivyClient,
  walletId: string,
  data: SwapTypedData,
): ReturnType<SwapSignatureHandler> {
  return signSwapTypedData(privy, walletId, data);
}
