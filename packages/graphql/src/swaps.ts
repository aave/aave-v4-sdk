import {
  BorrowSwapQuoteResultFragment,
  CancelSwapExecutionPlanFragment,
  PaginatedUserSwapsResultFragment,
  PreparePositionSwapResultFragment,
  PrepareSwapCancelResultFragment,
  PrepareTokenSwapResultFragment,
  RepayWithSupplyQuoteResultFragment,
  SupplySwapQuoteResultFragment,
  SwapExecutionPlanFragment,
  SwapStatusFragment,
  TokenFragment,
  TokenSwapQuoteResultFragment,
  WithdrawSwapQuoteResultFragment,
} from './fragments';
import { graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const TokenSwapQuoteQuery = graphql(
  `query TokenSwapQuote($request: TokenSwapQuoteRequest!, $currency: Currency!) {
    value: tokenSwapQuote(request: $request) {
      ...TokenSwapQuoteResult
    }
  }`,
  [TokenSwapQuoteResultFragment],
);
export type TokenSwapQuoteRequest = RequestOf<typeof TokenSwapQuoteQuery>;

export type MarketOrderTokenSwapQuoteInput = ReturnType<
  typeof graphql.scalar<'MarketOrderTokenSwapQuoteInput'>
>;
export type LimitOrderTokenSwapQuoteInput = ReturnType<
  typeof graphql.scalar<'LimitOrderTokenSwapQuoteInput'>
>;
export type MarketOrderTokenSwapFromQuoteInput = ReturnType<
  typeof graphql.scalar<'MarketOrderTokenSwapFromQuoteInput'>
>;

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
  `query PrepareTokenSwap($request: PrepareTokenSwapRequest!) {
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
  `query SwapStatus($request: SwapStatusRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
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
export const CancelSwapMutation = graphql(
  `mutation CancelSwap($request: CancelSwapRequest!) {
    value: cancelSwap(request: $request) {
      ...CancelSwapExecutionPlan
    }
  }`,
  [CancelSwapExecutionPlanFragment],
);
export type CancelSwapRequest = RequestOf<typeof CancelSwapMutation>;

/**
 * @internal
 */
export const UserSwapsQuery = graphql(
  `query UserSwaps($request: UserSwapsRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
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
  `query SupplySwapQuote($request: SupplySwapQuoteRequest!, $currency: Currency!) {
    value: supplySwapQuote(request: $request) {
      ...SupplySwapQuoteResult
    }
  }`,
  [SupplySwapQuoteResultFragment],
);
export type SupplySwapQuoteRequest = RequestOf<typeof SupplySwapQuoteQuery>;

export type MarketSupplySwapQuoteInput = ReturnType<
  typeof graphql.scalar<'MarketSupplySwapQuoteInput'>
>;
export type LimitSupplySwapQuoteInput = ReturnType<
  typeof graphql.scalar<'LimitSupplySwapQuoteInput'>
>;
export type FromQuoteSupplySwapQuoteInput = ReturnType<
  typeof graphql.scalar<'FromQuoteSupplySwapQuoteInput'>
>;

/**
 * @internal
 */
export const BorrowSwapQuoteQuery = graphql(
  `query BorrowSwapQuote($request: BorrowSwapQuoteRequest!, $currency: Currency!) {
    value: borrowSwapQuote(request: $request) {
      ...BorrowSwapQuoteResult
    }
  }`,
  [BorrowSwapQuoteResultFragment],
);
export type BorrowSwapQuoteRequest = RequestOf<typeof BorrowSwapQuoteQuery>;

export type MarketDebtSwapQuoteInput = ReturnType<
  typeof graphql.scalar<'MarketDebtSwapQuoteInput'>
>;
export type LimitDebtSwapQuoteInput = ReturnType<
  typeof graphql.scalar<'LimitDebtSwapQuoteInput'>
>;
export type FromQuoteDebtSwapQuoteInput = ReturnType<
  typeof graphql.scalar<'FromQuoteDebtSwapQuoteInput'>
>;

/**
 * @internal
 */
export const RepayWithSupplyQuoteQuery = graphql(
  `query RepayWithSupplyQuote($request: RepayWithSupplyQuoteRequest!, $currency: Currency!) {
    value: repayWithSupplyQuote(request: $request) {
      ...RepayWithSupplyQuoteResult
    }
  }`,
  [RepayWithSupplyQuoteResultFragment],
);
export type RepayWithSupplyQuoteRequest = RequestOf<
  typeof RepayWithSupplyQuoteQuery
>;

export type MarketRepayWithSupplyQuoteInput = ReturnType<
  typeof graphql.scalar<'MarketRepayWithSupplyQuoteInput'>
>;
export type LimitRepayWithSupplyQuoteInput = ReturnType<
  typeof graphql.scalar<'LimitRepayWithSupplyQuoteInput'>
>;
export type FromQuoteRepayWithSupplyQuoteInput = ReturnType<
  typeof graphql.scalar<'FromQuoteRepayWithSupplyQuoteInput'>
>;

/**
 * @internal
 */
export const WithdrawSwapQuoteQuery = graphql(
  `query WithdrawSwapQuote($request: WithdrawSwapQuoteRequest!, $currency: Currency!) {
    value: withdrawSwapQuote(request: $request) {
      ...WithdrawSwapQuoteResult
    }
  }`,
  [WithdrawSwapQuoteResultFragment],
);
export type WithdrawSwapQuoteRequest = RequestOf<typeof WithdrawSwapQuoteQuery>;

export type MarketWithdrawSwapQuoteInput = ReturnType<
  typeof graphql.scalar<'MarketWithdrawSwapQuoteInput'>
>;
export type LimitWithdrawSwapQuoteInput = ReturnType<
  typeof graphql.scalar<'LimitWithdrawSwapQuoteInput'>
>;
export type FromQuoteWithdrawSwapQuoteInput = ReturnType<
  typeof graphql.scalar<'FromQuoteWithdrawSwapQuoteInput'>
>;

/**
 * @internal
 */
export const PreparePositionSwapQuery = graphql(
  `query PreparePositionSwap($request: PreparePositionSwapRequest!) {
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
export type SwapByIntentInput = ReturnType<
  typeof graphql.scalar<'SwapByIntentInput'>
>;
export type SwapWithTransactionInput = ReturnType<
  typeof graphql.scalar<'SwapWithTransactionInput'>
>;
export type SwappableTokensRequestQuery = ReturnType<
  typeof graphql.scalar<'SwappableTokensRequestQuery'>
>;
export type SwapTokenInput = ReturnType<
  typeof graphql.scalar<'SwapTokenInput'>
>;
export type SwapErc20Input = ReturnType<
  typeof graphql.scalar<'SwapErc20Input'>
>;
export type SwappableTokenInput = ReturnType<
  typeof graphql.scalar<'SwappableTokenInput'>
>;
