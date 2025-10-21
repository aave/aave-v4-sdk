import { type BigDecimal, InvariantError } from '@aave/client-next';
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

export function isOrderedNumerically(
  values: BigDecimal[],
  order: 'asc' | 'desc',
): boolean {
  for (let i = 0; i < values.length - 1; i++) {
    const current = values[i]!;
    const next = values[i + 1]!;

    if (
      (order === 'desc' && current.lt(next)) ||
      (order === 'asc' && current.gt(next))
    ) {
      return false;
    }
  }
  return true;
}

export function isOrderedAlphabetically(
  values: string[],
  order: 'asc' | 'desc',
): boolean {
  for (let i = 0; i < values.length - 1; i++) {
    const current = values[i];
    const next = values[i + 1];

    const comparison = current!.localeCompare(next!);

    if (
      (order === 'desc' && comparison < 0) ||
      (order === 'asc' && comparison > 0)
    ) {
      return false;
    }
  }
  return true;
}
