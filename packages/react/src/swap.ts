import {
  type AaveClient,
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  ValidationError,
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
  swapQuote,
  swapStatus,
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
  PrepareSupplySwapRequest,
  PrepareSwapCancelRequest,
  SwapByIntentWithApprovalRequired,
  SwapCancelled,
  SwapExecutionPlan,
  SwapQuote,
  SwapQuoteRequest,
  SwapReceipt,
  SwapTransactionRequest,
  UserSwapsRequest,
} from '@aave/graphql';
import {
  BorrowSwapQuoteQuery,
  type ERC20PermitSignature,
  type PositionSwapByIntentApprovalsRequired,
  type PrepareBorrowSwapRequest,
  type PreparePositionSwapRequest,
  type PrepareRepayWithSupplyRequest,
  type PrepareTokenSwapRequest,
  type PrepareWithdrawSwapRequest,
  RepayWithSupplyQuoteQuery,
  SupplySwapQuoteQuery,
  type SwapApprovalRequired,
  type SwapByIntent,
  type SwapByIntentInput,
  SwappableTokensQuery,
  type SwappableTokensRequest,
  SwapQuoteQuery,
  type SwapTypedData,
  type Token,
  type TransactionRequest,
  UserSwapsQuery,
  WithdrawSwapQuoteQuery,
} from '@aave/graphql';
import type {
  NullishDeep,
  Prettify,
  ResultAsync,
  Signature,
} from '@aave/types';
import { invariant, isSignature, okAsync, ResultAwareError } from '@aave/types';
import { useCallback } from 'react';
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

export type UseSwapQuoteArgs = Prettify<
  SwapQuoteRequest & CurrencyQueryOptions
>;

/**
 * @experimental
 * Fetch a swap quote for the specified trade parameters.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useSwapQuote({
 *   chainId: chainId(1),
 *   buy: { erc20: evmAddress('0xA0b86a33E6…') },
 *   sell: { erc20: evmAddress('0x6B175474E…') },
 *   amount: bigDecimal('1000'),
 *   kind: SwapKind.Sell,
 *   suspense: true,
 * });
 * ```
 */
export function useSwapQuote(
  args: UseSwapQuoteArgs & Suspendable,
): SuspenseResult<SwapQuote>;
/**
 * @experimental
 * Fetch a swap quote for the specified trade parameters.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useSwapQuote({
 *   chainId: chainId(1),
 *   buy: { erc20: evmAddress('0xA0b86a33E6…') },
 *   sell: { erc20: evmAddress('0x6B175474E…') },
 *   amount: bigDecimal('1000'),
 *   kind: SwapKind.Sell,
 *   from: evmAddress('0x742d35cc…'),
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useSwapQuote(
  args: Pausable<UseSwapQuoteArgs> & Suspendable,
): PausableSuspenseResult<SwapQuote>;
/**
 * @experimental
 * Fetch a swap quote for the specified trade parameters.
 *
 * ```tsx
 * const { data, error, loading } = useSwapQuote({
 *   chainId: chainId(1),
 *   buy: { erc20: evmAddress('0xA0b86a33E6…') },
 *   sell: { erc20: evmAddress('0x6B175474E…') },
 *   amount: bigDecimal('1000'),
 *   kind: SwapKind.Sell,
 * });
 * ```
 */
export function useSwapQuote(args: UseSwapQuoteArgs): ReadResult<SwapQuote>;
/**
 * @experimental
 * Fetch a swap quote for the specified trade parameters.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useSwapQuote({
 *   chainId: chainId(1),
 *   buy: { erc20: evmAddress('0xA0b86a33E6…') },
 *   sell: { erc20: evmAddress('0x6B175474E…') },
 *   amount: bigDecimal('1000'),
 *   kind: SwapKind.Sell,
 *   from: evmAddress('0x742d35cc…'),
 *   pause: true,
 * });
 * ```
 */
export function useSwapQuote(
  args: Pausable<UseSwapQuoteArgs>,
): PausableReadResult<SwapQuote>;

