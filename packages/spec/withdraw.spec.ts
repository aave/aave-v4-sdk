import { describe, it } from 'vitest';

describe('Aave V4 Withdraw Scenario', () => {
  describe('GIVEN a user with a supply position', () => {
    describe('WHEN the user withdraws part of their supply', () => {
      it.todo('THEN it should be reflected in the user supply positions');
    });

    describe('WHEN the user withdraws all of their supply', () => {
      it.todo('THEN it should be reflected in the user supply positions');
    });

    describe.skip('WHEN the user withdraws tokens with a permit signature', () => {
      it.todo(
        'THEN it should allow to withdraw tokens without needing for an ERC20 Approval transaction on the aToken',
      );
    });

    describe('WHEN the user withdraws tokens specifying another address', () => {
      it.todo(
        `THEN it should be reflected in the user's supply positions and the other address should receive the tokens`,
      );
    });

    describe.skip('WHEN the user withdraws tokens specifying another address with a permit signature', () => {
      it.todo(
        'THEN the user should receive the tokens and it should be reflected in their supply positions',
      );
    });
  });

  describe('GIVEN a user with a supply position in a reserve that allows withdrawals in native tokens', () => {
    describe('WHEN the user withdraws from the reserve in native tokens', () => {
      it.todo('THEN the user should receive the amount in native tokens');
    });
  });
});
