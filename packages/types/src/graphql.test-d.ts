import { describe, expectTypeOf, it } from 'vitest';
import type { ExtendWithOpaqueType, OpaqueTypename } from './graphql';

describe('Given the graphql type utilities', () => {
  describe('When using ExtendWithOpaqueType<T> where T is a GQL union', () => {
    type BaseUnion =
      | { __typename: 'TypeA'; common: number; a: string }
      | { __typename: 'TypeB'; common: number; b: number };

    type Extended = ExtendWithOpaqueType<BaseUnion>;

    it('Then it should preserve __typename for narrowing', () => {
      const item = {} as Extended;

      if (item.__typename === 'TypeA') {
        expectTypeOf(item.__typename).toEqualTypeOf<'TypeA'>();
        expectTypeOf(item.a).toEqualTypeOf<string>();
      }

      if (item.__typename === 'TypeB') {
        expectTypeOf(item.__typename).toEqualTypeOf<'TypeB'>();
        expectTypeOf(item.b).toEqualTypeOf<number>();
      }
    });

    it('Then it should prevent exhaustive switch statements', () => {
      const item = {} as Extended;

      switch (item.__typename) {
        case 'TypeA':
          expectTypeOf(item.a).toEqualTypeOf<string>();
          break;
        case 'TypeB':
          expectTypeOf(item.b).toEqualTypeOf<number>();
          break;
      }

      // __typename is wider than just the two cases above
      expectTypeOf(item.__typename).not.toEqualTypeOf<'TypeA' | 'TypeB'>();
    });

    it('Then it should preserve common properties across all union members', () => {
      type Extended = ExtendWithOpaqueType<BaseUnion>;

      const item = {} as Extended;

      expectTypeOf(item.common).toEqualTypeOf<number>();
    });
  });
});
