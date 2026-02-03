import type { Tagged } from 'type-fest';

type EnumValues<E> = E[keyof E];

export type OpaqueEnumVariant = Tagged<string, 'OpaqueEnumVariant'>;

/**
 * Adds an opaque value to an enum-union.
 *
 * @internal
 */
export type ExtendWithOpaqueVariant<E> = EnumValues<E> | OpaqueEnumVariant;

/**
 * The order direction for sorting results.
 */
export enum OrderDirection {
  Asc = 'ASC',
  Desc = 'DESC',
}

/**
 * The page size for paginated results.
 */
export enum PageSize {
  Ten = 'TEN',
  Fifty = 'FIFTY',
}

/**
 * The time window for the historical data.
 */
export enum TimeWindow {
  LastDay = 'LAST_DAY',
  LastWeek = 'LAST_WEEK',
  LastMonth = 'LAST_MONTH',
  LastSixMonths = 'LAST_SIX_MONTHS',
  LastYear = 'LAST_YEAR',
  All = 'ALL',
}

/**
 * The operation type for transactions, used for tracking transaction processing.
 */
export enum OperationType {
  SpokeBorrow = 'SPOKE_BORROW',
  SpokeRepay = 'SPOKE_REPAY',
  SpokeSupply = 'SPOKE_SUPPLY',
  SpokeWithdraw = 'SPOKE_WITHDRAW',
  SpokeUpdateUserRiskPremium = 'SPOKE_UPDATE_USER_RISK_PREMIUM',
  SpokeUpdateUserDynamicConfig = 'SPOKE_UPDATE_USER_DYNAMIC_CONFIG',
  SpokeSetUserUsingAsCollateral = 'SPOKE_SET_USER_USING_AS_COLLATERAL',
  SpokeSetUserPositionManager = 'SPOKE_SET_USER_POSITION_MANAGER',
  RenounceSpokeUserPositionManager = 'RENOUNCE_SPOKE_USER_POSITION_MANAGER',
  Liquidation = 'LIQUIDATION',
}

/**
 * The filter for chains.
 */
export enum ChainsFilter {
  TESTNET_ONLY = 'TESTNET_ONLY',
  MAINNET_ONLY = 'MAINNET_ONLY',
  ALL = 'ALL',
}

/**
 * The activity type for user history.
 */
export enum ActivityType {
  Borrow = 'BORROW',
  Supply = 'SUPPLY',
  Withdraw = 'WITHDRAW',
  Repay = 'REPAY',
  Liquidated = 'LIQUIDATED',
  SetAsCollateral = 'SET_AS_COLLATERAL',
  UpdatedDynamicConfig = 'UPDATED_DYNAMIC_CONFIG',
  UpdatedRiskPremium = 'UPDATED_RISK_PREMIUM',
  TokenToTokenSwap = 'TOKEN_TO_TOKEN_SWAP',
  SupplySwap = 'SUPPLY_SWAP',
  BorrowSwap = 'BORROW_SWAP',
  RepayWithSupply = 'REPAY_WITH_SUPPLY',
  WithdrawSwap = 'WITHDRAW_SWAP',
}

/**
 * The APY metric for comparing rates.
 */
export enum ApyMetric {
  Highest = 'HIGHEST',
  Lowest = 'LOWEST',
  Average = 'AVERAGE',
}

/**
 * The collateral metric for comparing collateral factors.
 */
export enum CollateralMetric {
  Highest = 'HIGHEST',
  Lowest = 'LOWEST',
}

/**
 * The currency for fiat amounts.
 */
export enum Currency {
  Usd = 'USD',
  Eur = 'EUR',
  Gbp = 'GBP',
}

/**
 * The filter for reserves request.
 */
export enum ReservesRequestFilter {
  Supply = 'SUPPLY',
  Borrow = 'BORROW',
  Collateral = 'COLLATERAL',
  All = 'ALL',
}

/**
 * The borrow swap kind for debt swaps.
 */
export enum BorrowSwapKind {
  Current = 'CURRENT',
  New = 'NEW',
}

/**
 * The repay with supply kind for repay swaps.
 */
export enum RepayWithSupplyKind {
  Repay = 'REPAY',
  Supply = 'SUPPLY',
}

/**
 * The supply swap kind for supply swaps.
 */
export enum SupplySwapKind {
  Current = 'CURRENT',
  New = 'NEW',
}

/**
 * The withdraw swap kind for withdraw swaps.
 */
export enum WithdrawSwapKind {
  Withdraw = 'WITHDRAW',
  Buy = 'BUY',
}

/**
 * The filter for swap status.
 */
export enum SwapStatusFilter {
  Cancelled = 'CANCELLED',
  Expired = 'EXPIRED',
  Fulfilled = 'FULFILLED',
  Open = 'OPEN',
  PendingSignature = 'PENDING_SIGNATURE',
}

/**
 * The category for tokens.
 */
export enum TokenCategory {
  Stablecoin = 'STABLECOIN',
  EthCorrelated = 'ETH_CORRELATED',
}

/**
 * The update type for user position conditions.
 */
export enum UserPositionConditionsUpdate {
  AllDynamicConfig = 'ALL_DYNAMIC_CONFIG',
  JustRiskPremium = 'JUST_RISK_PREMIUM',
}

/**
 * Quote accuracy level for swap quotes.
 */
export enum QuoteAccuracy {
  /**
   * Fast price quality - faster response, potentially less accurate price
   */
  Fast = 'FAST',
  /**
   * Verified price quality - more accurate price, potentially slower response
   */
  Accurate = 'ACCURATE',
}

/**
 * Order class indicating market or limit order type.
 */
export enum SwapOrderClass {
  /**
   * Market order - executed immediately at current market price
   */
  Market = 'MARKET',
  /**
   * Limit order - executed at specified price or better
   */
  Limit = 'LIMIT',
}

/**
 * The swap kind for token swaps.
 */
export enum TokenSwapKind {
  /**
   * Buy a specific amount of the target token
   */
  Buy = 'BUY',
  /**
   * Sell a specific amount of the source token
   */
  Sell = 'SELL',
}
