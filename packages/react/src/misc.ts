import type { CurrencyQueryOptions } from '@aave/client-next';
import { exchangeRate } from '@aave/client-next/actions';
import type { UnexpectedError } from '@aave/core-next';
import type {
  Chain,
  ExchangeRateRequest,
  FiatAmount,
} from '@aave/graphql-next';
import {
  type ActivityItem,
  ChainQuery,
  type ChainRequest,
  ChainsFilter,
  ChainsQuery,
  ExchangeRateQuery,
  type NativeAmount,
  type PreviewAction,
} from '@aave/graphql-next';
import type { NullishDeep, Prettify } from '@aave/types-next';
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

export type UseChainArgs = ChainRequest;

/**
 * Fetch a specific chain by chain ID.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useChain({
 *   chainId: chainId(1),
 *   suspense: true,
 * });
 * // data will be Chain | null
 * ```
 */
export function useChain(
  args: UseChainArgs & Suspendable,
): SuspenseResult<Chain | null>;
/**
 * Fetch a specific chain by chain ID.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useChain({
 *   chainId: chainId(1),
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useChain(
  args: Pausable<UseChainArgs> & Suspendable,
): PausableSuspenseResult<Chain | null>;
/**
 * Fetch a specific chain by chain ID.
 *
 * ```tsx
 * const { data, error, loading } = useChain({
 *   chainId: chainId(1),
 * });
 * // data will be Chain | null
 * ```
 */
export function useChain(args: UseChainArgs): ReadResult<Chain | null>;
/**
 * Fetch a specific chain by chain ID.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useChain({
 *   chainId: chainId(1),
 *   pause: true,
 * });
 * ```
 */
export function useChain(
  args: Pausable<UseChainArgs>,
): PausableReadResult<Chain | null>;

