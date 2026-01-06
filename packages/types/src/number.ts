import { Big } from 'big.js';
import type { Tagged } from 'type-fest';
import { InvariantError, invariant } from './helpers';

Big.strict = true;

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
 * A high precision decimal number built on top of `big.js` library.
 */
export class BigDecimal {
  private readonly value: Big;

  private static readonly MAX_VAL = BigDecimal.new(Number.MAX_VALUE.toString()); // ≈ 1.7976931348623157e+308
  private static readonly MIN_VAL = BigDecimal.new(Number.MIN_VALUE.toString()); // ≈ 5e-324 (smallest positive subnormal)

  private constructor(value: Big.BigSource) {
    this.value = new Big(value);
  }

  /**
   * Throws an error to prevent implicit conversion to a number.
   */
  valueOf(): string {
    try {
      return this.value.valueOf();
    } catch (error) {
      throw new InvariantError('BigDecimal cannot be converted to a number', {
        cause: error,
      });
    }
  }

  /**
   * Throws an error to prevent conversion to a number.
   *
   * If you need a JS Number, and your can afford precision loss, use `toApproximateNumber()` instead.
   */
  toNumber(): number {
    throw new InvariantError('BigDecimal cannot be converted to a number');
  }

  /**
   * Returns a BigDecimal whose value is the absolute value, i.e. the magnitude, of this BigDecimal.
   */
  abs(): BigDecimal {
    return new BigDecimal(this.value.abs());
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal plus n - alias for .plus().
   *
   * @throws `NaN` if n is invalid.
   */
  add(n: BigDecimalSource): BigDecimal {
    return new BigDecimal(this.value.add(this.toBigSource(n)));
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal divided by n.
   *
   * @throws `NaN` if n is invalid.
   * @throws `±Infinity` on division by zero.
   * @throws `NaN` on division of zero by zero.
   */
  div(n: BigDecimalSource): BigDecimal {
    return new BigDecimal(this.value.div(this.toBigSource(n)));
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal minus n.
   *
   * @throws `NaN` if n is invalid.
   */
  minus(n: BigDecimalSource): BigDecimal {
    return new BigDecimal(this.value.minus(this.toBigSource(n)));
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal modulo n, i.e. the integer remainder of dividing this BigDecimal by n.
   *
   * The result will have the same sign as this BigDecimal, and it will match that of Javascript's % operator (within the limits of its precision) and BigDecimal's remainder method.
   *
   * @throws `NaN` if n is negative or otherwise invalid.
   */
  mod(n: BigDecimalSource): BigDecimal {
    return new BigDecimal(this.value.mod(this.toBigSource(n)));
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal times n - alias for .times().
   *
   * @throws `NaN` if n is invalid.
   */
  mul(n: BigDecimalSource): BigDecimal {
    return new BigDecimal(this.value.mul(this.toBigSource(n)));
  }

  /**
   * Return a new BigDecimal whose value is the value of this BigDecimal negated.
   */
  neg(): BigDecimal {
    return new BigDecimal(this.value.neg());
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal plus n.
   *
   * @throws `NaN` if n is invalid.
   */
  plus(n: BigDecimalSource): BigDecimal {
    return new BigDecimal(this.value.plus(this.toBigSource(n)));
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal raised to the power exp.
   *
   * @param exp The power to raise the number to, -1e+6 to 1e+6 inclusive
   * @throws Error if exp is invalid.
   *
   * Note: High value exponents may cause this method to be slow to return.
   */
  pow(exp: number): BigDecimal {
    return new BigDecimal(this.value.pow(exp));
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
  prec(sd: number, rm?: RoundingMode): BigDecimal {
    return new BigDecimal(this.value.prec(sd, rm));
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal rounded using rounding mode rm to a maximum of dp decimal places.
   *
   * @param dp Decimal places, 0 to 1e+6 inclusive
   * @param rm Rounding mode: RoundingMode.Down (0), RoundingMode.HalfUp (1), RoundingMode.HalfEven (2), or RoundingMode.Up (3).
   * @throws Error if dp is invalid.
   * @throws Error if rm is invalid.
   */
  round(dp?: number, rm?: RoundingMode): BigDecimal {
    return new BigDecimal(this.value.round(dp, rm));
  }

  /**
   * Returns a BigDecimal whose value is the square root of this BigDecimal.
   *
   * @throws `NaN` if this BigDecimal is negative.
   */
  sqrt(): BigDecimal {
    return new BigDecimal(this.value.sqrt());
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal minus n - alias for .minus().
   *
   * @throws `NaN` if n is invalid.
   */
  sub(n: BigDecimalSource): BigDecimal {
    return new BigDecimal(this.value.sub(this.toBigSource(n)));
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal times n.
   *
   * @throws `NaN` if n is invalid.
   */
  times(n: BigDecimalSource): BigDecimal {
    return new BigDecimal(this.value.times(this.toBigSource(n)));
  }

  /**
   * Compare the values.
   *
   * @returns 1 if this BigDecimal is greater than n, 0 if equal, -1 if less than n.
   * @throws `NaN` if n is invalid.
   */
  cmp(n: BigDecimalSource): Big.Comparison {
    return this.value.cmp(this.toBigSource(n));
  }

  /**
   * Returns true if the value of this BigDecimal equals the value of n, otherwise returns false.
   *
   * @throws `NaN` if n is invalid.
   */
  eq(n: BigDecimalSource): boolean {
    return this.value.eq(this.toBigSource(n));
  }

  /**
   * Returns true if the value of this BigDecimal is greater than the value of n, otherwise returns false.
   *
   * @throws `NaN` if n is invalid.
   */
  gt(n: BigDecimalSource): boolean {
    return this.value.gt(this.toBigSource(n));
  }

  /**
   * Returns true if the value of this BigDecimal is greater than or equal to the value of n, otherwise returns false.
   *
   * @throws `NaN` if n is invalid.
   */
  gte(n: BigDecimalSource): boolean {
    return this.value.gte(this.toBigSource(n));
  }

  /**
   * Returns true if the value of this BigDecimal is less than the value of n, otherwise returns false.
   *
   * @throws `NaN` if n is invalid.
   */
  lt(n: BigDecimalSource): boolean {
    return this.value.lt(this.toBigSource(n));
  }

  /**
   * Returns true if the value of this BigDecimal is less than or equal to the value of n, otherwise returns false.
   *
   * @throws `NaN` if n is invalid.
   */
  lte(n: BigDecimalSource): boolean {
    return this.value.lte(this.toBigSource(n));
  }

  /**
   * Returns a string representing the value of this BigDecimal in exponential notation to a fixed number of decimal places dp.
   *
   * @param dp Decimal places, 0 to 1e+6 inclusive
   * @param rm Rounding mode: RoundingMode.Down (0), RoundingMode.HalfUp (1), RoundingMode.HalfEven (2), or RoundingMode.Up (3).
   * @throws Error if dp is invalid.
   */
  toExponential(dp?: number, rm?: RoundingMode): string {
    return this.value.toExponential(dp, rm);
  }

  /**
   * Returns a string representing the value of this BigDecimal in normal notation to a fixed number of decimal places dp.
   *
   * @param dp Decimal places, 0 to 1e+6 inclusive
   * @param rm Rounding mode: RoundingMode.Down (0), RoundingMode.HalfUp (1), RoundingMode.HalfEven (2), or RoundingMode.Up (3).
   * @throws Error if dp is invalid.
   */
  toFixed(dp?: number, rm?: RoundingMode): string {
    return this.value.toFixed(dp, rm);
  }

  /**
   * Returns a string representing the value of this BigDecimal to the specified number of significant digits sd.
   *
   * @param sd Significant digits, 1 to 1e+6 inclusive
   * @param rm Rounding mode: RoundingMode.Down (0), RoundingMode.HalfUp (1), RoundingMode.HalfEven (2), or RoundingMode.Up (3).
   * @throws Error if sd is invalid.
   */
  toPrecision(sd?: number, rm?: RoundingMode): string {
    return this.value.toPrecision(sd, rm);
  }

  /**
   * Returns a string representing the value of this BigDecimal.
   *
   * If this BigDecimal has a positive exponent that is equal to or greater than 21, or a negative exponent equal to or less than -7, then exponential notation is returned.
   */
  toString(): string {
    return this.value.toString();
  }

  /**
   * Returns a string representing the value of this BigDecimal.
   *
   * This method is used by JSON.stringify() to serialize BigDecimal values.
   */
  toJSON(): string {
    return this.value.toFixed();
  }

  /**
   * Returns a BigDecimal whose value is the value of this BigDecimal multiplied by 10^decimals.
   *
   * @param decimals The number of decimal places to scale by (can be negative to scale down).
   */
  public rescale(decimals: number): BigDecimal {
    return this.mul(10 ** decimals);
  }

  /**
   * Returns a formatted string representation of this BigDecimal for display purposes.
   *
   * The precision behavior adapts based on the number's magnitude:
   * - For numbers >= 1: Always displays the full integer part, with decimal precision
   *   controlled by the precision parameter (representing orders of magnitude for decimals).
   * - For numbers < 1: Uses traditional significant figures behavior.
   *
   * @param precision - Precision control parameter.
   * For numbers >= 1: Total digits to display (integer + decimal).
   * For numbers < 1: Number of significant figures.
   * @param opts - Optional formatting options.
   * @param opts.rounding - The rounding mode to apply (default: RoundingMode.HalfUp).
   * @param opts.minFractionDigits - The minimum number of digits to display
   * after the decimal point (default: 0).
   * @param opts.trimTrailingZeros - When true, removes trailing zeros after
   * the decimal point for a cleaner display (default: false).
   *
   * @returns A string representing the rounded and formatted number.
   */
  public toDisplayString(
    precision: number,
    opts?: {
      rounding?: RoundingMode;
      minFractionDigits?: number;
      trimTrailingZeros?: boolean;
    },
  ): string {
    const {
      rounding = RoundingMode.HalfUp,
      minFractionDigits = 0,
      trimTrailingZeros = false,
    } = opts ?? {};

    if (this.eq(0)) {
      return minFractionDigits > 0 ? `0.${'0'.repeat(minFractionDigits)}` : '0';
    }

    const rounded = this.applyPrecisionWithMinFractionDigits(
      precision,
      minFractionDigits,
      rounding,
    );

    return this.formatDecimalString(
      rounded,
      minFractionDigits,
      trimTrailingZeros,
    );
  }

  /**
   * Returns a JavaScript `number` approximation of this BigDecimal, safely clamped
   * within the finite range of representable values.
   *
   * This method performs a best-effort conversion to a native `number` while ensuring
   * that:
   * - Values larger than `Number.MAX_VALUE` are clamped to `Number.MAX_VALUE`.
   * - Values smaller than `-Number.MAX_VALUE` are clamped to `-Number.MAX_VALUE`.
   * - Subnormal magnitudes smaller than `Number.MIN_VALUE` are rounded to `0` (preserving sign).
   *
   * Use this method only when precision loss is acceptable — for example, when displaying
   * approximate numeric values or interfacing with APIs that require `number` types.
   *
   * @returns A finite `number` approximation of this BigDecimal.
   *
   * @example
   * ```ts
   * const x = bigDecimal('1e500');
   * x.toApproximateNumber(); // → 1.7976931348623157e+308 (clamped)
   *
   * const y = bigDecimal('0.0000000000000000000000000000001');
   * y.toApproximateNumber(); // → 0
   *
   * const z = bigDecimal('123.456');
   * z.toApproximateNumber(); // → 123.456
   * ```
   */
  public toApproximateNumber(): number {
    if (this.gt(BigDecimal.MAX_VAL)) return Number.MAX_VALUE;
    if (this.lt(BigDecimal.MAX_VAL.times(-1))) return -Number.MAX_VALUE;

    // subnormal underflow -> preserve sign as -0 when negative
    if (this.abs().lt(BigDecimal.MIN_VAL)) return this.lt('0') ? -0 : 0;

    return Number(this.toString());
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

  /**
   * Converts BigDecimalSource to Big.BigSource for passing to super methods.
   */
  private toBigSource(n: BigDecimalSource): Big.BigSource {
    switch (typeof n) {
      case 'bigint':
        return n.toString();
      case 'number':
        return n.toString();
      case 'string':
        return n;
      default:
        return n.toFixed();
    }
  }

  private getIntegerDigitCount(): number {
    const absStr = this.abs().toFixed();
    const [integerPart] = absStr.split('.');
    return integerPart?.length ?? absStr.length;
  }

  private applyPrecisionWithMinFractionDigits(
    precision: number,
    minFractionDigits: number,
    rounding: RoundingMode,
  ): BigDecimal {
    const shouldRespectMinFraction = this.gte(1) && minFractionDigits > 0;

    if (shouldRespectMinFraction) {
      const integerDigits = this.getIntegerDigitCount();
      const requiredPrecision = integerDigits + minFractionDigits;
      const effectivePrecision = Math.max(precision, requiredPrecision);
      const decimalPlaces = effectivePrecision - integerDigits;
      return this.round(decimalPlaces, rounding);
    }

    return this.applyAdaptivePrecision(precision, rounding);
  }

  private formatDecimalString(
    value: BigDecimal,
    minFractionDigits: number,
    trimTrailingZeros: boolean,
  ): string {
    let result = value.toFixed();

    if (minFractionDigits > 0) {
      result = this.ensureMinFractionDigits(result, minFractionDigits);
    }

    if (trimTrailingZeros && result.includes('.')) {
      result = result.replace(/\.?0+$/, '');
    }

    return result;
  }

  private ensureMinFractionDigits(str: string, minDigits: number): string {
    const [intPart, fracPart = ''] = str.split('.');
    if (fracPart.length < minDigits) {
      return `${intPart}.${fracPart.padEnd(minDigits, '0')}`;
    }
    return str;
  }

  private applyAdaptivePrecision(
    precision: number,
    rounding: RoundingMode,
  ): BigDecimal {
    const absValue = this.abs();

    // For numbers >= 1, keep all integer digits and control decimal precision
    if (absValue.gte(1)) {
      const integerDigits = this.getIntegerDigitCount();
      const decimalPlaces = Math.max(0, precision - integerDigits);
      return this.round(decimalPlaces, rounding);
    }

    // For numbers < 1, use traditional significant figures
    return this.prec(precision, rounding);
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
export function chainId(value: number | bigint): ChainId {
  const id = Number(value);
  invariant(Number.isInteger(id) && id >= 0, `Invalid ChainId: ${value}`);
  return id as ChainId;
}
