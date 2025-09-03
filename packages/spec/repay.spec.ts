import { describe, it } from 'vitest';

describe('Aave V4 Repay Scenario', () => {
  describe('Given a user with a borrow position', () => {
    describe('When the user repays their loan', () => {
      it.todo('Then it should be reflected in the user positions');
    });

    describe('When the user repays a partial amount of their loan', () => {
      it.todo('Then it should be reflected in the user positions');
    });

    describe('When the reserve allows repaying in native tokens', () => {
      describe('AND the user repays their loan in native tokens', () => {
        it.todo('Then it should be reflected in the user positions');
      });
    });

    describe('When the user repays a loan with a permit signature', () => {
      it.todo(
        'Then it should allow to repay their own loan without needing for an ERC20 Approval transaction',
      );
    });
  });

  describe('Given an open borrow position', () => {
    describe('When a user repays a full loan amount in behalf of another address', () => {
      it.todo(
        'Then it should be reflected in the positions from the other address',
      );
    });

    describe('When a user repays a loan in behalf of another address with a permit signature', () => {
      it.todo(
        `Then it should be reflected in the other user's borrow positions`,
      );
    });
  });
});
