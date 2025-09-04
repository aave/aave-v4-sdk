import { ChainsFilter } from '@aave/client-next';
import { describe, it } from 'vitest';

describe('Aave V4 Chains Scenario', () => {
  describe('Given a user who wants to list available chains', () => {
    describe.skip('When listing supported chains with a filter', () => {
      const filter = Object.values(ChainsFilter);
      it.each(filter)(
        'Then it should return the expected list chains with filter %s',
        (_filter) => {
          // TODO: Implement test
        },
      );
    });
  });
});
