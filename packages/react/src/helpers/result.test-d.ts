import type { UnexpectedError } from '@aave/core';
import { describe, expectTypeOf, it } from 'vitest';
import type { PausableReadResult } from './results';

describe('Given the read hook result types', () => {
  describe('When the result is a PausableReadResult', () => {
    const result = {} as PausableReadResult<string>;

    it('Then it should narrow to paused state when paused is true', () => {
      if (result.paused) {
        expectTypeOf(result.paused).toEqualTypeOf<true>();
        expectTypeOf(result.data).toEqualTypeOf<string | undefined>();
        expectTypeOf(result.error).toEqualTypeOf<UnexpectedError | undefined>();
        expectTypeOf(result.loading).toEqualTypeOf<false>();
      }
    });

    it('Then it should narrow to active states when paused is false', () => {
      if (!result.paused) {
        expectTypeOf(result.paused).toEqualTypeOf<false>();
        expectTypeOf(result.loading).toEqualTypeOf<boolean>();
      }
    });

    it('Then it should narrow to loading state when not paused and loading', () => {
      if (!result.paused && result.loading) {
        expectTypeOf(result.data).toEqualTypeOf<undefined>();
        expectTypeOf(result.error).toEqualTypeOf<undefined>();
      }
    });

    it('Then it should narrow to success or error when not loading', () => {
      if (!result.paused && !result.loading) {
        expectTypeOf(result.loading).toEqualTypeOf<false>();
        // At this point, data is string | undefined and error is UnexpectedError | undefined
      }
    });

    it('Then it should narrow to success state when error is undefined', () => {
      if (!result.paused && !result.loading && !result.error) {
        expectTypeOf(result.data).toEqualTypeOf<string>();
        expectTypeOf(result.error).toEqualTypeOf<undefined>();
      }
    });

    it('Then it should narrow to error state when error is defined', () => {
      if (!result.paused && !result.loading && result.error) {
        expectTypeOf(result.data).toEqualTypeOf<undefined>();
        expectTypeOf(result.error).not.toEqualTypeOf<undefined>();
      }
    });
  });
});
