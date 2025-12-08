import {
  ETHEREUM_FORK_ID,
  fundNativeAddress,
  setupEip1193Interceptor,
} from '@aave/client/testing';
import { CancelError, SigningError } from '@aave/core';
import type { TransactionRequest } from '@aave/graphql';
import {
  assertErr,
  assertOk,
  type BlockchainData,
  evmAddress,
} from '@aave/types';
import {
  createWalletClient,
  custom,
  MethodNotSupportedRpcError,
  SwitchChainError,
  UserRejectedRequestError,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { describe, expect, it } from 'vitest';
import { renderHookWithinContext } from '../test-utils';
import { useSendTransaction } from './adapters';

const account = privateKeyToAccount(generatePrivateKey());
await fundNativeAddress(evmAddress(account.address));

describe(`Given the viem's '${useSendTransaction.name}' adapter hook`, () => {
  const request: TransactionRequest = {
    __typename: 'TransactionRequest',
    to: evmAddress(account.address),
    from: evmAddress(account.address),
    data: '0x' as BlockchainData,
    value: 0n,
    chainId: ETHEREUM_FORK_ID,
    operations: [],
  };

  describe('When the wallet is on a different chain than the TransactionRequest chain', () => {
    let walletChainId = `0x${(42).toString(16)}`;

    const provider = setupEip1193Interceptor((request) => {
      switch (request.method) {
        case 'wallet_switchEthereumChain':
          walletChainId = request.params[0].chainId;
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: null,
          };

        case 'eth_chainId':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: walletChainId,
          };
      }
      return;
    });

    const wallet = createWalletClient({
      account,
      transport: custom(provider),
    });

    it('Then it should switch the chain and continue', async () => {
      const { result } = renderHookWithinContext(() =>
        useSendTransaction(wallet),
      );

      const tx = await result.current[0](request);

      assertOk(tx);
    });
  });

  describe('When the wallet does not support the TransactionRequest chain', () => {
    let walletChainId = `0x${(42).toString(16)}`;

    const provider = setupEip1193Interceptor((request) => {
      switch (request.method) {
        case 'wallet_switchEthereumChain':
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: SwitchChainError.code,
              message: 'Unrecognized chain ID',
            },
          };

        case 'wallet_addEthereumChain':
          walletChainId = request.params[0].chainId;
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: null,
          };

        case 'eth_chainId':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: walletChainId,
          };
      }
      return;
    });

    const wallet = createWalletClient({
      account,
      transport: custom(provider),
    });

    it('Then it should add the chain to the wallet and continue', async () => {
      const { result } = renderHookWithinContext(() =>
        useSendTransaction(wallet),
      );

      const tx = await result.current[0](request);

      assertOk(tx);
    });
  });

  describe('When the wallet fails to add the chain to the wallet', () => {
    const provider = setupEip1193Interceptor((request) => {
      switch (request.method) {
        case 'wallet_switchEthereumChain':
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: SwitchChainError.code,
              message: 'Unrecognized chain ID',
            },
          };

        case 'wallet_addEthereumChain':
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: MethodNotSupportedRpcError.code,
              message: 'Resource not available',
            },
          };

        case 'eth_chainId':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: `0x${(42).toString(16)}`,
          };
      }
      return;
    });

    const wallet = createWalletClient({
      transport: custom(provider),
    });

    it('Then it should fail with a SigningError', async () => {
      const { result } = renderHookWithinContext(() =>
        useSendTransaction(wallet),
      );

      const tx = await result.current[0](request);

      assertErr(tx);
      expect(tx.error).toBeInstanceOf(SigningError);
    });
  });

  describe('When the user rejects the add chain request in their wallet', () => {
    const provider = setupEip1193Interceptor((request) => {
      switch (request.method) {
        case 'wallet_switchEthereumChain':
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: SwitchChainError.code,
              message: 'Unrecognized chain ID',
            },
          };

        case 'wallet_addEthereumChain':
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: UserRejectedRequestError.code,
              message: 'User rejected the request.',
            },
          };

        case 'eth_chainId':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: `0x${(42).toString(16)}`,
          };
      }
      return;
    });

    const wallet = createWalletClient({
      transport: custom(provider),
    });

    it('Then it should fail with a CancelError', async () => {
      const { result } = renderHookWithinContext(() =>
        useSendTransaction(wallet),
      );

      const tx = await result.current[0](request);

      assertErr(tx);
      expect(tx.error).toBeInstanceOf(CancelError);
    });
  });

  describe(`When the wallet does not support 'wallet_switchEthereumChain'`, () => {
    const provider = setupEip1193Interceptor((request) => {
      switch (request.method) {
        case 'wallet_switchEthereumChain':
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: MethodNotSupportedRpcError.code,
              message: 'method wallet_switchEthereumChain not supported',
            },
          };

        case 'eth_chainId':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: `0x${(42).toString(16)}`,
          };
      }
      return;
    });

    const wallet = createWalletClient({
      transport: custom(provider),
    });

    it('Then it should fail with a SigningError', async () => {
      const { result } = renderHookWithinContext(() =>
        useSendTransaction(wallet),
      );

      const tx = await result.current[0](request);

      assertErr(tx);
      expect(tx.error).toBeInstanceOf(SigningError);
    });
  });
});
