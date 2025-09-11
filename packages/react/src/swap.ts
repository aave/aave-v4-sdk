import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
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
  PendingSwapsRequest,
  PrepareSwapCancelRequest,
  PrepareSwapCancelResult,
  PrepareSwapRequest,
  SwapExecutionPlan,
  SwapQuote,
  SwapQuoteRequest,
  SwapReceipt,
} from '@aave/graphql-next';
import {
  type ERC712Signature,
  PendingSwapsQuery,
  type SwapByIntent,
  type SwapByIntentWithApprovalRequired,
  SwappableTokensQuery,
  type SwappableTokensRequest,
  type Token,
} from '@aave/graphql-next';
import type { Prettify, ResultAsync } from '@aave/types-next';

import { useAaveClient } from './context';
import {
  type ReadResult,
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

export type SwapIntent = SwapByIntent | SwapByIntentWithApprovalRequired;

export type SwapByIntentHandler = (
  intent: SwapIntent,
) => ResultAsync<ERC712Signature, SigningError | UnexpectedError>;

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
 * }).andThen((plan) => {
 *   switch (plan.__typename) {
 *     case 'InsufficientBalanceError':
 *       return errAsync(new Error(`Insufficient balance: ${plan.required.value} required.`));
 *
 *     case 'SwapTransactionRequest':
 *       return sendTransaction(plan.transaction)
 *         .map(() => plan.orderReceipt);
 *
 *     case 'SwapApprovalRequired':
 *       return sendTransaction(plan.approval)
 *         .andThen(() => sendTransaction(plan.originalTransaction.transaction))
 *         .map(() => plan.originalTransaction.orderReceipt);
 *
 *     case 'SwapReceipt':
 *       return okAsync(plan.orderReceipt);
 *   }
 * });
 * ```
 */
export function useSwapTokens(
  handler: SwapByIntentHandler,
): UseAsyncTask<
  PrepareSwapRequest,
  SwapExecutionPlan,
  SigningError | UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask(
    ({
      currency = DEFAULT_QUERY_OPTIONS.currency,
      ...request
    }: UseSwapTokensRequest) =>
      prepareSwap(client, request, { currency }).andThen((prepareResult) => {
        switch (prepareResult.__typename) {
          case 'SwapByIntent':
            return handler(prepareResult).andThen((signature) =>
              swap(client, { intent: { id: prepareResult.id, signature } }),
            );

          case 'SwapByIntentWithApprovalRequired':
            return handler(prepareResult).andThen((signature) =>
              swap(client, { intent: { id: prepareResult.id, signature } }),
            );

          case 'SwapByTransaction':
            return swap(client, { transaction: { id: prepareResult.id } });
        }
      }),
  );
}

export type CancelSwapByIntentHandler = (
  data: PrepareSwapCancelResult,
) => ResultAsync<ERC712Signature, SigningError | UnexpectedError>;

/**
 * Executes the complete swap cancellation workflow combining preparation and execution.
 *
 * ```tsx
 * const [sendTransaction, sending] = useSendTransaction(wallet);
 * const [signSwapByIntentWith, signing] = useSignSwapByIntentWith(wallet);
 *
 * const [cancelSwap, cancelling] = useCancelSwap((prepareResult) =>
 *   signSwapByIntentWith(prepareResult.data)
 * );
 *
 * const result = await cancelSwap({
 *   id: swapId('123...'),
 * }).andThen((plan) => {
 *   switch (plan.__typename) {
 *     case 'TransactionRequest':
 *       return sendTransaction(plan)
 *         .map(() => ({ success: true }));
 *
 *     case 'SwapCancelled':
 *       return okAsync(plan);
 *   }
 * });
 * ```
 */
export function useCancelSwap(
  handler: CancelSwapByIntentHandler,
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
