import type {
  Erc20ApprovalRequired,
  ExecutionPlan,
  TransactionRequest,
} from '@aave/graphql';
import {
  assertOk,
  type BlockchainData,
  chainId,
  evmAddress,
} from '@aave/types';
import { createWalletClient, custom } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import { sendBatchWith } from './viem';

const ADDRESS = '0x1111111111111111111111111111111111111111';
const CHAIN = chainId(8453);
const CHAIN_HEX = `0x${CHAIN.toString(16)}`;
const HASH = `0x${'ab'.repeat(32)}`;

function txRequest(data: string): TransactionRequest {
  return {
    __typename: 'TransactionRequest',
    to: evmAddress('0x2222222222222222222222222222222222222222'),
    from: evmAddress(ADDRESS),
    data: data as BlockchainData,
    value: 0n,
    chainId: CHAIN,
    operations: [],
  };
}

const plan = {
  __typename: 'Erc20ApprovalRequired',
  approvals: [
    { __typename: 'Erc20Approval', byTransaction: txRequest('0xa1') },
  ],
  originalTransaction: txRequest('0xb2'),
} as unknown as Erc20ApprovalRequired;

function rpcError(code: number, message = 'error') {
  return Object.assign(new Error(message), { code });
}

const confirmed = {
  version: '2.0.0',
  id: '0x01',
  chainId: CHAIN_HEX,
  atomic: true,
  status: 200,
  receipts: [
    {
      logs: [],
      status: '0x1',
      blockHash: `0x${'cd'.repeat(32)}`,
      blockNumber: '0x1',
      gasUsed: '0x1',
      transactionHash: HASH,
    },
  ],
};

function walletWith(onSendCalls: (calls: unknown[]) => unknown) {
  const request = vi.fn(async ({ method, params }) => {
    switch (method) {
      case 'wallet_getCapabilities':
        return { [CHAIN_HEX]: { atomic: { status: 'supported' } } };
      case 'wallet_sendCalls':
        return onSendCalls(params[0].calls);
      case 'wallet_getCallsStatus':
        return confirmed;
    }
    throw rpcError(-32601, `Unexpected ${method}`);
  });
  const wallet = createWalletClient({
    account: ADDRESS,
    transport: custom({ request }),
    pollingInterval: 1,
  });
  const sendCallsSizes = () =>
    request.mock.calls
      .filter(([args]) => args.method === 'wallet_sendCalls')
      .map(([args]) => args.params[0].calls.length);
  return { wallet, sendCallsSizes };
}

describe(`Given the viem '${sendBatchWith.name}' handler`, () => {
  it('Then a wallet with atomic support receives the approval and the transaction as one batch', async () => {
    const { wallet, sendCallsSizes } = walletWith(() => ({ id: '0xbatch' }));

    const result = await sendBatchWith(wallet, plan as ExecutionPlan);

    assertOk(result);
    expect(result.value.txHash).toBe(HASH);
    expect(sendCallsSizes()).toEqual([2]);
  });

  it('Then a wallet that turns out not to support atomic execution gets the steps one by one', async () => {
    const { wallet, sendCallsSizes } = walletWith((calls) => {
      if (calls.length > 1) {
        throw rpcError(5760, 'Atomicity not supported');
      }
      return { id: '0xsingle' };
    });

    const result = await sendBatchWith(wallet, plan as ExecutionPlan);

    assertOk(result);
    expect(sendCallsSizes()).toEqual([2, 1, 1]);
  });
});
