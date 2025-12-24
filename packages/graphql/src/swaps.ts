import {
  CancelSwapExecutionPlanFragment,
  PaginatedUserSwapsResultFragment,
  PrepareBorrowSwapResultFragment,
  PreparePositionSwapResultFragment,
  PrepareSupplySwapResultFragment,
  PrepareSwapCancelResultFragment,
  PrepareTokenSwapResultFragment,
  SwapExecutionPlanFragment,
  SwapQuoteFragment,
  SwapStatusFragment,
  TokenFragment,
} from './fragments';
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
export const PrepareTokenSwapQuery = graphql(
  `query PrepareTokenSwap($request: PrepareTokenSwapRequest!, $currency: Currency!) {
    value: prepareTokenSwap(request: $request) {
      ...PrepareTokenSwapResult
    }
  }`,
  [PrepareTokenSwapResultFragment],
);
export type PrepareTokenSwapRequest = RequestOf<typeof PrepareTokenSwapQuery>;

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
export const SwapMutation = graphql(
  `mutation Swap($request: SwapRequest!) {
    value: swap(request: $request) {
      ...SwapExecutionPlan
    }
  }`,
  [SwapExecutionPlanFragment],
);
export type SwapRequest = RequestOf<typeof SwapMutation>;

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

/**
 * @internal
 */
export const SupplySwapQuoteQuery = graphql(
  `query SupplySwapQuote($request: PrepareSupplySwapRequest!, $currency: Currency!) {
    value: supplySwapQuote(request: $request) {
      ...PrepareSupplySwapResult
    }
  }`,
  [PrepareSupplySwapResultFragment],
);
export type PrepareSupplySwapRequest = RequestOf<typeof SupplySwapQuoteQuery>;

/**
 * @internal
 */
export const BorrowSwapQuoteQuery = graphql(
  `query BorrowSwapQuote($request: PrepareBorrowSwapRequest!, $currency: Currency!) {
    value: borrowSwapQuote(request: $request) {
      ...PrepareBorrowSwapResult
    }
  }`,
  [PrepareBorrowSwapResultFragment],
);
export type PrepareBorrowSwapRequest = RequestOf<typeof BorrowSwapQuoteQuery>;

/**
 * @internal
 */
export const PreparePositionSwapQuery = graphql(
  `query PreparePositionSwap($request: PreparePositionSwapRequest!, $currency: Currency!) {
    value: preparePositionSwap(request: $request) {
      ...PreparePositionSwapResult
    }
  }`,
  [PreparePositionSwapResultFragment],
);
export type PreparePositionSwapRequest = RequestOf<
  typeof PreparePositionSwapQuery
>;

export type CancelIntentSwapInput = ReturnType<
  typeof graphql.scalar<'CancelIntentSwapInput'>
>;
export type PrepareLimitOrderSwapInput = ReturnType<
  typeof graphql.scalar<'PrepareLimitOrderSwapInput'>
>;
export type PrepareMarketOrderSwapInput = ReturnType<
  typeof graphql.scalar<'PrepareMarketOrderSwapInput'>
>;
export type SwapByIntentInput = ReturnType<
  typeof graphql.scalar<'SwapByIntentInput'>
>;
export type SwapWithTransactionInput = ReturnType<
  typeof graphql.scalar<'SwapWithTransactionInput'>
>;
export type SwappableTokensRequestQuery = ReturnType<
  typeof graphql.scalar<'SwappableTokensRequestQuery'>
>;
