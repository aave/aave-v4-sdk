import type { UnexpectedError } from '@aave/core';
import {
  type Asset,
  AssetBorrowHistoryQuery,
  type AssetBorrowHistoryRequest,
  type AssetBorrowSample,
  AssetCategoryBorrowHistoryQuery,
  type AssetCategoryBorrowHistoryRequest,
  type AssetCategoryBorrowSample,
  AssetPriceHistoryQuery,
  type AssetPriceHistoryRequest,
  type AssetPriceSample,
  AssetQuery,
  type AssetRequest,
  AssetSupplyHistoryQuery,
  type AssetSupplyHistoryRequest,
  type AssetSupplySample,
  ProtocolHistoryQuery,
  type ProtocolHistoryRequest,
  type ProtocolHistorySample,
} from '@aave/graphql';
import type { ResultAsync } from '@aave/types';
import type { AaveClient } from '../AaveClient';
import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type RequestPolicyOptions,
  type TimeWindowQueryOptions,
} from '../options';

/**
 * Fetches information about a specific asset (ERC20 token) in the protocol by ID or by token.
 *
 * ```ts
 * const result = await asset(client, {
 *   query: { assetId: assetId('SGVsbG8h') }
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The asset request parameters.
 * @param options - The query options including currency and time window.
 * @returns The asset data, or null if not found.
 */
export function asset(
  client: AaveClient,
  request: AssetRequest,
  options: CurrencyQueryOptions &
    TimeWindowQueryOptions &
    RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<Asset | null, UnexpectedError> {
  return client.query(
    AssetQuery,
    {
      request,
      currency: options.currency ?? DEFAULT_QUERY_OPTIONS.currency,
      timeWindow: options.timeWindow ?? DEFAULT_QUERY_OPTIONS.timeWindow,
    },
    {
      requestPolicy:
        options.requestPolicy ?? DEFAULT_QUERY_OPTIONS.requestPolicy,
    },
  );
}

/**
 * Fetches historical price data for a specific asset.
 *
 * ```ts
 * const result = await assetPriceHistory(client, {
 *   token: { chainId: chainId(1), address: evmAddress('0x123…') },
 *   currency: Currency.Usd,
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The asset price history request parameters.
 * @param options - The query options.
 * @returns Array of asset price samples over time.
 */
export function assetPriceHistory(
  client: AaveClient,
  request: AssetPriceHistoryRequest,
  options: Required<RequestPolicyOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<AssetPriceSample[], UnexpectedError> {
  return client.query(
    AssetPriceHistoryQuery,
    { request },
    {
      requestPolicy:
        options.requestPolicy ?? DEFAULT_QUERY_OPTIONS.requestPolicy,
    },
  );
}

/**
 * Fetches historical supply data for a specific asset.
 *
 * ```ts
 * const result = await assetSupplyHistory(client, {
 *   token: { chainId: chainId(1), address: evmAddress('0x123…') },
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The asset supply history request parameters.
 * @param options - The query options.
 * @returns Array of asset supply samples over time.
 */
export function assetSupplyHistory(
  client: AaveClient,
  request: AssetSupplyHistoryRequest,
  options: Required<RequestPolicyOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<AssetSupplySample[], UnexpectedError> {
  return client.query(
    AssetSupplyHistoryQuery,
    { request },
    {
      requestPolicy:
        options.requestPolicy ?? DEFAULT_QUERY_OPTIONS.requestPolicy,
    },
  );
}

/**
 * Fetches historical borrow data for a specific asset.
 *
 * ```ts
 * const result = await assetBorrowHistory(client, {
 *   token: { chainId: chainId(1), address: evmAddress('0x123…') },
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The asset borrow history request parameters.
 * @param options - The query options.
 * @returns Array of asset borrow samples over time.
 */
export function assetBorrowHistory(
  client: AaveClient,
  request: AssetBorrowHistoryRequest,
  options: Required<RequestPolicyOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<AssetBorrowSample[], UnexpectedError> {
  return client.query(
    AssetBorrowHistoryQuery,
    { request },
    {
      requestPolicy:
        options.requestPolicy ?? DEFAULT_QUERY_OPTIONS.requestPolicy,
    },
  );
}

/**
 * Fetches historical borrow data for a specific token category.
 *
 * ```ts
 * const result = await assetCategoryBorrowHistory(client, {
 *   category: TokenCategory.Stablecoin,
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The asset category borrow history request parameters.
 * @param options - The query options.
 * @returns Array of asset category borrow samples over time.
 */
export function assetCategoryBorrowHistory(
  client: AaveClient,
  request: AssetCategoryBorrowHistoryRequest,
  { currency }: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<AssetCategoryBorrowSample[], UnexpectedError> {
  return client.query(AssetCategoryBorrowHistoryQuery, { request, currency });
}

/**
 * Fetches historical protocol-wide data (deposits, borrows, earnings).
 *
 * ```ts
 * const result = await protocolHistory(client, {
 *   currency: Currency.Usd,
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The protocol history request parameters.
 * @param options - The query options.
 * @returns Array of protocol history samples over time.
 */
export function protocolHistory(
  client: AaveClient,
  request: ProtocolHistoryRequest,
  options: Required<RequestPolicyOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<ProtocolHistorySample[], UnexpectedError> {
  return client.query(
    ProtocolHistoryQuery,
    { request },
    {
      requestPolicy:
        options.requestPolicy ?? DEFAULT_QUERY_OPTIONS.requestPolicy,
    },
  );
}
