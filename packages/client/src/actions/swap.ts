import { delay, TimeoutError, UnexpectedError } from '@aave/core-next';
import type {
  CancelSwapExecutionPlan,
  CancelSwapRequest,
  PaginatedUserSwapsResult,
  PrepareSwapCancelRequest,
  PrepareSwapCancelResult,
  PrepareSwapRequest,
  PrepareSwapResult,
  SwapCancelled,
  SwapExecutionPlan,
  SwapExpired,
  SwapFulfilled,
  SwappableTokensRequest,
  SwapQuote,
  SwapQuoteRequest,
  SwapReceipt,
  SwapRequest,
  SwapStatus,
  SwapStatusRequest,
  Token,
  UserSwapsRequest,
} from '@aave/graphql-next';
import {
  CancelSwapQuery,
  PrepareSwapCancelQuery,
  PrepareSwapQuery,
  SwappableTokensQuery,
  SwapQuery,
  SwapQuoteQuery,
  SwapStatusQuery,
  UserSwapsQuery,
} from '@aave/graphql-next';
import { ResultAsync } from '@aave/types-next';
import type { AaveClient } from '../AaveClient';
import { type CurrencyQueryOptions, DEFAULT_QUERY_OPTIONS } from '../options';

/**
 * @internal
 * Fetches a swap quote for the specified trade parameters.
 *
 * ```ts
 * const result = await swapQuote(client, {
 *   chainId: chainId(1),
 *   buy: { erc20: evmAddress('0xA0b86a33E6...') },
 *   sell: { erc20: evmAddress('0x6B175474E...') },
 *   amount: bigDecimal('1000'),
 *   kind: SwapKind.SELL,
 *   from: evmAddress('0x742d35cc...'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The swap quote request parameters.
 * @param options - The query options.
 * @returns The swap quote including pricing and cost information.
 */
