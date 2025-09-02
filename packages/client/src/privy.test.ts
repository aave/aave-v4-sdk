import { assertOk, bigDecimal, chainId, evmAddress } from '@aave/types';
import { PrivyClient } from '@privy-io/server-auth';
import { describe, expect, it } from 'vitest';
import { permitTypedData } from './actions';
import { signERC20PermitWith } from './privy';
import { client, ETHEREUM_USDC_ADDRESS } from './test-utils';

const privy = new PrivyClient(
  import.meta.env.PRIVY_TEST_APP_ID,
  import.meta.env.PRIVY_TEST_APP_SECRET,
);

describe('Given a PrivyClient instance', () => {
  // TODO: Add a test for privy
  describe('When using it to send Aave v3 transactions', () => {
    it.todo(
      'Then it should work as expected (within current testability constraints)',
      async () => {
        // const result = await action(...).andThen(sendWith(privy, import.meta.env.PRIVY_TEST_WALLET_ID));
        // At this stage we are happy we can attempt to send a transaction, this can be improved later
        // assertErr(true);
        // assertOk(true);
      },
    );
  });

  describe('When using it to sign an ERC20 permit', () => {
    it('Then it should resolve with the expected EIP712Signature object', async () => {
      const result = await permitTypedData(client, {
        currency: ETHEREUM_USDC_ADDRESS,
        amount: bigDecimal('1'),
        chainId: chainId(1),
        spender: evmAddress('0x0000000000000000000000000000000000000000'),,
        owner: evmAddress('0x0000000000000000000000000000000000000000'),
      }).andThen(
        signERC20PermitWith(privy, import.meta.env.PRIVY_TEST_WALLET_ID),
      );

      assertOk(result);
      expect(result.value).toEqual({
        deadline: expect.any(Number),
        value: expect.toBeHexString(),
      });
    });
  });
});
