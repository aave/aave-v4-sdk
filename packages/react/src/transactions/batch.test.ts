import type { BatchCapability } from '@aave/client';
import { ETHEREUM_FORK_ID, environment } from '@aave/client/testing';
import {
  encodeReserveId,
  HasProcessedKnownTransactionQuery,
  type OnChainReserveId,
  OperationType,
  SupplyQuery,
  type SupplyRequest,
} from '@aave/graphql';
import {
  decimalNumber,
  makeErc20Approval,
  makeTransactionRequest,
} from '@aave/graphql/testing';
import { assertOk, bigDecimal, evmAddress, okAsync, txHash } from '@aave/types';
import * as msw from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { PendingTransaction } from '../helpers';
import { renderHookWithinContext } from '../test-utils';
import { useSupply } from './useSupply';

const sender = evmAddress('0x1111111111111111111111111111111111111111');

const supplyRequest: SupplyRequest = {
  reserve: encodeReserveId({
    chainId: ETHEREUM_FORK_ID,
    spoke: evmAddress('0x0000000000000000000000000000000000000001'),
    onChainId: 'xyz' as OnChainReserveId,
  }),
  amount: { erc20: { value: bigDecimal('1') } },
  sender,
};

const action = makeTransactionRequest({
  chainId: ETHEREUM_FORK_ID,
  from: sender,
  operations: [OperationType.SpokeSupply],
});

// with `bySignature`, so the per-step flow would offer a permit
const approval = makeErc20Approval({
  byTransaction: makeTransactionRequest({
    chainId: ETHEREUM_FORK_ID,
    from: sender,
  }),
});

const approvalRequired = {
  __typename: 'Erc20ApprovalRequired' as const,
  approvals: [approval],
  reason: 'Approval required',
  requiredAmount: decimalNumber(1),
  currentAllowance: decimalNumber(0),
  originalTransaction: action,
};

const executed = txHash(`0x${'e'.repeat(64)}`);

function sent() {
  return okAsync(
    new PendingTransaction(() =>
      okAsync({ txHash: executed, operations: action.operations }),
    ),
  );
}

const api = msw.graphql.link(environment.backend);
const server = setupServer(msw.http.all('*', async () => msw.passthrough()));

describe(`Given the '${useSupply.name}' hook with the batch option`, () => {
  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    server.use(
      api.query(SupplyQuery, () =>
        msw.HttpResponse.json({ data: { value: approvalRequired } }),
      ),
      api.query(HasProcessedKnownTransactionQuery, () =>
        msw.HttpResponse.json({ data: { value: true } }),
      ),
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  async function supplyWith(batch: BatchCapability | undefined) {
    const handler = vi.fn(sent);
    const {
      result: {
        current: [supply],
      },
    } = renderHookWithinContext(() => useSupply(handler, { batch }));

    const result = await supply(supplyRequest);
    return { handler, result };
  }

  describe('When the wallet can batch', () => {
    it('Then the handler receives the approval and the action as one TransactionBatch', async () => {
      const capability = vi.fn(() => okAsync(true));

      const { handler, result } = await supplyWith(capability);

      assertOk(result);
      expect(result.value.txHash).toBe(executed);
      expect(capability).toHaveBeenCalledWith(ETHEREUM_FORK_ID);
      expect(handler).toHaveBeenCalledOnce();
      // the API parses `value` into a bigint, so compare the rest
      const { value: _approvalValue, ...approvalTx } = approval.byTransaction;
      const { value: _actionValue, ...actionTx } = action;
      expect(handler.mock.calls[0]?.[0]).toMatchObject({
        __typename: 'TransactionBatch',
        chainId: ETHEREUM_FORK_ID,
        from: sender,
        transactions: [approvalTx, actionTx],
        operations: action.operations,
      });
    });
  });

  describe('When the wallet cannot batch', () => {
    it('Then the handler receives each step as today, permit included', async () => {
      const { handler, result } = await supplyWith(() => okAsync(false));

      assertOk(result);
      expect(handler.mock.calls.map(([plan]) => plan.__typename)).toEqual([
        'Erc20Approval',
        'TransactionRequest',
      ]);
      expect(handler.mock.calls[0]?.[0]).toHaveProperty(
        'bySignature',
        expect.objectContaining({ primaryType: 'Permit' }),
      );
    });
  });

  describe('When the batch option is undefined', () => {
    it('Then the handler receives each step as today', async () => {
      const { handler, result } = await supplyWith(undefined);

      assertOk(result);
      expect(handler.mock.calls.map(([plan]) => plan.__typename)).toEqual([
        'Erc20Approval',
        'TransactionRequest',
      ]);
    });
  });

  describe('When the plan has a single transaction', () => {
    beforeEach(() => {
      server.use(
        api.query(SupplyQuery, () =>
          msw.HttpResponse.json({ data: { value: action } }),
        ),
      );
    });

    it('Then it never asks the wallet and sends the transaction as today', async () => {
      const capability = vi.fn(() => okAsync(true));

      const { handler, result } = await supplyWith(capability);

      assertOk(result);
      expect(capability).not.toHaveBeenCalled();
      expect(handler.mock.calls.map(([plan]) => plan.__typename)).toEqual([
        'TransactionRequest',
      ]);
    });
  });
});
