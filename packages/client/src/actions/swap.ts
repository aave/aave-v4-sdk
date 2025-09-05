import type { UnexpectedError } from '@aave/core-next';
import {
  type Currency,
  PrepareSwapQuery,
  type PrepareSwapRequest,
  type PrepareSwapResult,
  SwappableTokensQuery,
  type SwappableTokensRequest,
  type SwapQuote,
  SwapQuoteQuery,
  type SwapQuoteRequest,
  type SwapStatus,
  SwapStatusQuery,
  type SwapStatusRequest,
  type Token,
} from '@aave/graphql-next';
import type { ResultAsync } from '@aave/types-next';

import type { AaveClient } from '../AaveClient';
import { DEFAULT_QUERY_OPTIONS } from '../options';

export type SwapQueryOptions = {
  /**
   * The currency for fiat amounts.
   *
   * @defaultValue {@link Currency.Usd}
   */
  currency: Currency;
};

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
  options: SwapQueryOptions = DEFAULT_QUERY_OPTIONS,
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
  options: SwapQueryOptions = DEFAULT_QUERY_OPTIONS,
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
