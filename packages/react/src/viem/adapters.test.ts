import { batchUnavailable } from '@aave/client';
import {
  ETHEREUM_FORK_ID,
  setupEip1193Interceptor,
} from '@aave/client/testing';
import { sendTransaction, signTypedDataWith } from '@aave/client/viem';
import { CancelError, SigningError } from '@aave/core';
import type { TransactionRequest } from '@aave/graphql';
import { makeSwapTypedData } from '@aave/graphql/testing';
import {
  assertErr,
  assertOk,
  type BlockchainData,
  evmAddress,
  okAsync,
  signatureFrom,
  txHash,
} from '@aave/types';
import {
  createWalletClient,
  custom,
  MethodNotSupportedRpcError,
  SwitchChainError,
  UserRejectedRequestError,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PendingTransaction } from '../helpers';
import { renderHookWithinContext } from '../test-utils';
import { useSendCalls, useSendTransaction, useSignTypedData } from './adapters';

vi.mock('@aave/client/viem', async () => {
  const actual =
    await vi.importActual<typeof import('@aave/client/viem')>(
      '@aave/client/viem',
    );

  return {
    ...actual,
    sendTransaction: vi.fn(() => okAsync(txHash(`0x${'0'.repeat(63)}1`))),
    signTypedDataWith: vi.fn(() =>
      okAsync(signatureFrom(`0x${'1'.repeat(130)}`)),
    ),
  };
});

const account = privateKeyToAccount(generatePrivateKey());

describe(`Given the viem's '${useSendTransaction.name}' adapter hook`, () => {
  beforeEach(() => {
    vi.mocked(sendTransaction).mockClear();
  });

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
      expect(sendTransaction).toHaveBeenCalledOnce();
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
      expect(sendTransaction).toHaveBeenCalledOnce();
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
      expect(sendTransaction).not.toHaveBeenCalled();
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
      expect(sendTransaction).not.toHaveBeenCalled();
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
      expect(sendTransaction).not.toHaveBeenCalled();
    });
  });
});

describe(`Given the viem's '${useSignTypedData.name}' adapter hook`, () => {
  beforeEach(() => {
    vi.mocked(signTypedDataWith).mockClear();
  });

  // `makeSwapTypedData` defaults its `domain.chainId` to the devnet fork id, which
  // matches `ETHEREUM_FORK_ID` — the chain this test asserts the wallet switches to.
  const typedData = makeSwapTypedData();

  describe("When the wallet is on a different chain than the typed data's chain", () => {
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

    it('Then it should switch the chain before signing', async () => {
      const { result } = renderHookWithinContext(() =>
        useSignTypedData(wallet),
      );

      const signature = await result.current[0](typedData);

      assertOk(signature);
      expect(walletChainId).toBe(`0x${ETHEREUM_FORK_ID.toString(16)}`);
      expect(signTypedDataWith).toHaveBeenCalledOnce();
    });
  });
});

const FORK_CHAIN_HEX = `0x${ETHEREUM_FORK_ID.toString(16)}`;
const CALLS_HASH = `0x${'ab'.repeat(32)}`;

function walletWithAtomic(
  status: 'supported' | 'ready',
  onSendCalls: (calls: unknown[]) => unknown = () => ({ id: '0xcalls' }),
) {
  const methods: string[] = [];
  const provider = setupEip1193Interceptor((request) => {
    methods.push(request.method);
    const respond = (result: unknown) => ({
      jsonrpc: '2.0' as const,
      id: request.id,
      result,
    });

    const method = request.method as string;
    switch (method) {
      case 'eth_chainId':
        return respond(FORK_CHAIN_HEX);

      case 'wallet_getCapabilities':
        return respond({ [FORK_CHAIN_HEX]: { atomic: { status } } });

      case 'wallet_sendCalls': {
        const [payload] = (request as { params: unknown }).params as [
          { calls: unknown[] },
        ];
        try {
          return respond(onSendCalls(payload.calls));
        } catch (error) {
          return {
            jsonrpc: '2.0' as const,
            id: request.id,
            error: error as { code: number; message: string },
          };
        }
      }

      case 'wallet_getCallsStatus':
        return respond({
          version: '2.0.0',
          id: '0xcalls',
          chainId: FORK_CHAIN_HEX,
          atomic: true,
          status: 200,
          receipts: [
            {
              logs: [],
              status: '0x1',
              blockHash: `0x${'cd'.repeat(32)}`,
              blockNumber: '0x1',
              gasUsed: '0x1',
              transactionHash: CALLS_HASH,
            },
          ],
        });
    }
    return;
  });

  const address = evmAddress('0x1111111111111111111111111111111111111111');
  const wallet = createWalletClient({
    account: address,
    transport: custom(provider),
    pollingInterval: 1,
  });

  const call: TransactionRequest = {
    __typename: 'TransactionRequest',
    to: evmAddress('0x2222222222222222222222222222222222222222'),
    from: address,
    data: '0x' as BlockchainData,
    value: 0n,
    chainId: ETHEREUM_FORK_ID,
    operations: [],
  };

  return { wallet, methods, call };
}

