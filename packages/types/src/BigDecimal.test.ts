import { describe, expect, it } from 'vitest';
import { InvariantError } from './helpers';
import { BigDecimal, bigDecimal, RoundingMode } from './number';

describe('Given a BigDecimal class', () => {
  describe('When the input is not a number', () => {
    it('Then it should throw an InvariantError', () => {
      expect(() => bigDecimal('not a number')).toThrow(InvariantError);
    });
  });

  describe('When serializing as JSON', () => {
    it('Then it should return the string representation of the number', () => {
      const number = bigDecimal('0.1234567890134567890123456789');
      expect(JSON.stringify(number)).toBe('"0.1234567890134567890123456789"');
    });
  });

  describe('When using BigDecimal#valueOf is invoked', () => {
    it('Then it should throw an InvariantError', () => {
      const number = bigDecimal('10.12345678901');
      // @ts-expect-error - we want to test the error case
      expect(() => 2 + number).toThrow(InvariantError);
    });
  });

  describe('When using BigDecimal#toNumber is invoked', () => {
    it('Then it should throw an InvariantError', () => {
      const number = bigDecimal('10.12345678901');
      expect(() => number.toNumber()).toThrow(InvariantError);
    });
  });

  describe('When calling toApproximateNumber() method', () => {
    it('Then it should clamp values larger than Number.MAX_VALUE', () => {
      const number = bigDecimal('1e500');
      expect(number.toApproximateNumber()).toBe(Number.MAX_VALUE);
    });

    it('Then it should clamp values smaller than -Number.MAX_VALUE', () => {
      const number = bigDecimal('-1e500');
      expect(number.toApproximateNumber()).toBe(-Number.MAX_VALUE);
    });

    it('Then it should round subnormal positive values to 0', () => {
      const number = bigDecimal('1e-500');
      expect(number.toApproximateNumber()).toBe(0);
    });

    it('Then it should round subnormal negative values to -0', () => {
      const number = bigDecimal('-1e-500');
      expect(number.toApproximateNumber()).toBe(-0);
    });

    it('Then it should convert regular values accurately', () => {
      const number = bigDecimal('123.456');
      expect(number.toApproximateNumber()).toBe(123.456);
    });
  });

  describe('When calling arithmetic methods', () => {
    it('Then methods should accept BigDecimalSource (string, number, BigDecimal)', () => {
      const a = bigDecimal('10');
      const b = bigDecimal('5');

      // Test with string
      expect(a.add('5').toString()).toBe('15');

      // Test with number
      expect(a.add(5).toString()).toBe('15');

      // Test with BigDecimal
      expect(a.add(b).toString()).toBe('15');
      expect(BigDecimal.isBigDecimal(a.add(b))).toBe(true);
    });

    it('Then bigDecimal() should accept BigDecimal and return same instance', () => {
      const original = bigDecimal('123.456');
      const result = bigDecimal(original);
      expect(result).toBe(original);
      expect(result.toString()).toBe('123.456');
    });

    it('Then abs() should return a BigDecimal with absolute value', () => {
      const number = bigDecimal('-100');
      const result = number.abs();
      expect(result.toString()).toBe('100');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then add() should return a BigDecimal with sum', () => {
      const number = bigDecimal('100');
      const result = number.add('50');
      expect(result.toString()).toBe('150');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then div() should return a BigDecimal with quotient', () => {
      const number = bigDecimal('100');
      const result = number.div('4');
      expect(result.toString()).toBe('25');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then minus() should return a BigDecimal with difference', () => {
      const number = bigDecimal('100');
      const result = number.minus('30');
      expect(result.toString()).toBe('70');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then mod() should return a BigDecimal with remainder', () => {
      const number = bigDecimal('100');
      const result = number.mod('30');
      expect(result.toString()).toBe('10');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then mul() should return a BigDecimal with product', () => {
      const number = bigDecimal('100');
      const result = number.mul('2');
      expect(result.toString()).toBe('200');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then neg() should return a BigDecimal with negated value', () => {
      const number = bigDecimal('100');
      const result = number.neg();
      expect(result.toString()).toBe('-100');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then plus() should return a BigDecimal with sum', () => {
      const number = bigDecimal('100');
      const result = number.plus('25');
      expect(result.toString()).toBe('125');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then pow() should return a BigDecimal with power', () => {
      const number = bigDecimal('2');
      const result = number.pow(3);
      expect(result.toString()).toBe('8');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then prec() should return a BigDecimal with precision', () => {
      const number = bigDecimal('123.456');
      const result = number.prec(4);
      expect(result.toString()).toBe('123.5');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then prec() should accept RoundingMode enum values', () => {
      const number = bigDecimal('123.456');
      expect(number.prec(4, RoundingMode.Down).toString()).toBe('123.4');
      expect(number.prec(4, RoundingMode.HalfUp).toString()).toBe('123.5');
      expect(number.prec(4, RoundingMode.HalfEven).toString()).toBe('123.5');
      expect(number.prec(4, RoundingMode.Up).toString()).toBe('123.5');
    });

    it('Then round() should return a BigDecimal with rounded value', () => {
      const number = bigDecimal('123.456');
      const result = number.round(1);
      expect(result.toString()).toBe('123.5');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then round() should accept RoundingMode enum values', () => {
      const number = bigDecimal('123.456');
      expect(number.round(1, RoundingMode.Down).toString()).toBe('123.4');
      expect(number.round(1, RoundingMode.HalfUp).toString()).toBe('123.5');
      expect(number.round(1, RoundingMode.HalfEven).toString()).toBe('123.5');
      expect(number.round(1, RoundingMode.Up).toString()).toBe('123.5');
    });

    it('Then sqrt() should return a BigDecimal with square root', () => {
      const number = bigDecimal('144');
      const result = number.sqrt();
      expect(result.toString()).toBe('12');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then sub() should return a BigDecimal with difference', () => {
      const number = bigDecimal('100');
      const result = number.sub('40');
      expect(result.toString()).toBe('60');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then times() should return a BigDecimal with product', () => {
      const number = bigDecimal('100');
      const result = number.times('3');
      expect(result.toString()).toBe('300');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then rescale() should return a BigDecimal with rescaled value', () => {
      const number = bigDecimal('10.12345678901');
      const result = number.rescale(2);
      expect(result.toString()).toBe('1012.345678901');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });
  });

  describe('When calling string conversion methods', () => {
    it('Then toString() should return string representation', () => {
      const number = bigDecimal('123.456');
      expect(number.toString()).toBe('123.456');
      expect(typeof number.toString()).toBe('string');
    });

    it('Then toFixed() should return fixed decimal notation', () => {
      const number = bigDecimal('123.456');
      expect(number.toFixed(2)).toBe('123.46');
      expect(number.toFixed(0)).toBe('123');
      expect(typeof number.toFixed(2)).toBe('string');
    });

    it('Then toExponential() should return exponential notation', () => {
      const number = bigDecimal('123.456');
      expect(number.toExponential(2)).toBe('1.23e+2');
      expect(typeof number.toExponential(2)).toBe('string');
    });

    it('Then toPrecision() should return specified precision', () => {
      const number = bigDecimal('123.456');
      expect(number.toPrecision(4)).toBe('123.5');
      expect(typeof number.toPrecision(4)).toBe('string');
    });

    it('Then toJSON() should return JSON string representation', () => {
      const number = bigDecimal('123.456');
      expect(number.toJSON()).toBe('123.456');
      expect(typeof number.toJSON()).toBe('string');
    });
  });

  describe('When calling comparison methods', () => {
    it('Then cmp() should return comparison result', () => {
      const a = bigDecimal('100');
      expect(a.cmp('50')).toBe(1);
      expect(a.cmp('100')).toBe(0);
      expect(a.cmp('150')).toBe(-1);
    });

    it('Then eq() should check equality', () => {
      const a = bigDecimal('100');
      expect(a.eq('100')).toBe(true);
      expect(a.eq('50')).toBe(false);
    });

    it('Then gt() should check greater than', () => {
      const a = bigDecimal('100');
      expect(a.gt('50')).toBe(true);
      expect(a.gt('100')).toBe(false);
      expect(a.gt('150')).toBe(false);
    });

    it('Then gte() should check greater than or equal', () => {
      const a = bigDecimal('100');
      expect(a.gte('50')).toBe(true);
      expect(a.gte('100')).toBe(true);
      expect(a.gte('150')).toBe(false);
    });

    it('Then lt() should check less than', () => {
      const a = bigDecimal('100');
      expect(a.lt('50')).toBe(false);
      expect(a.lt('100')).toBe(false);
      expect(a.lt('150')).toBe(true);
    });

    it('Then lte() should check less than or equal', () => {
      const a = bigDecimal('100');
      expect(a.lte('50')).toBe(false);
      expect(a.lte('100')).toBe(true);
      expect(a.lte('150')).toBe(true);
    });
  });

  describe('When calling static min(values) method', () => {
    it('Then it should return the minimum value from multiple arguments', () => {
      const result = BigDecimal.min(
        bigDecimal('10'),
        bigDecimal('5'),
        bigDecimal('20'),
        bigDecimal('3'),
      );
      expect(result.toString()).toBe('3');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then it should handle negative numbers', () => {
      const result = BigDecimal.min(
        bigDecimal('10'),
        bigDecimal('-5'),
        bigDecimal('20'),
        bigDecimal('-3'),
      );
      expect(result.toString()).toBe('-5');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });
  });

  describe('When calling static max(values) method', () => {
    it('Then it should return the maximum value from multiple arguments', () => {
      const result = BigDecimal.max(
        bigDecimal('10'),
        bigDecimal('5'),
        bigDecimal('20'),
        bigDecimal('3'),
      );
      expect(result.toString()).toBe('20');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });

    it('Then it should handle negative numbers', () => {
      const result = BigDecimal.max(
        bigDecimal('-10'),
        bigDecimal('-5'),
        bigDecimal('-20'),
        bigDecimal('-3'),
      );
      expect(result.toString()).toBe('-3');
      expect(BigDecimal.isBigDecimal(result)).toBe(true);
    });
  });

  describe('When calling toDisplayString() method', () => {
    it.each([
      ['123.456', 4, '123.5'],
      ['123.456', 2, '123'],
      ['0.0012345', 3, '0.00123'],
      ['123456789', 5, '123456789'],
      ['-123.456', 4, '-123.5'],
    ])(
      'Then it should format %s to %i significant digits as %s',
      (value, sigDigits, expected) => {
        const number = bigDecimal(value);
        expect(number.toDisplayString(sigDigits)).toBe(expected);
      },
    );

    describe('with minFractionDigits', () => {
      it.each([
        ['0', 3, 2, '0.00'],
        ['123', 3, 2, '123.00'],
        ['123.4', 4, 3, '123.400'],
      ])(
        'Then it should apply minFractionDigits for %s with %i sigDigits and minFractionDigits=%i as %s',
        (value, sigDigits, minFractionDigits, expected) => {
          const number = bigDecimal(value);
          expect(number.toDisplayString(sigDigits, { minFractionDigits })).toBe(
            expected,
          );
        },
      );
    });

    describe('with trimTrailingZeros', () => {
      it.each([
        ['123.4500', 5, '123.45'],
        ['123.000', 3, '123'],
      ])(
        'Then it should trim trailing zeros for %s with %i sigDigits as %s',
        (value, sigDigits, expected) => {
          const number = bigDecimal(value);
          expect(
            number.toDisplayString(sigDigits, {
              trimTrailingZeros: true,
            }),
          ).toBe(expected);
        },
      );
    });

    describe('with combined options', () => {
      it.each([
        ['123.4', 4, 3, '123.4'],
        ['123', 3, 2, '123'],
      ])(
        'Then it should apply combined options for %s with %i sigDigits, minFractionDigits=%i, and trimTrailingZeros as %s',
        (value, sigDigits, minFractionDigits, expected) => {
          const number = bigDecimal(value);
          expect(
            number.toDisplayString(sigDigits, {
              minFractionDigits,
              trimTrailingZeros: true,
            }),
          ).toBe(expected);
        },
      );
    });
  });
});
