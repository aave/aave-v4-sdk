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
} from '@aave/client-next/actions';
import type { SigningError, UnexpectedError } from '@aave/core-next';
import type {
  CancelSwapExecutionPlan,
  InsufficientBalanceError,
  PendingSwapsRequest,
  PrepareSwapCancelRequest,
  PrepareSwapCancelResult,
  PrepareSwapRequest,
  SwapQuote,
  SwapQuoteRequest,
  SwapReceipt,
} from '@aave/graphql-next';
import {
  type ERC712Signature,
  PendingSwapsQuery,
  SwappableTokensQuery,
  type SwappableTokensRequest,
  type Token,
  type TransactionRequest,
} from '@aave/graphql-next';
import { okAsync, type Prettify, type ResultAsync } from '@aave/types-next';
import { useAaveClient } from './context';
import {
  type ReadResult,
  type SendTransactionError,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  type SwapHandler,
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

export type UsePendingSwapsArgs = PendingSwapsRequest;

/**
 * Fetch pending swaps for a specific user.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = usePendingSwaps({
 *   user: evmAddress('0x742d35cc...'),
 *   suspense: true,
 * });
 * ```
 */
export function usePendingSwaps(
  args: UsePendingSwapsArgs & Suspendable,
): SuspenseResult<SwapReceipt[]>;

/**
 * Fetch pending swaps for a specific user.
 *
 * ```tsx
 * const { data, error, loading } = usePendingSwaps({
 *   user: evmAddress('0x742d35cc...'),
 * });
 * ```
 */
export function usePendingSwaps(
  args: UsePendingSwapsArgs,
): ReadResult<SwapReceipt[]>;

export function usePendingSwaps({
  suspense = false,
  ...request
}: UsePendingSwapsArgs & {
  suspense?: boolean;
}): SuspendableResult<SwapReceipt[]> {
  return useSuspendableQuery({
    document: PendingSwapsQuery,
    variables: {
      request,
    },
    suspense,
  });
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

export type UseSwapTokensRequest = Prettify<
  PrepareSwapRequest & CurrencyQueryOptions
>;

/**
 * Orchestrate the swap execution plan.
 *
 * ```tsx
 * const [sendTransaction, sending] = useSendTransaction(wallet);
 * const [signSwapByIntentWith, signing] = useSignSwapByIntentWith(wallet);
 *
 * const [swap, swapping] = useSwapTokens((intent) => {
 *   switch (intent.__typename) {
 *     case 'SwapByIntent':
 *       return signSwapByIntentWith(intent.data);
 *
 *     case 'SwapByIntentWithApprovalRequired':
 *       return sendTransaction(intent.approval)
 *         .andThen(() => signSwapByIntentWith(intent.data));
 *
 *     case 'SwapByTransaction':
 *       return sendTransaction(intent.transaction);
 *
 *     case 'SwapTransactionRequest':
 *       return sendTransaction(intent.transaction);
 *
 *     case 'SwapApprovalRequired':
 *       return sendTransaction(intent.approval)
 *         .andThen(() => sendTransaction(intent.originalTransaction.transaction));
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
  SendTransactionError | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    ({
      currency = DEFAULT_QUERY_OPTIONS.currency,
      ...request
    }: UseSwapTokensRequest) =>
      prepareSwap(client, request, { currency }).andThen((preparePlan) => {
        switch (preparePlan.__typename) {
          case 'SwapByTransaction':
          case 'SwapByIntent':
          case 'SwapByIntentWithApprovalRequired':
            return handler(preparePlan).andThen((receipt) => {
              // If the receipt is an ERC712Signature, we need to call swap
              // Handle scenario where swap is not by intent
              const swapRequest =
                preparePlan.__typename === 'SwapByTransaction'
                  ? { transaction: { id: preparePlan.id } }
                  : {
                      intent: {
                        id: preparePlan.id,
                        signature: receipt as ERC712Signature,
                      },
                    };
              return swap(client, swapRequest).andThen((swapPlan) => {
                switch (swapPlan.__typename) {
                  case 'SwapTransactionRequest':
                    return handler(swapPlan).andThen(() => {
                      return okAsync(swapPlan.orderReceipt);
                    });
                  case 'SwapApprovalRequired':
                    return handler(swapPlan).andThen(() => {
                      return okAsync(swapPlan.originalTransaction.orderReceipt);
                    });
                  case 'InsufficientBalanceError':
                    return errAsync(ValidationError.fromGqlNode(swapPlan));
                  case 'SwapReceipt':
                    return okAsync(swapPlan);
                }
              });
            });
        }
      }),
  );
}

export type CancelSwapHandler = (
  data: PrepareSwapCancelResult | TransactionRequest,
) => ResultAsync<ERC712Signature, SigningError | UnexpectedError>;

/**
 * Executes the complete swap cancellation workflow combining preparation and execution.
 *
 * ```tsx
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [signSwapCancelWith] = useSignSwapCancelWith(wallet);
 *
 *  const [cancelSwap, {loading, error}] = useCancelSwap((plan: PrepareSwapCancelResult | TransactionRequest) => {
 *     switch (plan.__typename) {
 *         case 'TransactionRequest':
 *             return sendTransaction(plan);
 *
 *         case 'PrepareSwapCancelResult':
 *             return signSwapCancelWith(plan.data);
 *     }
 * });
 *
 * const result = await cancelSwap({
 *   id: swapId('123...'),
 * });
 *
 * if (result.isErr()) {
 *     console.error(result.error);
 *     return;
 * }
 *
 * // result.value: SwapCancelled
 * console.log('Swap cancelled:', result.value);
 * ```
 */
export function useCancelSwap(
  handler: CancelSwapHandler,
): UseAsyncTask<
  PrepareSwapCancelRequest,
  CancelSwapExecutionPlan,
  SigningError | UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: PrepareSwapCancelRequest) =>
    prepareSwapCancel(client, request).andThen((prepareResult) =>
      handler(prepareResult).andThen((signature) =>
        cancelSwap(client, { intent: { id: request.id, signature } }),
      ),
    ),
  );
}
