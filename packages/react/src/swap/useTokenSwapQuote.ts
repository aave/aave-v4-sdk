import { tokenSwapQuote } from '@aave/client/actions';
import { UnexpectedError, ValidationError } from '@aave/core';
import type {
  InsufficientLiquidityError,
  SwapQuote,
  TokenSwapQuoteRequest,
} from '@aave/graphql';
import {
  QuoteAccuracy,
  TokenSwapQuoteQuery,
  type TokenSwapQuoteResult,
} from '@aave/graphql';
import type { NullishDeep, Prettify, Result } from '@aave/types';
import { err, ok } from '@aave/types';

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

import { type CurrencyQueryOptions, DEFAULT_QUERY_OPTIONS } from './helpers';

function extractTokenSwapQuote(
  data: TokenSwapQuoteResult,
): Result<
  SwapQuote,
  ValidationError<InsufficientLiquidityError> | UnexpectedError
> {
  switch (data.__typename) {
    case 'SwapByIntent':
    case 'SwapByIntentWithApprovalRequired':
    case 'SwapByTransaction':
      return ok(data.quote);
    case 'InsufficientLiquidityError':
      return err(ValidationError.fromGqlNode(data));
    default:
      return err(
        UnexpectedError.upgradeRequired(
          `Unsupported swap quote result: ${data.__typename}`,
        ),
      );
  }
}

function injectTokenSwapQuoteAccuracy(
  request: NullishDeep<TokenSwapQuoteRequest>,
  accuracy: QuoteAccuracy,
): NullishDeep<TokenSwapQuoteRequest> {
  if ('market' in request && request.market) {
    return { market: { ...request.market, accuracy } };
  }
  // Limit orders don't have an accuracy field
  return request;
}

export type UseTokenSwapQuoteArgs = Prettify<
  TokenSwapQuoteRequest & CurrencyQueryOptions
>;

/**
 * Fetch a swap quote for the specified trade parameters.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useTokenSwapQuote({
 *   market: {
 *     buy: { erc20: evmAddress('0xA0b86a33E6…') },
 *     sell: { erc20: evmAddress('0x6B175474E…') },
 *     amount: bigDecimal('1000'),
 *     kind: SwapKind.Sell,
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   chainId: chainId(1),
 *   suspense: true,
 * });
 * ```
 */
export function useTokenSwapQuote(
  args: UseTokenSwapQuoteArgs & Suspendable,
): SuspenseResult<SwapQuote>;
/**
 * Fetch a swap quote for the specified trade parameters.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useTokenSwapQuote({
 *   market: {
 *     chainId: chainId(1),
 *     buy: { erc20: evmAddress('0xA0b86a33E6…') },
 *     sell: { erc20: evmAddress('0x6B175474E…') },
 *     amount: bigDecimal('1000'),
 *     kind: SwapKind.Sell,
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useTokenSwapQuote(
  args: Pausable<UseTokenSwapQuoteArgs> & Suspendable,
): PausableSuspenseResult<SwapQuote>;
/**
 * Fetch a swap quote for the specified trade parameters.
 *
 * ```tsx
 * const { data, error, loading } = useTokenSwapQuote({
 *   market: {
 *     chainId: chainId(1),
 *     buy: { erc20: evmAddress('0xA0b86a33E6…') },
 *     sell: { erc20: evmAddress('0x6B175474E…') },
 *     amount: bigDecimal('1000'),
 *     kind: SwapKind.Sell,
 *     user: evmAddress('0x742d35cc…'),
 *   },
 * });
 * ```
 */
export function useTokenSwapQuote(
  args: UseTokenSwapQuoteArgs,
): ReadResult<SwapQuote>;
/**
 * Fetch a swap quote for the specified trade parameters.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useTokenSwapQuote({
 *   market: {
 *     chainId: chainId(1),
 *     buy: { erc20: evmAddress('0xA0b86a33E6…') },
 *     sell: { erc20: evmAddress('0x6B175474E…') },
 *     amount: bigDecimal('1000'),
 *     kind: SwapKind.Sell,
 *     user: evmAddress('0x742d35cc…'),
 *   },
 *   pause: true,
 * });
 * ```
 */
export function useTokenSwapQuote(
  args: Pausable<UseTokenSwapQuoteArgs>,
): PausableReadResult<SwapQuote>;

export function useTokenSwapQuote({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseTokenSwapQuoteArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<
  SwapQuote,
  UnexpectedError | ValidationError<InsufficientLiquidityError>
> {
  const client = useAaveClient();

  // Fast query - no polling, suspends in suspense mode for quick initial render
  const fastResult = useSuspendableQuery({
    document: TokenSwapQuoteQuery,
    variables: {
      request: injectTokenSwapQuoteAccuracy(request, QuoteAccuracy.Fast),
      currency,
    },
    selector: extractTokenSwapQuote,
    suspense,
    pause,
    batch: false, // Don't batch with Accurate query
  });

  // Accurate query - with polling, never suspends, fires after Fast in suspense mode
  const accurateResult = useSuspendableQuery({
    document: TokenSwapQuoteQuery,
    variables: {
      request: injectTokenSwapQuoteAccuracy(request, QuoteAccuracy.Accurate),
      currency,
    },
    selector: extractTokenSwapQuote,
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
 * Low-level hook to execute a swap quote action directly.
 *
 * @remarks
 * This hook **does not** actively watch for updated data on the swap quote.
 * Use this hook to retrieve quotes on demand as part of a larger workflow
 * (e.g., in an event handler to get a fresh quote before executing a swap).
 *
 * ```ts
 * const [getQuote, { called, data, error, loading }] = useTokenSwapQuoteAction();
 *
 * // …
 *
 * const result = await getQuote({
 *   market: {
 *     chainId: chainId(1),
 *     buy: { erc20: evmAddress('0xA0b86a33E6…') },
 *     sell: { erc20: evmAddress('0x6B175474E…') },
 *     amount: bigDecimal('1000'),
 *     kind: SwapKind.Sell,
 *   },
 * });
 *
 * if (result.isOk()) {
 *   console.log('Swap quote:', result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useTokenSwapQuoteAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<
  TokenSwapQuoteRequest,
  SwapQuote,
  UnexpectedError | ValidationError<InsufficientLiquidityError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: TokenSwapQuoteRequest) =>
      tokenSwapQuote(client, request, {
        currency: options.currency,
        requestPolicy: 'network-only',
      }).andThen(extractTokenSwapQuote),
    [client, options.currency],
  );
}
