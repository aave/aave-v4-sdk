import { invariant, isValidHexString } from '@aave/types-next';
import type { Tagged } from 'type-fest';

/**
 * An identifier.
 */
export type ID = Tagged<string, 'ID'>;

/**
 * An asset identifier.
 */
export type AssetId = Tagged<string, 'AssetId'>;

/**
 * Creates an asset identifier from a given base64 value.
 *
 * @remarks
 * This is meant to be used in tests and POC context. In normal circumstances
 * use the `Asset.id` retrieved from another API call.
 */
export function assetId(value: string): AssetId {
  invariant(
    typeof value === 'string' && value.length > 0,
    `Invalid AssetId: ${value}`,
  );
  // Basic base64 validation - contains only valid base64 characters
  invariant(
    /^[A-Za-z0-9+/]*={0,2}$/.test(value),
    `AssetId must be valid base64: ${value}`,
  );
  return value as AssetId;
}

/**
 * A hub identifier.
 */
export type HubId = Tagged<string, 'HubId'>;

/**
 * Creates a hub identifier from a given base64 value.
 *
 * @remarks
 * This is meant to be used in tests and POC context. In normal circumstances
 * use the `Hub.id` retrieved from another API call.
 */
export function hubId(value: string): HubId {
  invariant(
    typeof value === 'string' && value.length > 0,
    `Invalid HubId: ${value}`,
  );
  // Basic base64 validation - contains only valid base64 characters
  invariant(
    /^[A-Za-z0-9+/]*={0,2}$/.test(value),
    `HubId must be valid base64: ${value}`,
  );
  return value as HubId;
}

/**
 * A hub asset identifier.
 */
export type HubAssetId = Tagged<string, 'HubAssetId'>;

/**
 * Creates a hub asset identifier from a given base64 value.
 *
 * @remarks
 * This is meant to be used in tests and POC context. In normal circumstances
 * use the `HubAsset.id` retrieved from another API call.
 */
export function hubAssetId(value: string): HubAssetId {
  invariant(
    typeof value === 'string' && value.length > 0,
    `Invalid HubAssetId: ${value}`,
  );
  // Basic base64 validation - contains only valid base64 characters
  invariant(
    /^[A-Za-z0-9+/]*={0,2}$/.test(value),
    `HubAssetId must be valid base64: ${value}`,
  );
  return value as HubAssetId;
}

/**
 * The on-chain ID of a HubAsset. This is scoped to the specific Hub.
 */
export type OnChainHubAssetId = Tagged<number, 'OnChainHubAssetId'>;

/**
 * The on-chain ID of a Reserve. This is scoped to the specific Spoke.
 */
export type OnChainReserveId = Tagged<number, 'OnChainReserveId'>;

/**
 * A reserve identifier.
 */
export type ReserveId = Tagged<number, 'ReserveId'>;

/**
 * Creates a reserve identifier from a given value.
 *
 * @remarks
 * This is meant to be used in tests and POC context. In normal ciscumstances
 * use the `Reserve.id` from data retrieved from the API.
 */
export function reserveId(value: number): ReserveId {
  invariant(
    Number.isInteger(value) && value >= 0,
    `Invalid ReserveId: ${value}`,
  );
  return value as ReserveId;
}

/**
 * A user position identifier.
 */
export type UserPositionId = Tagged<string, 'UserPositionId'>;

/**
 * Creates a user position identifier from a given base64 value.
 *
 * @remarks
 * This is meant to be used in tests and POC context. In normal ciscumstances
 * use the `UserPosition.id` retrieved from another API call.
 */
export function userPositionId(value: string): UserPositionId {
  invariant(
    typeof value === 'string' && value.length > 0,
    `Invalid UserPositionId: ${value}`,
  );
  // Basic base64 validation - contains only valid base64 characters
  invariant(
    /^[A-Za-z0-9+/]*={0,2}$/.test(value),
    `UserPositionId must be valid base64: ${value}`,
  );
  return value as UserPositionId;
}

/**
 * A swap identifier.
 */
