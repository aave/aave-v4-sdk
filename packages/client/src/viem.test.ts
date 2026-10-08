import {
  CancelError,
  SubmissionUnresolvedError,
  TransactionError,
  UnexpectedError,
} from '@aave/core';
import type { Erc20ApprovalRequired, TransactionRequest } from '@aave/graphql';
import {
  type BlockchainData,
  chainId,
  evmAddress,
  type HexString,
  type Result,
  type ResultAsync,
  txHash,
} from '@aave/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  advancingBlockNumber,
  after,
  createScriptedWallet,
  makeBlock,
  makeCallsStatus,
  makeReceipt,
  makeTransaction,
  rpcErrors,
  type ScriptEntry,
  type ScriptedWallet,
  walletClientFor,
} from './testing-wallet';
import { SUBMISSION_TIMEOUT, sendWith, waitForTransactionResult } from './viem';

const account = evmAddress('0x1111111111111111111111111111111111111111');
const testChainId = chainId(1);

const submitted = txHash(`0x${'a'.repeat(64)}`); // what eth_sendTransaction returns
const executed = txHash(`0x${'e'.repeat(64)}`); // the real on-chain hash

const request: TransactionRequest = {
  __typename: 'TransactionRequest',
  to: account,
  from: account,
  data: '0x' as BlockchainData,
  value: 0n,
  chainId: testChainId,
  operations: [],
};

const pending = { result: makeCallsStatus({ status: 100 }) };
const executedStatus = (hash: HexString = executed) => ({
  result: makeCallsStatus({
    status: 200,
    receipts: [{ hash, status: 'success' }],
  }),
});
const receiptOf = (
  hash: HexString,
  status: 'success' | 'reverted' = 'success',
) => ({ result: makeReceipt({ hash, from: account, status }) });
const noReceipt = { result: null };

function setup(script: Partial<Record<string, ScriptEntry>>) {
  const provider = createScriptedWallet({
    eth_chainId: { result: '0x1' },
    eth_blockNumber: advancingBlockNumber,
    eth_getTransactionByHash: (params) => {
      const [hash] = params as [HexString];
      return { result: makeTransaction({ hash, from: account }) };
    },
    eth_getBlockByNumber: (params) => {
      const [number] = params as [HexString];
      return { result: makeBlock({ number }) };
    },
    eth_estimateGas: { result: '0x5208' },
    ...script,
  });
  const walletClient = walletClientFor(provider, {
    account,
    chainId: testChainId,
  });
  return { provider, walletClient };
}

type Settled<T, E> = { current: Result<T, E> | undefined; at?: number };

function track<T, E>(result: ResultAsync<T, E>): Settled<T, E> {
  const startedAt = Date.now();
  const settled: Settled<T, E> = { current: undefined };
  void result.then((value) => {
    settled.current = value;
    settled.at = Date.now() - startedAt;
  });
  return settled;
}

function expectNoFurtherCalls(provider: ScriptedWallet, method: string) {
  const before = provider.calls(method);
  return vi.advanceTimersByTimeAsync(60_000).then(() => {
    expect(provider.calls(method)).toBe(before);
  });
}

