import { TokenFragment } from './fragments/common';
import { SwapQuoteFragment } from './fragments/swaps';
import { graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const SwapQuoteQuery = graphql(
  `query SwapQuote($request: SwapQuoteRequest!) {
    value: swapQuote(request: $request) {
      ...SwapQuote
    }
  }`,
  [SwapQuoteFragment],
);
export type SwapQuoteRequest = RequestOf<typeof SwapQuoteQuery>;

/**
 * @internal
 */
export const SwappableTokensQuery = graphql(
  `query SwappableTokens($request: SwappableTokensRequest!) {
    value: swappableTokens(request: $request) {
      ...Token
    }
  }`,
  [TokenFragment],
);
export type SwappableTokensRequest = RequestOf<typeof SwappableTokensQuery>;
