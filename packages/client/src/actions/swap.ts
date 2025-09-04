import type { UnexpectedError } from '@aave/core-next';
import {
  SwappableTokensQuery,
  type SwappableTokensRequest,
  type SwapQuote,
  SwapQuoteQuery,
  type SwapQuoteRequest,
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