export function useSwapQuote({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseSwapQuoteArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<SwapQuote, UnexpectedError> {
  return useSuspendableQuery({
    document: SwapQuoteQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}

/**
 * @experimental
 * Low-level hook to execute a swap quote action directly.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 * @remarks
 * This hook **does not** actively watch for updated data on the swap quote.
 * Use this hook to retrieve quotes on demand as part of a larger workflow
 * (e.g., in an event handler to get a fresh quote before executing a swap).
 *
 * ```ts
 * const [getQuote, { called, data, error, loading }] = useSwapQuoteAction();
 *
 * // …
 *
 * const result = await getQuote({
 *   chainId: chainId(1),
 *   buy: { erc20: evmAddress('0xA0b86a33E6…') },
 *   sell: { erc20: evmAddress('0x6B175474E…') },
 *   amount: bigDecimal('1000'),
 *   kind: SwapKind.Sell,
 * });
 *
 * if (result.isOk()) {
 *   console.log('Swap quote:', result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useSwapQuoteAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<SwapQuoteRequest, SwapQuote, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: SwapQuoteRequest) =>
      swapQuote(client, request, { currency: options.currency }),
    [client, options.currency],
  );
}

export type UseSwappableTokensArgs = SwappableTokensRequest;

/**
 * @experimental
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
 * @experimental
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
 * @experimental
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
 * @experimental
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
  UserSwapsRequest & CurrencyQueryOptions
>;

/**
 * @experimental
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
 * @experimental
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
 * @experimental
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
 * @experimental
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
  ...request
}: NullishDeep<UseUserSwapsArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<PaginatedUserSwapsResult, UnexpectedError> {
  return useSuspendableQuery({
    document: UserSwapsQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}

// ------------------------------------------------------------

export type UseSupplySwapQuoteArgs = Prettify<
  PrepareSupplySwapRequest & CurrencyQueryOptions
>;

/**
 * @experimental
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
 * @experimental
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
 * @experimental
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
 * @experimental
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

// ------------------------------------------------------------

export type UseBorrowSwapQuoteArgs = Prettify<
  PrepareBorrowSwapRequest & CurrencyQueryOptions
>;

/**
 * @experimental
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
 * @experimental
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
 * @experimental
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
 * @experimental
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

// ------------------------------------------------------------

export type SwapHandlerOptions = {
  cancel: CancelOperation;
};

// ------------------------------------------------------------

/**
 * @experimental
 */
export type UseSwapSignerRequest = TransactionRequest; // TODO add other types to this union

/**
 * @experimental
 */
export type SwapSignerError = CancelError | SigningError | UnexpectedError;

/**
 * @experimental
 */
export type UseSwapSignerResult = UseAsyncTask<
  UseSwapSignerRequest,
  PendingTransaction | Signature,
  SwapSignerError
>;

// ------------------------------------------------------------

export type PositionSwapPlan = PositionSwapApproval | SwapByIntent;

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
      case 'InsufficientBalanceError':
        return ValidationError.fromGqlNode(plan).asResultAsync();
      default:
        return UnexpectedError.from(plan).asResultAsync();
    }
  });
}

// ------------------------------------------------------------

/**
 * @experimental
 */
export type UseSupplySwapRequest = Prettify<
  PrepareSupplySwapRequest & CurrencyQueryOptions
>;

/**
 * @experimental
 */
