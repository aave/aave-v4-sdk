import {
  type AaveClient,
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type TimeWindowQueryOptions,
  type ValidationError,
} from '@aave/client';
import {
  borrowSwapQuote,
  cancelSwap,
  preparePositionSwap,
  prepareSwapCancel,
  prepareTokenSwap,
  repayWithSupplyQuote,
  supplySwapQuote,
  swap,
  swapStatus,
  tokenSwapQuote,
  withdrawSwapQuote,
} from '@aave/client/actions';
import {
  type CancelError,
  type SigningError,
  type TimeoutError,
  type TransactionError,
  UnexpectedError,
} from '@aave/core';
import type {
  InsufficientBalanceError,
  PaginatedUserSwapsResult,
  PositionSwapApproval,
  PrepareSwapCancelRequest,
  SupplySwapQuoteRequest,
  SwapCancelled,
  SwapQuote,
  SwapReceipt,
  SwapStatus,
  SwapStatusRequest,
  SwapTransactionRequest,
  TokenSwapQuoteRequest,
  UserSwapsRequest,
} from '@aave/graphql';
import {
  BorrowSwapQuoteQuery,
  type BorrowSwapQuoteRequest,
  type ERC20PermitSignature,
  type Erc20Approval,
  type PositionSwapByIntentApprovalsRequired,
  type PreparePositionSwapRequest,
  QuoteAccuracy,
  RepayWithSupplyQuoteQuery,
  type RepayWithSupplyQuoteRequest,
  SupplySwapQuoteQuery,
  type SwapByIntentInput,
  SwappableTokensQuery,
  type SwappableTokensRequest,
  type SwapRequest,
  SwapStatusQuery,
  type SwapTypedData,
  type Token,
  TokenSwapQuoteQuery,
  type TokenSwapQuoteResult,
  type TransactionRequest,
  UserSwapsQuery,
  WithdrawSwapQuoteQuery,
  type WithdrawSwapQuoteRequest,
} from '@aave/graphql';
import type {
  NullishDeep,
  Prettify,
  ResultAsync,
  Signature,
} from '@aave/types';
import {
  invariant,
  isSignature,
  never,
  okAsync,
  ResultAwareError,
} from '@aave/types';
import { useCallback, useEffect, useState } from 'react';
import { useAaveClient } from './context';
import {
  type CancelOperation,
  cancel,
  type Pausable,
  type PausableReadResult,
  type PausableSuspenseResult,
  PendingTransaction,
  type PendingTransactionError,
  type ReadResult,
  type SendTransactionError,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  useSuspendableQuery,
} from './helpers';
import { type UseAsyncTask, useAsyncTask } from './helpers/tasks';

// TODO rethink this approach so that selector errors are not thrown but returned as UnexpectedError
function extractTokenSwapQuote(data: TokenSwapQuoteResult): SwapQuote {
  switch (data.__typename) {
    case 'SwapByIntent':
    case 'SwapByIntentWithApprovalRequired':
    case 'SwapByTransaction':
      return data.quote;
    default:
      throw UnexpectedError.upgradeRequired(
        `Unsupported swap quote result: ${data.__typename}`,
      );
  }
}

function injectSwapQuoteAccuracy(
  request: TokenSwapQuoteRequest,
  accuracy: QuoteAccuracy,
): TokenSwapQuoteRequest {
  if ('market' in request && request.market) {
    return {
      ...request,
      market: { ...request.market, accuracy },
    };
  }
  if ('limit' in request && request.limit) {
    return {
      ...request,
      limit: { ...request.limit, accuracy },
    };
  }
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
}): SuspendableResult<SwapQuote, UnexpectedError> {
  const client = useAaveClient();

  // Fast query - no polling, suspends in suspense mode for quick initial render
  const fastResult = useSuspendableQuery({
    document: TokenSwapQuoteQuery,
    variables: {
      request: injectSwapQuoteAccuracy(
        request as TokenSwapQuoteRequest,
        QuoteAccuracy.Fast,
      ),
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
      request: injectSwapQuoteAccuracy(
        request as TokenSwapQuoteRequest,
        QuoteAccuracy.Accurate,
      ),
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
): UseAsyncTask<TokenSwapQuoteRequest, SwapQuote, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: TokenSwapQuoteRequest) =>
      tokenSwapQuote(client, request, {
        currency: options.currency,
        requestPolicy: 'network-only',
      }).map(extractTokenSwapQuote),
    [client, options.currency],
  );
}

