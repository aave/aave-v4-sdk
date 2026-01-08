import {
  CancelError,
  SigningError,
  TransactionError,
  UnexpectedError,
  ValidationError,
} from '@aave/core';
import type {
  Chain,
  ExecutionPlan,
  PermitTypedDataResponse,
  SwapTypedData,
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
  defineChain,
  type ProviderRpcError,
  type RpcError,
  SwitchChainError,
  TransactionExecutionError,
  type Transport,
  type TypedData,
  type TypedDataDomain,
  UserRejectedRequestError,
  type Chain as ViemChain,
  type WalletClient,
} from 'viem';
import {
  estimateGas as estimateGasWithViem,
  sendTransaction as sendTransactionWithViem,
  signTypedData,
  waitForTransactionReceipt,
} from 'viem/actions';
import { mainnet, sepolia } from 'viem/chains';
import type { AaveClient } from './AaveClient';
import { chain as fetchChain } from './actions';
import type {
  ERC20PermitHandler,
  ExecutionPlanHandler,
  SwapSignatureHandler,
  TransactionResult,
} from './types';

function isRpcError(err: unknown): err is RpcError {
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

const devnetChain: ViemChain = defineChain({
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
 * @deprecated
 */
export const supportedChains: Record<ChainId, ViemChain> = {
  [chainId(devnetChain.id)]: devnetChain,
};

/**
 * @internal
 */
export function toViemChain(chain: Chain): ViemChain {
  // known chains
  switch (chain.chainId) {
    case chainId(mainnet.id):
      return mainnet;

    case chainId(sepolia.id):
      return sepolia;
  }

  // most likely a tenderly fork
  return defineChain({
    id: chain.chainId,
    name: chain.name,
    nativeCurrency: {
      name: chain.nativeInfo.name,
      symbol: chain.nativeInfo.symbol,
      decimals: chain.nativeInfo.decimals,
    },
    rpcUrls: { default: { http: [chain.rpcUrl] } },
    blockExplorers: {
      default: {
        name: `${chain.name} Explorer`,
        url: chain.explorerUrl,
      },
    },
  });
}

/**
 * @internal
 */
export function viemChainsFrom(chains: Chain[]): ViemChain[] {
  return chains.map(toViemChain);
}

/**
 * @internal
 */
export function ensureChain(
  aaveClient: AaveClient,
  walletClient: WalletClient,
  request: TransactionRequest,
): ResultAsync<void, CancelError | SigningError | UnexpectedError> {
  return ResultAsync.fromPromise(walletClient.getChainId(), (err) =>
    SigningError.from(err),
  ).andThen((chainId) => {
    if (chainId === request.chainId) {
      return okAsync();
    }

    return fetchChain(
      aaveClient,
      { chainId: request.chainId },
      { batch: false },
    ).andThen((chain) => {
      invariant(chain, `Chain ${request.chainId} is not supported`);

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

        if (code === SwitchChainError.code) {
          return ResultAsync.fromPromise(
            walletClient.addChain({ chain: toViemChain(chain) }),
            (err) => {
              if (
                isRpcError(err) &&
                err.code === UserRejectedRequestError.code
              ) {
                return CancelError.from(err);
              }
              return SigningError.from(err);
            },
          );
        }

        return err.asResultAsync();
      });
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
  walletClient: WalletClient<Transport, ViemChain, Account>,
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
): walletClient is WalletClient<Transport, ViemChain, Account> {
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

  return sendEip1559Transaction(walletClient, request);
}

/**
 * @internal
 */
export function transactionError(
  chain: ViemChain | undefined,
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
  data: PermitTypedDataResponse,
): ReturnType<ERC20PermitHandler> {
  invariant(walletClient.account, 'Wallet account is required');

  return ResultAsync.fromPromise(
    signTypedData(walletClient, {
      account: walletClient.account,
      domain: data.domain as TypedDataDomain,
      types: data.types as TypedData,
      primaryType: data.primaryType as keyof typeof data.types,
      message: data.message,
    }),
    (err) => SigningError.from(err),
  ).map((hex) => ({
    deadline: data.message.deadline,
    value: signatureFrom(hex),
  }));
}

/**
 * Creates an ERC20 permit handler that signs ERC20 permits using the provided wallet client.
 */
export function signERC20PermitWith(
  walletClient: WalletClient,
): ERC20PermitHandler;
/**
 * Signs ERC20 permits using the provided wallet client.
 */
export function signERC20PermitWith(
  walletClient: WalletClient,
  data: PermitTypedDataResponse,
): ReturnType<ERC20PermitHandler>;
export function signERC20PermitWith(
  walletClient: WalletClient,
  data?: PermitTypedDataResponse,
): ERC20PermitHandler | ReturnType<ERC20PermitHandler> {
  return typeof data === 'undefined'
    ? signERC20Permit.bind(null, walletClient)
    : signERC20Permit(walletClient, data);
}

function signSwapTypedData(
  walletClient: WalletClient,
  result: SwapTypedData,
): ReturnType<SwapSignatureHandler> {
  invariant(walletClient.account, 'Wallet account is required');

  return ResultAsync.fromPromise(
    signTypedData(walletClient, {
      account: walletClient.account,
      domain: result.domain as TypedDataDomain,
      types: result.types as TypedData,
      primaryType: result.primaryType,
      message: result.message,
    }),
    (err) => SigningError.from(err),
  ).map(signatureFrom);
}

/**
 * Creates a swap signature handler that signs swap typed data using the provided wallet client.
 */
export function signSwapTypedDataWith(
  walletClient: WalletClient,
): SwapSignatureHandler;
/**
 * Signs swap typed data using the provided wallet client.
 */
export function signSwapTypedDataWith(
  walletClient: WalletClient,
  result: SwapTypedData,
): ReturnType<SwapSignatureHandler>;
export function signSwapTypedDataWith(
  walletClient: WalletClient,
  result?: SwapTypedData,
): SwapSignatureHandler | ReturnType<SwapSignatureHandler> {
  return result
    ? signSwapTypedData(walletClient, result)
    : signSwapTypedData.bind(null, walletClient);
}
