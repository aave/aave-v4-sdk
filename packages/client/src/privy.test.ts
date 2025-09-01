import { assertOk, bigDecimal, chainId, evmAddress } from '@aave/types';
import { PrivyClient } from '@privy-io/server-auth';
import { describe, expect, it } from 'vitest';
import { permitTypedData } from './actions';
// import { userSetEmode } from './actions/transactions';
import { signERC20PermitWith } from './privy';
import {
  client,
  ETHEREUM_MARKET_ADDRESS,
  ETHEREUM_USDC_ADDRESS,
} from './test-utils';

const privy = new PrivyClient(
  import.meta.env.PRIVY_TEST_APP_ID,
  import.meta.env.PRIVY_TEST_APP_SECRET,
);

describe('Given a PrivyClient instance', () => {
  describe('When using it to sign an ERC20 permit', () => {
    it('Then it should resolve with the expected EIP712Signature object', async () => {
      const result = await permitTypedData(client, {
        currency: ETHEREUM_USDC_ADDRESS,
        amount: bigDecimal('1'),
        chainId: chainId(1),
        spender: ETHEREUM_MARKET_ADDRESS,
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