export type UseSwappableTokensArgs = SwappableTokensRequest;

/**
 * Fetch the list of tokens available for swapping on a specific chain.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useSwappableTokens({
 *   query: { chainIds: [chainId(1)] },
 *   suspense: true,
 * });
 * ```
 */
export function useSwappableTokens(
  args: UseSwappableTokensArgs & Suspendable,
): SuspenseResult<Token[]>;
/**
 * Fetch the list of tokens available for swapping on a specific chain.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useSwappableTokens({
 *   query: { chainIds: [chainId(1)] },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useSwappableTokens(
  args: Pausable<UseSwappableTokensArgs> & Suspendable,
): PausableSuspenseResult<Token[]>;
/**
 * Fetch the list of tokens available for swapping on a specific chain.
 *
 * ```tsx
 * const { data, error, loading } = useSwappableTokens({
 *   query: { chainIds: [chainId(1)] },
 * });
 * ```
 */
export function useSwappableTokens(
  args: UseSwappableTokensArgs,
): ReadResult<Token[]>;
/**
 * Fetch the list of tokens available for swapping on a specific chain.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useSwappableTokens({
 *   query: { chainIds: [chainId(1)] },
 *   pause: true,
 * });
 * ```
 */
export function useSwappableTokens(
  args: Pausable<UseSwappableTokensArgs>,
): PausableReadResult<Token[]>;

