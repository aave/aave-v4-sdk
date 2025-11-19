import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  errAsync,
  ValidationError,
} from '@aave/client';
import {
  cancelSwap,
  prepareSwap,
  prepareSwapCancel,
  swap,
  swapQuote,
  swapStatus,
} from '@aave/client/actions';
import type {
  CancelError,
  SigningError,
  TimeoutError,
  TransactionError,
  UnexpectedError,
} from '@aave/core';
import type {
  InsufficientBalanceError,
  PaginatedUserSwapsResult,
  PrepareSwapCancelRequest,
  SwapByIntentTypedData,
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
  type CancelSwapTypedData,
  type ERC20PermitSignature,
  type PrepareSwapRequest,
  type SwapApprovalRequired,
  SwappableTokensQuery,
  type SwappableTokensRequest,
  SwapQuoteQuery,
  type Token,
  type TransactionRequest,
  UserSwapsQuery,
} from '@aave/graphql';
import {
  invariant,
  type NullishDeep,
  okAsync,
  type Prettify,
  type ResultAsync,
  ResultAwareError,
} from '@aave/types';
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
 * @internal
 * Fetch a swap quote for the specified trade parameters.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useSwapQuote({
 *   chainId: chainId(1),
 *   buy: { erc20: evmAddress('0xA0b86a33E6...') },
 *   sell: { erc20: evmAddress('0x6B175474E...') },
 *   amount: bigDecimal('1000'),
 *   kind: SwapKind.SELL,
 *   suspense: true,
 * });
 * ```
 */
export function useSwapQuote(
  args: UseSwapQuoteArgs & Suspendable,
): SuspenseResult<SwapQuote>;
/**
 * @internal
 * Fetch a swap quote for the specified trade parameters.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useSwapQuote({
 *   chainId: chainId(1),
 *   buy: { erc20: evmAddress('0xA0b86a33E6...') },
 *   sell: { erc20: evmAddress('0x6B175474E...') },
 *   amount: bigDecimal('1000'),
 *   kind: SwapKind.SELL,
 *   from: evmAddress('0x742d35cc...'),
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useSwapQuote(
  args: Pausable<UseSwapQuoteArgs> & Suspendable,
): PausableSuspenseResult<SwapQuote>;
/**
 * @internal
 * Fetch a swap quote for the specified trade parameters.
 *
 * ```tsx
 * const { data, error, loading } = useSwapQuote({
 *   chainId: chainId(1),
 *   buy: { erc20: evmAddress('0xA0b86a33E6...') },
 *   sell: { erc20: evmAddress('0x6B175474E...') },
 *   amount: bigDecimal('1000'),
 *   kind: SwapKind.SELL,
 * });
 * ```
 */
export function useSwapQuote(args: UseSwapQuoteArgs): ReadResult<SwapQuote>;
/**
 * @internal
 * Fetch a swap quote for the specified trade parameters.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useSwapQuote({
 *   chainId: chainId(1),
 *   buy: { erc20: evmAddress('0xA0b86a33E6...') },
 *   sell: { erc20: evmAddress('0x6B175474E...') },
 *   amount: bigDecimal('1000'),
 *   kind: SwapKind.SELL,
 *   from: evmAddress('0x742d35cc...'),
 *   pause: true,
 * });
 * ```
 */
export function useSwapQuote(
  args: Pausable<UseSwapQuoteArgs>,
): PausableReadResult<SwapQuote>;

/**
 * @internal
 */
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
 * @internal
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
 *   buy: { erc20: evmAddress('0xA0b86a33E6...') },
 *   sell: { erc20: evmAddress('0x6B175474E...') },
 *   amount: bigDecimal('1000'),
 *   kind: SwapKind.SELL,
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
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

