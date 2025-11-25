import { CancelError, UnexpectedError } from '@aave/core';
import type { TransactionRequest } from '@aave/graphql';
import { assertErr, type BlockchainData, evmAddress } from '@aave/types';
import { BrowserProvider, type Eip1193Provider, Wallet } from 'ethers';
import { UserRejectedRequestError } from 'viem';
import { describe, expect, it } from 'vitest';
import { sendWith } from './ethers';
import { setupEip1193Interceptor } from './rpc.helpers';
import { ETHEREUM_FORK_ID, fundNativeAddress } from './test-utils';

const wallet = Wallet.createRandom();

async function createNewSigner(windowEthereum: Eip1193Provider) {
  const provider = new BrowserProvider(windowEthereum);
  const signer = await provider.getSigner();

  // Fund it
  await fundNativeAddress(evmAddress(wallet.address));

  return signer;
}

describe('Given an ethers Signer instance', () => {
  describe(`And the '${sendWith.name}' handler is used to send a TransactionRequest`, () => {
    const request: TransactionRequest = {
      __typename: 'TransactionRequest',
      to: evmAddress(wallet.address),
      from: evmAddress(wallet.address),
      data: '0x' as BlockchainData,
      value: 0n,
      chainId: ETHEREUM_FORK_ID,
      operations: [],
    };

    describe('When the wallet is on a different chain than the TransactionRequest chain', () => {
      const provider = setupEip1193Interceptor((request) => {
        switch (request.method) {
          case 'eth_chainId':
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: `0x${(42).toString(16)}`,
            };
        }
        return;
      });

      it('Then it fail with an UnexpectedError', async () => {
        const signer = await createNewSigner(provider);

        const result = await sendWith(signer, request);

        assertErr(result);
        expect(result.error).toBeInstanceOf(UnexpectedError);
      });
    });

    describe('When the user rejects the signing request', () => {
      const provider = setupEip1193Interceptor((request) => {
        switch (request.method) {
          case 'eth_chainId':
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: `0x${(ETHEREUM_FORK_ID).toString(16)}`,
            };

          case 'eth_accounts':
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: [wallet.address],
            };

          case 'eth_sendTransaction':
            return {
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: UserRejectedRequestError.code,
                message: 'User rejected the request.',
              },
            };
        }
        return;
      });

      it('Then it should fail with a CancelError', async () => {
        const signer = await createNewSigner(provider);

        const result = await sendWith(signer, request);

        assertErr(result);
        expect(result.error).toBeInstanceOf(CancelError);
      });
    });
  });
});