export function useSwappableTokens({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseSwappableTokensArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<Token[], UnexpectedError> {
  return useSuspendableQuery({
    document: SwappableTokensQuery,
    variables: {
      request,
    },
    suspense,
    pause,
  });
}

export type UseUserSwapsArgs = Prettify<
  UserSwapsRequest & CurrencyQueryOptions & TimeWindowQueryOptions
>;

/**
 * Fetch the user's swap history for a specific chain.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useUserSwaps({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc…'),
 *   filterBy: [SwapStatusFilter.FULFILLED, SwapStatusFilter.OPEN],
 *   suspense: true,
 * });
 * ```
 */
export function useUserSwaps(
  args: UseUserSwapsArgs & Suspendable,
): SuspenseResult<PaginatedUserSwapsResult>;
/**
 * Fetch the user's swap history for a specific chain.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useUserSwaps({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc…'),
 *   filterBy: [SwapStatusFilter.FULFILLED, SwapStatusFilter.OPEN],
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useUserSwaps(
  args: Pausable<UseUserSwapsArgs> & Suspendable,
): PausableSuspenseResult<PaginatedUserSwapsResult>;
/**
 * Fetch the user's swap history for a specific chain.
 *
 * ```tsx
 * const { data, error, loading } = useUserSwaps({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc…'),
 *   filterBy: [SwapStatusFilter.FULFILLED, SwapStatusFilter.OPEN],
 * });
 * ```
 */
export function useUserSwaps(
  args: UseUserSwapsArgs,
): ReadResult<PaginatedUserSwapsResult>;
/**
 * Fetch the user's swap history for a specific chain.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useUserSwaps({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc…'),
 *   filterBy: [SwapStatusFilter.FULFILLED, SwapStatusFilter.OPEN],
 *   pause: true,
 * });
 * ```
 */
export function useUserSwaps(
  args: Pausable<UseUserSwapsArgs>,
): PausableReadResult<PaginatedUserSwapsResult>;

export function useUserSwaps({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: NullishDeep<UseUserSwapsArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<PaginatedUserSwapsResult, UnexpectedError> {
  const client = useAaveClient();
  const [allTerminal, setAllTerminal] = useState(false);

  const result: SuspendableResult<PaginatedUserSwapsResult, UnexpectedError> =
    useSuspendableQuery({
      document: UserSwapsQuery,
      variables: { request, currency, timeWindow },
      suspense,
      pause: pause || allTerminal,
      pollInterval: client.context.environment.swapStatusInterval,
    });

  useEffect(() => {
    if (result.data && result.data.items.length > 0) {
      const allItemsTerminal = result.data.items.every(isTerminalSwapStatus);
      if (allItemsTerminal) {
        setAllTerminal(true);
      }
    }
  }, [result.data]);

  return result;
}

// ------------------------------------------------------------

function isTerminalSwapStatus(data: SwapStatus): boolean {
  return (
    data.__typename === 'SwapFulfilled' ||
    data.__typename === 'SwapCancelled' ||
    data.__typename === 'SwapExpired'
  );
}

export type UseSwapStatusArgs = Prettify<
  SwapStatusRequest & CurrencyQueryOptions & TimeWindowQueryOptions
>;

/**
 * Monitor the status of a single swap operation in real-time.
 *
 * Polls automatically until the swap reaches a terminal state (fulfilled, cancelled, or expired).
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useSwapStatus({
 *   id: swapReceipt.id,
 *   suspense: true,
 * });
 * ```
 */
export function useSwapStatus(
  args: UseSwapStatusArgs & Suspendable,
): SuspenseResult<SwapStatus>;
/**
 * Monitor the status of a single swap operation in real-time.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useSwapStatus({
 *   id: swapReceipt.id,
 *   suspense: true,
 *   pause: shouldPause,
 * });
 * ```
 */
export function useSwapStatus(
  args: Pausable<UseSwapStatusArgs> & Suspendable,
): PausableSuspenseResult<SwapStatus>;
/**
 * Monitor the status of a single swap operation in real-time.
 *
 * Polls automatically until the swap reaches a terminal state (fulfilled, cancelled, or expired).
 *
 * ```tsx
 * const { data, error, loading } = useSwapStatus({
 *   id: swapReceipt.id,
 * });
 * ```
 */
export function useSwapStatus(args: UseSwapStatusArgs): ReadResult<SwapStatus>;
/**
 * Monitor the status of a single swap operation in real-time.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useSwapStatus({
 *   id: swapReceipt.id,
 *   pause: shouldPause,
 * });
 * ```
 */
export function useSwapStatus(
  args: Pausable<UseSwapStatusArgs>,
): PausableReadResult<SwapStatus>;

export function useSwapStatus({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: NullishDeep<UseSwapStatusArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<SwapStatus, UnexpectedError> {
  const client = useAaveClient();
  const [isTerminal, setIsTerminal] = useState(false);

  const result: SuspendableResult<SwapStatus, UnexpectedError> =
    useSuspendableQuery({
      document: SwapStatusQuery,
      variables: { request, currency, timeWindow },
      suspense,
      pause: pause || isTerminal,
      pollInterval: client.context.environment.swapStatusInterval,
    });

  useEffect(() => {
    if (result.data && isTerminalSwapStatus(result.data)) {
      setIsTerminal(true);
    }
  }, [result.data]);

  return result;
}

// ------------------------------------------------------------

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
}): SuspendableResult<SwapQuote, UnexpectedError> {
  return useSuspendableQuery({
    document: SupplySwapQuoteQuery,
    variables: {
      request,
      currency,
    },
    selector: (data) => data.quote,
    suspense,
    pause,
  });
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
): UseAsyncTask<SupplySwapQuoteRequest, SwapQuote, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: SupplySwapQuoteRequest) =>
      supplySwapQuote(client, request, {
        currency: options.currency,
        requestPolicy: 'network-only',
      }).map((data) => data.quote),
    [client, options.currency],
  );
}

// ------------------------------------------------------------

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
}): SuspendableResult<SwapQuote, UnexpectedError> {
  return useSuspendableQuery({
    document: BorrowSwapQuoteQuery,
    variables: {
      request,
      currency,
    },
    selector: (data) => data.quote,
    suspense,
    pause,
  });
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
): UseAsyncTask<BorrowSwapQuoteRequest, SwapQuote, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: BorrowSwapQuoteRequest) =>
      borrowSwapQuote(client, request, {
        currency: options.currency,
        requestPolicy: 'network-only',
      }).map((data) => data.quote),
    [client, options.currency],
  );
}

