import { describe, it } from 'vitest';

describe('Aave V4 Supply Scenarios', () => {
  describe('Given a user and a Reserve', () => {
    describe('When the user supplies tokens', () => {
      describe("Then the user's supply positions are updated", () => {
        it.todo('AND the supplied tokens are set as collateral by default');
      });
    });

    describe('When the user supplies tokens with collateral disabled', () => {
      it.todo(
        `Then the user's supply positions are updated without collateral`,
      );
    });

    describe('When the user supplies tokens on behalf of another address', () => {
      it.todo(`Then the other address's supply positions are updated`);
    });

    describe('When the user supplies tokens using a permit signature', () => {
      it.todo('Then the supply succeeds without requiring ERC20 approval');
    });

    describe('When the user supplies tokens on behalf of another address using a permit signature', () => {
      describe('Then the supply succeeds without requiring ERC20 approval', () => {
        it.todo(`AND the other user's supply positions are updated`);
      });
    });

    describe('When the Reserve allows supplying native tokens', () => {
      describe('AND the user supplies native tokens', () => {
        describe(`Then the use's supply positions are updated`, () => {
          it.todo(`AND should appear in the user's supply positions`);
        });
      });
    });
  });

  describe('Given a user with a more than one supply position', () => {
    describe('When fetching supply positions ordered by', () => {
      it.todo('Then it should return the supply positions ordered by amount');
      it.todo('Then it should return the supply positions ordered by earned');
      it.todo(
        'Then it should return the supply positions ordered by isCollateral',
      );
      it.todo('Then it should return the supply positions ordered by reserve');
    });
  });
});
