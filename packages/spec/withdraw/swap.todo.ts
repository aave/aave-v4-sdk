import { describe, it } from 'vitest';

describe('Withdraw Position swapping on Aave V4', () => {
  describe('Given a user with a supply position', () => {
    describe('When the user wants to withdraw part of the position in a different token than the one they supplied with a market order', () => {
      it.todo(
        'Then the user should be able withdraw in the new token and the position should be updated',
      );
    });

    describe('When the user wants to withdraw part of the position in a different token than the one they supplied with a limit order', () => {
      it.todo(
        'Then the user should be able to withdraw in the new token and the position should be updated',
      );
    });
  });
});