// ------------------------------------------------------------

export type SwapHandlerOptions = {
  cancel: CancelOperation;
};

// ------------------------------------------------------------

/**
 */
export type UseSwapSignerRequest = TransactionRequest; // TODO add other types to this union

/**
 */
export type SwapSignerError = CancelError | SigningError | UnexpectedError;

/**
 */
export type UseSwapSignerResult = UseAsyncTask<
  UseSwapSignerRequest,
  PendingTransaction | Signature,
  SwapSignerError
>;

// ------------------------------------------------------------

export type PositionSwapPlan = PositionSwapApproval | SwapTypedData;

export type PositionSwapHandler = (
  plan: PositionSwapPlan,
  options: SwapHandlerOptions,
) => ResultAsync<PendingTransaction | Signature, SwapSignerError>;

export type PositionSwapValue = {
  quote?: SwapQuote;
};

function processApprovals(result: PositionSwapByIntentApprovalsRequired) {
  return {
    with: (
      handler: PositionSwapHandler,
    ): ResultAsync<PreparePositionSwapRequest, SwapSignerError> =>
      result.approvals.reduce<
        ResultAsync<PreparePositionSwapRequest, SwapSignerError>
      >(
        (acc, approval) =>
          acc.andThen((request) =>
            handler(approval, { cancel }).map((value) => {
              switch (approval.__typename) {
                case 'PositionSwapAdapterContractApproval':
                  request.adapterContractSignature = isSignature(value)
                    ? value
                    : null;
                  break;
                case 'PositionSwapPositionManagerApproval':
                  request.positionManagerSignature = isSignature(value)
                    ? value
                    : null;
                  break;
              }
              return request;
            }),
          ),
        okAsync({
          quoteId: result.quote.quoteId,
          adapterContractSignature: null,
          positionManagerSignature: null,
        }),
      ),
  };
}

function swapPosition(
  client: AaveClient,
  intent: SwapByIntentInput,
): ResultAsync<
  SwapReceipt,
  ValidationError<InsufficientBalanceError> | UnexpectedError
> {
  return swap(client, { intent }).andThen((plan) => {
    switch (plan.__typename) {
      case 'SwapReceipt':
        return okAsync(plan);
      default:
        return UnexpectedError.from(plan).asResultAsync();
    }
  });
}

// ------------------------------------------------------------

/**
 */
export type UseSupplySwapRequest = Prettify<
  SupplySwapQuoteRequest & CurrencyQueryOptions
>;

/**
 */
export function useSupplySwap(
  handler: PositionSwapHandler,
): UseAsyncTask<
  SupplySwapQuoteRequest,
  SwapReceipt,
  | SwapSignerError
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    ({
      currency = DEFAULT_QUERY_OPTIONS.currency,
      ...request
    }: UseSupplySwapRequest) => {
      return supplySwapQuote(client, request, { currency }).andThen(
        (result) => {
          return processApprovals(result)
            .with(handler)
            .andThen((request) => preparePositionSwap(client, request))
            .andThen((order) =>
              handler(order.data, { cancel }).map((result) => {
                invariant(
                  isSignature(result),
                  'Expected signature, got an object instead.',
                );
                return result;
              }),
            )
            .andThen((signature) =>
              swapPosition(client, {
                quoteId: result.quote.quoteId,
                signature,
              }),
            );
        },
      );
    },
    [client, handler],
  );
}

// ------------------------------------------------------------

/**
 */
export type UseBorrowSwapRequest = Prettify<
  BorrowSwapQuoteRequest & CurrencyQueryOptions
>;

/**
 */
