import { prepareSwap, swap, swapQuote } from '@aave/client-next';
import type { UnexpectedError } from '@aave/core-next';
import type {
  PrepareSwapRequest,
  PrepareSwapResult,
  SwapExecutionPlan,
  SwapQuote,
  SwapQuoteRequest,
  SwapRequest,
} from '@aave/graphql-next';
import {
  SwappableTokensQuery,
  type SwappableTokensRequest,
  type Token,
} from '@aave/graphql-next';
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
export function useSwapQuote(): UseAsyncTask<
  SwapQuoteRequest,
  SwapQuote,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: SwapQuoteRequest) =>
    swapQuote(client, request),
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

/**
 * Prepares swap for the specified trade parameters.
 *
 * ```tsx
 * const [prepare, preparing] = usePrepareSwap();
 *
 * const loading = preparing.loading;
 * const error = preparing.error;
 *
 * // …
 *
 * const result = await prepare({
 *   market: {
 *     chainId: chainId(1),
 *     buy: { erc20: evmAddress('0xA0b86a33E6...') },
 *     sell: { erc20: evmAddress('0x6B175474E...') },
 *     amount: bigDecimal('1000'),
 *     kind: SwapKind.SELL,
 *     user: evmAddress('0x742d35cc...'),
 *   },
 * }).andThen((swapResult) => {
 *   switch (swapResult.__typename) {
 *     case 'SwapByIntent':
 *       // TODO: define how to handle SwapByIntent
 *     case 'SwapByIntentWithApprovalRequired':
 *       // TODO: define how to handle SwapByIntentWithApprovalRequired
 *     case 'SwapByTransaction':
 *       // TODO: define how to handle SwapByTransaction
 *     default:
 *       return errAsync(new Error('Unexpected swap result type'));
 *   }
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 * ```
 */
export function usePrepareSwap(): UseAsyncTask<
  PrepareSwapRequest,
  PrepareSwapResult,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: PrepareSwapRequest) =>
    prepareSwap(client, request),
  );
}

/**
 * Executes a swap for the specified request parameters.
 *
 * ```tsx
 * const [execute, executing] = useSwap();
 * const [sendTransaction, sending] = useSendTransaction(wallet);
 *
 * const loading = executing.loading && sending.loading;
 * const error = executing.error || sending.error;
 *
 * // …
 *
 * const result = await execute({
 *   intent: {
 *     id: swapRequestId('123...'),
 *     signature: {
 *       value: signature('0x456...'),
 *       deadline: 1234567890,
 *     },
 *   },
 * }).andThen((plan) => {
 *   switch (plan.__typename) {
 *     case 'SwapTransactionRequest':
 *       return sendTransaction(plan.transaction);
 *
 *     case 'SwapApprovalRequired':
 *       return sendTransaction(plan.approval)
 *         .andThen(() => sendTransaction(plan.originalTransaction.transaction));
 *
 *     case 'InsufficientBalanceError':
 *       return errAsync(new Error(`Insufficient balance: ${plan.required.value} required.`));
 *
 *     case 'SwapReceipt':
 *       return plan;
 *   }
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 * ```
 */
export function useSwap(): UseAsyncTask<
  SwapRequest,
  SwapExecutionPlan,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: SwapRequest) => swap(client, request));
}
