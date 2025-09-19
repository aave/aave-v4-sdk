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
  SpokeSetUserUsingAsCollateral = 'SPOKE_SET_USER_USING_AS_COLLATERAL',
  SpokeSetUserPositionManager = 'SPOKE_SET_USER_POSITION_MANAGER',
  RenounceSpokeUserPositionManager = 'RENOUNCE_SPOKE_USER_POSITION_MANAGER',
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
 * The status type for hub assets.
 */
export enum HubAssetStatusType {
  Active = 'ACTIVE',
  Frozen = 'FROZEN',
  Paused = 'PAUSED',
}

/**
 * The order by options for hub assets request.
 */
export enum HubAssetsRequestOrderBy {
  Balance = 'BALANCE',
  Name = 'NAME',
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
  Swap = 'SWAP',
}

/**
 * The APY metric for comparing rates.
 */
export enum ApyMetric {
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
  All = 'ALL',
}

/**
 * The swap kind for swapping tokens.
 */
export enum SwapKind {
  Buy = 'BUY',
  Sell = 'SELL',
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
