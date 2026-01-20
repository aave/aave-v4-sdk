import {
  SigningError,
  type TransactionError,
  ValidationError,
} from '@aave/core';
import type {
  ERC20PermitSignature,
  ExecutionPlan,
  TransactionRequest,
} from '@aave/graphql';
import {
  errAsync,
  okAsync,
  ResultAsync,
  type Signature,
  signatureFrom,
  type TxHash,
  txHash,
} from '@aave/types';
import type { PrivyClient } from '@privy-io/server-auth';
import { createPublicClient, http } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions';
import type {
  ExecutionPlanHandler,
  SignTypedDataError,
  TransactionResult,
  TypedData,
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
): ResultAsync<ExecutionPlan, E | SignTypedDataError> {
  return action().andThen((result) => {
    if (
      result.__typename === 'Erc20ApprovalRequired' &&
      result.approval.bySignature
    ) {
      const permitTypedData = result.approval.bySignature;
      return signTypedDataWith(privy, walletId, permitTypedData)
        .map((signature) => ({
          deadline: permitTypedData.message.deadline,
          value: signature,
        }))
        .andThen((permitSig) => action(permitSig));
    }
    return okAsync(result);
  });
}

function signTypedData(
  privy: PrivyClient,
  walletId: string,
  data: TypedData,
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

/**
 * Signs EIP-712 typed data (ERC-20 permits, swap intents, etc.) using the specified Privy wallet.
 * Returns the raw signature without any wrapping. Deadline encapsulation is handled by consumer code.
 *
 * @param privy - The Privy client instance.
 * @param walletId - The wallet ID to use for signing.
 * @param data - The typed data to sign.
 * @returns A ResultAsync containing the raw signature.
 */
export function signTypedDataWith(
  privy: PrivyClient,
  walletId: string,
  data: TypedData,
): ResultAsync<Signature, SignTypedDataError> {
  return signTypedData(privy, walletId, data).map(signatureFrom);
}
