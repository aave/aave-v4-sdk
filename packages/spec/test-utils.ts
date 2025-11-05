import { InvariantError } from '@aave/client-next';
import type { NonEmptyTuple } from 'type-fest';

export function assertNonEmptyArray<T>(
  value: readonly T[],
): asserts value is NonEmptyTuple<T> {
  if (value.length === 0) {
    throw new InvariantError('Expected array to be non-empty');
  }
}

export function assertSingleElementArray<T>(
  value: readonly T[],
): asserts value is [T] {
  if (value.length !== 1) {
    throw new InvariantError('Expected array to have exactly one item');
  }
}
