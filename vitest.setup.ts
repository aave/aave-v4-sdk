import type { BigDecimal } from '@aave/types';
import * as matchers from 'jest-extended';
import { expect } from 'vitest';

expect.extend(matchers);

expect.extend({
  toBeBigDecimalCloseTo(
    received: BigDecimal,
    expected: BigDecimal,
    precision = 2,
  ) {
    const pass = received.round(precision).eq(expected.round(precision));

    return {
      pass,
      message: () =>
        pass
          ? `expected "${received}" not to be close to ${expected}`
          : `expected "${received}" to be close to ${expected}, but got difference of ${received.minus(expected)}`,
    };
  },

  toBeBigDecimalGreaterThan(received: BigDecimal, expected: number | string) {
    const pass = received.gt(expected);

    return {
      pass,
      message: () =>
        pass
          ? `expected "${received}" not to be greater than ${expected}`
          : `expected "${received}" to be greater than ${expected}, but got ${received.minus(expected)}`,
    };
  },

  toBeSortedByDate(received: string[], order: 'asc' | 'desc') {
    let pass = true;
    for (let i = 0; i < received.length - 1; i++) {
      const current = received[i];
      const next = received[i + 1];

      if (!current || !next) {
        continue;
      }

      if (
        (order === 'desc' &&
          new Date(current).getTime() < new Date(next).getTime()) ||
        (order === 'asc' &&
          new Date(current).getTime() > new Date(next).getTime())
      ) {
        pass = false;
        break;
      }
    }
    return {
      pass,
      message: () =>
        `expected array not to be sorted by date ${order}ending, but got: ${received}`,
    };
  },

  toBeBigDecimalLessThan(received: BigDecimal, expected: number | string) {
    const pass = received.lt(expected);

    return {
      pass,
      message: () =>
        pass
          ? `expected "${received}" not to be less than ${expected}`
          : `expected "${received}" to be less than ${expected}, but got ${received.minus(expected)}`,
    };
  },

  toBeBetweenDates(received: string, start: Date, end: Date) {
    const receivedDate = new Date(received);
    const pass =
      !Number.isNaN(receivedDate.getTime()) &&
      receivedDate >= start &&
      receivedDate <= end;

    return {
      pass,
      message: () =>
        pass
          ? `expected "${received}" not to be between ${start.toISOString()} and ${end.toISOString()}`
          : `expected "${received}" to be between ${start.toISOString()} and ${end.toISOString()}, but got ${receivedDate.toISOString()}`,
    };
  },

  toBeHexString: (received) => {
    return {
      pass: /^0x[a-fA-F0-9]+$/.test(received),
      message: () => `expected ${received} to be an hex string (0x…)`,
    };
  },

  toBeSortedNumerically(received: BigDecimal[], order: 'asc' | 'desc') {
    let pass = true;
    for (let i = 0; i < received.length - 1; i++) {
      const current = received[i];
      const next = received[i + 1];

      if (!current || !next) {
        continue;
      }

      if (
        (order === 'desc' && current.lt(next)) ||
        (order === 'asc' && current.gt(next))
      ) {
        pass = false;
        break;
      }
    }
    return {
      pass,
      message: () =>
        pass
          ? `expected array not to be ordered ${order}ending, but got: ${received}`
          : `expected array to be ordered ${order}ending, but got: ${received}`,
    };
  },

  toBeSortedAlphabetically(received: string[], order: 'asc' | 'desc') {
    let pass = true;
    for (let i = 0; i < received.length - 1; i++) {
      const current = received[i];
      const next = received[i + 1];

      if (!current || !next) {
        continue;
      }

      if (
        (order === 'desc' && current.localeCompare(next) < 0) ||
        (order === 'asc' && current.localeCompare(next) > 0)
      ) {
        pass = false;
        break;
      }
    }

    return {
      pass,
      message: () =>
        pass
          ? `expected array not to be ordered alphabetically ${order}ending, but got: ${received}`
          : `expected array to be ordered alphabetically ${order}ending, but got: ${received}`,
    };
  },

  toBeArrayWithElements(received, expected) {
    const { printReceived, printExpected } = this.utils;

    const isArray = Array.isArray(received) && received.length > 0;
    const pass =
      isArray && received.every((item) => this.equals(item, expected));

    return {
      pass,
      message: () =>
        pass
          ? `Expected array not to have all items matching:\n  ${printExpected(
              expected,
            )}\nBut it does.\n\nReceived:\n  ${printReceived(received)}`
          : `Expected all array items to match:\n  ${printExpected(
              expected,
            )}\nBut received:\n  ${printReceived(received)}`,
    };
  },
});
