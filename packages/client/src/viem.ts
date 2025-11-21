import {
  CancelError,
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
  type ChainId,
  chainId,
  errAsync,
  invariant,
  isObject,
  okAsync,
  ResultAsync,
  signatureFrom,
  type TxHash,
  txHash,
} from '@aave/types';
import {
  type Account,
  type Chain,
  defineChain,
  type ProviderRpcError,
  type RpcError,
  SwitchChainError,
  TransactionExecutionError,
  type Transport,
  type TypedData,
  type TypedDataDomain,
  UserRejectedRequestError,
  type WalletClient,
} from 'viem';
import {
  estimateGas as estimateGasWithViem,
  sendTransaction as sendTransactionWithViem,
  signTypedData,
  waitForTransactionReceipt,
} from 'viem/actions';
import type {
  ERC20PermitHandler,
  ExecutionPlanHandler,
  SwapSignatureHandler,
  TransactionResult,
} from './types';

/**
 * @internal
 */
export function isRpcError(err: unknown): err is RpcError {
  return isObject(err) && 'code' in err && 'message' in err;
}

function isProviderRpcError(
  err: unknown,
): err is ProviderRpcError<{ originalError?: { code: number } }> {
  return isObject(err) &&
    'name' in err &&
    'message' in err &&
    'originalError' in err
    ? isRpcError(err.originalError) && 'code' in err.originalError
    : true;
}

/**
 * @internal
 */
export const devnetChain: Chain = defineChain({
  id: Number.parseInt(import.meta.env.ETHEREUM_TENDERLY_FORK_ID, 10),
  name: 'Devnet',
  network: 'ethereum-fork',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [import.meta.env.ETHEREUM_TENDERLY_PUBLIC_RPC] },
  },
  blockExplorers: {
    default: {
      name: 'Devnet Explorer',
      url: import.meta.env.ETHEREUM_TENDERLY_BLOCKEXPLORER,
    },
  },
});

/**
 * @internal
 */
export const supportedChains: Record<
  ChainId,
  ReturnType<typeof defineChain>
> = {
  // TODO add them back when deployed on these chains
  // [chainId(mainnet.id)]: mainnet,
  // [chainId(sepolia.id)]: sepolia,
  [chainId(devnetChain.id)]: devnetChain,
};

function ensureChain(
  walletClient: WalletClient,
  request: TransactionRequest,
): ResultAsync<void, CancelError | SigningError> {
  return ResultAsync.fromPromise(walletClient.getChainId(), (err) =>
    SigningError.from(err),
  ).andThen((chainId) => {
    if (chainId === request.chainId) {
      return okAsync();
    }

    return ResultAsync.fromPromise(
      walletClient.switchChain({ id: request.chainId }),
      (err) => SigningError.from(err),
    ).orElse((err) => {
      const code = isRpcError(err.cause)
        ? err.cause.code
        : // Unwrapping for MetaMask Mobile
          // https://github.com/MetaMask/metamask-mobile/issues/2944#issuecomment-976988719
          isProviderRpcError(err.cause)
          ? err.cause.data?.originalError?.code
          : undefined;

      if (
        code === SwitchChainError.code &&
        request.chainId in supportedChains
      ) {
        return ResultAsync.fromPromise(
          walletClient.addChain({ chain: supportedChains[request.chainId] }),
          (err) => {
            if (isRpcError(err) && err.code === UserRejectedRequestError.code) {
              return CancelError.from(err);
            }
            return SigningError.from(err);
          },
        );
      }

      return err.asResultAsync();
    });
  });
}

function estimateGas(
  walletClient: WalletClient,
  request: TransactionRequest,
): ResultAsync<bigint, SigningError> {
  return ResultAsync.fromPromise(
    estimateGasWithViem(walletClient, {
      account: walletClient.account,
      data: request.data,
      to: request.to,
      value: BigInt(request.value),
    }),
    (err) => SigningError.from(err),
  ).map((gas) => (gas * 115n) / 100n); // 15% buffer
}

function sendEip1559Transaction(
  walletClient: WalletClient<Transport, Chain, Account>,
  request: TransactionRequest,
): ResultAsync<TxHash, CancelError | SigningError> {
  return estimateGas(walletClient, request)
    .andThen((gas) =>
      ResultAsync.fromPromise(
        sendTransactionWithViem(walletClient, {
          account: walletClient.account,
          data: request.data,
          to: request.to,
          value: BigInt(request.value),
          chain: walletClient.chain,
          gas,
        }),
        (err) => {
          if (err instanceof TransactionExecutionError) {
            const rejected = err.walk(
              (err) => err instanceof UserRejectedRequestError,
            );

            if (rejected) {
              return CancelError.from(rejected);
            }
          }
          return SigningError.from(err);
        },
      ),
    )
    .map(txHash);
}

function isWalletClientWithAccount(
  walletClient: WalletClient,
): walletClient is WalletClient<Transport, Chain, Account> {
  return walletClient.account !== undefined;
}

/**
 * @internal
 */
export function sendTransaction(
  walletClient: WalletClient,
  request: TransactionRequest,
): ResultAsync<TxHash, CancelError | SigningError> {
  invariant(
    isWalletClientWithAccount(walletClient),
    'Wallet client with account is required',
  );

  return ensureChain(walletClient, request).andThen((_) =>
    sendEip1559Transaction(walletClient, request),
  );
}

