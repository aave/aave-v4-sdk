import type { UnexpectedError } from '@aave/core-next';
import {
  type Asset,
  AssetPriceHistoryQuery,
  type AssetPriceHistoryRequest,
  type AssetPriceSample,
  AssetQuery,
  type AssetRequest,
} from '@aave/graphql-next';
import type { ResultAsync } from '@aave/types-next';
import type { AaveClient } from '../AaveClient';
import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type RequestPolicyOptions,
  type TimeWindowQueryOptions,
} from '../options';

/**
 * Fetches information about a specific asset (ERC20 token) in the protocol.
 *
 * ```ts
 * const result = await asset(client, {
 *   token: { chainId: chainId(1), address: evmAddress('0x123…') }
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
    options.requestPolicy ?? DEFAULT_QUERY_OPTIONS.requestPolicy,
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
    options.requestPolicy ?? DEFAULT_QUERY_OPTIONS.requestPolicy,
  );
}
