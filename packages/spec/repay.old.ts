import { describe, it } from 'vitest';

describe('Aave V4 Repay Scenario', () => {
  describe('GIVEN a user with a borrow position', () => {
    describe('WHEN the user repays their loan', () => {
      it.todo('THEN it should be reflected in the user positions');
    });

    describe('WHEN the user repays a partial amount of their loan', () => {
      it.todo('THEN it should be reflected in the user positions');
    });

    describe('WHEN the reserve allows repaying in native tokens', () => {
      describe('AND the user repays their loan in native tokens', () => {
        it.todo('THEN it should be reflected in the user positions');
      });
    });

    describe('WHEN the user repays a loan with a permit signature', () => {
      it.todo(
        'THEN it should allow to repay their own loan without needing for an ERC20 Approval transaction',
      );
    });
  });

  describe('GIVEN an open borrow position', () => {
    describe('WHEN a user repays a full loan amount in behalf of another address', () => {
      it.todo(
        'THEN it should be reflected in the positions from the other address',
      );
    });

    describe('When a user repays a loan in behalf of another address with a permit signature', () => {
      it(`Then it should be reflected in the other user's borrow positions`, async () => {
        // TODO: Implement test
      });
    });
  });
});
