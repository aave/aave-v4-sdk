import { describe, it } from 'vitest';

describe('Aave V4 Positions Scenario', () => {
  describe('GIVEN a user with more than one supply/borrow positions', () => {
    describe('WHEN fetching supply positions', () => {
      it('THEN it should be possible so sort them by balance', async () => {
        // TODO: Implement test
      });

      it('THEN it should be possible so sort them by name', async () => {
        // TODO: Implement test
      });

      it('THEN it should be possible so sort them by APY', async () => {
        // TODO: Implement test
      });

      it('THEN it should be possible so sort them by whether the position is used as collateral', async () => {
        // TODO: Implement test
      });
    });

    describe('When fetching borrow positions', () => {
      it('Then it should be possible so sort them by debt', async () => {
        // TODO: Implement test
      });

      it('Then it should be possible so sort them by name', async () => {
        // TODO: Implement test
      });

      it('Then it should be possible so sort them by APY', async () => {
        // TODO: Implement test
      });
    });
  });
});
