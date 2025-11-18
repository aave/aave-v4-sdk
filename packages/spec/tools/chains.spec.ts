import { assertOk, ChainsFilter } from '@aave/client';
import { chains } from '@aave/client/actions';
import { client } from '@aave/client/test-utils';
import { describe, expect, it } from 'vitest';

describe('Aave V4 Chains Scenario', () => {
  describe('Given a user who wants to list available chains', () => {
    describe('When listing supported chains with a filter', () => {
      const filter = Object.values(ChainsFilter);
      it.each(filter)(
        'Then it should return the expected list chains with filter %s',
        async (filter) => {
          const result = await chains(client, filter);
          assertOk(result);
          expect(result.value).toMatchSnapshot();
        },
      );
    });
  });
});
