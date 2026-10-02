import {
  CancelError,
  SigningError,
  TimeoutError,
  TransactionError,
  UnexpectedError,
} from '@aave/core';
import type { TransactionRequest } from '@aave/graphql';
import {
  assertErr,
  assertOk,
  type BlockchainData,
  chainId,
  evmAddress,
} from '@aave/types';
import { createWalletClient, custom, type WalletClient } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { describe, expect, it, vi } from 'vitest';
import {
  type CallsId,
  decodeFallbackCallsId,
  getWalletCapabilities,
  sendCalls,
  waitForCallsResult,
} from './eip5792';
import { batchUnavailable } from './types';

const ADDRESS = '0x1111111111111111111111111111111111111111';
const OTHER = '0x2222222222222222222222222222222222222222';
const CHAIN = chainId(8453);
const HASH = `0x${'ab'.repeat(32)}`;
const MAGIC = '5792'.repeat(16);

type Handler = (method: string, params: unknown) => unknown;

function rpcError(code: number, message = 'error') {
  return Object.assign(new Error(message), { code });
}

function walletWith(handler: Handler): {
  wallet: WalletClient;
  request: ReturnType<typeof vi.fn>;
} {
  const request = vi.fn(async ({ method, params }) => handler(method, params));
  const wallet = createWalletClient({
    account: ADDRESS,
    transport: custom({ request }),
    pollingInterval: 1,
  });
  return { wallet, request };
}

function txRequest(
  overrides: Partial<TransactionRequest> = {},
): TransactionRequest {
  return {
    __typename: 'TransactionRequest',
    to: evmAddress(OTHER),
    from: evmAddress(ADDRESS),
    data: '0x1234' as BlockchainData,
    value: 0n,
    chainId: CHAIN,
    operations: [],
    ...overrides,
  };
}

function receipt(status: '0x1' | '0x0' = '0x1', hash = HASH) {
  return {
    logs: [],
    status,
    blockHash: `0x${'cd'.repeat(32)}`,
    blockNumber: '0x1',
    gasUsed: '0x1',
    transactionHash: hash,
  };
}

function callsStatus(status: number, receipts?: unknown[]) {
  return {
    version: '2.0.0',
    id: '0x01',
    chainId: `0x${CHAIN.toString(16)}`,
    atomic: true,
    status,
    receipts,
  };
}

function methodsCalled(request: ReturnType<typeof vi.fn>, method: string) {
  return request.mock.calls.filter(([args]) => args.method === method).length;
}

