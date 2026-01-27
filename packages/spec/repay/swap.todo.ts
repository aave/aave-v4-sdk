import { describe, it } from 'vitest';

describe('Repay Position swapping on Aave V4', () => {
  describe('Given a user with a supply position enabled as collateral', () => {
    describe('And the user has a borrow position', () => {
      describe('When the user wants to repay part of the borrow position in a different token than the one they borrowed with a market order', () => {
        it.todo(
          'Then the user should be able to repay and the position should be updated',
        );
      });

      describe('When the user wants to repay part of the borrow position in a different token than the one they borrowed with a limit order', () => {
        it.todo(
          'Then the user should be able to repay and the position should be updated',
        );
      });

      describe('And the user has another supply position with a different token as the borrowed', () => {
        describe('When the user wants to repay part of the borrow position with the previous supply position with a market order', () => {
          it.todo(
            'Then the user should be able to repay and the position should be updated',
          );
        });

        describe('When the user wants to repay part of the borrow position with the previous supply position with a limit order', () => {
          it.todo(
            'Then the user should be able to repay and the position should be updated',
          );
        });
      });
    });
  });
});
