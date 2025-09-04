import { TokenFragment } from './fragments/common';
import {
  PrepareSwapResultFragment,
  SwapExecutionPlanFragment,
  SwapQuoteFragment,
} from './fragments/swaps';
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

/**
 * @internal
 */
export const PrepareSwapQuery = graphql(
  `query PrepareSwap($request: PrepareSwapRequest!) {
    value: prepareSwap(request: $request) {
      ...PrepareSwapResult
    }
  }`,
  [PrepareSwapResultFragment],
);
export type PrepareSwapRequest = RequestOf<typeof PrepareSwapQuery>;

/**
 * @internal
 */
export const SwapQuery = graphql(
  `query Swap($request: SwapRequest!) {
    value: swap(request: $request) {
      ...SwapExecutionPlan
    }
  }`,
  [SwapExecutionPlanFragment],
);
export type SwapRequest = RequestOf<typeof SwapQuery>;
