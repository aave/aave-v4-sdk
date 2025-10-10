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

export function useExchangeRate({
  suspense = false,
  ...request
}: UseExchangeRateArgs & {
  suspense?: boolean;
}): SuspendableResult<FiatAmount> {
  const client = useAaveClient();
  const pollInterval = client.context.environment.exchangeRateInterval;

  return useSuspendableQuery({
    document: ExchangeRateQuery,
    variables: { request },
    suspense,
    pollInterval,
  });
}
