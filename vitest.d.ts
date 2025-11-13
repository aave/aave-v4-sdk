import 'vitest';

declare module 'vitest' {
  interface AsymmetricMatchersContaining extends JestExtendedMatchers {
    toBeBigDecimalCloseTo: (expected: number | string, precision?: number) => R;
    toBeBigDecimalGreaterThan: (expected: number | string) => R;
    toBeBigDecimalLessThan: (expected: number | string) => R;
    toBeBetweenDates: (start: Date, end: Date) => R;
    toBeHexString: () => R;
    toBeSortedNumerically: (order: 'asc' | 'desc') => R;
    toBeSortedAlphabetically: (order: 'asc' | 'desc') => R;
    toBeSortedByDate: (order: 'asc' | 'desc') => R;
  }
}
