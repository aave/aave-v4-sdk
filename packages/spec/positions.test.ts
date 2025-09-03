import { describe, it } from 'vitest';

describe('Aave V4 Positions Scenario', () => {
  describe('GIVEN a user with more than one supply/borrow positions', () => {
    describe('WHEN fetching a specific position', () => {
      it.todo('THEN it should return the position details');
    });

    describe('WHEN fetching positions ordered by', () => {
      it.todo('Then it should return the positions ordered by balance');
      it.todo('Then it should return the positions ordered by apy');
      it.todo('Then it should return the positions ordered by healthFactor');
      it.todo('Then it should return the positions ordered by created');
      it.todo('Then it should return the positions ordered by netCollateral');
    });
  });
});
