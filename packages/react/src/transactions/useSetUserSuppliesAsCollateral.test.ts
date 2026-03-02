import { AaveClient } from '@aave/client';
import { userPositions } from '@aave/client/actions';
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
  SetUserSuppliesAsCollateralQuery,
} from '@aave/graphql';
import {
  makeTransactionRequest,
  makeUserPosition,
} from '@aave/graphql/testing';
import { assertErr, assertOk, evmAddress } from '@aave/types';
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
import { useSetUserSuppliesAsCollateral } from './useSetUserSuppliesAsCollateral';

const walletClient = await createNewWallet();
await fundNativeAddress(evmAddress(walletClient.account.address));

const sender = evmAddress(walletClient.account.address);

const spoke = evmAddress('0x0000000000000000000000000000000000000001');

const reserve = encodeReserveId({
  chainId: ETHEREUM_FORK_ID,
  spoke,
  onChainId: 'xyz' as OnChainReserveId,
});

const transactionRequest = makeTransactionRequest({
  chainId: ETHEREUM_FORK_ID,
  from: sender,
  operations: [OperationType.SpokeSetUserUsingAsCollateral],
});

const api = msw.graphql.link(environment.backend);
const server = setupServer(msw.http.all('*', async () => msw.passthrough()));

describe(`Given the '${useSetUserSuppliesAsCollateral.name}' hook`, () => {
  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    server.use(
      api.query(SetUserSuppliesAsCollateralQuery, () =>
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

    it('Then it should complete the full transaction flow ', async () => {
      const {
        result: {
          current: [setCollateral],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);

        return useSetUserSuppliesAsCollateral((plan) => {
          return sendTransaction(plan);
        });
      });

      const result = await setCollateral({
        changes: [{ reserve: reserve, enableCollateral: true }],
        sender,
      });

      assertOk(result);
      expect(result.value).toEqual(
        expect.objectContaining({
          __typename: 'TransactionReceipt',
          txHash: expect.any(String),
        }),
      );
    });
  });

  describe('And the client cache contains an entry for a query targeted by the andThrough callback', () => {
    // Uses same client instance between the hook and the setup/assertion phases.
    const client = AaveClient.create({ environment });
    let userPositionsRequestCount = 0;

    beforeEach(async () => {
      userPositionsRequestCount = 0;

      server.use(
        api.query('UserPositions', () => {
          userPositionsRequestCount++;
          return msw.HttpResponse.json({
            data: {
              value: [
                makeUserPosition({
                  address: spoke,
                  chainId: ETHEREUM_FORK_ID,
                  user: sender,
                }),
              ],
            },
          });
        }),
        api.query(HasProcessedKnownTransactionQuery, () =>
          msw.HttpResponse.json({
            data: { value: true },
          }),
        ),
      );

      // Prime the cache with a UserPositions query for the sender (uses the same client as the hook)
      const primed = await userPositions(
        client,
        {
          user: sender,
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        },
        {
          requestPolicy: 'cache-and-network',
        },
      );
      assertOk(primed);
      expect(userPositionsRequestCount).toBe(1);
    });

    describe('When the transaction succeeds', () => {
      it('Then it should flag the cache entry as stale for the next activation', async () => {
        const {
          result: {
            current: [setCollateral],
          },
        } = renderHookWithinContext(
          () => {
            const [sendTransaction] = useSendTransaction(walletClient);
            return useSetUserSuppliesAsCollateral((plan) => {
              return sendTransaction(plan);
            });
          },
          { client },
        );
        const result = await setCollateral({
          changes: [{ reserve: reserve, enableCollateral: true }],
          sender,
        });
        assertOk(result);
        // After the transaction, the cache entry should be stale, so the next query should trigger a new request
        const afterTx = await userPositions(
          client,
          {
            user: sender,
            filter: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          },
          {
            requestPolicy: 'cache-first',
          },
        );
        assertOk(afterTx);
        expect(userPositionsRequestCount).toBe(2);
      });
    });
  });

  describe('When the user cancels the transaction signing', () => {
    it('Then it should return a CancelError', async () => {
      const {
        result: {
          current: [setCollateral],
        },
      } = renderHookWithinContext(() => {
        return useSetUserSuppliesAsCollateral((_plan, { cancel }) => {
          return cancel('User rejected');
        });
      });

      const result = await setCollateral({
        changes: [{ reserve: reserve, enableCollateral: true }],
        sender,
      });

      assertErr(result);
      expect(result.error).toBeInstanceOf(CancelError);
    });
  });

  describe('When the GraphQL query fails', () => {
    beforeEach(() => {
      server.use(
        api.query(SetUserSuppliesAsCollateralQuery, () =>
          msw.HttpResponse.json({
            errors: [{ message: 'Something went wrong' }],
          }),
        ),
      );
    });

    it('Then it should return a UnexpectedError', async () => {
      const {
        result: {
          current: [setCollateral],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);

        return useSetUserSuppliesAsCollateral((plan) => {
          return sendTransaction(plan);
        });
      });

      const result = await setCollateral({
        changes: [{ reserve: reserve, enableCollateral: true }],
        sender,
      });

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
          current: [setCollateral],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);

        return useSetUserSuppliesAsCollateral((plan) => {
          return sendTransaction(plan);
        });
      });

      const result = await setCollateral({
        changes: [{ reserve: reserve, enableCollateral: true }],
        sender,
      });

      assertErr(result);
      expect(result.error).toBeInstanceOf(TimeoutError);
    }, 90_000);
  });
});
