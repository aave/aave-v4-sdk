import {
  CancelError,
  SubmissionUnresolvedError,
  UnexpectedError,
} from '@aave/client';
import {
  chainScript,
  createScriptedWallet,
  ETHEREUM_FORK_ID,
  makeCallsStatus,
  makeReceipt,
  rpcErrors,
  type ScriptEntry,
} from '@aave/client/testing';
import { SUBMISSION_TIMEOUT } from '@aave/client/viem';
import type { TransactionRequest } from '@aave/graphql';
import {
  assertErr,
  assertOk,
  type BlockchainData,
  evmAddress,
  txHash,
} from '@aave/types';
import { useWallets } from '@privy-io/react-auth';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSendTransaction } from './privy';
import { renderHookWithinContext } from './test-utils';

vi.mock('@privy-io/react-auth', () => ({
  useWallets: vi.fn(),
  useSignTypedData: vi.fn(() => ({ signTypedData: vi.fn() })),
}));

const account = evmAddress('0x1111111111111111111111111111111111111111');
const submitted = txHash(`0x${'a'.repeat(64)}`);
const executed = txHash(`0x${'e'.repeat(64)}`);

const request: TransactionRequest = {
  __typename: 'TransactionRequest',
  to: account,
  from: account,
  data: '0x' as BlockchainData,
  value: 0n,
  chainId: ETHEREUM_FORK_ID,
  operations: [],
};

// Shape of a Privy wallet error for an unsupported method (TBD from manual testing).
const privyUnsupported = {
  code: 4200,
  message: 'The Provider does not support the requested method',
};

function setupPrivyWallet(
  script: Partial<Record<string, ScriptEntry>>,
  { switchChain = vi.fn(async () => {}) } = {},
) {
  const provider = createScriptedWallet({
    ...chainScript({ account, chainId: ETHEREUM_FORK_ID }),
    eth_sendTransaction: { result: submitted },
    ...script,
  });
  vi.mocked(useWallets).mockReturnValue({
    ready: true,
    wallets: [
      {
        address: account,
        switchChain,
        getEthereumProvider: async () => provider,
      },
    ],
  } as unknown as ReturnType<typeof useWallets>);
  return { provider, switchChain };
}

async function send() {
  const { result } = renderHookWithinContext(() => useSendTransaction());
  return result.current[0](request);
}

describe(`Given the Privy '${useSendTransaction.name}' hook`, () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('When the wallet is a Privy embedded EOA', () => {
    it('Then it resolves with the receipt hash', async () => {
      const { provider } = setupPrivyWallet({
        wallet_getCallsStatus: { error: privyUnsupported },
        eth_getTransactionReceipt: {
          result: makeReceipt({
            hash: submitted,
            from: account,
            status: 'success',
          }),
        },
      });

      const pending = await send();
      assertOk(pending);

      const result = await pending.value.wait();
      assertOk(result);
      expect(result.value.txHash).toBe(submitted);
      expect(provider.unscripted()).toEqual([]);
    });
  });

  describe('When the wallet is an external Safe over WalletConnect', () => {
    it('Then it resolves with the real execution hash once executed', async () => {
      setupPrivyWallet({
        eth_getTransactionReceipt: { result: null },
        wallet_getCallsStatus: [
          { result: makeCallsStatus({ status: 100 }) },
          {
            result: makeCallsStatus({
              status: 200,
              receipts: [{ hash: executed, status: 'success' }],
            }),
          },
        ],
      });

      const pending = await send();
      assertOk(pending);

      vi.useFakeTimers();
      const wait = pending.value.wait();
      await vi.advanceTimersByTimeAsync(10_000);

      const result = await wait;
      assertOk(result);
      expect(result.value.txHash).toBe(executed);
    });

    it(`Then it fails with a ${SubmissionUnresolvedError.name} while still awaiting signatures`, async () => {
      setupPrivyWallet({
        eth_getTransactionReceipt: { result: null },
        wallet_getCallsStatus: { result: makeCallsStatus({ status: 100 }) },
      });

      const pending = await send();
      assertOk(pending);

      vi.useFakeTimers();
      const wait = pending.value.wait();
      await vi.advanceTimersByTimeAsync(SUBMISSION_TIMEOUT + 10_000);

      const result = await wait;
      assertErr(result);
      expect(SubmissionUnresolvedError.is(result.error)).toBe(true);
    });
  });

  describe('When switching chain fails', () => {
    it(`Then it fails with an ${UnexpectedError.name} without sending`, async () => {
      const { provider } = setupPrivyWallet(
        {},
        { switchChain: vi.fn(async () => Promise.reject(new Error('nope'))) },
      );

      const result = await send();

      assertErr(result);
      expect(result.error).toBeInstanceOf(UnexpectedError);
      expect(provider.calls('eth_sendTransaction')).toBe(0);
    });
  });

  describe('When the user rejects the transaction', () => {
    it(`Then it fails with a ${CancelError.name}`, async () => {
      setupPrivyWallet({
        eth_sendTransaction: { error: rpcErrors.userRejected },
      });

      const result = await send();

      assertErr(result);
      expect(result.error).toBeInstanceOf(CancelError);
    });
  });
});
