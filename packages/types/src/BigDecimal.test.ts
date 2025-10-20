import { describe, expect, it } from 'vitest';
import { InvariantError } from './helpers';
import { bigDecimal } from './number';

describe('Given a BigDecimal class', () => {
  describe('When the input is not a number', () => {
    it('Then it should throw an InvariantError', () => {
      expect(() => bigDecimal('not a number')).toThrow(InvariantError);
    });
  });

  describe('When serializing as JSON', () => {
    it('Then it should return the string representation of the number', () => {
      const number = bigDecimal('10.12345678901');
      expect(JSON.stringify(number)).toBe('"10.12345678901"');
    });
  });

  // TODO: delete once strict mode is enabled again
  describe('When using the Number(BigDecimal) cosntructor', () => {
    it('Then it should return the number representation of the BigDecimal', () => {
      const number = bigDecimal('10.12345678901');
      expect(Number(number)).toBe(10.12345678901);
    });
  });

  describe.skip('When using the Number(BigDecimal) cosntructor', () => {
    it('Then it should throw an InvariantError', () => {
      const number = bigDecimal('10.12345678901');
      expect(() => Number(number)).toThrow(InvariantError);
    });
  });

  describe.skip('When using BigDecimal#valueOf is invoked', () => {
    it('Then it should throw an InvariantError', () => {
      const number = bigDecimal('10.12345678901');
      // @ts-expect-error - we want to test the error case
      expect(() => 2 + number).toThrow(InvariantError);
    });
  });
});