/**
 * @internal
 */
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
 * @internal
 * Fetch the user's swap history for a specific chain.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useUserSwaps({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc...'),
 *   filterBy: [SwapStatusFilter.FULFILLED, SwapStatusFilter.OPEN],
 *   suspense: true,
 * });
 * ```
 */
export function useUserSwaps(
  args: UseUserSwapsArgs & Suspendable,
): SuspenseResult<PaginatedUserSwapsResult>;
/**
 * @internal
 * Fetch the user's swap history for a specific chain.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useUserSwaps({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc...'),
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
 * @internal
 * Fetch the user's swap history for a specific chain.
 *
 * ```tsx
 * const { data, error, loading } = useUserSwaps({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc...'),
 *   filterBy: [SwapStatusFilter.FULFILLED, SwapStatusFilter.OPEN],
 * });
 * ```
 */
export function useUserSwaps(
  args: UseUserSwapsArgs,
): ReadResult<PaginatedUserSwapsResult>;
/**
 * @internal
 * Fetch the user's swap history for a specific chain.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useUserSwaps({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc...'),
 *   filterBy: [SwapStatusFilter.FULFILLED, SwapStatusFilter.OPEN],
 *   pause: true,
 * });
 * ```
 */
export function useUserSwaps(
  args: Pausable<UseUserSwapsArgs>,
): PausableReadResult<PaginatedUserSwapsResult>;

/**
 * @internal
 */
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

export type UseSwapTokensRequest = Prettify<
  PrepareSwapRequest & CurrencyQueryOptions
>;

export type SwapIntent =
  | SwapByIntentTypedData
  | SwapByIntentWithApprovalRequired
  | SwapTransactionRequest
  | SwapApprovalRequired;

export type SwapHandlerOptions = {
  cancel: CancelOperation;
};

export type SwapHandler = (
  intent: SwapIntent,
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
 * @internal
 * Orchestrate the swap execution plan.
 *
 * ```tsx
 * const [sendTransaction, sending] = useSendTransaction(wallet);
 * const [signSwapByIntentWith, signing] = useSignSwapByIntentWith(wallet);
 *
 * const [swap, swapping] = useSwapTokens((plan) => {
 *   switch (plan.__typename) {
 *     case 'SwapByIntentTypedData':
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
 *     buy: { erc20: evmAddress('0xA0b86a33E6...') },
 *     sell: { erc20: evmAddress('0x6B175474E...') },
 *     amount: bigDecimal('1000'),
 *     kind: SwapKind.SELL,
 *     user: evmAddress('0x742d35cc...'),
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
export function useSwapTokens(
  handler: SwapHandler,
): UseAsyncTask<
  PrepareSwapRequest,
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
          return errAsync(ValidationError.fromGqlNode(plan));
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
    }: UseSwapTokensRequest) =>
      prepareSwap(client, request, { currency }).andThen((preparePlan) => {
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
            return errAsync(ValidationError.fromGqlNode(preparePlan));
        }
      }),
    [client, handler, executeSwap],
  );
}

export type CancelSwapHandler = (
  data: CancelSwapTypedData | TransactionRequest,
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
 * @internal
 * Executes the complete swap cancellation workflow combining preparation and execution.
 *
 * ```tsx
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [signSwapCancelWith] = useSignSwapCancelWith(wallet);
 *
 * const [cancelSwap, {loading, error}] = useCancelSwap((plan: CancelSwapTypedData | TransactionRequest) => {
 *   switch (plan.__typename) {
 *     case 'TransactionRequest':
 *       return sendTransaction(plan);
 *
 *     case 'CancelSwapTypedData':
 *       return signSwapCancelWith(plan);
 *   }
 * });
 *
 * const result = await cancelSwap({
 *   id: swapId('123...'),
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
                      return errAsync(
                        new CannotCancelSwapError('Failed to cancel swap'),
                      );
                    })
                );
              });

          case 'SwapCancelled':
            return okAsync(status);

          default:
            return errAsync(
              new CannotCancelSwapError('Swap cannot longer be cancelled'),
            );
        }
      }),
    [client, handler],
  );
}
