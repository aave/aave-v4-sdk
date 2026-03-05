import { withdrawSwapQuote } from '@aave/client/actions';
import type { UnexpectedError, ValidationError } from '@aave/core';
import type { InsufficientLiquidityError, SwapQuote } from '@aave/graphql';
import {
  QuoteAccuracy,
  WithdrawSwapQuoteQuery,
  type WithdrawSwapQuoteRequest,
} from '@aave/graphql';
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

function injectWithdrawSwapQuoteAccuracy(
  request: NullishDeep<WithdrawSwapQuoteRequest>,
  accuracy: QuoteAccuracy,
): NullishDeep<WithdrawSwapQuoteRequest> {
  if ('market' in request && request.market) {
    return { market: { ...request.market, accuracy } };
  }
  return request;
}

export type UseWithdrawSwapQuoteArgs = Prettify<
  WithdrawSwapQuoteRequest & CurrencyQueryOptions
>;

/**
 * Fetch a quote for a withdraw swap operation with the specified parameters.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useWithdrawSwapQuote({
 *   market: {
 *     position: userSupplyItem.id,
 *     buyReserve: reserve.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   suspense: true,
 * });
 * ```
 */
export function useWithdrawSwapQuote(
  args: UseWithdrawSwapQuoteArgs & Suspendable,
): SuspenseResult<SwapQuote>;
/**
 * Fetch a quote for a withdraw swap operation with the specified parameters.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useWithdrawSwapQuote({
 *   market: {
 *     position: userSupplyItem.id,
 *     buyReserve: reserve.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useWithdrawSwapQuote(
  args: Pausable<UseWithdrawSwapQuoteArgs> & Suspendable,
): PausableSuspenseResult<SwapQuote>;
/**
 * Fetch a quote for a withdraw swap operation with the specified parameters.
 *
 * ```tsx
 * const { data, error, loading } = useWithdrawSwapQuote({
 *   market: {
 *     position: userSupplyItem.id,
 *     buyReserve: reserve.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 * });
 * ```
 */
export function useWithdrawSwapQuote(
  args: UseWithdrawSwapQuoteArgs,
): ReadResult<SwapQuote>;
/**
 * Fetch a quote for a withdraw swap operation with the specified parameters.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useWithdrawSwapQuote({
 *   market: {
 *     position: userSupplyItem.id,
 *     buyReserve: reserve.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   pause: true,
 * });
 * ```
 */
export function useWithdrawSwapQuote(
  args: Pausable<UseWithdrawSwapQuoteArgs>,
): PausableReadResult<SwapQuote>;

export function useWithdrawSwapQuote({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseWithdrawSwapQuoteArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<
  SwapQuote,
  UnexpectedError | ValidationError<InsufficientLiquidityError>
> {
  const client = useAaveClient();

  // Fast query - no polling, suspends in suspense mode for quick initial render
  const fastResult = useSuspendableQuery({
    document: WithdrawSwapQuoteQuery,
    variables: {
      request: injectWithdrawSwapQuoteAccuracy(request, QuoteAccuracy.Fast),
      currency,
    },
    selector: extractPositionSwapQuote,
    suspense,
    pause,
    batch: false, // Don't batch with Accurate query
  });

  // Accurate query - with polling, never suspends, fires after Fast in suspense mode
  const accurateResult = useSuspendableQuery({
    document: WithdrawSwapQuoteQuery,
    variables: {
      request: injectWithdrawSwapQuoteAccuracy(request, QuoteAccuracy.Accurate),
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
 * Low-level hook to execute a withdraw swap quote action directly.
 *
 * @remarks
 * This hook **does not** actively watch for updated data on the swap quote.
 * Use this hook to retrieve quotes on demand as part of a larger workflow.
 *
 * ```ts
 * const [getQuote, { called, data, error, loading }] = useWithdrawSwapQuoteAction();
 *
 * // …
 *
 * const result = await getQuote({
 *   position: userSupplyItem.id,
 *   buyReserve: reserve.id,
 *   amount: bigDecimal('1000'),
 *   user: evmAddress('0x742d35cc…'),
 * });
 *
 * if (result.isOk()) {
 *   console.log('Withdraw swap quote:', result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useWithdrawSwapQuoteAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<
  WithdrawSwapQuoteRequest,
  SwapQuote,
  UnexpectedError | ValidationError<InsufficientLiquidityError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: WithdrawSwapQuoteRequest) =>
      withdrawSwapQuote(client, request, {
        currency: options.currency,
        requestPolicy: 'network-only',
      }).andThen(extractPositionSwapQuote),
    [client, options.currency],
  );
}
