import {
  createNewWallet,
  ETHEREUM_FORK_ID,
  environment,
  fundNativeAddress,
} from '@aave/client/testing';
import { CancelError, TimeoutError, UnexpectedError } from '@aave/core';
import {
  encodeReserveId,
  HasProcessedKnownTransactionQuery,
  type OnChainReserveId,
  OperationType,
  RepayQuery,
  type RepayRequest,
} from '@aave/graphql';
import {
  decimalNumber,
  makeErc20Approval,
  makePermitTypedData,
  makeTransactionRequest,
} from '@aave/graphql/testing';
import {
  assertErr,
  assertOk,
  assertTypename,
  bigDecimal,
  evmAddress,
  okAsync,
  type Signature,
} from '@aave/types';
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
} from 'vitest';
import { renderHookWithinContext } from '../test-utils';
import { useSendTransaction } from '../viem';
import { useRepay } from './useRepay';

const walletClient = await createNewWallet();
await fundNativeAddress(evmAddress(walletClient.account.address));

const sender = evmAddress(walletClient.account.address);

const spoke = evmAddress('0x0000000000000000000000000000000000000001');

const reserve = encodeReserveId({
  chainId: ETHEREUM_FORK_ID,
  spoke,
  onChainId: 'xyz' as OnChainReserveId,
});

const repayRequest: RepayRequest = {
  reserve,
  amount: {
    erc20: {
      value: { exact: bigDecimal('1') },
    },
  },
  sender,
};

const transactionRequest = makeTransactionRequest({
  chainId: ETHEREUM_FORK_ID,
  from: sender,
  operations: [OperationType.SpokeRepay],
});

const erc20ApprovalRequired = {
  __typename: 'Erc20ApprovalRequired' as const,
  approvals: [makeErc20Approval()],
  reason: 'Approval required',
  requiredAmount: decimalNumber(1),
  currentAllowance: decimalNumber(0),
  originalTransaction: transactionRequest,
};

const api = msw.graphql.link(environment.backend);
const server = setupServer(msw.http.all('*', async () => msw.passthrough()));

describe(`Given the '${useRepay.name}' hook`, () => {
  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    server.use(
      api.query(RepayQuery, () =>
        msw.HttpResponse.json({
          data: {
            value: transactionRequest,
          },
        }),
      ),
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('When the transaction succeeds', () => {
    beforeEach(() => {
      server.use(
        api.query(HasProcessedKnownTransactionQuery, () =>
          msw.HttpResponse.json({
            data: { value: true },
          }),
        ),
      );
    });

    it('Then it should complete the full transaction flow', async () => {
      const {
        result: {
          current: [repay],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);

        return useRepay((plan) => {
          assertTypename(plan, 'TransactionRequest');
          return sendTransaction(plan);
        });
      });

      const result = await repay(repayRequest);

      assertOk(result);
      expect(result.value).toEqual(
        expect.objectContaining({
          __typename: 'TransactionReceipt',
          txHash: expect.any(String),
        }),
      );
    });
  });

  describe('When ERC20 permit approval is required', () => {
    beforeEach(() => {
      // First call returns Erc20ApprovalRequired, second returns TransactionRequest
      let callCount = 0;
      server.use(
        api.query(RepayQuery, () => {
          callCount++;
          if (callCount === 1) {
            return msw.HttpResponse.json({
              data: { value: erc20ApprovalRequired },
            });
          }
          return msw.HttpResponse.json({
            data: { value: transactionRequest },
          });
        }),
      );
    });

    it('Then the hook invokes the handler with Erc20Approval then TransactionRequest', async () => {
      const mockSignature = `0x${'ab'.repeat(65)}` as Signature;
      const receivedPlans: string[] = [];

      const {
        result: {
          current: [repay],
        },
      } = renderHookWithinContext(() => {
        return useRepay((plan, { cancel }) => {
          receivedPlans.push(plan.__typename);

          if (plan.__typename === 'Erc20Approval') {
            // Return mock signature to trigger the permit injection path
            return okAsync(mockSignature);
          }

          // TransactionRequest reached — permit flow completed; cancel to avoid live tx
          return cancel('permit flow verified');
        });
      });

      const result = await repay(repayRequest);

      assertErr(result);
      expect(result.error).toBeInstanceOf(CancelError);
      expect(receivedPlans).toEqual(['Erc20Approval', 'TransactionRequest']);
    });

    it('Then the permit typed data exposes signedAmount', () => {
      const permitData = makePermitTypedData();
      expect(permitData.signedAmount).toEqual(bigDecimal(1));
    });
  });

  describe('When the user cancels the transaction signing', () => {
    it('Then it should return a CancelError', async () => {
      const {
        result: {
          current: [repay],
        },
      } = renderHookWithinContext(() => {
        return useRepay((_plan, { cancel }) => {
          return cancel('User rejected');
        });
      });

      const result = await repay(repayRequest);

      assertErr(result);
      expect(result.error).toBeInstanceOf(CancelError);
    });
  });

  describe('When the GraphQL query fails', () => {
    beforeEach(() => {
      server.use(
        api.query(RepayQuery, () =>
          msw.HttpResponse.json({
            errors: [{ message: 'Something went wrong' }],
          }),
        ),
      );
    });

    it('Then it should return a UnexpectedError', async () => {
      const {
        result: {
          current: [repay],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);

        return useRepay((plan) => {
          assertTypename(plan, 'TransactionRequest');
          return sendTransaction(plan);
        });
      });

      const result = await repay(repayRequest);

      assertErr(result);
      expect(result.error).toBeInstanceOf(UnexpectedError);
    });
  });

  describe('When the transaction is not indexed by the API in time', () => {
    beforeEach(() => {
      server.use(
        api.query(HasProcessedKnownTransactionQuery, () =>
          msw.HttpResponse.json({
            data: { value: false },
          }),
        ),
      );
    });

    it('Then it should return a TimeoutError', async () => {
      const {
        result: {
          current: [repay],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);

        return useRepay((plan) => {
          assertTypename(plan, 'TransactionRequest');
          return sendTransaction(plan);
        });
      });

      const result = await repay(repayRequest);

      assertErr(result);
      expect(result.error).toBeInstanceOf(TimeoutError);
    }, 90_000);
  });
});
