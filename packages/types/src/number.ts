import Big from 'big.js';
import type { Tagged } from 'type-fest';
import { InvariantError, invariant } from './helpers';

Big.strict = true;

/**
 * A high precision decimal number.
 */
export class BigDecimal extends Big {
  readonly STRICT = true;

  private constructor(value: string) {
    super(value);
  }

  override valueOf(): string {
    try {
      return super.valueOf();
    } catch (error) {
      throw new InvariantError('BigDecimal cannot be converted to a number', {
        cause: error,
      });
    }
  }

  /**
   * @internal
   */
  static new(value: string): BigDecimal {
    try {
      return new BigDecimal(value);
    } catch (error) {
      throw new InvariantError('Invalid value for BigDecimal', {
        cause: error,
      });
    }
  }

  static isBigDecimal(value: unknown): value is BigDecimal {
    return value instanceof BigDecimal;
  }
}

/**
 * Create a new BigDecimal.
 *
 * @param value - The value to create a new BigDecimal from.
 * @returns A new BigDecimal.
 */
export function bigDecimal(value: number | string) {
  return BigDecimal.new(value.toString());
}

/**
 * An integer representation of a blockchain chain ID.
 */
export type ChainId = Tagged<number, 'ChainId'>;
export function chainId(value: number): ChainId {
  invariant(Number.isInteger(value) && value >= 0, `Invalid ChainId: ${value}`);
  return value as ChainId;
}