export function useChain({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseChainArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<Chain | null, UnexpectedError> {
  return useSuspendableQuery({
    document: ChainQuery,
    variables: {
      request,
    },
    suspense,
    pause,
  });
}

/**
 * @deprecated Use `UseChainArgs` instead.
 */
export type UseAaveChainArgs = UseChainArgs;

/**
 * @deprecated Use `useChain` instead.
 */
export function useAaveChain(
  args: UseAaveChainArgs & Suspendable,
): SuspenseResult<Chain | null>;
/**
 * @deprecated Use `useChain` instead.
 */
export function useAaveChain(
  args: Pausable<UseAaveChainArgs> & Suspendable,
): PausableSuspenseResult<Chain | null>;
/**
 * @deprecated Use `useChain` instead.
 */
export function useAaveChain(args: UseAaveChainArgs): ReadResult<Chain | null>;
/**
 * @deprecated Use `useChain` instead.
 */
export function useAaveChain(
  args: Pausable<UseAaveChainArgs>,
): PausableReadResult<Chain | null>;
export function useAaveChain(
  args: NullishDeep<UseAaveChainArgs> & {
    suspense?: boolean;
    pause?: boolean;
  },
): SuspendableResult<Chain | null, UnexpectedError> {
  return useChain(args as Parameters<typeof useChain>[0]);
}

export type UseChainsArgs = {
  filter: ChainsFilter;
};
/**
 * Fetches the list of supported chains.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useChains({
 *   filter: ChainsFilter.ALL,
 *   suspense: true,
 * });
 * ```
 */
export function useChains(
  args: UseChainsArgs & Suspendable,
): SuspenseResult<Chain[]>;
/**
 * Fetches the list of supported chains.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useChains({
 *   filter: ChainsFilter.ALL,
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useChains(
  args: Pausable<UseChainsArgs> & Suspendable,
): PausableSuspenseResult<Chain[]>;
/**
 * Fetches the list of supported chains.
 *
 * ```tsx
 * const { data, error, loading } = useChains({
 *   filter: ChainsFilter.ALL,
 * });
 * ```
 */
export function useChains(args?: UseChainsArgs): ReadResult<Chain[]>;
/**
 * Fetches the list of supported chains.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useChains({
 *   filter: ChainsFilter.ALL,
 *   pause: true,
 * });
 * ```
 */
export function useChains(
  args?: Pausable<UseChainsArgs>,
): PausableReadResult<Chain[]>;

export function useChains(
  {
    suspense = false,
    pause = false,
    filter,
  }: NullishDeep<UseChainsArgs> & {
    suspense?: boolean;
    pause?: boolean;
  } = { filter: ChainsFilter.ALL },
): SuspendableResult<Chain[], UnexpectedError> {
  return useSuspendableQuery({
    document: ChainsQuery,
    variables: { filter },
    suspense,
    pause,
  });
}

/**
 * @deprecated Use `UseChainsArgs` instead.
 */
export type UseAaveChainsArgs = UseChainsArgs;

/**
 * @deprecated Use `useChains` instead.
 */
export function useAaveChains(
  args: UseAaveChainsArgs & Suspendable,
): SuspenseResult<Chain[]>;
/**
 * @deprecated Use `useChains` instead.
 */
export function useAaveChains(
  args: Pausable<UseAaveChainsArgs> & Suspendable,
): PausableSuspenseResult<Chain[]>;
/**
 * @deprecated Use `useChains` instead.
 */
export function useAaveChains(args?: UseAaveChainsArgs): ReadResult<Chain[]>;
/**
 * @deprecated Use `useChains` instead.
 */
export function useAaveChains(
  args?: Pausable<UseAaveChainsArgs>,
): PausableReadResult<Chain[]>;
export function useAaveChains(
  args?: NullishDeep<UseAaveChainsArgs> & {
    suspense?: boolean;
    pause?: boolean;
  },
): SuspendableResult<Chain[], UnexpectedError> {
  return useChains(args as Parameters<typeof useChains>[0]);
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

  return useSuspendableQuery({
    document: ExchangeRateQuery,
    variables: { request },
    suspense,
    pause,
    pollInterval: request.at
      ? 0
      : client.context.environment.exchangeRateInterval,
  });
}

export type UseNetworkFeeRequestQuery =
  | {
      activity: ActivityItem;
    }
  | {
      estimate: PreviewAction;
    };

export type UseNetworkFeeArgs = Prettify<
  {
    query: UseNetworkFeeRequestQuery;
  } & CurrencyQueryOptions
>;

type PausableUseNetworkFeeArgs = Partial<
  {
    query: Partial<UseNetworkFeeRequestQuery>;
  } & CurrencyQueryOptions
>;

/**
 * Fetch the network fee for an ActivityItem.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 */
export type UseNetworkFee<T extends NativeAmount = NativeAmount> =
  /**
   * Fetches the network fee for a past ActivityItem.
   *
   * This signature supports React Suspense:
   *
   * ```tsx
   * const { data } = useNetworkFee({
   *   query: { activity },
   *   suspense: true,
   * });
   *
   * data: NativeAmount
   * ```
   */
  ((args: UseNetworkFeeArgs & Suspendable) => SuspenseResult<T>) &
    /**
     * Fetches the network fee for a past ActivityItem.
     *
     * Pausable suspense mode.
     *
     * ```tsx
     * const { data, paused } = useNetworkFee({
     *   query: { activity },
     *   suspense: true,
     *   pause: true,
     * });
     *
     * data: NativeAmount | undefined
     * ```
     */
    ((
      args: Pausable<UseNetworkFeeArgs, PausableUseNetworkFeeArgs> &
        Suspendable,
    ) => PausableSuspenseResult<T>) &
    /**
     * Fetches the network fee for a past ActivityItem.
     *
     * ```tsx
     * const { data, error, loading } = useNetworkFee({
     *   query: { activity },
     * });
     * ```
     */
    ((args: UseNetworkFeeArgs) => ReadResult<T>) &
    /**
     * Fetches the network fee for a past ActivityItem.
     *
     * Pausable loading state mode.
     *
     * ```tsx
     * const { data, error, loading, paused } = useNetworkFee({
     *   query: { activity },
     *   pause: true,
     * });
     *
     * data: NativeAmount | undefined
     * ```
     */
    ((
      args: Pausable<UseNetworkFeeArgs, PausableUseNetworkFeeArgs>,
    ) => PausableReadResult<T>);
