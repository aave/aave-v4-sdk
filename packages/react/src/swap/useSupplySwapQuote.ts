import { supplySwapQuote } from '@aave/client/actions';
import type { UnexpectedError, ValidationError } from '@aave/core';
import type {
  InsufficientLiquidityError,
  SupplySwapQuoteRequest,
  SwapQuote,
} from '@aave/graphql';
import { QuoteAccuracy, SupplySwapQuoteQuery } from '@aave/graphql';
import type { NullishDeep, Prettify } from '@aave/types';

import { useAaveClient } from '../context';
import {
  type Pausable,
  type PausableReadResult,
  type PausableSuspenseResult,
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  useSuspendableQuery,
} from '../helpers';
import { type UseAsyncTask, useAsyncTask } from '../helpers/tasks';

import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  extractPositionSwapQuote,
} from './helpers';

function injectSupplySwapQuoteAccuracy(
  request: NullishDeep<SupplySwapQuoteRequest>,
  accuracy: QuoteAccuracy,
): NullishDeep<SupplySwapQuoteRequest> {
  if ('market' in request && request.market) {
    return { market: { ...request.market, accuracy } };
  }
  return request;
}

export type UseSupplySwapQuoteArgs = Prettify<
  SupplySwapQuoteRequest & CurrencyQueryOptions
>;

/**
 * Fetch a quote for a supply swap operation with the specified parameters.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useSupplySwapQuote({
 *   market: {
 *     sellPosition: userSupplyItem.id,
 *     buyReserve: reserve.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   suspense: true,
 * });
 * ```
 */
export function useSupplySwapQuote(
  args: UseSupplySwapQuoteArgs & Suspendable,
): SuspenseResult<SwapQuote>;
/**
 * Fetch a quote for a supply swap operation with the specified parameters.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useSupplySwapQuote({
 *   market: {
 *     sellPosition: userSupplyItem.id,
 *     buyReserve: reserve.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useSupplySwapQuote(
  args: Pausable<UseSupplySwapQuoteArgs> & Suspendable,
): PausableSuspenseResult<SwapQuote>;
/**
 * Fetch a quote for a supply swap operation with the specified parameters.
 *
 * ```tsx
 * const { data, error, loading } = useSupplySwapQuote({
 *   market: {
 *     sellPosition: userSupplyItem.id,
 *     buyReserve: reserve.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 * });
 * ```
 */
export function useSupplySwapQuote(
  args: UseSupplySwapQuoteArgs,
): ReadResult<SwapQuote>;
/**
 * Fetch a quote for a supply swap operation with the specified parameters.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useSupplySwapQuote({
 *   market: {
 *     sellPosition: userSupplyItem.id,
 *     buyReserve: reserve.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   pause: true,
 * });
 * ```
 */
export function useSupplySwapQuote(
  args: Pausable<UseSupplySwapQuoteArgs>,
): PausableReadResult<SwapQuote>;

export function useSupplySwapQuote({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseSupplySwapQuoteArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<
  SwapQuote,
  UnexpectedError | ValidationError<InsufficientLiquidityError>
> {
  const client = useAaveClient();

  // Fast query - no polling, suspends in suspense mode for quick initial render
  const fastResult = useSuspendableQuery({
    document: SupplySwapQuoteQuery,
    variables: {
      request: injectSupplySwapQuoteAccuracy(request, QuoteAccuracy.Fast),
      currency,
    },
    selector: extractPositionSwapQuote,
    suspense,
    pause,
    batch: false, // Don't batch with Accurate query
  });

  // Accurate query - with polling, never suspends, fires after Fast in suspense mode
  const accurateResult = useSuspendableQuery({
    document: SupplySwapQuoteQuery,
    variables: {
      request: injectSupplySwapQuoteAccuracy(request, QuoteAccuracy.Accurate),
      currency,
    },
    selector: extractPositionSwapQuote,
    suspense: false, // Never suspend on Accurate (would cause re-suspend)
    pause: pause || (suspense && !fastResult.data),
    pollInterval: client.context.environment.swapQuoteInterval,
    batch: false, // Don't batch with Fast query
  });

  const hasAccurateForCurrentCycle =
    accurateResult.data &&
    accurateResult.metadata.resultOperationKey ===
      accurateResult.metadata.operationKey;

  if (hasAccurateForCurrentCycle) {
    return accurateResult;
  }

  return fastResult;
}

/**
 * Low-level hook to execute a supply swap quote action directly.
 *
 * @remarks
 * This hook **does not** actively watch for updated data on the swap quote.
 * Use this hook to retrieve quotes on demand as part of a larger workflow.
 *
 * ```ts
 * const [getQuote, { called, data, error, loading }] = useSupplySwapQuoteAction();
 *
 * // …
 *
 * const result = await getQuote({
 *   sellPosition: userSupplyItem.id,
 *   buyReserve: reserve.id,
 *   amount: bigDecimal('1000'),
 *   user: evmAddress('0x742d35cc…'),
 * });
 *
 * if (result.isOk()) {
 *   console.log('Supply swap quote:', result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useSupplySwapQuoteAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<
  SupplySwapQuoteRequest,
  SwapQuote,
  UnexpectedError | ValidationError<InsufficientLiquidityError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: SupplySwapQuoteRequest) =>
      supplySwapQuote(client, request, {
        currency: options.currency,
        requestPolicy: 'network-only',
      }).andThen(extractPositionSwapQuote),
    [client, options.currency],
  );
}