export function swapQuote(
  client: AaveClient,
  request: SwapQuoteRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<SwapQuote, UnexpectedError> {
  return client.query(SwapQuoteQuery, { request, ...options });
}

/**
 * @internal
 * Fetches the list of tokens available for swapping on a specific chain.
 *
 * ```ts
 * const result = await swappableTokens(client, {
 *   query: { chainIds: [chainId(1)] },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The swappable tokens request parameters.
 * @returns The list of tokens available for swapping.
 */
export function swappableTokens(
  client: AaveClient,
  request: SwappableTokensRequest,
): ResultAsync<Token[], UnexpectedError> {
  return client.query(SwappableTokensQuery, { request });
}

/**
 * @internal
 * Prepares a swap for the specified trade parameters.
 *
 * ```ts
 * const result = await prepareSwap(client, {
 *   market: {
 *     chainId: chainId(1),
 *     buy: { erc20: evmAddress('0xA0b86a33E6...') },
 *     sell: { erc20: evmAddress('0x6B175474E...') },
 *     amount: bigDecimal('1000'),
 *     kind: SwapKind.SELL,
 *     user: evmAddress('0x742d35cc...'),
 *   },
 * }).andThen(plan => {
 *   switch (plan.__typename) {
 *     case 'SwapByIntent':
 *       return signSwapByIntentWith(plan.data)
 *         .andThen((signature) => swap({ intent: { quoteId: quote.quoteId, signature } }))
 *         .andThen((plan) => {
 *           // …
 *         });
 *       );
 *
 *     case 'SwapByIntentWithApprovalRequired':
 *       return sendTransaction(plan.transaction)
 *         .andThen(signSwapByIntentWith(plan.data))
 *         .andThen((signature) => swap({ intent: { quoteId: quote.quoteId, signature } }))
 *         .andThen((plan) => {
 *         // …
 *         });
 *       );
 *
 *     case 'SwapByTransaction':
 *       return swap({ transaction: { quoteId: quote.quoteId } })
 *         .andThen((plan) => {
 *           // …
 *         });
 *       );
 *
 *     case 'InsufficientBalanceError':
 *       return errAsync(new Error(`Insufficient balance: ${plan.required.value} required.`));
 *   }
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The prepare swap request parameters.
 * @param options - The query options.
 * @returns The prepared swap result containing details of the swap.
 */
export function prepareSwap(
  client: AaveClient,
  request: PrepareSwapRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<PrepareSwapResult, UnexpectedError> {
  return client.query(PrepareSwapQuery, { request, ...options });
}

/**
 * @internal
 * Fetches the status of a specific swap.
 *
 * ```ts
 * const result = await swapStatus(client, {
 *   id: swapId('swap_123'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The swap status request parameters.
 * @param options - The query options.
 * @returns The current status of the swap.
 */
export function swapStatus(
  client: AaveClient,
  request: SwapStatusRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<SwapStatus, UnexpectedError> {
  return client.query(SwapStatusQuery, { request, ...options });
}

export type SwapOutcome = SwapCancelled | SwapExpired | SwapFulfilled;

/**
 * @internal
 * Waits for a swap to reach a final outcome (cancelled, expired, or fulfilled).
 *
 * ```ts
 * const result = waitForSwapOutcome(client)(swapReceipt);
 *
 * if (result.isOk()) {
 *   const outcome = result.value;
 *   switch (outcome.__typename) {
 *     case 'SwapFulfilled':
 *       console.log('Swap completed successfully:', outcome.txHash);
 *       break;
 *     case 'SwapCancelled':
 *       console.log('Swap was cancelled:', outcome.cancelledAt);
 *       break;
 *     case 'SwapExpired':
 *       console.log('Swap expired:', outcome.expiredAt);
 *       break;
 *   }
 * }
 * ```
 *
 * @param client - Aave client configured with polling settings.
 * @returns A function that takes a SwapReceipt and returns a ResultAsync with the final outcome.
 */
export function waitForSwapOutcome(
  client: AaveClient,
): (
  receipt: SwapReceipt,
) => ResultAsync<SwapOutcome, TimeoutError | UnexpectedError> {
  return (receipt: SwapReceipt) => {
    const pollForSwapOutcome = async (
      request: SwapStatusRequest,
    ): Promise<SwapOutcome> => {
      const startedAt = Date.now();

      while (
        Date.now() - startedAt <
        client.context.environment.indexingTimeout
      ) {
        const status = await swapStatus(client, request).match(
          (ok) => ok,
          (err) => {
            throw err;
          },
        );

        switch (status.__typename) {
          case 'SwapCancelled':
          case 'SwapExpired':
          case 'SwapFulfilled':
            return status;

          default:
            await delay(client.context.environment.pollingInterval);
            continue;
        }
      }

      throw TimeoutError.from(
        `Timeout waiting for swap ${request.id} to reach final outcome.`,
      );
    };

    return ResultAsync.fromPromise(
      pollForSwapOutcome({ id: receipt.id }),
      (error) => {
        if (error instanceof TimeoutError || error instanceof UnexpectedError) {
          return error;
        }
        return UnexpectedError.from(error);
      },
    );
  };
}

/**
 * @internal
 * Executes a swap for the specified request parameters.
 *
 * ```ts
 * const result = await swap(client, {
 *   intent: {
 *     quoteId: swapQuoteId('123...'),
 *     signature: {
 *       value: signature('0x456...'),
 *       deadline: 1234567890,
 *     },
 *   },
 * }).andThen((plan) => {
 *   switch (plan.__typename) {
 *     case 'SwapTransactionRequest':
 *       return sendTransaction(plan.transaction)
 *         .map(() => plan.orderReceipt);
 *
 *     case 'SwapApprovalRequired':
 *       return sendTransaction(plan.transaction)
 *         .andThen(() => sendTransaction(plan.originalTransaction))
 *         .map(() => plan.originalTransaction.orderReceipt);
 *
 *     case 'SwapReceipt':
 *       return okAsync(plan.orderReceipt);
 *
 *     case 'InsufficientBalanceError':
 *       return errAsync(new Error(`Insufficient balance: ${plan.required.value} required.`));
 *   }
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Order receipt:', result.value);
 * ```
 *
 * @param client - Aave client.
 * @param request - The swap request parameters.
 * @returns The swap execution plan containing transaction details or receipt.
 */
export function swap(
  client: AaveClient,
  request: SwapRequest,
): ResultAsync<SwapExecutionPlan, UnexpectedError> {
  return client.query(SwapQuery, { request });
}

/**
 * @internal
 * Prepares a swap cancellation for the specified swap ID.
 *
 * ```ts
 * const result = await prepareSwapCancel(client, {
 *   id: swapId('123...'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The prepare swap cancel request parameters.
 * @returns The prepared swap cancel result containing typed data for signing.
 */
export function prepareSwapCancel(
  client: AaveClient,
  request: PrepareSwapCancelRequest,
): ResultAsync<PrepareSwapCancelResult, UnexpectedError> {
  return client.query(PrepareSwapCancelQuery, { request });
}

/**
 * @internal
 * Executes a swap cancellation for the specified request parameters.
 *
 * ```ts
 * const result = await cancelSwap(client, {
 *   intent: {
 *     id: swapId('123...'),
 *     signature: {
 *       value: signature('0x456...'),
 *       deadline: 1234567890,
 *     },
 *   },
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
 *
 * @param client - Aave client.
 * @param request - The cancel swap request parameters.
 * @returns The cancel swap execution plan containing transaction details or cancellation receipt.
 */
export function cancelSwap(
  client: AaveClient,
  request: CancelSwapRequest,
): ResultAsync<CancelSwapExecutionPlan, UnexpectedError> {
  return client.query(CancelSwapQuery, { request });
}

/**
 * @internal
 * Fetches the user's swap history for a specific chain.
 *
 * ```ts
 * const result = await userSwaps(client, {
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc...'),
 *   filterBy: [SwapStatusFilter.FULFILLED, SwapStatusFilter.OPEN],
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The user swaps request parameters.
 * @param options - The query options.
 * @returns The paginated list of user swaps with their status information.
 */
export function userSwaps(
  client: AaveClient,
  request: UserSwapsRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<PaginatedUserSwapsResult, UnexpectedError> {
  return client.query(UserSwapsQuery, { request, ...options });
}
