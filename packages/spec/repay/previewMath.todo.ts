import { describe, it } from 'vitest';

describe('Repay Preview Math', () => {
  describe('Given a user with 1 supply position enabled as collateral', () => {
    describe('And the collateral has collateralRisk > 0', () => {
      describe('And the user has 1 borrow position', () => {
        describe('When the user previews a repay action repaying part of the debt', () => {
          it.todo('Then the healthFactor should increase');
          it.todo('Then the riskPremium should remain unchanged');
        });

        describe('When the user previews a repay action repaying the full debt', () => {
          it.todo('Then the healthFactor should become null');
          it.todo('Then the riskPremium should be 0');
        });
      });

      describe('And the user has 2 borrow positions', () => {
        describe('When the user previews a repay action repaying one of the borrow positions', () => {
          it.todo('Then the healthFactor should increase');
          it.todo('Then the riskPremium should remain unchanged');
        });
      });
    });
  });
});
