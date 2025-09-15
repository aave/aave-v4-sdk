import { assertOk, bigDecimal, chainId, evmAddress } from '@aave/types-next';
import { createThirdwebClient } from 'thirdweb';
import { describe, expect, it } from 'vitest';
import { permitTypedData } from './actions';
import { client, ETHEREUM_USDC_ADDRESS } from './test-utils';
import { signERC20PermitWith } from './thirdweb';

const thirdwebClient = createThirdwebClient({
  secretKey: import.meta.env.THIRDWEB_TEST_SECRET_KEY,
});

describe('Given a ThirdwebClient instance', () => {
  describe('When using it to send Aave v4 transactions', () => {
    it.todo('Then it should work as expected', async () => {
      // const result = await action(...).andThen(sendWith(thirdwebClient));
      // assertOk(result);
    });
  });

  describe('When using it to sign an ERC20 permit', () => {
    it('Then it should resolve with the expected EIP712Signature object', async () => {
      const result = await permitTypedData(client, {
        currency: ETHEREUM_USDC_ADDRESS,
        amount: bigDecimal('1'),
        chainId: chainId(1),
        spender: evmAddress('0x0000000000000000000000000000000000000000'),
        owner: evmAddress(import.meta.env.THIRDWEB_TEST_WALLET_ADDRESS),
      }).andThen(signERC20PermitWith(thirdwebClient));

      assertOk(result);
      expect(result.value).toEqual({
        deadline: expect.any(Number),
        value: expect.toBeHexString(),
      });
    });
  });
});