describe(`Given the viem's '${useSendTransaction.name}' adapter hook and an EIP-5792 wallet`, () => {
  beforeEach(() => {
    vi.mocked(sendTransaction).mockClear();
  });

  describe("When the wallet reports atomic: 'supported'", () => {
    it('Then it should send via wallet_sendCalls and wait on the calls status', async () => {
      const { wallet, methods, call } = walletWithAtomic('supported');
      const { result } = renderHookWithinContext(() =>
        useSendTransaction(wallet),
      );

      const tx = await result.current[0](call);

      assertOk(tx);
      expect(sendTransaction).not.toHaveBeenCalled();
      expect(methods.filter((m) => m === 'wallet_sendCalls')).toHaveLength(1);

      const receipt = await tx.value.wait();
      assertOk(receipt);
      expect(receipt.value.txHash).toBe(CALLS_HASH);
    });
  });

  describe("When the wallet reports atomic: 'ready'", () => {
    it('Then it should keep the legacy eth_sendTransaction path', async () => {
      const { wallet, methods, call } = walletWithAtomic('ready');
      const { result } = renderHookWithinContext(() =>
        useSendTransaction(wallet),
      );

      const tx = await result.current[0](call);

      assertOk(tx);
      expect(sendTransaction).toHaveBeenCalledOnce();
      expect(methods).not.toContain('wallet_sendCalls');
    });
  });

  describe('When the wallet client has a local account', () => {
    it('Then it should not probe the wallet capabilities', async () => {
      const methods: string[] = [];
      const provider = setupEip1193Interceptor((request) => {
        methods.push(request.method);
        if (request.method === 'eth_chainId') {
          return { jsonrpc: '2.0', id: request.id, result: FORK_CHAIN_HEX };
        }
        return;
      });
      const wallet = createWalletClient({
        account,
        transport: custom(provider),
      });
      const { result } = renderHookWithinContext(() =>
        useSendTransaction(wallet),
      );

      const tx = await result.current[0]({
        __typename: 'TransactionRequest',
        to: evmAddress(account.address),
        from: evmAddress(account.address),
        data: '0x' as BlockchainData,
        value: 0n,
        chainId: ETHEREUM_FORK_ID,
        operations: [],
      });

      assertOk(tx);
      expect(methods).not.toContain('wallet_getCapabilities');
      expect(sendTransaction).toHaveBeenCalledOnce();
    });
  });
});

describe(`Given the viem's '${useSendCalls.name}' adapter hook`, () => {
  it("Then it should report support only when the wallet reports atomic: 'supported'", async () => {
    const supported = walletWithAtomic('supported');
    const ready = walletWithAtomic('ready');

    const { result: a } = renderHookWithinContext(() =>
      useSendCalls(supported.wallet),
    );
    const { result: b } = renderHookWithinContext(() =>
      useSendCalls(ready.wallet),
    );

    const yes = await a.current.supports(ETHEREUM_FORK_ID);
    const no = await b.current.supports(ETHEREUM_FORK_ID);

    assertOk(yes);
    assertOk(no);
    expect(yes.value).toBe(true);
    expect(no.value).toBe(false);
  });

  it('Then it should send a BatchRequest atomically and return a PendingTransaction', async () => {
    const { wallet, call } = walletWithAtomic('supported');
    const { result } = renderHookWithinContext(() => useSendCalls(wallet));

    const sent = await result.current.send({
      __typename: 'BatchRequest',
      requests: [call, call],
    });

    assertOk(sent);
    expect(sent.value).toBeInstanceOf(PendingTransaction);
  });

  it('Then it should resolve to BatchUnavailable when the wallet cannot execute the batch atomically', async () => {
    const { wallet, call } = walletWithAtomic('supported', () => {
      throw { code: 5760, message: 'Atomicity not supported' };
    });
    const { result } = renderHookWithinContext(() => useSendCalls(wallet));

    const sent = await result.current.send({
      __typename: 'BatchRequest',
      requests: [call, call],
    });

    assertOk(sent);
    expect(sent.value).toBe(batchUnavailable);
  });
});
