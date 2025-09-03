import { describe, it } from 'vitest';

describe('Aave V4 Borrow Scenarios', () => {
  describe('Given a user with a supply position as collateral', () => {
    describe('When the user borrows an ERC20 asset', () => {
      it.todo(`Then the user's borrow positions are updated`);
    });

    describe('When the user borrows from a reserve that supports native borrowing', () => {
      it.todo(`Then the user's borrow positions are updated`);
    });
  });

  describe('Given a user with a more than one borrow position', () => {
    describe('When fetching borrow positions ordered by', () => {
      it.todo('Then it should return the borrow positions ordered by balance');
      it.todo('Then it should return the borrow positions ordered by apy');
      it.todo('Then it should return the borrow positions ordered by paid');
      it.todo('Then it should return the borrow positions ordered by name');
    });
  });
});
