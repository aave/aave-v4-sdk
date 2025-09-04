import type { UnexpectedError } from '@aave/core-next';
import type { SwapExecutionPlan } from '@aave/graphql-next';
import {
  PrepareSwapQuery,
  type PrepareSwapRequest,
  type PrepareSwapResult,
  SwappableTokensQuery,
  type SwappableTokensRequest,
  SwapQuery,
  type SwapQuote,
  SwapQuoteQuery,
  type SwapQuoteRequest,
  type SwapRequest,
  type Token,
} from '@aave/graphql-next';
import type { ResultAsync } from '@aave/types-next';

import type { AaveClient } from '../AaveClient';

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
): ResultAsync<SwapQuote, UnexpectedError> {
  return client.query(SwapQuoteQuery, { request });
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
): ResultAsync<PrepareSwapResult, UnexpectedError> {
  return client.query(PrepareSwapQuery, { request });
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
 * });
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
