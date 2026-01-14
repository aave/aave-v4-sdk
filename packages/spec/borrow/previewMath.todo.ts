import { describe, it } from 'vitest';

describe('Borrow Preview Math', () => {
  describe('Given a user with 1 supply position enabled as collateral', () => {
    describe('And the collateral is a safe token with collateralRisk = 0', () => {
      describe('When the user previews a borrow action', () => {
        // Call the contract method to check the current healthFactor and riskPremium
        it.todo(
          'Then the healthFactor should change from null to a value higher than 1',
        );
        it.todo('Then the riskPremium should be 0');
      });

      describe('And the user has 1 borrow position', () => {
        describe('When the user previews a borrow action adding more debt', () => {
          it.todo('Then the healthFactor should decrease');
          it.todo('Then the riskPremium should be 0');
        });
      });
    });

    describe('And the collateral is a risky token with collateralRisk > 0', () => {
      describe('When the user previews a borrow action', () => {
        it.todo(
          'Then the healthFactor should change from null to a value higher than 1',
        );
        it.todo('Then the riskPremium should be greater than 0');
      });

      describe('And the user has 1 borrow position', () => {
        describe('When the user previews a borrow action adding more debt', () => {
          it.todo('Then the healthFactor should decrease');
          it.todo('Then the riskPremium should be higher');
        });
      });
    });

    describe('When the user previews a borrow action that exceeds the borrowing power', () => {
      it.todo(
        'Then the healthFactor should be below 1 and flagged as an error',
      );
    });
  });
});
