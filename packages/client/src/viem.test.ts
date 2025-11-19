import { CancelError, SigningError } from '@aave/core';
import type { TransactionRequest } from '@aave/graphql';
import {
  assertErr,
  assertOk,
  type BlockchainData,
  evmAddress,
} from '@aave/types';
import { HttpResponse } from 'msw';
import {
  MethodNotSupportedRpcError,
  SwitchChainError,
  UserRejectedRequestError,
} from 'viem';
import { describe, expect, it } from 'vitest';
import { setupRpcInterceptor } from './rpc.helpers';
import { createNewWallet, ETHEREUM_FORK_ID } from './test-utils';
import { sendWith } from './viem';

const walletClient = await createNewWallet();

describe(`Given a viem's WalletClient instance`, () => {
  describe(`And the '${sendWith.name}' handler is used to send a TransactionRequest`, () => {
    const request: TransactionRequest = {
      __typename: 'TransactionRequest',
      to: evmAddress(walletClient.account.address),
      from: evmAddress(walletClient.account.address),
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
        const result = await sendWith(walletClient, request);

        assertOk(result);
      });
    });

    describe('When the wallet does not support the TransactionRequest chain', () => {
      let walletChainId = `0x${(42).toString(16)}`;

      setupRpcInterceptor((request) => {
        switch (request.method) {
          case 'wallet_switchEthereumChain':
            return HttpResponse.json({
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: SwitchChainError.code,
                message: 'Unrecognized chain ID',
              },
            });

          case 'wallet_addEthereumChain':
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

      it('Then it should add the chain to the wallet and continue', async () => {
        const result = await sendWith(walletClient, request);

        assertOk(result);
      });
    });

    describe('When the wallet fails to add the chain to the wallet', () => {
      setupRpcInterceptor((request) => {
        switch (request.method) {
          case 'wallet_switchEthereumChain':
            return HttpResponse.json({
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: SwitchChainError.code,
                message: 'Unrecognized chain ID',
              },
            });

          case 'wallet_addEthereumChain':
            return HttpResponse.json({
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: MethodNotSupportedRpcError.code,
                message: 'Resource not available',
              },
            });

          case 'eth_chainId':
            return HttpResponse.json({
              jsonrpc: '2.0',
              id: request.id,
              result: `0x${(42).toString(16)}`,
            });
        }
        return;
      });

      it('Then it should fail with a SigningError', async () => {
        const result = await sendWith(walletClient, request);

        assertErr(result);
        expect(result.error).toBeInstanceOf(SigningError);
      });
    });

    describe('When the user rejects the add chain request in their wallet', () => {
      setupRpcInterceptor((request) => {
        switch (request.method) {
          case 'wallet_switchEthereumChain':
            return HttpResponse.json({
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: SwitchChainError.code,
                message: 'Unrecognized chain ID',
              },
            });

          case 'wallet_addEthereumChain':
            return HttpResponse.json({
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: UserRejectedRequestError.code,
                message: 'User rejected the request.',
              },
            });

          case 'eth_chainId':
            return HttpResponse.json({
              jsonrpc: '2.0',
              id: request.id,
              result: `0x${(42).toString(16)}`,
            });
        }
        return;
      });

      it('Then it should fail with a CancelError', async () => {
        const result = await sendWith(walletClient, request);

        assertErr(result);
        expect(result.error).toBeInstanceOf(CancelError);
      });
    });

    describe(`When the wallet does not support 'wallet_switchEthereumChain'`, () => {
      setupRpcInterceptor((request) => {
        switch (request.method) {
          case 'wallet_switchEthereumChain':
            return HttpResponse.json({
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: MethodNotSupportedRpcError.code,
                message: 'method wallet_switchEthereumChain not supported',
              },
            });

          case 'eth_chainId':
            return HttpResponse.json({
              jsonrpc: '2.0',
              id: request.id,
              result: `0x${(42).toString(16)}`,
            });
        }
        return;
      });

      it('Then it should fail with a SigningError', async () => {
        const result = await sendWith(walletClient, request);

        assertErr(result);
        expect(result.error).toBeInstanceOf(SigningError);
      });
    });
  });
});
