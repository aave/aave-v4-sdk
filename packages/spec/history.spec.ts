import { describe, it } from 'vitest';

describe('Aave V4 History Scenario', () => {
  describe('Given a user with prior history of transactions', () => {
    describe('When fetching the user history by activity type', () => {
      const activityType = Object.values([
        'BORROW',
        'SUPPLY',
        'WITHDRAW',
        'REPAY',
        'LIQUIDATED',
        'SWAP',
      ]);
      it.each(activityType)(
        'Then it should be possible so filter them by %s activity',
        (_activityType) => {
          // TODO: Implement test
        },
      );
    });

    describe('When fetching filtered user history', () => {
      it.todo('Then it should be possible to filter them by chainIds');
      it.todo('Then it should be possible to filter them by spoke');
    });
  });
});