describe('Given the EIP-5792 helpers', () => {
  describe(`When probing capabilities with '${getWalletCapabilities.name}'`, () => {
    it('Then a local account resolves to unsupported without a wallet request', async () => {
      const request = vi.fn();
      const wallet = createWalletClient({
        account: privateKeyToAccount(generatePrivateKey()),
        transport: custom({ request }),
      });

      const result = await getWalletCapabilities(wallet, CHAIN);

      assertOk(result);
      expect(result.value.atomic).toBe('unsupported');
      expect(request).not.toHaveBeenCalled();
    });

    it('Then it reads the chain entry, falling back to the all-chains entry', async () => {
      const { wallet } = walletWith(() => ({
        '0x0': { atomic: { status: 'ready' } },
        [`0x${CHAIN.toString(16)}`]: { atomic: { status: 'supported' } },
      }));

      const onChain = await getWalletCapabilities(wallet, CHAIN);
      const elsewhere = await getWalletCapabilities(wallet, chainId(1));

      assertOk(onChain);
      assertOk(elsewhere);
      expect(onChain.value.atomic).toBe('supported');
      expect(elsewhere.value.atomic).toBe('ready');
    });

    it('Then a successful response is cached per wallet client and account', async () => {
      const { wallet, request } = walletWith(() => ({
        [`0x${CHAIN.toString(16)}`]: { atomic: { status: 'supported' } },
      }));

      await getWalletCapabilities(wallet, CHAIN);
      await getWalletCapabilities(wallet, CHAIN);

      expect(methodsCalled(request, 'wallet_getCapabilities')).toBe(1);
    });

    it('Then a definitive "method not found" is cached as unsupported', async () => {
      const { wallet, request } = walletWith(() => {
        throw rpcError(-32601, 'Method not found');
      });

      const first = await getWalletCapabilities(wallet, CHAIN);
      await getWalletCapabilities(wallet, CHAIN);

      assertOk(first);
      expect(first.value.atomic).toBe('unsupported');
      expect(methodsCalled(request, 'wallet_getCapabilities')).toBe(1);
    });

    it('Then a transient error resolves to unsupported but is not cached', async () => {
      const { wallet, request } = walletWith(() => {
        throw new Error('socket hang up');
      });

      const first = await getWalletCapabilities(wallet, CHAIN);
      // viem's transport retries a transport error itself before giving up.
      const afterFirst = methodsCalled(request, 'wallet_getCapabilities');
      await getWalletCapabilities(wallet, CHAIN);

      assertOk(first);
      expect(first.value.atomic).toBe('unsupported');
      expect(methodsCalled(request, 'wallet_getCapabilities')).toBe(
        afterFirst * 2,
      );
    });
  });

  describe(`When sending with '${sendCalls.name}'`, () => {
    it("Then a single call targets the request's chain non-atomically", async () => {
      const { wallet, request } = walletWith((method) => {
        if (method === 'wallet_sendCalls') return { id: '0xcalls' };
        return undefined;
      });

      const result = await sendCalls(wallet, [txRequest()]);

      assertOk(result);
      expect(result.value).toBe('0xcalls');
      const [{ params }] = request.mock.calls.find(
        ([args]) => args.method === 'wallet_sendCalls',
      ) ?? [{ params: [] }];
      expect(params[0]).toMatchObject({
        atomicRequired: false,
        chainId: `0x${CHAIN.toString(16)}`,
        from: ADDRESS,
      });
    });

    it('Then a user rejection fails with a CancelError', async () => {
      const { wallet } = walletWith(() => {
        throw rpcError(4001, 'User rejected the request.');
      });

      const result = await sendCalls(wallet, [txRequest()]);

      assertErr(result);
      expect(result.error).toBeInstanceOf(CancelError);
    });

    it('Then any other wallet error fails with a SigningError', async () => {
      const { wallet } = walletWith(() => {
        throw rpcError(-32602, 'Invalid params');
      });

      const result = await sendCalls(wallet, [txRequest()]);

      assertErr(result);
      expect(result.error).toBeInstanceOf(SigningError);
    });

    it('Then a wallet answering 5760 for a batch resolves to BatchUnavailable', async () => {
      const { wallet } = walletWith(() => {
        throw rpcError(5760, 'Atomicity not supported');
      });

      const result = await sendCalls(wallet, [txRequest(), txRequest()]);

      assertOk(result);
      expect(result.value).toBe(batchUnavailable);
    });

    it("Then a batch to a wallet without 'wallet_sendCalls' resolves to BatchUnavailable", async () => {
      const { wallet, request } = walletWith(() => {
        throw rpcError(-32601, 'Method not found');
      });

      const result = await sendCalls(wallet, [txRequest(), txRequest()]);

      assertOk(result);
      expect(result.value).toBe(batchUnavailable);
      expect(methodsCalled(request, 'eth_sendTransaction')).toBe(0);
    });

    it("Then a single call to a wallet without 'wallet_sendCalls' falls back and yields a decodable synthetic id", async () => {
      const { wallet, request } = walletWith((method) => {
        switch (method) {
          case 'wallet_sendCalls':
            throw rpcError(-32601, 'Method not found');
          case 'eth_chainId':
            return `0x${CHAIN.toString(16)}`;
          case 'eth_sendTransaction':
            return HASH;
        }
        return undefined;
      });

      const result = await sendCalls(wallet, [txRequest()]);

      assertOk(result);
      expect(methodsCalled(request, 'eth_sendTransaction')).toBe(1);
      expect(decodeFallbackCallsId(result.value as CallsId, CHAIN)).toBe(HASH);
    });

    it('Then requests from another sender are rejected', () => {
      const { wallet } = walletWith(() => undefined);

      expect(() =>
        sendCalls(wallet, [txRequest({ from: evmAddress(OTHER) })]),
      ).toThrow();
    });

    it('Then requests on different chains are rejected', () => {
      const { wallet } = walletWith(() => undefined);

      expect(() =>
        sendCalls(wallet, [txRequest(), txRequest({ chainId: chainId(1) })]),
      ).toThrow();
    });
  });

  describe(`When decoding a synthetic id with '${decodeFallbackCallsId.name}'`, () => {
    const chainWord = CHAIN.toString(16).padStart(64, '0');
    const valid = `0x${HASH.slice(2)}${chainWord}${MAGIC}` as CallsId;

    it('Then it returns the hash of a well-formed id', () => {
      expect(decodeFallbackCallsId(valid, CHAIN)).toBe(HASH);
    });

    it('Then it rejects a wallet id, a different chain or a different length', () => {
      expect(decodeFallbackCallsId('0xcalls' as CallsId, CHAIN)).toBeNull();
      expect(decodeFallbackCallsId(valid, chainId(1))).toBeNull();
      expect(
        decodeFallbackCallsId(`${valid}${'00'.repeat(32)}` as CallsId, CHAIN),
      ).toBeNull();
    });
  });

  describe(`When waiting with '${waitForCallsResult.name}'`, () => {
    const id = '0x01' as CallsId;

    function waitWith(responses: Array<() => unknown>, timeout?: number) {
      let i = 0;
      const { wallet, request } = walletWith((method) => {
        if (method !== 'wallet_getCallsStatus') return undefined;
        const next = responses[Math.min(i++, responses.length - 1)];
        return next?.();
      });
      return {
        result: waitForCallsResult(
          wallet,
          [txRequest({ operations: ['SpokeSupply' as never] })],
          id,
          { timeout: timeout ?? 5_000 },
        ),
        request,
      };
    }

    it('Then it resolves with the last receipt once a 2xx status has receipts', async () => {
      const { result } = waitWith([
        () => callsStatus(100),
        () => callsStatus(201),
        () => callsStatus(200, [receipt()]),
      ]);

      const outcome = await result;

      assertOk(outcome);
      expect(outcome.value).toEqual({
        txHash: HASH,
        operations: ['SpokeSupply'],
      });
    });

    it('Then a failure status with a receipt fails with a TransactionError', async () => {
      const { result } = waitWith([() => callsStatus(500, [receipt('0x0')])]);

      const outcome = await result;

      assertErr(outcome);
      expect(outcome.error).toBeInstanceOf(TransactionError);
    });

    it('Then a failure status without a receipt fails with an UnexpectedError', async () => {
      const { result } = waitWith([() => callsStatus(500)]);

      const outcome = await result;

      assertErr(outcome);
      expect(outcome.error).toBeInstanceOf(UnexpectedError);
    });

    it('Then a 2xx status with a reverted receipt fails with a TransactionError', async () => {
      const { result } = waitWith([() => callsStatus(200, [receipt('0x0')])]);

      const outcome = await result;

      assertErr(outcome);
      expect(outcome.error).toBeInstanceOf(TransactionError);
    });

    it('Then a transport error is treated as still pending', async () => {
      const { result } = waitWith([
        () => {
          throw new Error('socket hang up');
        },
        () => callsStatus(200, [receipt()]),
      ]);

      const outcome = await result;

      assertOk(outcome);
    });

    it('Then an unknown Calls ID fails immediately with an UnexpectedError', async () => {
      const { result, request } = waitWith([
        () => {
          throw rpcError(5730, 'Unknown bundle id');
        },
      ]);

      const outcome = await result;

      assertErr(outcome);
      expect(outcome.error).toBeInstanceOf(UnexpectedError);
      expect(methodsCalled(request, 'wallet_getCallsStatus')).toBe(1);
    });

    it('Then it fails with a TimeoutError carrying the Calls ID when still pending at the deadline', async () => {
      const { result } = waitWith([() => callsStatus(100)], 20);

      const outcome = await result;

      assertErr(outcome);
      expect(outcome.error).toBeInstanceOf(TimeoutError);
      expect(outcome.error.cause).toEqual({ callsId: id });
    });
  });
});
