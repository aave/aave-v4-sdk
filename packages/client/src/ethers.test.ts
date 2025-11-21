import type { TransactionRequest } from '@aave/graphql';
import { assertOk, type BlockchainData, evmAddress } from '@aave/types';
import { JsonRpcProvider, Wallet } from 'ethers';
import { HttpResponse } from 'msw';
import { describe, it } from 'vitest';
import { sendWith } from './ethers';
import { setupRpcInterceptor } from './rpc.helpers';
import {
  ETHEREUM_FORK_ID,
  ETHEREUM_FORK_RPC_URL,
  fundNativeAddress,
} from './test-utils';

async function createNewSigner() {
  const privateKey = Wallet.createRandom().privateKey;

  const provider = new JsonRpcProvider(ETHEREUM_FORK_RPC_URL);
  const signer = new Wallet(privateKey, provider);

  // Fund it
  await fundNativeAddress(evmAddress(await signer.getAddress()));

  return signer;
}

const signer = await createNewSigner();

describe('Given an ethers Signer instance', () => {
  describe(`And the '${sendWith.name}' handler is used to send a TransactionRequest`, () => {
    const request: TransactionRequest = {
      __typename: 'TransactionRequest',
      to: evmAddress(signer.address),
      from: evmAddress(signer.address),
      data: '0x' as BlockchainData,
      value: 0n,
      chainId: ETHEREUM_FORK_ID,
      operations: [],
    };

    describe('When the wallet is on a different chain than the TransactionRequest chain', () => {
      let walletChainId = `0x${(42).toString(16)}`;

      setupRpcInterceptor((request) => {
        switch (request.method) {
          case 'wallet_switchEthereumChain':
            walletChainId = request.params[0].chainId;
            return HttpResponse.json({
              jsonrpc: '2.0',
              id: request.id,
              result: null,
            });

          case 'eth_chainId':
            return HttpResponse.json({
              jsonrpc: '2.0',
              id: request.id,
              result: walletChainId,
            });
        }
        return;
      });

      it('Then it should switch the chain and continue', async () => {
        const result = await sendWith(signer, request);

        assertOk(result);
      });
    });
  });
});
