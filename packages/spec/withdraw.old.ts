import { describe, it } from 'vitest';

describe('Given an Aave Market', () => {
  describe('And a user with a supply position', () => {
    describe('When the user withdraws part of their supply', () => {
      it('Then it should be reflected in the user supply positions', async () => {
        // TODO: Implement test
      });
    });

    describe('When the user withdraws all of their supply', () => {
      it('Then it should be reflected in the user supply positions', async () => {
        // TODO: Implement test
      });
    });
  });

  describe('And a user with a supply position', () => {
    describe('When the user withdraws tokens specifying another address', () => {
      it(`Then it should be reflected in the user's supply positions and the other address should receive the tokens`, async () => {
        // TODO: Implement test
      });
    });

    describe.skip('When the user withdraws tokens specifying another address with a permit signature', () => {
      it('Then the user should receive the tokens and it should be reflected in their supply positions', async () => {
        // TODO: Only possible to test with WETH reserve and the reserve is not supporting `permit`
      });
    });

    describe.skip('When the user withdraws tokens with a permit signature', () => {
      it('Then it should allow to withdraw tokens without needing for an ERC20 Approval transaction on the aToken', async () => {
        // TODO: Only possible to test with WETH reserve and the reserve is not supporting `permit`
      });
    });
  });

  describe('And the reserve allows withdrawals in native tokens', () => {
    describe('When the user withdraws from the reserve in native tokens', () => {
      it('Then the user should receive the amount in native tokens', async () => {
        // TODO: Implement test
      });
    });
  });
});
