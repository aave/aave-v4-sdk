import { borrowSwapQuote } from '@aave/client/actions';
import type { UnexpectedError, ValidationError } from '@aave/core';
import type { InsufficientLiquidityError, SwapQuote } from '@aave/graphql';
import {
  BorrowSwapQuoteQuery,
  type BorrowSwapQuoteRequest,
  QuoteAccuracy,
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

function injectBorrowSwapQuoteAccuracy(
  request: NullishDeep<BorrowSwapQuoteRequest>,
  accuracy: QuoteAccuracy,
): NullishDeep<BorrowSwapQuoteRequest> {
  if ('market' in request && request.market) {
    return { market: { ...request.market, accuracy } };
  }
  return request;
}

export type UseBorrowSwapQuoteArgs = Prettify<
  BorrowSwapQuoteRequest & CurrencyQueryOptions
>;

/**
 * Fetch a quote for a borrow swap operation with the specified parameters.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useBorrowSwapQuote({
 *   market: {
 *     sellPosition: userBorrowItem.id,
 *     buyReserve: reserve.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   suspense: true,
 * });
 * ```
 */
export function useBorrowSwapQuote(
  args: UseBorrowSwapQuoteArgs & Suspendable,
): SuspenseResult<SwapQuote>;
/**
 * Fetch a quote for a borrow swap operation with the specified parameters.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useBorrowSwapQuote({
 *   market: {
 *     sellPosition: userBorrowItem.id,
 *     buyReserve: reserve.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useBorrowSwapQuote(
  args: Pausable<UseBorrowSwapQuoteArgs> & Suspendable,
): PausableSuspenseResult<SwapQuote>;
/**
 * Fetch a quote for a borrow swap operation with the specified parameters.
 *
 * ```tsx
 * const { data, error, loading } = useBorrowSwapQuote({
 *   market: {
 *     sellPosition: userBorrowItem.id,
 *     buyReserve: reserve.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 * });
 * ```
 */
export function useBorrowSwapQuote(
  args: UseBorrowSwapQuoteArgs,
): ReadResult<SwapQuote>;
/**
 * Fetch a quote for a borrow swap operation with the specified parameters.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useBorrowSwapQuote({
 *   market: {
 *     sellPosition: userBorrowItem.id,
 *     buyReserve: reserve.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   pause: true,
 * });
 * ```
 */
export function useBorrowSwapQuote(
  args: Pausable<UseBorrowSwapQuoteArgs>,
): PausableReadResult<SwapQuote>;

export function useBorrowSwapQuote({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseBorrowSwapQuoteArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<
  SwapQuote,
  UnexpectedError | ValidationError<InsufficientLiquidityError>
> {
  const client = useAaveClient();

  // Fast query - no polling, suspends in suspense mode for quick initial render
  const fastResult = useSuspendableQuery({
    document: BorrowSwapQuoteQuery,
    variables: {
      request: injectBorrowSwapQuoteAccuracy(request, QuoteAccuracy.Fast),
      currency,
    },
    selector: extractPositionSwapQuote,
    suspense,
    pause,
    batch: false, // Don't batch with Accurate query
  });

  // Accurate query - with polling, never suspends, fires after Fast in suspense mode
  const accurateResult = useSuspendableQuery({
    document: BorrowSwapQuoteQuery,
    variables: {
      request: injectBorrowSwapQuoteAccuracy(request, QuoteAccuracy.Accurate),
      currency,
    },
    selector: extractPositionSwapQuote,
    suspense: false, // Never suspend on Accurate (would cause re-suspend)
    pause: pause || (suspense && !fastResult.data),
    pollInterval: client.context.environment.swapQuoteInterval,
    batch: false, // Don't batch with Fast query
  });

  const hasAccurateForCurrentParams =
    accurateResult.data &&
    accurateResult.metadata.resultOperationKey ===
      accurateResult.metadata.operationKey;

  if (hasAccurateForCurrentParams) {
    return accurateResult;
  }

  return fastResult;
}

/**
 * Low-level hook to execute a borrow swap quote action directly.
 *
 * @remarks
 * This hook **does not** actively watch for updated data on the swap quote.
 * Use this hook to retrieve quotes on demand as part of a larger workflow.
 *
 * ```ts
 * const [getQuote, { called, data, error, loading }] = useBorrowSwapQuoteAction();
 *
 * // …
 *
 * const result = await getQuote({
 *   debtPosition: userBorrowItem.id,
 *   buyReserve: reserve.id,
 *   amount: bigDecimal('1000'),
 *   user: evmAddress('0x742d35cc…'),
 * });
 *
 * if (result.isOk()) {
 *   console.log('Borrow swap quote:', result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useBorrowSwapQuoteAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<
  BorrowSwapQuoteRequest,
  SwapQuote,
  UnexpectedError | ValidationError<InsufficientLiquidityError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: BorrowSwapQuoteRequest) =>
      borrowSwapQuote(client, request, {
        currency: options.currency,
        requestPolicy: 'network-only',
      }).andThen(extractPositionSwapQuote),
    [client, options.currency],
  );
}
