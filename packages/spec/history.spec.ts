import { describe, it } from 'vitest';

describe('Aave V4 History Scenario', () => {
  describe('GIVEN a user with prior history of transactions', () => {
    describe('WHEN fetching the user history by activity type', () => {
      const activityType = Object.values([
        'BORROW',
        'SUPPLY',
        'WITHDRAW',
        'REPAY',
        'LIQUIDATED',
        'SWAP',
      ]);
      it.each(activityType)(
        'THEN it should be possible so filter them by %s activity',
        (_activityType) => {
          // TODO: Implement test
        },
      );
    });

    describe('WHEN fetching filtered user history', () => {
      it.todo('THEN it should be possible to filter them by chainIds');
      it.todo('THEN it should be possible to filter them by spoke');
    });
  });
});