describe(`Given the viem '${waitForTransactionResult.name}' function`, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('When the wallet is an EOA without EIP-5792 support', () => {
    it('Then it resolves with the receipt hash once mined', async () => {
      const { provider, walletClient } = setup({
        wallet_getCallsStatus: { error: rpcErrors.methodNotFound },
        eth_getTransactionReceipt: after(
          12_000,
          receiptOf(submitted),
          noReceipt,
        ),
      });

      const result = track(
        waitForTransactionResult(walletClient, request, submitted),
      );
      await vi.advanceTimersByTimeAsync(11_000);
      expect(result.current).toBeUndefined();

      await vi.advanceTimersByTimeAsync(5_000);
      expect(result.current?._unsafeUnwrap()).toEqual({
        txHash: submitted,
        operations: [],
      });
      expect(provider.unscripted()).toEqual([]);
    });
  });

  describe('When the wallet is an EOA on MetaMask', () => {
    it('Then it resolves with the receipt hash without added latency', async () => {
      const { provider, walletClient } = setup({
        wallet_getCallsStatus: { error: rpcErrors.unknownBundle },
        eth_getTransactionReceipt: receiptOf(submitted),
      });

      const result = track(
        waitForTransactionResult(walletClient, request, submitted),
      );
      await vi.advanceTimersByTimeAsync(100);

      expect(result.current?._unsafeUnwrap().txHash).toBe(submitted);
      expect(provider.unscripted()).toEqual([]);
    });
  });

  describe('When the wallet is a Safe 1-of-1 on mobile (receipts never resolve)', () => {
    it('Then it resolves with the real execution hash from wallet_getCallsStatus', async () => {
      const { provider, walletClient } = setup({
        eth_getTransactionReceipt: noReceipt,
        wallet_getCallsStatus: [
          { error: rpcErrors.safeMobileNotFound },
          { error: rpcErrors.safeMobileNotFound },
          pending,
          executedStatus(),
        ],
      });

      const result = track(
        waitForTransactionResult(walletClient, request, submitted),
      );
      await vi.advanceTimersByTimeAsync(20_000);

      expect(result.current?._unsafeUnwrap().txHash).toBe(executed);
      expect(provider.unscripted()).toEqual([]);
    });
  });

  describe('When the wallet is a Safe multisig awaiting co-signers', () => {
    it('Then it stays pending until executed and resolves with the real hash', async () => {
      const { walletClient } = setup({
        eth_getTransactionReceipt: noReceipt,
        wallet_getCallsStatus: after(10 * 60_000, executedStatus(), pending),
      });

      const result = track(
        waitForTransactionResult(walletClient, request, submitted),
      );
      await vi.advanceTimersByTimeAsync(9 * 60_000);
      expect(result.current).toBeUndefined();

      await vi.advanceTimersByTimeAsync(2 * 60_000);
      expect(result.current?._unsafeUnwrap().txHash).toBe(executed);
    });
  });

  describe('When the Safe iframe echoes the safeTxHash as the receipt hash', () => {
    it('Then it ignores the echoed receipt and resolves with the real hash', async () => {
      const { walletClient } = setup({
        eth_getTransactionReceipt: receiptOf(submitted),
        wallet_getCallsStatus: [pending, executedStatus()],
      });

      const result = track(
        waitForTransactionResult(walletClient, request, submitted),
      );
      await vi.advanceTimersByTimeAsync(10_000);

      expect(result.current?._unsafeUnwrap().txHash).toBe(executed);
    });

    it('Then it holds an echoed receipt that arrives before the first status answer', async () => {
      const { walletClient } = setup({
        eth_getTransactionReceipt: receiptOf(submitted),
        wallet_getCallsStatus: { delayMs: 50, respond: executedStatus() },
      });

      const result = track(
        waitForTransactionResult(walletClient, request, submitted),
      );
      await vi.advanceTimersByTimeAsync(10_000);

      expect(result.current?._unsafeUnwrap().txHash).toBe(executed);
    });
  });

  describe('When the wallet reports a final status', () => {
    it.each([
      {
        description: '400 (rejected or dropped)',
        status: { result: makeCallsStatus({ status: 400 }) },
        expected: CancelError,
      },
      {
        description: '500 with a reverted receipt',
        status: {
          result: makeCallsStatus({
            status: 500,
            receipts: [{ hash: executed, status: 'reverted' }],
          }),
        },
        expected: TransactionError,
      },
      {
        description: '600 with [success, reverted] receipts',
        status: {
          result: makeCallsStatus({
            status: 600,
            receipts: [
              { hash: submitted, status: 'success' },
              { hash: executed, status: 'reverted' },
            ],
          }),
        },
        expected: TransactionError,
      },
      {
        description: '200 with a reverted receipt',
        status: {
          result: makeCallsStatus({
            status: 200,
            receipts: [{ hash: executed, status: 'reverted' }],
          }),
        },
        expected: TransactionError,
      },
    ])(
      'Then $description maps to $expected.name',
      async ({ status, expected }) => {
        const { walletClient } = setup({
          eth_getTransactionReceipt: noReceipt,
          wallet_getCallsStatus: [pending, status],
        });

        const result = track(
          waitForTransactionResult(walletClient, request, submitted),
        );
        await vi.advanceTimersByTimeAsync(10_000);

        const error = result.current?._unsafeUnwrapErr();
        expect(error).toBeInstanceOf(expected);
        if (error instanceof TransactionError) {
          expect(error.txHash).toBe(executed);
        }
      },
    );
  });

  describe('When the transaction never executes', () => {
    it(`Then it fails with a ${SubmissionUnresolvedError.name} at the submission timeout`, async () => {
      const { walletClient } = setup({
        eth_getTransactionReceipt: noReceipt,
        wallet_getCallsStatus: pending,
      });

      const result = track(
        waitForTransactionResult(walletClient, request, submitted),
      );
      await vi.advanceTimersByTimeAsync(SUBMISSION_TIMEOUT - 1_000);
      expect(result.current).toBeUndefined();

      await vi.advanceTimersByTimeAsync(2_000);
      const error = result.current?._unsafeUnwrapErr();
      expect(SubmissionUnresolvedError.is(error)).toBe(true);
      expect(error).toMatchObject({
        name: 'TimeoutError',
        submissionId: submitted,
        chainId: testChainId,
      });
    });
  });

  describe('When wallet_getCallsStatus always errors', () => {
    it('Then it ignores the errors and resolves from the receipt', async () => {
      const { walletClient } = setup({
        wallet_getCallsStatus: { error: rpcErrors.transport },
        eth_getTransactionReceipt: after(
          8_000,
          receiptOf(submitted),
          noReceipt,
        ),
      });

      const result = track(
        waitForTransactionResult(walletClient, request, submitted),
      );
      await vi.advanceTimersByTimeAsync(20_000);

      expect(result.current?._unsafeUnwrap().txHash).toBe(submitted);
    });
  });

  describe('When the EOA transaction is replaced', () => {
    it(`Then a reverted receipt with a different hash fails with a ${CancelError.name}`, async () => {
      const { walletClient } = setup({
        wallet_getCallsStatus: { error: rpcErrors.methodNotFound },
        eth_getTransactionReceipt: receiptOf(executed, 'reverted'),
      });

      const result = track(
        waitForTransactionResult(walletClient, request, submitted),
      );
      await vi.advanceTimersByTimeAsync(10_000);

      expect(result.current?._unsafeUnwrapErr()).toBeInstanceOf(CancelError);
    });

    it(`Then a reverted receipt with the same hash fails with a ${TransactionError.name}`, async () => {
      const { walletClient } = setup({
        wallet_getCallsStatus: { error: rpcErrors.methodNotFound },
        eth_getTransactionReceipt: receiptOf(submitted, 'reverted'),
      });

      const result = track(
        waitForTransactionResult(walletClient, request, submitted),
      );
      await vi.advanceTimersByTimeAsync(10_000);

      const error = result.current?._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(TransactionError);
      expect((error as TransactionError).txHash).toBe(submitted);
    });
  });

  describe('When the transaction has settled', () => {
    it('Then it stops polling wallet_getCallsStatus', async () => {
      const { provider, walletClient } = setup({
        eth_getTransactionReceipt: noReceipt,
        wallet_getCallsStatus: [pending, executedStatus()],
      });

      const result = track(
        waitForTransactionResult(walletClient, request, submitted),
      );
      await vi.advanceTimersByTimeAsync(10_000);
      expect(result.current?.isOk()).toBe(true);

      await expectNoFurtherCalls(provider, 'wallet_getCallsStatus');
    });
  });

  describe('When the receipt request fails', () => {
    it('Then it ignores the failure once the wallet recognised the id', async () => {
      const { walletClient } = setup({
        eth_getTransactionReceipt: { error: rpcErrors.transport },
        wallet_getCallsStatus: [pending, pending, executedStatus()],
      });

      const result = track(
        waitForTransactionResult(walletClient, request, submitted),
      );
      await vi.advanceTimersByTimeAsync(20_000);

      expect(result.current?._unsafeUnwrap().txHash).toBe(executed);
    });

    it(`Then it fails with an ${UnexpectedError.name} when the wallet does not recognise the id`, async () => {
      const { walletClient } = setup({
        eth_getTransactionReceipt: { error: rpcErrors.transport },
        wallet_getCallsStatus: { error: rpcErrors.methodNotFound },
      });

      const result = track(
        waitForTransactionResult(walletClient, request, submitted),
      );
      await vi.advanceTimersByTimeAsync(10_000);

      expect(result.current?._unsafeUnwrapErr()).toBeInstanceOf(
        UnexpectedError,
      );
    });
  });

  describe("When the wallet's first status probe hangs", () => {
    it('Then it holds the receipt until the first-probe cap, then resolves', async () => {
      const { walletClient } = setup({
        wallet_getCallsStatus: { hang: true },
        eth_getTransactionReceipt: after(
          1_000,
          receiptOf(submitted),
          noReceipt,
        ),
      });

      const result = track(
        waitForTransactionResult(walletClient, request, submitted),
      );
      await vi.advanceTimersByTimeAsync(4_900);
      expect(result.current).toBeUndefined();

      await vi.advanceTimersByTimeAsync(200);
      expect(result.current?._unsafeUnwrap().txHash).toBe(submitted);
    });
  });
});

