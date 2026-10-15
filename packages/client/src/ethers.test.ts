import { CancelError, UnexpectedError } from '@aave/core';
import type { TransactionRequest } from '@aave/graphql';
import { assertErr, type BlockchainData, evmAddress } from '@aave/types';
import { BrowserProvider, type Eip1193Provider, Wallet } from 'ethers';
import { UserRejectedRequestError } from 'viem';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendWith } from './ethers';
import {
  createScriptedWallet,
  ETHEREUM_FORK_ID,
  fundNativeAddress,
  setupEip1193Interceptor,
} from './testing';

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

describe('Given an ethers Signer connected to a Smart Account', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('When the wallet returns an id that never appears on-chain (e.g. Safe mobile safeTxHash)', () => {
    // Update deliberately when ethers support for Smart Accounts lands.
    it('Then sending blocks while ethers polls for the transaction (known limitation, see sc-wallet-txs.md)', async () => {
      const safeTxHash = `0x${'a'.repeat(64)}`;
      const provider = createScriptedWallet({
        eth_chainId: { result: `0x${ETHEREUM_FORK_ID.toString(16)}` },
        eth_accounts: { result: [wallet.address] },
        eth_estimateGas: { result: '0x5208' },
        eth_sendTransaction: { result: safeTxHash },
        eth_getTransactionByHash: { result: null },
        eth_blockNumber: { result: '0x1' },
      });
      const signer = await new BrowserProvider(
        provider as unknown as Eip1193Provider,
      ).getSigner();
      vi.useFakeTimers();

      const request: TransactionRequest = {
        __typename: 'TransactionRequest',
        to: evmAddress(wallet.address),
        from: evmAddress(wallet.address),
        data: '0x' as BlockchainData,
        value: 0n,
        chainId: ETHEREUM_FORK_ID,
        operations: [],
      };

      let settled = false;
      void sendWith(signer, request).then(() => {
        settled = true;
      });
      await vi.advanceTimersByTimeAsync(60_000);

      expect(settled).toBe(false);
      expect(provider.calls('eth_getTransactionByHash')).toBeGreaterThanOrEqual(
        5,
      );
      expect(provider.calls('wallet_getCallsStatus')).toBe(0);
    });
  });
});
