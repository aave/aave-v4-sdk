import type { Tagged } from 'type-fest';
import { invariant } from './helpers';

/**
 * An identifier.
 */
export type ID = Tagged<string, 'ID'>;

/**
 * A reserve identifier.
 */
export type ReserveId = Tagged<number, 'ReserveId'>;

/**
 * Creates a reserve identifier from a given value.
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