/**
 * @internal
 */
export function transactionError(
  chain: Chain | undefined,
  txHash: TxHash,
  request: TransactionRequest,
): TransactionError {
  const baseUrl = chain?.blockExplorers?.default?.url;
  const link = baseUrl && new URL(`/tx/${txHash}`, baseUrl).toString();

  return TransactionError.new({ txHash, request, link });
}

/**
 * @internal
 */
export function waitForTransactionResult(
  walletClient: WalletClient,
  request: TransactionRequest,
  initialTxHash: TxHash,
): ResultAsync<
  TransactionResult,
  CancelError | TransactionError | UnexpectedError
> {
  return ResultAsync.fromPromise(
    waitForTransactionReceipt(walletClient, {
      hash: initialTxHash,
      pollingInterval: 100,
      retryCount: 20,
      retryDelay: 50,
    }),
    (err) => UnexpectedError.from(err),
  ).andThen((receipt) => {
    const hash = txHash(receipt.transactionHash);

    switch (receipt.status) {
      case 'reverted':
        if (initialTxHash !== hash) {
          return errAsync(CancelError.from(`Transaction replaced by ${hash}`));
        }
        return errAsync(transactionError(walletClient.chain, hash, request));
      case 'success':
        return okAsync({
          // viem's waitForTransactionReceipt supports transaction replacement
          // so it's important to use the transaction hash from the receipt
          txHash: hash,
          operations: request.operations,
        });
    }
  });
}

function sendTransactionAndWait(
  walletClient: WalletClient,
  request: TransactionRequest,
): ResultAsync<
  TransactionResult,
  CancelError | SigningError | TransactionError | UnexpectedError
> {
  return sendTransaction(walletClient, request).andThen((hash) =>
    waitForTransactionResult(walletClient, request, hash),
  );
}

function executePlan(
  walletClient: WalletClient,
  result: ExecutionPlan,
): ReturnType<ExecutionPlanHandler> {
  switch (result.__typename) {
    case 'TransactionRequest':
      return sendTransactionAndWait(walletClient, result);

    case 'Erc20ApprovalRequired':
    case 'PreContractActionRequired':
      return sendTransactionAndWait(walletClient, result.transaction).andThen(
        () => sendTransactionAndWait(walletClient, result.originalTransaction),
      );

    case 'InsufficientBalanceError':
      return errAsync(ValidationError.fromGqlNode(result));
  }
}

/**
 * Creates an execution plan handler that sends transactions using the provided wallet client.
 */
export function sendWith(walletClient: WalletClient): ExecutionPlanHandler;
/**
 * Sends execution plan transactions using the provided wallet client.
 */
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  walletClient: WalletClient,
  result: T,
): ReturnType<ExecutionPlanHandler<T>>;
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  walletClient: WalletClient,
  result?: T,
): ExecutionPlanHandler<T> | ReturnType<ExecutionPlanHandler<T>> {
  return result
    ? executePlan(walletClient, result)
    : executePlan.bind(null, walletClient);
}

function signERC20Permit(
  walletClient: WalletClient,
  result: PermitTypedDataResponse,
): ReturnType<ERC20PermitHandler> {
  invariant(walletClient.account, 'Wallet account is required');

  return ResultAsync.fromPromise(
    signTypedData(walletClient, {
      account: walletClient.account,
      domain: result.domain as TypedDataDomain,
      types: result.types as TypedData,
      primaryType: result.primaryType as keyof typeof result.types,
      message: result.message,
    }),
    (err) => SigningError.from(err),
  ).map((hex) => ({
    deadline: result.message.deadline,
    value: signatureFrom(hex),
  }));
}

/**
 * Creates an ERC20 permit handler that signs ERC20 permits using the provided wallet client.
 */
export function signERC20PermitWith(
  walletClient: WalletClient,
): ERC20PermitHandler {
  return signERC20Permit.bind(null, walletClient);
}

function signSwapTypedData(
  walletClient: WalletClient,
  result: SwapByIntentTypedData | CancelSwapTypedData,
): ReturnType<SwapSignatureHandler> {
  invariant(walletClient.account, 'Wallet account is required');

  return ResultAsync.fromPromise(
    signTypedData(walletClient, {
      account: walletClient.account,
      domain: result.domain as TypedDataDomain,
      types: result.types as TypedData,
      primaryType: result.primaryType,
      message: JSON.parse(result.message),
    }),
    (err) => SigningError.from(err),
  ).map((hex) => ({
    deadline: JSON.parse(result.message).deadline,
    value: signatureFrom(hex),
  }));
}

/**
 * @internal
 * Creates a swap signature handler that signs swap typed data using the provided wallet client.
 */
export function signSwapTypedDataWith(
  walletClient: WalletClient,
): SwapSignatureHandler;
/**
 * @internal
 * Signs swap typed data using the provided wallet client.
 */
export function signSwapTypedDataWith(
  walletClient: WalletClient,
  result: SwapByIntentTypedData | CancelSwapTypedData,
): ReturnType<SwapSignatureHandler>;
export function signSwapTypedDataWith(
  walletClient: WalletClient,
  result?: SwapByIntentTypedData | CancelSwapTypedData,
): SwapSignatureHandler | ReturnType<SwapSignatureHandler> {
  return result
    ? signSwapTypedData(walletClient, result)
    : signSwapTypedData.bind(null, walletClient);
}
