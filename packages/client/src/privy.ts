import {
  SigningError,
  type TransactionError,
  ValidationError,
} from '@aave/core';
import type {
  ExecutionPlan,
  PermitTypedDataResponse,
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

function signERC20Permit(
  privy: PrivyClient,
  walletId: string,
  result: PermitTypedDataResponse,
): ReturnType<ERC20PermitHandler> {
  return ResultAsync.fromPromise(
    privy.walletApi.ethereum.signTypedData({
      walletId,
      typedData: {
        domain: result.domain,
        types: result.types,
        message: result.message,
        primaryType: result.primaryType,
      },
    }),
    (err) => SigningError.from(err),
  ).map((response) => ({
    deadline: result.message.deadline,
    value: signatureFrom(response.signature),
  }));
}

/**
 * Creates an ERC20 permit handler that signs ERC20 permits using the specified Privy wallet.
 */
export function signERC20PermitWith(
  privy: PrivyClient,
  walletId: string,
): ERC20PermitHandler {
  return signERC20Permit.bind(null, privy, walletId);
}

function signSwapTypedData(
  privy: PrivyClient,
  walletId: string,
  result: SwapTypedData,
): ReturnType<SwapSignatureHandler> {
  return ResultAsync.fromPromise(
    privy.walletApi.ethereum.signTypedData({
      walletId,
      typedData: {
        domain: result.domain,
        types: result.types,
        message: result.message,
        primaryType: result.primaryType,
      },
    }),
    (err) => SigningError.from(err),
  ).map((response) => signatureFrom(response.signature));
}

/**
 * @internal
 * Creates a swap signature handler that signs swap typed data using the specified Privy wallet.
 */
export function signSwapTypedDataWith(
  privy: PrivyClient,
  walletId: string,
): SwapSignatureHandler;
/**
 * @internal
 * Signs swap typed data using the specified Privy wallet.
 */
export function signSwapTypedDataWith(
  privy: PrivyClient,
  walletId: string,
  result: SwapTypedData,
): ReturnType<SwapSignatureHandler>;
export function signSwapTypedDataWith(
  privy: PrivyClient,
  walletId: string,
  result?: SwapTypedData,
): SwapSignatureHandler | ReturnType<SwapSignatureHandler> {
  return result
    ? signSwapTypedData(privy, walletId, result)
    : signSwapTypedData.bind(null, privy, walletId);
}
