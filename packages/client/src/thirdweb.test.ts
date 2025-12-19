import type { TransactionRequest } from '@aave/graphql';
import {
  assertOk,
  type BlockchainData,
  chainId,
  evmAddress,
} from '@aave/types';
import { createThirdwebClient } from 'thirdweb';
import { describe, it } from 'vitest';
import { client } from './testing';
import { sendWith } from './thirdweb';

const thirdwebClient = createThirdwebClient({
  secretKey: import.meta.env.THIRDWEB_TEST_SECRET_KEY,
});

describe('Given a ThirdwebClient instance', () => {
  describe('When using the `sendWith` helper', () => {
    // using sepolia cause thirdweb Engine doesn't support custom chain RPCs
    // this is a good enough way to test the sendWith helper
    const request: TransactionRequest = {
      __typename: 'TransactionRequest',
      chainId: chainId(11155111),
      to: evmAddress(import.meta.env.THIRDWEB_TEST_WALLET_ADDRESS),
      from: evmAddress(import.meta.env.THIRDWEB_TEST_WALLET_ADDRESS),
      data: '0x' as BlockchainData,
      value: 0n,
      operations: [],
    };

    it('Then it should work as expected', async () => {
      const result = await sendWith(client, thirdwebClient, request);

      assertOk(result);
    });
  });
});
