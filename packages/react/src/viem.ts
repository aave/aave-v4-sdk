import { type SigningError, UnexpectedError } from '@aave/client-next';
import {
  sendTransaction,
  signERC20PermitWith,
  signSwapTypedDataWith,
  supportedChains,
  waitForTransactionResult,
} from '@aave/client-next/viem';
import {
  type Chain,
  Currency,
  type DecimalNumber,
  type ERC20PermitSignature,
  type FiatAmount,
  type NativeAmount,
  type PermitRequest,
  type SwapByIntentTypedData,
  type TransactionRequest,
  type TxHashInput,
} from '@aave/graphql-next';
import {
  bigDecimal,
  invariant,
  never,
  ResultAsync,
  type TxHash,
} from '@aave/types-next';
import { useEffect } from 'react';
import {
  createPublicClient,
  http,
  type TransactionReceipt,
  type WalletClient,
} from 'viem';
import {
  PendingTransaction,
  ReadResult,
  type SuspendableResult,
  type UseAsyncTask,
  type UseSendTransactionResult,
  useAsyncTask,
} from './helpers';
import {
  type UseNetworkFee,
  type UseNetworkFeeRequestQuery,
  useExchangeRate,
} from './misc';
import { usePermitTypedDataAction } from './permits';

/**
 * A hook that provides a way to send Aave transactions using a viem WalletClient instance.
 *
 * Use the `useWalletClient` wagmi hook to get the `WalletClient` instance, then pass it to this hook to create a function that can be used to send transactions.
 *
 * ```ts
 * const { data: wallet } = useWalletClient(); // wagmi hook
 *
 * const [sendTransaction] = useSendTransaction(wallet);
 * ```
 *
 * @param walletClient - The wallet client to use for sending transactions.
 */
export function useSendTransaction(
  walletClient: WalletClient | undefined,
): UseSendTransactionResult {
  return useAsyncTask(
    (request: TransactionRequest) => {
      invariant(
        walletClient,
        'Expected a WalletClient to handle the operation result.',
      );

      return sendTransaction(walletClient, request).map(
        (hash) =>
          new PendingTransaction(() =>
            waitForTransactionResult(walletClient, request, hash),
          ),
      );
    },
    [walletClient],
  );
}

export type SignERC20PermitError = SigningError | UnexpectedError;

/**
 * A hook that provides a way to sign ERC20 permits using a viem WalletClient instance.
 *
 * ```ts
 * const { data: wallet } = useWalletClient(); // wagmi hook
 * const [signERC20Permit, { loading, error, data }] = useERC20Permit(wallet);
 *
 * const run = async () => {
 *   const result = await signERC20Permit({
 *     supply: {
 *       sender: evmAddress(wallet.account.address), // User's address
 *       reserve: {
 *         reserveId: reserve.id,
 *         chainId: reserve.chain.chainId,
 *         spoke: reserve.spoke.address,
 *       },
 *       amount: {
 *         value: bigDecimal(42), // 42 USDC
 *       },
 *     },
 *   });
 *
 *   if (result.isErr()) {
 *     console.error(result.error);
 *     return;
 *   }
 *
 *   console.log('ERC20 Permit signature:', result.value);
 * };
 * ```
 */
export function useERC20Permit(
  walletClient: WalletClient | undefined,
): UseAsyncTask<PermitRequest, ERC20PermitSignature, SignERC20PermitError> {
  const [permitTypedData] = usePermitTypedDataAction();

  return useAsyncTask(
    (request: PermitRequest) => {
      invariant(walletClient, 'Expected a WalletClient to sign ERC20 permits');

      return permitTypedData(request).andThen(
        signERC20PermitWith(walletClient),
      );
    },
    [permitTypedData, walletClient],
  );
}

export type SignSwapTypedDataError = SigningError | UnexpectedError;

/**
 * A hook that provides a way to sign swap typed data using a viem WalletClient instance.
 *
 * ```ts
 * const { data: wallet } = useWalletClient(); // wagmi hook
 * const [signSwapTypedData, { loading, error, data }] = useSignSwapTypedDataWith(wallet);
 *
 * const run = async () => {
 *   const result = await signSwapTypedData(swapTypedData);
 *
 *   if (result.isErr()) {
 *     console.error(result.error);
 *     return;
 *   }
 *
 *   console.log('Swap typed data signed:', result.value);
 * };
 * ```
 */