export function useBorrowSwap(
  handler: PositionSwapHandler,
): UseAsyncTask<
  BorrowSwapQuoteRequest,
  SwapReceipt,
  | SwapSignerError
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    ({
      currency = DEFAULT_QUERY_OPTIONS.currency,
      ...request
    }: UseBorrowSwapRequest) => {
      return borrowSwapQuote(client, request, { currency }).andThen(
        (result) => {
          return processApprovals(result)
            .with(handler)
            .andThen((request) => preparePositionSwap(client, request))
            .andThen((order) =>
              handler(order.data, { cancel }).map((result) => {
                invariant(
                  isSignature(result),
                  'Expected signature, got an object instead.',
                );
                return result;
              }),
            )
            .andThen((signature) =>
              swapPosition(client, {
                quoteId: result.quote.quoteId,
                signature,
              }),
            );
        },
      );
    },
    [client, handler],
  );
}

// ------------------------------------------------------------

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
}): SuspendableResult<SwapQuote, UnexpectedError> {
  return useSuspendableQuery({
    document: RepayWithSupplyQuoteQuery,
    variables: {
      request,
      currency,
    },
    selector: (data) => data.quote,
    suspense,
    pause,
  });
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
): UseAsyncTask<RepayWithSupplyQuoteRequest, SwapQuote, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: RepayWithSupplyQuoteRequest) =>
      repayWithSupplyQuote(client, request, {
        currency: options.currency,
        requestPolicy: 'network-only',
      }).map((data) => data.quote),
    [client, options.currency],
  );
}

// ------------------------------------------------------------

/**
 */
export type UseRepayWithSupplyRequest = Prettify<
  RepayWithSupplyQuoteRequest & CurrencyQueryOptions
>;

/**
 */
export function useRepayWithSupply(
  handler: PositionSwapHandler,
): UseAsyncTask<
  RepayWithSupplyQuoteRequest,
  SwapReceipt,
  | SwapSignerError
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    ({
      currency = DEFAULT_QUERY_OPTIONS.currency,
      ...request
    }: UseRepayWithSupplyRequest) => {
      return repayWithSupplyQuote(client, request, { currency }).andThen(
        (result) => {
          return processApprovals(result)
            .with(handler)
            .andThen((request) => preparePositionSwap(client, request))
            .andThen((order) =>
              handler(order.data, { cancel }).map((result) => {
                invariant(
                  isSignature(result),
                  'Expected signature, got an object instead.',
                );
                return result;
              }),
            )
            .andThen((signature) =>
              swapPosition(client, {
                quoteId: result.quote.quoteId,
                signature,
              }),
            );
        },
      );
    },
    [client, handler],
  );
}

// ------------------------------------------------------------

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
}): SuspendableResult<SwapQuote, UnexpectedError> {
  return useSuspendableQuery({
    document: WithdrawSwapQuoteQuery,
    variables: {
      request,
      currency,
    },
    selector: (data) => data.quote,
    suspense,
    pause,
  });
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
): UseAsyncTask<WithdrawSwapQuoteRequest, SwapQuote, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: WithdrawSwapQuoteRequest) =>
      withdrawSwapQuote(client, request, {
        currency: options.currency,
        requestPolicy: 'network-only',
      }).map((data) => data.quote),
    [client, options.currency],
  );
}

// ------------------------------------------------------------

/**
 */
export type UseWithdrawSwapRequest = Prettify<
  WithdrawSwapQuoteRequest & CurrencyQueryOptions
>;

/**
 */
export function useWithdrawSwap(
  handler: PositionSwapHandler,
): UseAsyncTask<
  WithdrawSwapQuoteRequest,
  SwapReceipt,
  | SwapSignerError
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    ({
      currency = DEFAULT_QUERY_OPTIONS.currency,
      ...request
    }: UseWithdrawSwapRequest) => {
      return withdrawSwapQuote(client, request, { currency }).andThen(
        (result) => {
          return processApprovals(result)
            .with(handler)
            .andThen((request) => preparePositionSwap(client, request))
            .andThen((order) =>
              handler(order.data, { cancel }).map((result) => {
                invariant(
                  isSignature(result),
                  'Expected signature, got an object instead.',
                );
                return result;
              }),
            )
            .andThen((signature) =>
              swapPosition(client, {
                quoteId: result.quote.quoteId,
                signature,
              }),
            );
        },
      );
    },
    [client, handler],
  );
}

