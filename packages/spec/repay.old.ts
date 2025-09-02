import { describe, it } from 'vitest';

describe('Given an Aave Market', () => {
  describe('And a user with a borrow position', () => {
    describe('When the user repays their loan', () => {
      it('Then it should be reflected in the user borrow positions', async () => {
        // TODO: Implement test
      });
    });

    describe('When the user repays a partial amount of their loan', () => {
      it('Then it should be reflected in the user borrow positions', async () => {
        // TODO: Implement test
      });
    });

    describe('And the reserve allows repaying in native tokens', () => {
      describe('When the user repays their loan in native tokens', () => {
        it('Then it should be reflected in the user borrow positions', async () => {
          // TODO: Implement test
        });
      });
    });
  });

  describe('And an open borrow position', () => {
    describe('When a user repays a full loan amount in behalf of another address', () => {
      it('Then it should be reflected in the borrow positions of the other address', async () => {
        // TODO: Implement test
      });
    });

    describe('When a user repays a loan with a permit signature', () => {
      it('Then it should allow to repay their own loan without needing for an ERC20 Approval transaction', async () => {
        // TODO: Implement test
      });
    });

    describe('When a user repays a loan in behalf of another address with a permit signature', () => {
      it(`Then it should be reflected in the other user's borrow positions`, async () => {
        // TODO: Implement test
      });
    });
  });
});
