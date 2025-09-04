import { TokenFragment } from './fragments/common';
import {
  PrepareSwapResultFragment,
  SwapQuoteFragment,
} from './fragments/swaps';
import { graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const SwapQuoteQuery = graphql(
  `query SwapQuote($request: SwapQuoteRequest!, $currency: Currency!) {
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

/**
 * @internal
 */
export const PrepareSwapQuery = graphql(
  `query PrepareSwap($request: PrepareSwapRequest!, $currency: Currency!) {
    value: prepareSwap(request: $request) {
      ...PrepareSwapResult
    }
  }`,
  [PrepareSwapResultFragment],
);
export type PrepareSwapRequest = RequestOf<typeof PrepareSwapQuery>;