// ------------------------------------------------------------

export type UseTokenSwapRequest = Prettify<
  TokenSwapQuoteRequest & CurrencyQueryOptions
>;

export type TokenSwapPlan =
  | SwapTypedData
  | Erc20Approval
  | SwapTransactionRequest;

export type TokenSwapHandler = (
  plan: TokenSwapPlan,
  options: SwapHandlerOptions,
) => ResultAsync<
  ERC20PermitSignature | PendingTransaction | Signature,
  SwapSignerError
>;

/**
 * Orchestrate the swap execution plan.
 *
 * ```tsx
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [signSwapTypedData] = useSignSwapTypedData(wallet);
 *
 * const [swap, { loading, error }] = useTokenSwap((plan) => {
 *   switch (plan.__typename) {
 *     case 'SwapTypedData':
 *       return signSwapTypedData(plan);
 *
 *     case 'SwapApprovalRequired':
 *       return sendTransaction(plan.transaction);
 *
 *     case 'SwapByIntentWithApprovalRequired':
 *       return sendTransaction(plan.approval.byTransaction);
 *
 *     case 'SwapTransactionRequest':
 *       return sendTransaction(plan.transaction);
 *   }
 * });
 *
 * const result = await swap({
 *   market: {
 *     chainId: chainId(1),
 *     buy: { erc20: evmAddress('0xA0b86a33E6…') },
 *     sell: { erc20: evmAddress('0x6B175474E…') },
 *     amount: bigDecimal('1000'),
 *     kind: SwapKind.Sell,
 *     user: evmAddress('0x742d35cc…'),
 *   },
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * // result.value: SwapReceipt
 * ```
 */
export function useTokenSwap(
  handler: TokenSwapHandler,
): UseAsyncTask<
  UseTokenSwapRequest,
  SwapReceipt,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  const executeSwap = useCallback(
    (
      request: SwapRequest,
    ): ResultAsync<
      SwapReceipt,
      | SendTransactionError
      | PendingTransactionError
      | ValidationError<InsufficientBalanceError>
    > => {
      return swap(client, request).andThen((plan) => {
        switch (plan.__typename) {
          case 'SwapTransactionRequest':
            return handler(plan, { cancel })
              .map(PendingTransaction.ensure)
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(() => okAsync(plan.orderReceipt));

          case 'SwapReceipt':
            return okAsync(plan);
        }
      });
    },
    [client, handler],
  );

  return useAsyncTask(
    ({
      currency = DEFAULT_QUERY_OPTIONS.currency,
      ...request
    }: UseTokenSwapRequest) =>
      tokenSwapQuote(client, request, { currency }).andThen((quoteResult) => {
        switch (quoteResult.__typename) {
          case 'SwapByTransaction':
            return executeSwap({
              transaction: { quoteId: quoteResult.quote.quoteId },
            });

          case 'SwapByIntent':
            return prepareTokenSwap(client, {
              quoteId: quoteResult.quote.quoteId,
            }).andThen((order) =>
              handler(order.data, { cancel })
                .map((result) => {
                  invariant(isSignature(result), 'Invalid signature');
                  return result;
                })
                .andThen((signature) =>
                  executeSwap({
                    intent: { quoteId: order.newQuoteId, signature },
                  }),
                ),
            );

          case 'SwapByIntentWithApprovalRequired':
            return handler(quoteResult.approval, { cancel })
              .andThen((result) => {
                if (isSignature(result)) {
                  const permitTypedData = quoteResult.approval.bySignature;
                  if (!permitTypedData) {
                    return UnexpectedError.from(
                      'Expected bySignature to be present in SwapByIntentWithApprovalRequired',
                    ).asResultAsync();
                  }
                  const permitSig: ERC20PermitSignature = {
                    deadline: permitTypedData.message.deadline as number,
                    value: result,
                  };
                  return prepareTokenSwap(client, {
                    quoteId: quoteResult.quote.quoteId,
                    permitSig,
                  });
                }
                if (PendingTransaction.isInstanceOf(result)) {
                  return result.wait().andThen(() =>
                    prepareTokenSwap(client, {
                      quoteId: quoteResult.quote.quoteId,
                    }),
                  );
                }
                return UnexpectedError.from(result).asResultAsync();
              })
              .andThen((order) =>
                handler(order.data, { cancel })
                  .map((handlerResult) => {
                    invariant(isSignature(handlerResult), 'Invalid signature');
                    return handlerResult;
                  })
                  .andThen((signature) =>
                    executeSwap({
                      intent: { quoteId: quoteResult.quote.quoteId, signature },
                    }),
                  ),
              );
          default:
            never(
              `Unsupported swap quote result: ${quoteResult.__typename}. To be removed from API soon.`,
            );
        }
      }),
    [client, handler, executeSwap],
  );
}