export function useSignSwapTypedDataWith(
  walletClient: WalletClient | undefined,
): UseAsyncTask<
  SwapByIntentTypedData,
  ERC20PermitSignature,
  SignSwapTypedDataError
> {
  return useAsyncTask(
    (typedData: SwapByIntentTypedData) => {
      invariant(
        walletClient,
        'Expected a WalletClient to sign swap typed data',
      );

      return signSwapTypedDataWith(walletClient)(typedData);
    },
    [walletClient],
  );
}

function extractTransactionDetails(
  query: UseNetworkFeeRequestQuery | null | undefined,
): [Chain, TxHash, Date] | [undefined, undefined, undefined] {
  if (!query) {
    return [undefined, undefined, undefined];
  }
  return 'chain' in query.activity &&
    'txHash' in query.activity &&
    'timestamp' in query.activity
    ? [query.activity.chain, query.activity.txHash, query.activity.timestamp]
    : [undefined, undefined, undefined];
}

function useTransactionReceipt(): UseAsyncTask<
  TxHashInput,
  TransactionReceipt,
  UnexpectedError
> {
  return useAsyncTask(({ chainId, txHash }: TxHashInput) => {
    const publicClient = createPublicClient({
      chain: supportedChains[chainId] ?? never(`Unsupported chain ${chainId}`),
      transport: http(),
    });

    return ResultAsync.fromPromise(
      publicClient.getTransactionReceipt({ hash: txHash }),
      (error) => UnexpectedError.from(error),
    );
  }, []);
}

function createNetworkFeeAmount(
  receipt: TransactionReceipt,
  chain: Chain,
  rate: FiatAmount,
): NativeAmount {
  const value = bigDecimal(receipt.gasUsed * receipt.effectiveGasPrice).rescale(
    -chain.nativeInfo.decimals,
  );

  const amount: DecimalNumber = {
    __typename: 'DecimalNumber',
    decimals: chain.nativeInfo.decimals,
    onChainValue: receipt.gasUsed,
    value,
  };

  return {
    __typename: 'NativeAmount',
    token: {
      __typename: 'NativeToken',
      info: chain.nativeInfo,
      chain,
    },
    amount,
    fiatAmount: {
      __typename: 'FiatAmount',
      value: value.mul(rate.value),
      name: rate.name,
      symbol: rate.symbol,
    },
    fiatRate: {
      __typename: 'DecimalNumber',
      decimals: 2,
      onChainValue: BigInt(rate.value.mul(10 ** 2).toString()),
      value: rate.value,
    },
  };
}

/**
 * Fetch the network fee for an ActivityItem.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 */
export const useNetworkFee: UseNetworkFee = (({
  query,
  currency = Currency.Usd,
  pause = false,
  suspense = false,
}: {
  query?: UseNetworkFeeRequestQuery;
  currency?: Currency;
  pause?: boolean;
  suspense?: boolean;
}): SuspendableResult<NativeAmount, UnexpectedError> => {
  const [fetchReceipt, receipt] = useTransactionReceipt();

  const [chain, txHash, timestamp] = extractTransactionDetails(query);

  const rate = useExchangeRate({
    from: chain
      ? {
          native: chain.chainId,
        }
      : undefined,
    to: currency,
    at: timestamp,
    pause,
    ...(suspense ? { suspense } : {}),
  });

  useEffect(() => {
    if (pause || !chain || !txHash || receipt.called) return;

    fetchReceipt({ chainId: chain.chainId, txHash });
  }, [fetchReceipt, chain, txHash, pause, receipt.called]);

  if (rate.paused) {
    return ReadResult.Paused(
      chain && receipt.data && rate.data
        ? createNetworkFeeAmount(receipt.data, chain, rate.data)
        : undefined,
      rate.error ? rate.error : undefined,
    );
  }

  if (!receipt.called || receipt.loading || rate.loading) {
    return ReadResult.Loading();
  }

  if (receipt.error || rate.error) {
    return ReadResult.Failure(
      receipt.error ?? rate.error ?? never('Unknown error'),
    );
  }

  invariant(
    receipt.data && chain && rate.data,
    'Expected receipt, chain, and rate data',
  );

  return ReadResult.Success(
    createNetworkFeeAmount(receipt.data, chain, rate.data),
  );
}) as UseNetworkFee;