describe(`Given the viem '${sendWith.name}' handler`, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const approval: TransactionRequest = {
    ...request,
    data: '0x01' as BlockchainData,
  };
  const plan = {
    __typename: 'Erc20ApprovalRequired',
    approvals: [{ byTransaction: approval }],
    originalTransaction: request,
  } as unknown as Erc20ApprovalRequired;

  const approvalId = txHash(`0x${'1'.repeat(64)}`);
  const mainId = txHash(`0x${'2'.repeat(64)}`);

  describe('When an approval is still awaiting signatures', () => {
    it(`Then it fails with a ${SubmissionUnresolvedError.name} for the approval and never sends the main transaction`, async () => {
      const { provider, walletClient } = setup({
        eth_sendTransaction: [{ result: approvalId }, { result: mainId }],
        eth_getTransactionReceipt: noReceipt,
        wallet_getCallsStatus: pending,
      });

      const result = track(sendWith(walletClient, plan));
      await vi.advanceTimersByTimeAsync(SUBMISSION_TIMEOUT + 10_000);

      const error = result.current?._unsafeUnwrapErr();
      expect(SubmissionUnresolvedError.is(error)).toBe(true);
      expect((error as SubmissionUnresolvedError).submissionId).toBe(
        approvalId,
      );
      expect(provider.calls('eth_sendTransaction')).toBe(1);
    });
  });

  describe('When the approval executes', () => {
    it('Then it sends the main transaction and resolves with its real hash', async () => {
      const approvalExecuted = txHash(`0x${'3'.repeat(64)}`);
      const mainExecuted = txHash(`0x${'4'.repeat(64)}`);
      const { provider, walletClient } = setup({
        eth_sendTransaction: [{ result: approvalId }, { result: mainId }],
        eth_getTransactionReceipt: noReceipt,
        wallet_getCallsStatus: (params) => {
          const [id] = params as [string];
          return id === approvalId
            ? executedStatus(approvalExecuted)
            : executedStatus(mainExecuted);
        },
      });

      const result = track(sendWith(walletClient, plan));
      await vi.advanceTimersByTimeAsync(10_000);

      expect(result.current?._unsafeUnwrap().txHash).toBe(mainExecuted);
      expect(provider.calls('eth_sendTransaction')).toBe(2);
    });
  });

  describe('When the user rejects the transaction', () => {
    it(`Then it fails with a ${CancelError.name}`, async () => {
      const { provider, walletClient } = setup({
        eth_sendTransaction: { error: rpcErrors.userRejected },
      });

      const result = track(sendWith(walletClient, request));
      await vi.advanceTimersByTimeAsync(1_000);

      expect(result.current?._unsafeUnwrapErr()).toBeInstanceOf(CancelError);
      expect(provider.calls('wallet_getCallsStatus')).toBe(0);
      expect(provider.calls('eth_getTransactionReceipt')).toBe(0);
    });
  });
});