export type SwapId = Tagged<string, 'SwapId'>;

/**
 * Creates a type-safe swap Id.
 *
 * @remarks
 * This is meant to be used in tests and POC context. In normal ciscumstances
 * use the `Swap.id` retrieved from another API call.
 */
export function swapId(value: string): SwapId {
  invariant(isValidHexString(value), `Invalid SwapId: ${value}`);
  return value as SwapId;
}

/**
 * A swap quote identifier.
 */
export type SwapQuoteId = Tagged<string, 'SwapQuoteId'>;

/**
 * Creates a type-safe Swap Quote ID.
 *
 * @remarks
 * This is meant to be used in tests and POC context. In normal circumstances
 * use the `SwapQuote.id` retrieved from another API call.
 */
export function swapQuoteId(value: string): SwapQuoteId {
  invariant(isValidHexString(value), `Invalid SwapQuoteId: ${value}`);
  return value as SwapQuoteId;
}

/**
 * A spoke identifier.
 */
export type SpokeId = Tagged<string, 'SpokeId'>;

/**
 * Creates a spoke identifier from a given base64 value.
 *
 * @remarks
 * This is meant to be used in tests and POC context. In normal circumstances
 * use the `Spoke.id` retrieved from another API call.
 */
export function spokeId(value: string): SpokeId {
  invariant(
    typeof value === 'string' && value.length > 0,
    `Invalid SpokeId: ${value}`,
  );
  // Basic base64 validation - contains only valid base64 characters
  invariant(
    /^[A-Za-z0-9+/]*={0,2}$/.test(value),
    `SpokeId must be valid base64: ${value}`,
  );
  return value as SpokeId;
}

/**
 * A user balance identifier.
 */
export type UserBalanceId = Tagged<string, 'UserBalanceId'>;

/**
 * Creates a user balance identifier from a given base64 value.
 *
 * @remarks
 * This is meant to be used in tests and POC context. In normal circumstances
 * use the `UserBalance.id` retrieved from another API call.
 */
export function userBalanceId(value: string): UserBalanceId {
  invariant(
    typeof value === 'string' && value.length > 0,
    `Invalid UserBalanceId: ${value}`,
  );
  // Basic base64 validation - contains only valid base64 characters
  invariant(
    /^[A-Za-z0-9+/]*={0,2}$/.test(value),
    `UserBalanceId must be valid base64: ${value}`,
  );
  return value as UserBalanceId;
}

/**
 * A user borrow item identifier.
 */
export type UserBorrowItemId = Tagged<string, 'UserBorrowItemId'>;

/**
 * Creates a user borrow item identifier from a given base64 value.
 *
 * @remarks
 * This is meant to be used in tests and POC context. In normal circumstances
 * use the `UserBorrowItem.id` retrieved from another API call.
 */
export function userBorrowItemId(value: string): UserBorrowItemId {
  invariant(
    typeof value === 'string' && value.length > 0,
    `Invalid UserBorrowItemId: ${value}`,
  );
  // Basic base64 validation - contains only valid base64 characters
  invariant(
    /^[A-Za-z0-9+/]*={0,2}$/.test(value),
    `UserBorrowItemId must be valid base64: ${value}`,
  );
  return value as UserBorrowItemId;
}

/**
 * A user supply item identifier.
 */
export type UserSupplyItemId = Tagged<string, 'UserSupplyItemId'>;

/**
 * Creates a user supply item identifier from a given base64 value.
 *
 * @remarks
 * This is meant to be used in tests and POC context. In normal circumstances
 * use the `UserSupplyItem.id` retrieved from another API call.
 */
export function userSupplyItemId(value: string): UserSupplyItemId {
  invariant(
    typeof value === 'string' && value.length > 0,
    `Invalid UserSupplyItemId: ${value}`,
  );
  // Basic base64 validation - contains only valid base64 characters
  invariant(
    /^[A-Za-z0-9+/]*={0,2}$/.test(value),
    `UserSupplyItemId must be valid base64: ${value}`,
  );
  return value as UserSupplyItemId;
}
