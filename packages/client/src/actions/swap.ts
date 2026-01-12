import {
  delay,
  TimeoutError,
  UnexpectedError,
  ValidationError,
} from '@aave/core';
import {
  BorrowSwapQuoteQuery,
  type BorrowSwapQuoteRequest,
  type BorrowSwapQuoteResult,
  type CancelSwapExecutionPlan,
  CancelSwapMutation,
  type CancelSwapRequest,
  type InsufficientBalanceError,
  type PaginatedUserSwapsResult,
  PreparePositionSwapQuery,
  type PreparePositionSwapRequest,
  PrepareSwapCancelQuery,
  type PrepareSwapCancelRequest,
  type PrepareSwapCancelResult,
  PrepareTokenSwapQuery,
  type PrepareTokenSwapRequest,
  RepayWithSupplyQuoteQuery,
  type RepayWithSupplyQuoteRequest,
  type RepayWithSupplyQuoteResult,
  SupplySwapQuoteQuery,
  type SupplySwapQuoteRequest,
  type SupplySwapQuoteResult,
  type SwapByIntent,
  type SwapCancelled,
  type SwapExecutionPlan,
  type SwapExpired,
  type SwapFulfilled,
  SwapMutation,
  SwappableTokensQuery,
  type SwappableTokensRequest,
  type SwapReceipt,
  type SwapRequest,
  type SwapStatus,
  SwapStatusQuery,
  type SwapStatusRequest,
  type Token,
  TokenSwapQuoteQuery,
  type TokenSwapQuoteRequest,
  type TokenSwapQuoteResult,
  UserSwapsQuery,
  type UserSwapsRequest,
  WithdrawSwapQuoteQuery,
  type WithdrawSwapQuoteRequest,
  type WithdrawSwapQuoteResult,
} from '@aave/graphql';
import { extendWithOpaqueType, okAsync, ResultAsync } from '@aave/types';
import type { AaveClient } from '../AaveClient';
import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type TimeWindowQueryOptions,
} from '../options';

/**
 * Fetches a swap quote for the specified trade parameters.
 *
 * ```ts
 * const result = await tokenSwapQuote(client, {
 *   market: {
 *     chainId: chainId(1),
 *     buy: { erc20: evmAddress('0xA0b86a33E6...') },
 *     sell: { erc20: evmAddress('0x6B175474E...') },
 *     amount: bigDecimal('1000'),
 *     kind: SwapKind.Sell,
 *     user: evmAddress('0x742d35cc...'),
 *   },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The swap quote request parameters.
 * @param options - The query options.
 * @returns The swap quote including pricing and cost information.
 */
