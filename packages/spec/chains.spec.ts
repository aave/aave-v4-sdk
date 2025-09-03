import { ChainsFilter } from '@aave/graphql';
import { describe, it } from 'vitest';

describe('Aave V4 Chains Scenario', () => {
  describe('GIVEN a user who wants to list available chains', () => {
    describe.skip('WHEN listing supported chains with a filter', () => {
      const filter = Object.values(ChainsFilter);
      it.each(filter)(
        'THEN it should return the expected list chains with filter %s',
        (_filter) => {
          // TODO: Implement test
        },
      );
    });
  });
});
