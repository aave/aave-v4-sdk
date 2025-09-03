import { describe, it } from 'vitest';

describe('Aave V4 Borrow Scenarios', () => {
  describe('GIVEN a user with a supply position as collateral', () => {
    describe('WHEN the user borrows an ERC20 asset', () => {
      it.todo(`THEN the user's borrow positions are updated`);
    });

    describe('WHEN the user borrows from a reserve that supports native borrowing', () => {
      it.todo(`THEN the user's borrow positions are updated`);
    });
  });

  describe('GIVEN a user with a more than one borrow position', () => {
    describe('WHEN fetching borrow positions ordered by', () => {
      it.todo('THEN it should return the borrow positions ordered by balance');
      it.todo('THEN it should return the borrow positions ordered by apy');
      it.todo('THEN it should return the borrow positions ordered by paid');
      it.todo('THEN it should return the borrow positions ordered by name');
    });
  });
});
