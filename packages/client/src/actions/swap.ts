import type { UnexpectedError } from '@aave/core-next';
import type {
  PrepareSwapRequest,
  PrepareSwapResult,
  SwapExecutionPlan,
  SwappableTokensRequest,
  SwapQuote,
  SwapQuoteRequest,
  SwapRequest,
  SwapStatus,
  SwapStatusRequest,
  Token,
} from '@aave/graphql-next';
import {
  PendingSwapsQuery,
  type PendingSwapsRequest,
  PrepareSwapQuery,
  SwappableTokensQuery,
  SwapQuery,
  SwapQuoteQuery,
  type SwapReceipt,
  SwapStatusQuery,
} from '@aave/graphql-next';

import type { ResultAsync } from '@aave/types-next';

import type { AaveClient } from '../AaveClient';
import { type CurrencyQueryOptions, DEFAULT_QUERY_OPTIONS } from '../options';

/**
 * Fetches a swap quote for the specified trade parameters.
 *
 * ```ts
 * const result = await swapQuote(client, {
 *   chainId: chainId(1),
 *   buy: { erc20: evmAddress('0xA0b86a33E6...') },
 *   sell: { erc20: evmAddress('0x6B175474E...') },
 *   amount: bigDecimal('1000'),
 *   kind: SwapKind.SELL,
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The swap quote request parameters.
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
 * Fetches the list of tokens available for swapping on a specific chain.
 *
 * ```ts
 * const result = await swappableTokens(client, {
 *   query: { chainId: chainId(1) },
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
 *         .andThen((signature) => swap({ intent: { id: plan.id, signature } }))
 *         .andThen((plan) => {
 *           // …
 *         });
 *       );
 *     case 'SwapByIntentWithApprovalRequired':
 *       return sendTransaction(plan.approval)
 *         .andThen(signSwapByIntentWith(plan.data))
 *         .andThen((signature) => swap({ intent: { id: plan.id, signature } }))
 *         .andThen((plan) => {
 *         // …
 *         });
 *       );
 *     case 'SwapByTransaction':
 *       return swap({ transaction: { id: plan.id } })
 *         .andThen((plan) => {
 *           // …
 *         });
 *       );
 *   }
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The prepare swap request parameters.
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
 * @returns The current status of the swap.
 */
export function swapStatus(
  client: AaveClient,
  request: SwapStatusRequest,
): ResultAsync<SwapStatus, UnexpectedError> {
  return client.query(SwapStatusQuery, { request });
}

/**
 * Fetches pending swaps for a specific user.
 *
 * ```ts
 * const result = await pendingSwaps(client, {
 *   user: evmAddress('0x742d35cc...'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The pending swaps request parameters.
 * @returns The list of pending swap receipts for the user.
 */
export function pendingSwaps(
  client: AaveClient,
  request: PendingSwapsRequest,
): ResultAsync<SwapReceipt[], UnexpectedError> {
  return client.query(PendingSwapsQuery, { request });
}

/**
 * Executes a swap for the specified request parameters.
 *
 * ```ts
 * const result = await swap(client, {
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
 *       return sendTransaction(plan.transaction)
 *         .map(() => plan.orderReceipt);
 *
 *     case 'SwapApprovalRequired':
 *       return sendTransaction(plan.approval)
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
