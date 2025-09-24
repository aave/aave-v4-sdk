import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  errAsync,
  ValidationError,
} from '@aave/client-next';
import {
  cancelSwap,
  prepareSwap,
  prepareSwapCancel,
  swap,
  swapQuote,
  swapStatus,
} from '@aave/client-next/actions';
import type {
  CancelError,
  SigningError,
  TimeoutError,
  TransactionError,
  UnexpectedError,
} from '@aave/core-next';
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
} from '@aave/graphql-next';
import {
  type CancelSwapTypedData,
  type ERC20PermitSignature,
  type PrepareSwapRequest,
  type SwapApprovalRequired,
  SwappableTokensQuery,
  type SwappableTokensRequest,
  type Token,
  type TransactionRequest,
  UserSwapsQuery,
} from '@aave/graphql-next';
import {
  invariant,
  okAsync,
  type Prettify,
  type ResultAsync,
  ResultAwareError,
} from '@aave/types-next';
import { useAaveClient } from './context';
import {
  type CancelOperation,
  cancel,
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

/**
 * Fetches a swap quote for the specified trade parameters.
 *
 * ```tsx
 * const [getQuote, gettingQuote] = useSwapQuote();
 *
 * const loading = gettingQuote.loading;
 * const error = gettingQuote.error;
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
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Swap quote:', result.value);
 * ```
 */
export function useSwapQuote(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<SwapQuoteRequest, SwapQuote, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask((request: SwapQuoteRequest) =>
    swapQuote(client, request, options),
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
 *   query: { chainId: chainId(1) },
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
 * ```tsx
 * const { data, error, loading } = useSwappableTokens({
 *   query: { chainId: chainId(1) },
 * });
 * ```
 */
export function useSwappableTokens(
  args: UseSwappableTokensArgs,
): ReadResult<Token[]>;

export function useSwappableTokens({
  suspense = false,
  ...request
}: UseSwappableTokensArgs & {
  suspense?: boolean;
}): SuspendableResult<Token[]> {
  return useSuspendableQuery({
    document: SwappableTokensQuery,
    variables: {
      request,
    },
    suspense,
  });
}

export type UseUserSwapsArgs = Prettify<
  UserSwapsRequest & CurrencyQueryOptions
>;

/**
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

export function useUserSwaps({
  suspense = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: UseUserSwapsArgs & {
  suspense?: boolean;
}): SuspendableResult<PaginatedUserSwapsResult> {
  return useSuspendableQuery({
    document: UserSwapsQuery,
    variables: {
      request,
      currency,
    },
    suspense,
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
 *       return sendTransaction(plan.approval);
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

  function executeSwap(
    plan: SwapExecutionPlan,
  ): ResultAsync<
    SwapReceipt,
    | SendTransactionError
    | PendingTransactionError
    | ValidationError<InsufficientBalanceError>
  > {
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
  }

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

  return useAsyncTask((request) =>
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
  );
}
