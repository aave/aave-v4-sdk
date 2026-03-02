import { repayWithSupplyQuote } from '@aave/client/actions';
import type { UnexpectedError, ValidationError } from '@aave/core';
import type { InsufficientLiquidityError, SwapQuote } from '@aave/graphql';
import {
  QuoteAccuracy,
  RepayWithSupplyQuoteQuery,
  type RepayWithSupplyQuoteRequest,
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

function injectRepayWithSupplyQuoteAccuracy(
  request: NullishDeep<RepayWithSupplyQuoteRequest>,
  accuracy: QuoteAccuracy,
): NullishDeep<RepayWithSupplyQuoteRequest> {
  if ('market' in request && request.market) {
    return { market: { ...request.market, accuracy } };
  }
  return request;
}

export type UseRepayWithSupplyQuoteArgs = Prettify<
  RepayWithSupplyQuoteRequest & CurrencyQueryOptions
>;

/**
 * Fetch a quote for a repay with supply operation with the specified parameters.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useRepayWithSupplyQuote({
 *   market: {
 *     sellPosition: userSupplyItem.id,
 *     buyPosition: userBorrowItem.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   suspense: true,
 * });
 * ```
 */
export function useRepayWithSupplyQuote(
  args: UseRepayWithSupplyQuoteArgs & Suspendable,
): SuspenseResult<SwapQuote>;
/**
 * Fetch a quote for a repay with supply operation with the specified parameters.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useRepayWithSupplyQuote({
 *   market: {
 *     sellPosition: userSupplyItem.id,
 *     buyPosition: userBorrowItem.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useRepayWithSupplyQuote(
  args: Pausable<UseRepayWithSupplyQuoteArgs> & Suspendable,
): PausableSuspenseResult<SwapQuote>;
/**
 * Fetch a quote for a repay with supply operation with the specified parameters.
 *
 * ```tsx
 * const { data, error, loading } = useRepayWithSupplyQuote({
 *   market: {
 *     sellPosition: userSupplyItem.id,
 *     buyPosition: userBorrowItem.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 * });
 * ```
 */
export function useRepayWithSupplyQuote(
  args: UseRepayWithSupplyQuoteArgs,
): ReadResult<SwapQuote>;
/**
 * Fetch a quote for a repay with supply operation with the specified parameters.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useRepayWithSupplyQuote({
 *   market: {
 *     sellPosition: userSupplyItem.id,
 *     buyPosition: userBorrowItem.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   pause: true,
 * });
 * ```
 */
export function useRepayWithSupplyQuote(
  args: Pausable<UseRepayWithSupplyQuoteArgs>,
): PausableReadResult<SwapQuote>;

export function useRepayWithSupplyQuote({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseRepayWithSupplyQuoteArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<
  SwapQuote,
  UnexpectedError | ValidationError<InsufficientLiquidityError>
> {
  const client = useAaveClient();

  // Fast query - no polling, suspends in suspense mode for quick initial render
  const fastResult = useSuspendableQuery({
    document: RepayWithSupplyQuoteQuery,
    variables: {
      request: injectRepayWithSupplyQuoteAccuracy(request, QuoteAccuracy.Fast),
      currency,
    },
    selector: extractPositionSwapQuote,
    suspense,
    pause,
    batch: false, // Don't batch with Accurate query
  });

  // Accurate query - with polling, never suspends, fires after Fast in suspense mode
  const accurateResult = useSuspendableQuery({
    document: RepayWithSupplyQuoteQuery,
    variables: {
      request: injectRepayWithSupplyQuoteAccuracy(
        request,
        QuoteAccuracy.Accurate,
      ),
      currency,
    },
    selector: extractPositionSwapQuote,
    suspense: false, // Never suspend on Accurate (would cause re-suspend)
    pause: pause || (suspense && !fastResult.data),
    pollInterval: client.context.environment.swapQuoteInterval,
    batch: false, // Don't batch with Fast query
  });

  if (accurateResult.data) {
    return accurateResult;
  }

  return fastResult;
}

/**
 * Low-level hook to execute a repay with supply quote action directly.
 *
 * @remarks
 * This hook **does not** actively watch for updated data on the swap quote.
 * Use this hook to retrieve quotes on demand as part of a larger workflow.
 *
 * ```ts
 * const [getQuote, { called, data, error, loading }] = useRepayWithSupplyQuoteAction();
 *
 * // …
 *
 * const result = await getQuote({
 *   repayWithReserve: reserve.id,
 *   debtPosition: userBorrowItem.id,
 *   amount: bigDecimal('1000'),
 *   user: evmAddress('0x742d35cc…'),
 * });
 *
 * if (result.isOk()) {
 *   console.log('Repay with supply quote:', result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useRepayWithSupplyQuoteAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<
  RepayWithSupplyQuoteRequest,
  SwapQuote,
  UnexpectedError | ValidationError<InsufficientLiquidityError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: RepayWithSupplyQuoteRequest) =>
      repayWithSupplyQuote(client, request, {
        currency: options.currency,
        requestPolicy: 'network-only',
      }).andThen(extractPositionSwapQuote),
    [client, options.currency],
  );
}
