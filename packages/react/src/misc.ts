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
} from '@aave/graphql-next';
import { useAaveClient } from './context';
import {
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
 * ```tsx
 * const { data, error, loading } = useAaveChains({
 *   filter: ChainsFilter.ALL,
 * });
 * ```
 */
export function useAaveChains(args: UseAaveChainsArgs): ReadResult<Chain[]>;

export function useAaveChains({
  suspense = false,
  filter = ChainsFilter.ALL,
}: UseAaveChainsArgs & {
  suspense?: boolean;
}): SuspendableResult<Chain[]> {
  return useSuspendableQuery({
    document: ChainsQuery,
    variables: { filter },
    suspense,
  });
}

/**
 * Fetches the exchange rate between tokens and fiat currencies.
 *
 * ```tsx
 * const [getExchangeRate, gettingRate] = useExchangeRate();
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
export function useExchangeRate(): UseAsyncTask<
  ExchangeRateRequest,
  FiatAmount,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: ExchangeRateRequest) =>
    exchangeRate(client, request),
  );
}

export type UseLiveExchangeRateArgs = ExchangeRateRequest;

/**
 * Fetches exchange rates between tokens and fiat currencies.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useLiveExchangeRate({
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
export function useLiveExchangeRate(
  args: UseLiveExchangeRateArgs & Suspendable,
): SuspenseResult<FiatAmount>;

/**
 * Fetches exchange rates between tokens and fiat currencies.
 *
 * ```tsx
 * const { data, error, loading } = useLiveExchangeRate({
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
export function useLiveExchangeRate(
  args: UseLiveExchangeRateArgs,
): ReadResult<FiatAmount>;

export function useLiveExchangeRate({
  suspense = false,
  ...request
}: UseLiveExchangeRateArgs & {
  suspense?: boolean;
}): SuspendableResult<FiatAmount> {
  return useSuspendableQuery({
    document: ExchangeRateQuery,
    variables: { request },
    suspense,
    pollInterval: 10000,
    requestPolicy: 'cache-and-network',
  });
}