export type CancelSwapHandler = (
  data: SwapTypedData | TransactionRequest,
  options: SwapHandlerOptions,
) => ResultAsync<PendingTransaction | Signature, SwapSignerError>;

export class CannotCancelSwapError extends ResultAwareError {
  name = 'CannotCancelSwapError' as const;
}

export type CancelSwapError =
  | CancelError
  | CannotCancelSwapError
  | SigningError
  | TimeoutError
  | TransactionError
  | UnexpectedError;

/**
 * Executes the complete swap cancellation workflow combining preparation and execution.
 *
 * ```tsx
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [signSwapTypedData] = useSignSwapTypedData(wallet);
 *
 * const [cancelSwap, { loading, error }] = useCancelSwap((plan) => {
 *   switch (plan.__typename) {
 *     case 'TransactionRequest':
 *       return sendTransaction(plan);
 *
 *     case 'SwapTypedData':
 *       return signSwapTypedData(plan);
 *   }
 * });
 *
 * const result = await cancelSwap({
 *   id: swapId('123…'),
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * // result.value: SwapCancelled
 * console.log('Swap cancelled:', result.value);
 * ```
 */
export function useCancelSwap(
  handler: CancelSwapHandler,
): UseAsyncTask<PrepareSwapCancelRequest, SwapCancelled, CancelSwapError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request) =>
      swapStatus(client, { id: request.id }).andThen((status) => {
        switch (status.__typename) {
          case 'SwapOpen':
          case 'SwapPendingSignature':
            return prepareSwapCancel(client, request)
              .andThen((result) => handler(result.data, { cancel }))
              .map((result) => {
                invariant(isSignature(result), 'Invalid signature');
                return result;
              })
              .andThen((signature) =>
                cancelSwap(client, {
                  intent: { id: request.id, signature },
                }),
              )
              .andThen((plan) => {
                if (plan.__typename === 'SwapCancelled') {
                  return okAsync(plan);
                }

                return (
                  handler(plan, { cancel })
                    .map(PendingTransaction.ensure)
                    .andThen((pendingTransaction) => pendingTransaction.wait())
                    // TODO: verify that if fails cause too early, we need to waitForSwapOutcome(client)({ id: request.id })
                    .andThen(() => swapStatus(client, { id: request.id }))
                    .andThen((status) => {
                      if (status.__typename === 'SwapCancelled') {
                        return okAsync(status);
                      }
                      return new CannotCancelSwapError(
                        'Failed to cancel swap',
                      ).asResultAsync();
                    })
                );
              });

          case 'SwapCancelled':
            return okAsync(status);

          case 'SwapExpired':
            return new CannotCancelSwapError(
              'Swap cannot longer be cancelled',
            ).asResultAsync();

          default:
            return UnexpectedError.upgradeRequired(
              `Unsupported swap status: ${status.__typename}`,
            ).asResultAsync();
        }
      }),
    [client, handler],
  );
}
