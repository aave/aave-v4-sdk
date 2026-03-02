import type { BigDecimalSource } from '@aave/types';
import 'vitest';

declare module 'vitest' {
  interface AsymmetricMatchersContaining extends JestExtendedMatchers {
    toBeBigDecimalEqualTo: (expected: BigDecimalSource) => R;
    toBeBigDecimalCloseTo: (
      expected: number | string,
      config: { precision: number } | { percent: number },
    ) => R;
    toBeBigDecimalGreaterThan: (expected: number | string) => R;
    toBeBigDecimalLessThan: (expected: number | string) => R;
    toBeBetweenDates: (start: Date, end: Date) => R;
    toBeHexString: () => R;
    toBeSortedNumerically: (order: 'asc' | 'desc') => R;
    toBeSortedAlphabetically: (order: 'asc' | 'desc') => R;
    toBeSortedByDate: (order: 'asc' | 'desc') => R;
    toBeArrayWithElements: (expected: unknown | AsymmetricMatcher) => R;
  }
}
