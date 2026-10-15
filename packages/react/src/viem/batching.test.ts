import {
  chainScript,
  createScriptedWallet,
  type ScriptEntry,
  walletClientFor,
} from '@aave/client/testing';
import { chainId, evmAddress } from '@aave/types';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  batchCapability,
  CAN_BATCH_STALE_TIME,
  clearCanBatchCache,
  useCanBatch,
} from './batching';

const account = evmAddress('0x1111111111111111111111111111111111111111');
const testChainId = chainId(1);

const supported = { result: { '0x1': { atomic: { status: 'supported' } } } };
const ready = { result: { '0x1': { atomic: { status: 'ready' } } } };

function setup(capabilities: ScriptEntry) {
  const provider = createScriptedWallet({
    ...chainScript({ account, chainId: testChainId }),
    wallet_getCapabilities: capabilities,
  });
  const walletClient = walletClientFor(provider, {
    account,
    chainId: testChainId,
  });
  return { provider, walletClient };
}

describe(`Given the '${batchCapability.name}' function`, () => {
  describe('When the wallet supports atomic batches', () => {
    it('Then it asks the wallet afresh on every call', async () => {
      const { provider, walletClient } = setup(supported);
      const check = batchCapability(walletClient);

      expect((await check(testChainId))._unsafeUnwrap()).toBe(true);
      expect((await check(testChainId))._unsafeUnwrap()).toBe(true);
      expect(provider.calls('wallet_getCapabilities')).toBe(2);
    });
  });

  describe('When there is no wallet client', () => {
    it('Then it resolves to false', async () => {
      const result = await batchCapability(undefined)(testChainId);

      expect(result._unsafeUnwrap()).toBe(false);
    });
  });
});

describe(`Given the '${useCanBatch.name}' hook`, () => {
  beforeEach(() => {
    clearCanBatchCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('When the wallet supports atomic batches', () => {
    it('Then it is false until the wallet answers, then true', async () => {
      const { walletClient } = setup(supported);

      const { result } = renderHook(() =>
        useCanBatch(walletClient, { chainId: testChainId }),
      );

      expect(result.current).toBe(false);
      await waitFor(() => expect(result.current).toBe(true));
    });
  });

  describe("When the wallet only reports atomic 'ready'", () => {
    it('Then it stays false', async () => {
      const { provider, walletClient } = setup(ready);

      const { result } = renderHook(() =>
        useCanBatch(walletClient, { chainId: testChainId }),
      );

      await waitFor(() =>
        expect(provider.calls('wallet_getCapabilities')).toBe(1),
      );
      expect(result.current).toBe(false);
    });
  });

  describe('When there is no wallet client', () => {
    it('Then it is false without asking anything', () => {
      const { result } = renderHook(() =>
        useCanBatch(undefined, { chainId: testChainId }),
      );

      expect(result.current).toBe(false);
    });
  });

  describe('When several components ask for the same account and chain', () => {
    it('Then the wallet is asked once until the answer goes stale', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const { provider, walletClient } = setup(supported);

      const first = renderHook(() =>
        useCanBatch(walletClient, { chainId: testChainId }),
      );
      const second = renderHook(() =>
        useCanBatch(walletClient, { chainId: testChainId }),
      );
      await waitFor(() => expect(second.result.current).toBe(true));
      expect(first.result.current).toBe(true);
      expect(provider.calls('wallet_getCapabilities')).toBe(1);

      vi.advanceTimersByTime(CAN_BATCH_STALE_TIME + 1);
      const later = renderHook(() =>
        useCanBatch(walletClient, { chainId: testChainId }),
      );
      await waitFor(() => expect(later.result.current).toBe(true));
      expect(provider.calls('wallet_getCapabilities')).toBe(2);
    });
  });
});
