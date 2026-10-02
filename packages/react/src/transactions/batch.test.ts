import { batchUnavailable } from '@aave/client';
import { UnexpectedError } from '@aave/core';
import type {
  Erc20ApprovalRequired,
  PreContractActionRequired,
  TransactionRequest,
} from '@aave/graphql';
import {
  assertErr,
  assertOk,
  type BlockchainData,
  chainId,
  evmAddress,
  okAsync,
} from '@aave/types';
import { describe, expect, it, vi } from 'vitest';
import {
  type BatchRequest,
  type BatchSender,
  PendingTransaction,
} from '../helpers';
import { asStepHandler, sendAsBatch } from './batch';

const CHAIN = chainId(8453);

function txRequest(data: string): TransactionRequest {
  return {
    __typename: 'TransactionRequest',
    to: evmAddress('0x2222222222222222222222222222222222222222'),
    from: evmAddress('0x1111111111111111111111111111111111111111'),
    data: data as BlockchainData,
    value: 0n,
    chainId: CHAIN,
    operations: [],
  };
}

const approve = txRequest('0xa1');
const original = txRequest('0xb2');
const setManager = txRequest('0xc3');

const approvalPlan = {
  __typename: 'Erc20ApprovalRequired',
  approvals: [{ __typename: 'Erc20Approval', byTransaction: approve }],
  originalTransaction: original,
} as unknown as Erc20ApprovalRequired;

const preActionPlan = {
  __typename: 'PreContractActionRequired',
  transaction: setManager,
  reason: 'position manager',
  originalTransaction: original,
} as unknown as PreContractActionRequired;

const pending = new PendingTransaction(() =>
  okAsync({ txHash: `0x${'ab'.repeat(32)}` as never, operations: [] }),
);

function senderThat(supported: boolean): BatchSender {
  return {
    supports: vi.fn(() => okAsync(supported)),
    send: vi.fn(() => okAsync(pending)),
  };
}

describe(`Given the '${sendAsBatch.name}' helper`, () => {
  it('Then without a batch sender it resolves to null and never calls the handler', async () => {
    const handler = vi.fn();

    const result = await sendAsBatch(approvalPlan, handler, undefined);

    assertOk(result);
    expect(result.value).toBeNull();
    expect(handler).not.toHaveBeenCalled();
  });

  it('Then when the wallet cannot batch it resolves to null and never calls the handler', async () => {
    const handler = vi.fn();
    const batch = senderThat(false);

    const result = await sendAsBatch(approvalPlan, handler, batch);

    assertOk(result);
    expect(result.value).toBeNull();
    expect(batch.supports).toHaveBeenCalledWith(CHAIN);
    expect(handler).not.toHaveBeenCalled();
  });

  it('Then it calls the handler once with a BatchRequest of the approvals and the original transaction', async () => {
    const batch = senderThat(true);
    const handler = vi.fn((plan: BatchRequest) => batch.send(plan));

    const result = await sendAsBatch(approvalPlan, handler, batch);

    assertOk(result);
    expect(result.value).toBe(pending);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0]?.[0]).toEqual({
      __typename: 'BatchRequest',
      requests: [approve, original],
    });
  });

  it('Then a pre-contract action is batched before the original transaction', async () => {
    const batch = senderThat(true);
    const handler = vi.fn((plan: BatchRequest) => batch.send(plan));

    await sendAsBatch(preActionPlan, handler, batch);

    expect(handler.mock.calls[0]?.[0]).toEqual({
      __typename: 'BatchRequest',
      requests: [setManager, original],
    });
  });

  it('Then a BatchUnavailable result resolves to null so the hook falls back to step by step', async () => {
    const batch = senderThat(true);
    const handler = vi.fn(() => okAsync(batchUnavailable));

    const result = await sendAsBatch(approvalPlan, handler, batch);

    assertOk(result);
    expect(result.value).toBeNull();
  });

  it('Then a handler that does not return the batch result fails with an UnexpectedError', async () => {
    const batch = senderThat(true);
    const handler = vi.fn(() => okAsync('0xsignature'));

    const result = await sendAsBatch(approvalPlan, handler as never, batch);

    assertErr(result);
    expect(result.error).toBeInstanceOf(UnexpectedError);
  });
});

describe(`Given the '${asStepHandler.name}' helper`, () => {
  it('Then it passes step results through', async () => {
    const steps = asStepHandler(vi.fn(() => okAsync(pending)));

    const result = await steps(original, { cancel: vi.fn() });

    assertOk(result);
    expect(result.value).toBe(pending);
  });

  it('Then a BatchUnavailable step result fails with an UnexpectedError', async () => {
    const steps = asStepHandler(vi.fn(() => okAsync(batchUnavailable)));

    const result = await steps(original, { cancel: vi.fn() });

    assertErr(result);
    expect(result.error).toBeInstanceOf(UnexpectedError);
  });
});