export function tokenSwapQuote(
  client: AaveClient,
  request: TokenSwapQuoteRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<TokenSwapQuoteResult, UnexpectedError> {
  return client.query(
    TokenSwapQuoteQuery,
    {
      request,
      currency: options.currency,
    },
    { batch: false },
  );
}

/**
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
 * Prepares a swap for the specified trade parameters.
 *
 * ```ts
 * const result = await prepareTokenSwap(client, {
 *   market: {
 *     chainId: chainId(1),
 *     buy: { erc20: evmAddress('0xA0b86a33E6...') },
 *     sell: { erc20: evmAddress('0x6B175474E...') },
 *     amount: bigDecimal('1000'),
 *     kind: SwapKind.Sell,
 *     user: evmAddress('0x742d35cc...'),
 *   },
 * }).andThen(plan => {
 *   switch (plan.__typename) {
 *     case 'SwapByIntent':
 *       return signSwapTypedDataWith(wallet, plan.data)
 *         .andThen((signature) =>
 *           swap({ intent: { quoteId: plan.quote.quoteId, signature } }),
 *         );
 *
 *     default:
 *       return new UnexpectedError(`Unsupported swap plan: ${plan.__typename}`).asResultAsync();
 *   }
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The prepare swap request parameters.
 * @param options - The query options.
 * @returns The prepared swap result containing details of the swap.
 */
export function prepareTokenSwap(
  client: AaveClient,
  request: PrepareTokenSwapRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<
  SwapByIntent,
  ValidationError<InsufficientBalanceError> | UnexpectedError
> {
  return client
    .query(PrepareTokenSwapQuery, { request, ...options })
    .map(extendWithOpaqueType)
    .andThen((result) => {
      switch (result.__typename) {
        case 'SwapByIntent':
          return okAsync(result);
        case 'InsufficientBalanceError':
          return ValidationError.fromGqlNode(result).asResultAsync();
        default:
          return UnexpectedError.upgradeRequired(
            `Unsupported result: ${result.__typename}`,
          ).asResultAsync();
      }
    });
}

/**
 * Fetches a supply swap quote for swapping deposited funds.
 *
 * ```ts
 * const result = await supplySwapQuote(client, {
 *   market: {
 *     sellPosition: userSupplyItemId('position_123'),
 *     buyReserve: reserveId('reserve_456'),
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc...'),
 *   },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The supply swap request parameters.
 * @param options - The query options.
 * @returns The supply swap result with quote, approvals, and preview.
 */
export function supplySwapQuote(
  client: AaveClient,
  request: SupplySwapQuoteRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<SupplySwapQuoteResult, UnexpectedError> {
  return client.query(
    SupplySwapQuoteQuery,
    { request, currency: options.currency },
    { batch: false },
  );
}

/**
 * Fetches a borrow swap quote for swapping debt positions.
 *
 * ```ts
 * const result = await borrowSwapQuote(client, {
 *   market: {
 *     sellPosition: userBorrowItemId('position_123'),
 *     buyReserve: reserveId('reserve_456'),
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc...'),
 *   },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The borrow swap request parameters.
 * @param options - The query options.
 * @returns The borrow swap result with quote, approvals, and preview.
 */
export function borrowSwapQuote(
  client: AaveClient,
  request: BorrowSwapQuoteRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<BorrowSwapQuoteResult, UnexpectedError> {
  return client.query(
    BorrowSwapQuoteQuery,
    { request, currency: options.currency },
    { batch: false },
  );
}

/**
 * Fetches a repay with supply quote for repaying debt using collateral.
 *
 * ```ts
 * const result = await repayWithSupplyQuote(client, {
 *   market: {
 *     sellPosition: userSupplyItemId('collateral_123'),
 *     buyPosition: userBorrowItemId('debt_456'),
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc...'),
 *   },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The repay with supply request parameters.
 * @param options - The query options.
 * @returns The repay with supply result with quote, approvals, and preview.
 */
export function repayWithSupplyQuote(
  client: AaveClient,
  request: RepayWithSupplyQuoteRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<RepayWithSupplyQuoteResult, UnexpectedError> {
  return client.query(
    RepayWithSupplyQuoteQuery,
    { request, currency: options.currency },
    { batch: false },
  );
}

/**
 * Fetches a withdraw swap quote for withdrawing deposits and swapping on the fly.
 *
 * ```ts
 * const result = await withdrawSwapQuote(client, {
 *   market: {
 *     position: userSupplyItemId('position_123'),
 *     buyReserve: reserveId('reserve_456'),
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc...'),
 *   },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The withdraw swap request parameters.
 * @param options - The query options.
 * @returns The withdraw swap result with quote, approvals, and preview.
 */
export function withdrawSwapQuote(
  client: AaveClient,
  request: WithdrawSwapQuoteRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<WithdrawSwapQuoteResult, UnexpectedError> {
  return client.query(
    WithdrawSwapQuoteQuery,
    { request, currency: options.currency },
    { batch: false },
  );
}

/**
 * Prepares a position swap by obtaining the typed data for signing.
 *
 * ```ts
 * const result = await preparePositionSwap(client, {
 *   quoteId: swapQuoteId('quote_123'),
 *   adapterContractSignature: signature('0x456...'),
 *   positionManagerSignature: signature('0x789...'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The position swap request with quote ID and signatures.
 * @param options - The query options.
 * @returns The position swap result with intent data for execution.
 */
export function preparePositionSwap(
  client: AaveClient,
  request: PreparePositionSwapRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<
  SwapByIntent,
  ValidationError<InsufficientBalanceError> | UnexpectedError
> {
  return client
    .query(
      PreparePositionSwapQuery,
      { request, currency: options.currency },
      { batch: false },
    )
    .map(extendWithOpaqueType)
    .andThen((result) => {
      switch (result.__typename) {
        case 'SwapByIntent':
          return okAsync(result);
        case 'InsufficientBalanceError':
          return ValidationError.fromGqlNode(result).asResultAsync();
        default:
          return UnexpectedError.upgradeRequired(
            `Unsupported result: ${result.__typename}`,
          ).asResultAsync();
      }
    });
}

/**
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
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  }: CurrencyQueryOptions & TimeWindowQueryOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<SwapStatus, UnexpectedError> {
  return client.query(SwapStatusQuery, { request, currency, timeWindow });
}

export type SwapOutcome = SwapCancelled | SwapExpired | SwapFulfilled;

/**
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
 * Executes a swap for the specified request parameters.
 *
 * ```ts
 * const result = await swap(client, {
 *   intent: {
 *     quoteId: swapQuoteId('123...'),
 *     signature: signature('0x456...'),
 *   },
 * }).andThen((plan) => {
 *   switch (plan.__typename) {
 *     case 'SwapTransactionRequest':
 *       return sendTransaction(plan.transaction)
 *         .map(() => plan.orderReceipt);
 *
 *     case 'SwapReceipt':
 *       return okAsync(plan);
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
  return client.mutation(SwapMutation, { request });
}

/**
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
 *       return sendTransaction(plan);
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
  return client.mutation(CancelSwapMutation, { request });
}

/**
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
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  }: CurrencyQueryOptions & TimeWindowQueryOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<PaginatedUserSwapsResult, UnexpectedError> {
  return client.query(UserSwapsQuery, { request, currency, timeWindow });
}
