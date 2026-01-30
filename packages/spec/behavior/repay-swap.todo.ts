import { describe, it } from 'vitest';

describe('Repay Position swapping on Aave V4', () => {
  describe('Given a user with a supply position enabled as collateral', () => {
    describe('And the user has a borrow position', () => {
      describe('And the user has another supply position in a different token than the borrowed one', () => {
        describe('When the user repays part of the borrow position using the other supply position using a market order', () => {
          it.todo(
            'Then the repayment should succeed and both positions should be updated',
          );
        });

        describe('When the user repays part of the borrow position using the other supply position with a limit order', () => {
          it.todo(
            'Then the repayment should succeed and both positions should be updated',
          );
        });
      });
    });
  });
});