export function useSupplySwap(
  handler: PositionSwapHandler,
): UseAsyncTask<
  PrepareSupplySwapRequest,
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
          invariant(
            result.__typename === 'PositionSwapByIntentApprovalsRequired',
            `Unsupported swap plan: ${result.__typename}. Upgrade to a newer version of the @aave/react package.`,
          );

          return processApprovals(result)
            .with(handler)
            .andThen((request) =>
              preparePositionSwap(client, request, { currency }).map(
                (result) => {
                  invariant(
                    result.__typename === 'SwapByIntent',
                    `Unsupported swap plan: ${result.__typename}. Upgrade to a newer version of the @aave/react package.`,
                  );
                  return result;
                },
              ),
            )
            .andThen((intent) =>
              handler(intent, { cancel }).map((result) => {
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
 * @experimental
 */
export type UseBorrowSwapRequest = Prettify<
  PrepareBorrowSwapRequest & CurrencyQueryOptions
>;

/**
 * @experimental
 */
export function useBorrowSwap(
  handler: PositionSwapHandler,
): UseAsyncTask<
  PrepareBorrowSwapRequest,
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
          invariant(
            result.__typename === 'PositionSwapByIntentApprovalsRequired',
            `Unsupported swap plan: ${result.__typename}. Upgrade to a newer version of the @aave/react package.`,
          );

          return processApprovals(result)
            .with(handler)
            .andThen((request) =>
              preparePositionSwap(client, request, { currency }).map(
                (result) => {
                  invariant(
                    result.__typename === 'SwapByIntent',
                    `Unsupported swap plan: ${result.__typename}. Upgrade to a newer version of the @aave/react package.`,
                  );
                  return result;
                },
              ),
            )
            .andThen((intent) =>
              handler(intent, { cancel }).map((result) => {
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
  PrepareRepayWithSupplyRequest & CurrencyQueryOptions
>;

/**
 * @experimental
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
 * @experimental
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
 * @experimental
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
 * @experimental
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

// ------------------------------------------------------------

/**
 * @experimental
 */
export type UseRepayWithSupplyRequest = Prettify<
  PrepareRepayWithSupplyRequest & CurrencyQueryOptions
>;

/**
 * @experimental
 */
export function useRepayWithSupply(
  handler: PositionSwapHandler,
): UseAsyncTask<
  PrepareRepayWithSupplyRequest,
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
          invariant(
            result.__typename === 'PositionSwapByIntentApprovalsRequired',
            `Unsupported swap plan: ${result.__typename}. Upgrade to a newer version of the @aave/react package.`,
          );

          return processApprovals(result)
            .with(handler)
            .andThen((request) =>
              preparePositionSwap(client, request, { currency }).map(
                (result) => {
                  invariant(
                    result.__typename === 'SwapByIntent',
                    `Unsupported swap plan: ${result.__typename}. Upgrade to a newer version of the @aave/react package.`,
                  );
                  return result;
                },
              ),
            )
            .andThen((intent) =>
              handler(intent, { cancel }).map((result) => {
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
  PrepareWithdrawSwapRequest & CurrencyQueryOptions
>;

/**
 * @experimental
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
 * @experimental
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
 * @experimental
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
 * @experimental
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

// ------------------------------------------------------------

/**
 * @experimental
 */
export type UseWithdrawSwapRequest = Prettify<
  PrepareWithdrawSwapRequest & CurrencyQueryOptions
>;

/**
 * @experimental
 */
export function useWithdrawSwap(
  handler: PositionSwapHandler,
): UseAsyncTask<
  PrepareWithdrawSwapRequest,
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
          invariant(
            result.__typename === 'PositionSwapByIntentApprovalsRequired',
            `Unsupported swap plan: ${result.__typename}. Upgrade to a newer version of the @aave/react package.`,
          );

          return processApprovals(result)
            .with(handler)
            .andThen((request) =>
              preparePositionSwap(client, request, { currency }).map(
                (result) => {
                  invariant(
                    result.__typename === 'SwapByIntent',
                    `Unsupported swap plan: ${result.__typename}. Upgrade to a newer version of the @aave/react package.`,
                  );
                  return result;
                },
              ),
            )
            .andThen((intent) =>
              handler(intent, { cancel }).map((result) => {
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
  PrepareTokenSwapRequest & CurrencyQueryOptions
>;

export type TokenSwapPlan =
  | SwapTypedData
  | SwapByIntentWithApprovalRequired
  | SwapTransactionRequest
  | SwapApprovalRequired;

export type TokenSwapHandler = (
  plan: TokenSwapPlan,
  options: SwapHandlerOptions,
) => ResultAsync<
  ERC20PermitSignature | SwapReceipt,
  SendTransactionError | PendingTransactionError
>;

function isERC20PermitSignature(
  signature: unknown,
): signature is ERC20PermitSignature {
  return (
    typeof signature === 'object' &&
    signature !== null &&
    'deadline' in signature &&
    'value' in signature
  );
}

/**
 * @experimental
 * Orchestrate the swap execution plan.
 *
 * ```tsx
 * const [sendTransaction, sending] = useSendTransaction(wallet);
 * const [signSwapByIntentWith, signing] = useSignSwapByIntentWith(wallet);
 *
 * const [swap, swapping] = useTokenSwap((plan) => {
 *   switch (plan.__typename) {
 *     case 'SwapTypedData':
 *       return signSwapByIntentWith(plan);
 *
 *     case 'SwapApprovalRequired':
 *     case 'SwapByIntentWithApprovalRequired':
 *       return sendTransaction(plan.transaction);
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
      plan: SwapExecutionPlan,
    ): ResultAsync<
      SwapReceipt,
      | SendTransactionError
      | PendingTransactionError
      | ValidationError<InsufficientBalanceError>
    > => {
      switch (plan.__typename) {
        case 'SwapTransactionRequest':
          return handler(plan, { cancel })
            .map(PendingTransaction.ensure)
            .andThen((pendingTransaction) => pendingTransaction.wait())
            .andThen(() => {
              return okAsync(plan.orderReceipt);
            });
        case 'SwapApprovalRequired':
          return handler(plan, { cancel })
            .map(PendingTransaction.ensure)
            .andThen((pendingTransaction) => pendingTransaction.wait())
            .andThen(() => handler(plan.originalTransaction, { cancel }))
            .map(PendingTransaction.ensure)
            .andThen((pendingTransaction) => pendingTransaction.wait())
            .andThen(() => {
              return okAsync(plan.originalTransaction.orderReceipt);
            });
        case 'InsufficientBalanceError':
          return ValidationError.fromGqlNode(plan).asResultAsync();
        case 'SwapReceipt':
          return okAsync(plan);
      }
    },
    [handler],
  );

  return useAsyncTask(
    ({
      currency = DEFAULT_QUERY_OPTIONS.currency,
      ...request
    }: UseTokenSwapRequest) =>
      prepareTokenSwap(client, request, { currency }).andThen((preparePlan) => {
        switch (preparePlan.__typename) {
          case 'SwapByTransaction':
            return swap(client, {
              transaction: { quoteId: preparePlan.quote.quoteId },
            }).andThen(executeSwap);

          case 'SwapByIntent':
            return handler(preparePlan.data, { cancel }).andThen(
              (signedTypedData) => {
                invariant(
                  isERC20PermitSignature(signedTypedData),
                  'Invalid signature',
                );

                return swap(client, {
                  intent: {
                    quoteId: preparePlan.quote.quoteId,
                    signature: signedTypedData.value,
                  },
                }).andThen(executeSwap);
              },
            );

          case 'SwapByIntentWithApprovalRequired':
            return handler(preparePlan, { cancel })
              .map(PendingTransaction.ensure)
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(() => handler(preparePlan.data, { cancel }))
              .map(PendingTransaction.ensure)
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen((signedTypedData) => {
                invariant(
                  isERC20PermitSignature(signedTypedData),
                  'Invalid signature',
                );
                return swap(client, {
                  intent: {
                    quoteId: preparePlan.quote.quoteId,
                    signature: signedTypedData.value,
                  },
                }).andThen(executeSwap);
              });

          case 'InsufficientBalanceError':
            return ValidationError.fromGqlNode(preparePlan).asResultAsync();
        }
      }),
    [client, handler, executeSwap],
  );
}

export type CancelSwapHandler = (
  data: SwapTypedData | TransactionRequest,
) => ResultAsync<
  ERC20PermitSignature | PendingTransaction,
  SigningError | UnexpectedError
>;

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
 * @experimental
 * Executes the complete swap cancellation workflow combining preparation and execution.
 *
 * ```tsx
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [signSwapCancelWith] = useSignSwapCancelWith(wallet);
 *
 * const [cancelSwap, {loading, error}] = useCancelSwap((plan: SwapTypedData | TransactionRequest) => {
 *   switch (plan.__typename) {
 *     case 'TransactionRequest':
 *       return sendTransaction(plan);
 *
 *     case 'SwapTypedData':
 *       return signSwapCancelWith(plan);
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
              .andThen((result) => handler(result.data))
              .andThen((signedTypedData) => {
                invariant(
                  isERC20PermitSignature(signedTypedData),
                  'Invalid signature',
                );

                return cancelSwap(client, {
                  intent: { id: request.id, signature: signedTypedData.value },
                });
              })
              .andThen((plan) => {
                if (plan.__typename === 'SwapCancelled') {
                  return okAsync(plan);
                }

                return (
                  handler(plan)
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

          default:
            return new CannotCancelSwapError(
              'Swap cannot longer be cancelled',
            ).asResultAsync();
        }
      }),
    [client, handler],
  );
}
