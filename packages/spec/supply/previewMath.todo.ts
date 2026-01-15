import { describe, it } from 'vitest';

describe('Supply Preview Math', () => {
  describe('Given a user with 1 supply position enabled as collateral', () => {
    describe('And the user has 1 borrow position', () => {
      describe('When the user previews a supply action adding more collateral to the same position', () => {
        it.todo('Then the healthFactor should increase');
        it.todo('Then the riskPremium should remain unchanged');
      });

      describe('When the user previews a supply action to a different reserve without enabling it as collateral', () => {
        it.todo('Then the healthFactor should remain unchanged');
        it.todo('Then the riskPremium should remain unchanged');
      });

      describe('And the user has another supply position that is not enabled as collateral', () => {
        describe('When the user previews a supply action to that position without enabling it as collateral', () => {
          it.todo('Then the healthFactor should remain unchanged');
          it.todo('Then the riskPremium should remain unchanged');
        });

        describe('When the user previews a supply action to that position and enables it as collateral', () => {
          it.todo('Then the healthFactor should increase');
          it.todo('Then the riskPremium should remain unchanged');
        });
      });
    });
  });
});
