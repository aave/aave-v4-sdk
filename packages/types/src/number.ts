import { Big } from 'big.js';
import type { Tagged } from 'type-fest';
import { InvariantError, invariant } from './helpers';

// TODO: renable once interface migration is complete
Big.strict = false;

/**
 * Valid input types for BigDecimal operations.
 */
export type BigDecimalSource = string | number | bigint | BigDecimal;

/**
 * Rounding mode for BigDecimal operations.
 */
export enum RoundingMode {
  /**
   * Rounds towards zero (truncate, no rounding).
   */
  Down = 0,
  /**
   * Rounds towards nearest neighbor; if equidistant, rounds away from zero.
   */
  HalfUp = 1,
  /**
   * Rounds towards nearest neighbor; if equidistant, rounds towards even neighbor.
   */
  HalfEven = 2,
  /**
   * Rounds away from zero.
   */
  Up = 3,
}

/**
 * A high precision decimal number.
 */
export class BigDecimal extends Big {
  private constructor(value: string | Big) {
    super(value);
  }

  /**
   * Returns a string representing the value of this BigDecimal.
   *
   * This method is called automatically when the BigDecimal is used in a context that expects a primitive value.
   * To prevent accidental type coercion and loss of precision, this will throw an error in strict mode.
   *
   * @returns A string representation of the BigDecimal value.
   * @throws `InvariantError` when strict mode is enabled to prevent implicit conversion.
   *
   * @example
   * ```ts
   * const x = bigDecimal('123.456');
   * x.valueOf(); // Returns "123.456"
   * // Note: In strict mode, operations like `2 + x` will throw an error
   * ```
   */
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
   * Returns a BigDecimal whose value is the absolute value, i.e. the magnitude, of this BigDecimal.
   */
  override abs(): BigDecimal {
    return new BigDecimal(super.abs());
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal plus n - alias for .plus().
   *
   * @throws `NaN` if n is invalid.
   */
  override add(n: Big.BigSource): BigDecimal {
    return new BigDecimal(super.add(n));
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal divided by n.
   *
   * @throws `NaN` if n is invalid.
   * @throws `±Infinity` on division by zero.
   * @throws `NaN` on division of zero by zero.
   */
  override div(n: Big.BigSource): BigDecimal {
    return new BigDecimal(super.div(n));
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal minus n.
   *
   * @throws `NaN` if n is invalid.
   */
  override minus(n: Big.BigSource): BigDecimal {
    return new BigDecimal(super.minus(n));
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal modulo n, i.e. the integer remainder of dividing this BigDecimal by n.
   *
   * The result will have the same sign as this BigDecimal, and it will match that of Javascript's % operator (within the limits of its precision) and BigDecimal's remainder method.
   *
   * @throws `NaN` if n is negative or otherwise invalid.
   */
  override mod(n: Big.BigSource): BigDecimal {
    return new BigDecimal(super.mod(n));
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal times n - alias for .times().
   *
   * @throws `NaN` if n is invalid.
   */
  override mul(n: Big.BigSource): BigDecimal {
    return new BigDecimal(super.mul(n));
  }

  /**
   * Return a new BigDecimal whose value is the value of this BigDecimal negated.
   */
  override neg(): BigDecimal {
    return new BigDecimal(super.neg());
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal plus n.
   *
   * @throws `NaN` if n is invalid.
   */
  override plus(n: Big.BigSource): BigDecimal {
    return new BigDecimal(super.plus(n));
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal raised to the power exp.
   *
   * @param exp The power to raise the number to, -1e+6 to 1e+6 inclusive
   * @throws Error if exp is invalid.
   *
   * Note: High value exponents may cause this method to be slow to return.
   */
  override pow(exp: number): BigDecimal {
    return new BigDecimal(super.pow(exp));
  }

  /**
   * Return a new BigDecimal whose value is the value of this BigDecimal rounded to a maximum precision of sd
   * significant digits using rounding mode rm.
   *
   * @param sd Significant digits: integer, 1 to MAX_DP inclusive.
   * @param rm Rounding mode: RoundingMode.Down (0), RoundingMode.HalfUp (1), RoundingMode.HalfEven (2), or RoundingMode.Up (3).
   * @throws Error if sd is invalid.
   * @throws Error if rm is invalid.
   */
  override prec(sd: number, rm?: RoundingMode): BigDecimal {
    return new BigDecimal(super.prec(sd, rm));
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal rounded using rounding mode rm to a maximum of dp decimal places.
   *
   * @param dp Decimal places, 0 to 1e+6 inclusive
   * @param rm Rounding mode: RoundingMode.Down (0), RoundingMode.HalfUp (1), RoundingMode.HalfEven (2), or RoundingMode.Up (3).
   * @throws Error if dp is invalid.
   * @throws Error if rm is invalid.
   */
  override round(dp?: number, rm?: RoundingMode): BigDecimal {
    return new BigDecimal(super.round(dp, rm));
  }

  /**
   * Returns a BigDecimal whose value is the square root of this BigDecimal.
   *
   * @throws `NaN` if this BigDecimal is negative.
   */
  override sqrt(): BigDecimal {
    return new BigDecimal(super.sqrt());
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal minus n - alias for .minus().
   *
   * @throws `NaN` if n is invalid.
   */
  override sub(n: Big.BigSource): BigDecimal {
    return new BigDecimal(super.sub(n));
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal times n.
   *
   * @throws `NaN` if n is invalid.
   */
  override times(n: Big.BigSource): BigDecimal {
    return new BigDecimal(super.times(n));
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal multiplied by 10^decimals.
   *
   * @param decimals The number of decimal places to scale by (can be negative to scale down).
   */
  public rescale(decimals: number): BigDecimal {
    return new BigDecimal(this.mul(10 ** decimals));
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

  /**
   * Returns the minimum value from the provided BigDecimal values.
   *
   * @param first - The first value to compare.
   * @param second - The second value to compare.
   * @param others - The other values to compare.
   * @returns The minimum value.
   */
  static min(
    first: BigDecimal,
    second: BigDecimal,
    ...others: BigDecimal[]
  ): BigDecimal {
    return [second, ...others].reduce<BigDecimal>((min, current) => {
      return min.lt(current) ? min : current;
    }, first);
  }

  /**
   * Returns the maximum value from the provided BigDecimal values.
   *
   * @param first - The first value to compare.
   * @param second - The second value to compare.
   * @param others - The other values to compare.
   * @returns The maximum value.
   */
  static max(
    first: BigDecimal,
    second: BigDecimal,
    ...others: BigDecimal[]
  ): BigDecimal {
    return [second, ...others].reduce<BigDecimal>((max, current) => {
      return max.gt(current) ? max : current;
    }, first);
  }
}

/**
 * Create a new BigDecimal.
 *
 * @param value - The value to create a new BigDecimal from.
 * @returns A new BigDecimal.
 */
export function bigDecimal(value: BigDecimalSource): BigDecimal {
  if (value instanceof BigDecimal) {
    return value;
  }
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
