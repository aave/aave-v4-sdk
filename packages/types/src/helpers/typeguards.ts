import type { NonEmptyTuple, UnknownRecord } from 'type-fest';

export type { NonEmptyTuple, UnknownRecord };

export function isObject(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks if the given array is a non-empty array.
 */
export function isNonEmptyArray<T>(
  value: readonly T[],
): value is NonEmptyTuple<T> {
  return value.length > 0;
}

/**
 * Checks if the given array is a one-entry array.
 */
export function isOneEntryArray<T>(value: readonly T[]): value is [T] {
  return value.length === 1;
}
