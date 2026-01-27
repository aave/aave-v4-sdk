import { describe, it } from 'vitest';

describe('Borrow Position swapping on Aave V4', () => {
  describe('Given a user with a supply position enabled as collateral', () => {
    describe('And the user has a borrow position', () => {
      describe('When the user wants to swap part of the borrow position in a different token than the one they borrowed with a market order', () => {
        it.todo(
          'Then the user should be able to swap and the position should be updated',
        );
      });

      describe('When the user wants to swap part of the borrow position in a different token than the one they borrowed with a limit order', () => {
        it.todo(
          'Then the user should be able to swap and the position should be updated',
        );
      });
    });
  });
});
