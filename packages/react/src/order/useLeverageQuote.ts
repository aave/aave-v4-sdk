import { leverageQuote } from '@aave/client/actions';
import type { UnexpectedError, ValidationError } from '@aave/core';
import type {
  InsufficientLiquidityError,
  LeverageApprovalsRequired,
  LeverageQuoteRequest,
} from '@aave/graphql';
import { LeverageQuoteQuery, QuoteAccuracy } from '@aave/graphql';
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
  extractLeverageQuote,
} from './helpers';

function injectLeverageQuoteAccuracy(
  request: NullishDeep<LeverageQuoteRequest>,
  accuracy: QuoteAccuracy,
): NullishDeep<LeverageQuoteRequest> {
  if ('market' in request && request.market) {
    return { market: { ...request.market, accuracy } };
  }
  return request;
}

export type UseLeverageQuoteArgs = Prettify<
  LeverageQuoteRequest & CurrencyQueryOptions
>;

/**
 * Fetch a quote for a leverage operation with the specified parameters.
 *
 * Resolves to the full quote node, so `maxSafeMultiplier` is available
 * alongside `quote` to bound a leverage input.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useLeverageQuote({
 *   market: {
 *     debtReserve: debtReserve.id,
 *     collateralReserve: collateralReserve.id,
 *     multiplier: bigDecimal('2.5'),
 *     additionalCollateral: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   suspense: true,
 * });
 * ```
 */
export function useLeverageQuote(
  args: UseLeverageQuoteArgs & Suspendable,
): SuspenseResult<LeverageApprovalsRequired>;
/**
 * Fetch a quote for a leverage operation with the specified parameters.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useLeverageQuote({
 *   market: {
 *     debtReserve: debtReserve.id,
 *     collateralReserve: collateralReserve.id,
 *     multiplier: bigDecimal('2.5'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useLeverageQuote(
  args: Pausable<UseLeverageQuoteArgs> & Suspendable,
): PausableSuspenseResult<LeverageApprovalsRequired>;
/**
 * Fetch a quote for a leverage operation with the specified parameters.
 *
 * ```tsx
 * const { data, error, loading } = useLeverageQuote({
 *   market: {
 *     debtReserve: debtReserve.id,
 *     collateralReserve: collateralReserve.id,
 *     multiplier: bigDecimal('2.5'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 * });
 * ```
 */
export function useLeverageQuote(
  args: UseLeverageQuoteArgs,
): ReadResult<LeverageApprovalsRequired>;
/**
 * Fetch a quote for a leverage operation with the specified parameters.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useLeverageQuote({
 *   market: {
 *     debtReserve: debtReserve.id,
 *     collateralReserve: collateralReserve.id,
 *     multiplier: bigDecimal('2.5'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   pause: true,
 * });
 * ```
 */
export function useLeverageQuote(
  args: Pausable<UseLeverageQuoteArgs>,
): PausableReadResult<LeverageApprovalsRequired>;

export function useLeverageQuote({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseLeverageQuoteArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<
  LeverageApprovalsRequired,
  UnexpectedError | ValidationError<InsufficientLiquidityError>
> {
  const client = useAaveClient();

  // Fast query - no polling, suspends in suspense mode for quick initial render
  const fastResult = useSuspendableQuery({
    document: LeverageQuoteQuery,
    variables: {
      request: injectLeverageQuoteAccuracy(request, QuoteAccuracy.Fast),
      currency,
    },
    selector: extractLeverageQuote,
    suspense,
    pause,
    batch: false, // Don't batch with Accurate query
  });

  // Accurate query - with polling, never suspends, fires after Fast in suspense mode
  const accurateResult = useSuspendableQuery({
    document: LeverageQuoteQuery,
    variables: {
      request: injectLeverageQuoteAccuracy(request, QuoteAccuracy.Accurate),
      currency,
    },
    selector: extractLeverageQuote,
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
 * Low-level hook to execute a leverage quote action directly.
 *
 * @remarks
 * This hook **does not** actively watch for updated data on the leverage quote.
 * Use this hook to retrieve quotes on demand as part of a larger workflow.
 *
 * ```ts
 * const [getQuote, { called, data, error, loading }] = useLeverageQuoteAction();
 *
 * // …
 *
 * const result = await getQuote({
 *   market: {
 *     debtReserve: debtReserve.id,
 *     collateralReserve: collateralReserve.id,
 *     multiplier: bigDecimal('2.5'),
 *     user: evmAddress('0x742d35cc…'),
 *   },
 * });
 *
 * if (result.isOk()) {
 *   console.log('Max safe multiplier:', result.value.maxSafeMultiplier);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useLeverageQuoteAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<
  LeverageQuoteRequest,
  LeverageApprovalsRequired,
  UnexpectedError | ValidationError<InsufficientLiquidityError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: LeverageQuoteRequest) =>
      leverageQuote(client, request, {
        currency: options.currency,
        requestPolicy: 'network-only',
      }),
    [client, options.currency],
  );
}
