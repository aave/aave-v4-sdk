import { TokenFragment } from './fragments/common';
import {
  CancelSwapExecutionPlanFragment,
  PaginatedUserSwapsResultFragment,
  PrepareSwapCancelResultFragment,
  PrepareSwapResultFragment,
  SwapExecutionPlanFragment,
  SwapQuoteFragment,
  SwapStatusFragment,
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

/**
 * @internal
 */
export const SwapStatusQuery = graphql(
  `query SwapStatus($request: SwapStatusRequest!, $currency: Currency!) {
    value: swapStatus(request: $request) {
      ...SwapStatus
    }
  }`,
  [SwapStatusFragment],
);
export type SwapStatusRequest = RequestOf<typeof SwapStatusQuery>;

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

/**
 * @internal
 */
export const PrepareSwapCancelQuery = graphql(
  `query PrepareSwapCancel($request: PrepareSwapCancelRequest!) {
    value: prepareSwapCancel(request: $request) {
      ...PrepareSwapCancelResult
    }
  }`,
  [PrepareSwapCancelResultFragment],
);
export type PrepareSwapCancelRequest = RequestOf<typeof PrepareSwapCancelQuery>;

/**
 * @internal
 */
export const CancelSwapQuery = graphql(
  `query CancelSwap($request: CancelSwapRequest!) {
    value: cancelSwap(request: $request) {
      ...CancelSwapExecutionPlan
    }
  }`,
  [CancelSwapExecutionPlanFragment],
);
export type CancelSwapRequest = RequestOf<typeof CancelSwapQuery>;

/**
 * @internal
 */
export const UserSwapsQuery = graphql(
  `query UserSwaps($request: UserSwapsRequest!, $currency: Currency!) {
    value: userSwaps(request: $request) {
      ...PaginatedUserSwapsResult
    }
  }`,
  [PaginatedUserSwapsResultFragment],
);
export type UserSwapsRequest = RequestOf<typeof UserSwapsQuery>;
