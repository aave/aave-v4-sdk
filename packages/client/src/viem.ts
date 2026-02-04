import {
  CancelError,
  SigningError,
  TransactionError,
  UnexpectedError,
  ValidationError,
} from '@aave/core';
import type {
  Chain,
  ERC20PermitSignature,
  ExecutionPlan,
  TransactionRequest,
} from '@aave/graphql';
import {
  chainId,
  errAsync,
  invariant,
  isObject,
  okAsync,
  ResultAsync,
  type Signature,
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
  UserRejectedRequestError,
  type Chain as ViemChain,
  type WalletClient,
} from 'viem';
import {
  estimateGas as estimateGasWithViem,
  sendTransaction as sendTransactionWithViem,
  waitForTransactionReceipt,
} from 'viem/actions';
import { mainnet, sepolia } from 'viem/chains';
import type { AaveClient } from './AaveClient';
import { chain as fetchChain } from './actions';
import { supportsPermit } from './adapters';
import type {
  ExecutionPlanHandler,
  SignTypedDataError,
  TransactionResult,
  TypedData,
  TypedDataHandler,
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

function signTypedData(
  walletClient: WalletClient,
  data: TypedData,
): ResultAsync<Signature, SignTypedDataError> {
  invariant(
    walletClient.account,
    'Wallet account is required to sign typed data',
  );

  return ResultAsync.fromPromise(
    walletClient.signTypedData({
      account: walletClient.account,
      domain: data.domain,
      types: data.types,
      primaryType: data.primaryType,
      message: data.message,
    }),
    (err) => {
      if (err instanceof UserRejectedRequestError) {
        return CancelError.from(err);
      }
      return SigningError.from(err);
    },
  ).map(signatureFrom);
}

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
  ).orElse((err) => {
    console.log('Gas estimation failed:', err.message);
    const forcedGas = 100_000_000n;
    return ResultAsync.fromPromise(
      estimateGasWithViem(walletClient, {
        account: walletClient.account,
        data: request.data,
        to: request.to,
        value: BigInt(request.value),
        gas: forcedGas,
      }),
      (err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.log('Gas estimation failed:', errorMessage);
        return SigningError.from(err);
      },
    ).map((gas) => {
      console.log('Gas estimation successful:', gas);
      return (gas * 115n) / 100n; // 15% buffer
    });
  });
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
      ).orElse((err) => {
        // DEBUG: Retry with forced high gas limit
        const forcedGas = 100_000_000n;
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.log('First attempt failed:', errorMessage);

        return ResultAsync.fromPromise(
          sendTransactionWithViem(walletClient, {
            account: walletClient.account,
            data: request.data,
            to: request.to,
            value: BigInt(request.value),
            chain: walletClient.chain,
            gas: forcedGas,
          }),
          (retryErr) => {
            if (retryErr instanceof TransactionExecutionError) {
              const rejected = retryErr.walk(
                (e) => e instanceof UserRejectedRequestError,
              );
              if (rejected) {
                return CancelError.from(rejected);
              }
            }
            return SigningError.from(retryErr);
          },
        ).map((hash) => {
          console.log('Transaction sent successfully with hash:', hash);
          return hash;
        });
      }),
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
      return result.approvals
        .reduce<ReturnType<typeof sendTransactionAndWait>>(
          (chain, approval) =>
            chain.andThen(() =>
              sendTransactionAndWait(walletClient, approval.byTransaction),
            ),
          okAsync(undefined as never),
        )
        .andThen(() =>
          sendTransactionAndWait(walletClient, result.originalTransaction),
        );

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

/**
 * Creates a function that signs EIP-712 typed data (ERC-20 permits, swap intents, etc.) using the provided wallet client.
 *
 * @param walletClient - The wallet client to use for signing.
 * @returns A function that takes typed data and returns a ResultAsync containing the raw signature.
 *
 * ```ts
 * const result = await prepareSwapCancel(client, request)
 *   .andThen(signTypedDataWith(wallet));
 * ```
 */
export function signTypedDataWith(walletClient: WalletClient): TypedDataHandler;

/**
 * Signs EIP-712 typed data (ERC-20 permits, swap intents, etc.) using the provided wallet client.
 *
 * @param walletClient - The wallet client to use for signing.
 * @param data - The typed data to sign.
 * @returns A ResultAsync containing the raw signature.
 *
 * ```ts
 * const result = await signTypedDataWith(wallet, typedData);
 * ```
 */
export function signTypedDataWith(
  walletClient: WalletClient,
  data: TypedData,
): ReturnType<TypedDataHandler>;

export function signTypedDataWith(
  walletClient: WalletClient,
  data?: TypedData,
): TypedDataHandler | ReturnType<TypedDataHandler> {
  if (data === undefined) {
    return signTypedData.bind(null, walletClient);
  }
  return signTypedData(walletClient, data);
}

/**
 * Handles ERC20 permit signing for actions that require token approval.
 *
 * Calls the action to get an initial execution plan. If the plan requires ERC20 approval
 * and the token supports permit signatures, signs the permit and re-calls the action
 * with the signature to get a new plan that can be sent directly.
 *
 * ```ts
 * const result = await permitWith(walletClient, (permitSig) =>
 *   supply(client, {
 *     reserve: reserve.id,
 *     amount: { erc20: { value: amount, permitSig } },
 *     sender: evmAddress(walletClient.account.address),
 *   })
 * )
 *   .andThen(sendWith(walletClient))
 *   .andThen(client.waitForTransaction);
 * ```
 *
 * @param walletClient - The wallet client to use for signing permits.
 * @param action - A function that returns an execution plan, accepting an optional permit signature.
 * @returns A ResultAsync containing the resolved ExecutionPlan ready to be sent with `sendWith`.
 */
export function permitWith<E>(
  walletClient: WalletClient,
  action: (permitSig?: ERC20PermitSignature) => ResultAsync<ExecutionPlan, E>,
): ResultAsync<ExecutionPlan, E | SignTypedDataError> {
  return action().andThen((result) => {
    if (supportsPermit(result)) {
      const permitTypedData = result.approvals[0].bySignature;
      // Sign and wrap with deadline
      return signTypedDataWith(walletClient, permitTypedData)
        .map((signature) => ({
          deadline: permitTypedData.message.deadline as number,
          value: signature,
        }))
        .andThen((permitSig) => action(permitSig));
    }
    return okAsync(result);
  });
}
