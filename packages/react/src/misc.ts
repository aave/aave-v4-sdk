import type { CurrencyQueryOptions } from '@aave/client-next';
import { exchangeRate } from '@aave/client-next/actions';
import type { UnexpectedError } from '@aave/core-next';
import type {
  Chain,
  ExchangeRateRequest,
  FiatAmount,
} from '@aave/graphql-next';
import {
  ChainsFilter,
  ChainsQuery,
  ExchangeRateQuery,
  type NativeAmount,
} from '@aave/graphql-next';
import {
  type ChainId,
  type NullishDeep,
  never,
  type Prettify,
  type TxHash,
} from '@aave/types-next';
import { useAaveClient } from './context';
import {
  type Pausable,
  type PausableReadResult,
  type PausableSuspenseResult,
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  useSuspendableQuery,
} from './helpers';
import { type UseAsyncTask, useAsyncTask } from './helpers/tasks';

export type UseAaveChainsArgs = {
  filter?: ChainsFilter;
};
/**
 * Fetches the list of supported chains.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useAaveChains({
 *   filter: ChainsFilter.ALL,
 *   suspense: true,
 * });
 * ```
 */
export function useAaveChains(
  args: UseAaveChainsArgs & Suspendable,
): SuspenseResult<Chain[]>;
/**
 * Fetches the list of supported chains.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useAaveChains({
 *   filter: ChainsFilter.ALL,
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useAaveChains(
  args: Pausable<UseAaveChainsArgs> & Suspendable,
): PausableSuspenseResult<Chain[]>;
/**
 * Fetches the list of supported chains.
 *
 * ```tsx
 * const { data, error, loading } = useAaveChains({
 *   filter: ChainsFilter.ALL,
 * });
 * ```
 */
export function useAaveChains(args: UseAaveChainsArgs): ReadResult<Chain[]>;
/**
 * Fetches the list of supported chains.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useAaveChains({
 *   filter: ChainsFilter.ALL,
 *   pause: true,
 * });
 * ```
 */
export function useAaveChains(
  args: Pausable<UseAaveChainsArgs>,
): PausableReadResult<Chain[]>;

export function useAaveChains({
  suspense = false,
  pause = false,
  filter = ChainsFilter.ALL,
}: NullishDeep<UseAaveChainsArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<Chain[], UnexpectedError> {
  return useSuspendableQuery({
    document: ChainsQuery,
    variables: { filter },
    suspense,
    pause,
  });
}

/**
 * Fetches exchange rates between tokens and fiat currencies.
 *
 * ```tsx
 * const [getExchangeRate, gettingRate] = useExchangeRateAction();
 *
 * const loading = gettingRate.loading;
 * const error = gettingRate.error;
 *
 * // …
 *
 * const result = await getExchangeRate({
 *   from: { erc20: { chainId: chainId(1), address: evmAddress('0xA0b86a33E6...') } },
 *   to: Currency.Usd,
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Exchange rate:', result.value);
 * ```
 */
export function useExchangeRateAction(): UseAsyncTask<
  ExchangeRateRequest,
  FiatAmount,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: ExchangeRateRequest) => exchangeRate(client, request),
    [client],
  );
}

export type UseExchangeRateArgs = ExchangeRateRequest;

/**
 * Fetches exchange rates between tokens and fiat currencies with automatic polling.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useExchangeRate({
 *   from: {
 *     erc20: {
 *       chainId: chainId(1),
 *       address: evmAddress('0xA0b86a33E6...')
 *     }
 *   },
 *   to: Currency.Usd,
 *   suspense: true,
 * });
 * ```
 */
export function useExchangeRate(
  args: UseExchangeRateArgs & Suspendable,
): SuspenseResult<FiatAmount>;
/**
 * Fetches exchange rates between tokens and fiat currencies with automatic polling.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useExchangeRate({
 *   from: {
 *     erc20: {
 *       chainId: chainId(1),
 *       address: evmAddress('0xA0b86a33E6...')
 *     }
 *   },
 *   to: Currency.Usd,
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useExchangeRate(
  args: Pausable<UseExchangeRateArgs> & Suspendable,
): PausableSuspenseResult<FiatAmount>;
/**
 * Fetches exchange rates between tokens and fiat currencies with automatic polling.
 *
 * ```tsx
 * const { data, error, loading } = useExchangeRate({
 *   from: {
 *     erc20: {
 *       chainId: chainId(1),
 *       address: evmAddress('0xA0b86a33E6...')
 *     }
 *   },
 *   to: Currency.Usd,
 * });
 *
 * <Component value={somewhere} fxRate={data} />
 * ```
 */
export function useExchangeRate(
  args: UseExchangeRateArgs,
): ReadResult<FiatAmount>;
/**
 * Fetches exchange rates between tokens and fiat currencies with automatic polling.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useExchangeRate({
 *   from: {
 *     erc20: {
 *       chainId: chainId(1),
 *       address: evmAddress('0xA0b86a33E6...')
 *     }
 *   },
 *   to: Currency.Usd,
 *   pause: true,
 * });
 * ```
 */
export function useExchangeRate(
  args: Pausable<UseExchangeRateArgs>,
): PausableReadResult<FiatAmount>;

export function useExchangeRate({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseExchangeRateArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<FiatAmount, UnexpectedError> {
  const client = useAaveClient();
  const pollInterval = client.context.environment.exchangeRateInterval;

  return useSuspendableQuery({
    document: ExchangeRateQuery,
    variables: { request },
    suspense,
    pause,
    pollInterval,
  });
}

export type UseNetworkFeeArgs = Prettify<
  {
    chainId: ChainId;
    txHash: TxHash;
  } & CurrencyQueryOptions
>;

/**
 * Fetches the network fee for a transaction.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useNetworkFee({
 *   chainId: chainId(1),
 *   txHash: txHash('0x123...'),
 *   suspense: true,
 * });
 *
 * data: NativeAmount
 * ```
 */
export function useNetworkFee(
  args: UseNetworkFeeArgs & Suspendable,
): SuspenseResult<NativeAmount>;
/**
 * Fetches the network fee for a transaction.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data, paused } = useNetworkFee({
 *   chainId: chainId(1),
 *   txHash: txHash('0x123...'),
 *   suspense: true,
 *   pause: true,
 * });
 *
 * data: NativeAmount | undefined
 * ```
 */
export function useNetworkFee(
  args: Pausable<UseNetworkFeeArgs> & Suspendable,
): PausableSuspenseResult<NativeAmount>;
/**
 * Fetches the network fee for a transaction.
 *
 * ```tsx
 * const { data, error, loading } = useNetworkFee({
 *   chainId: chainId(1),
 *   txHash: txHash('0x123...'),
 * });
 * ```
 */
export function useNetworkFee(
  args: UseNetworkFeeArgs,
): ReadResult<NativeAmount>;
/**
 * Fetches the network fee for a transaction.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useNetworkFee({
 *   chainId: chainId(1),
 *   txHash: txHash('0x123...'),
 *   pause: true,
 * });
 *
 * data: NativeAmount | undefined
 * ```
 */
export function useNetworkFee(
  args: Pausable<UseNetworkFeeArgs>,
): PausableReadResult<NativeAmount>;

export function useNetworkFee(
  _: NullishDeep<UseNetworkFeeArgs> & {
    suspense?: boolean;
    pause?: boolean;
  },
): SuspendableResult<NativeAmount, UnexpectedError, boolean> {
  never('Not implemented');
}
