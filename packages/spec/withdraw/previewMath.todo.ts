import { describe, it } from 'vitest';

describe('Withdraw Preview Math', () => {
  describe('Given a user with 1 supply position enabled as collateral', () => {
    describe('And the user has 1 borrow position', () => {
      describe('When the user previews a withdraw action removing part of the collateral', () => {
        it.todo('Then the healthFactor should decrease');
        it.todo('Then the riskPremium should remain unchanged');
      });

      describe('When the user previews a withdraw action that exceeds the safety threshold', () => {
        it.todo(
          'Then the healthFactor should be below 1 and flagged as an error',
        );
      });
    });
  });

  describe('Given a user with 2 supply positions enabled as collateral, with different collateralRisk values', () => {
    describe('And the user has 1 borrow position distributed across the borrowing power of both collaterals', () => {
      describe('When the user previews a withdraw action from the collateral with the lower collateralRisk', () => {
        it.todo('Then the healthFactor should decrease');
        it.todo('Then the riskPremium should increase');
      });

      describe('When the user previews a withdraw action from the collateral with the higher collateralRisk', () => {
        it.todo('Then the healthFactor should decrease');
        it.todo('Then the riskPremium should remain unchanged');
      });
    });

    describe('And the user has 1 borrow position that is fully covered by the safest collateral', () => {
      describe('When the user previews a withdraw action from the collateral with the lower collateralRisk', () => {
        it.todo('Then the healthFactor should decrease');
        it.todo('Then the riskPremium should increase');
      });

      describe('When the user previews a withdraw action from the collateral with the higher collateralRisk', () => {
        it.todo('Then the healthFactor should decrease');
        it.todo('Then the riskPremium should remain unchanged');
      });
    });
  });
});
