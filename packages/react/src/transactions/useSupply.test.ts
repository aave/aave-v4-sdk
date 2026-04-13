import { AaveClient } from '@aave/client';
import { reserveHolders, userPositions } from '@aave/client/actions';
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
  ReserveHoldersFilter,
  SupplyQuery,
  type SupplyRequest,
} from '@aave/graphql';
import {
  makeErc20Amount,
  makeTransactionRequest,
  makeUserPosition,
  percentNumber,
  randomEvmAddress,
} from '@aave/graphql/testing';
import {
  assertErr,
  assertOk,
  assertTypename,
  bigDecimal,
  evmAddress,
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
import { useSupply } from './useSupply';

const walletClient = await createNewWallet();
await fundNativeAddress(evmAddress(walletClient.account.address));

const sender = evmAddress(walletClient.account.address);

const spoke = evmAddress('0x0000000000000000000000000000000000000001');

const reserve = encodeReserveId({
  chainId: ETHEREUM_FORK_ID,
  spoke,
  onChainId: 'xyz' as OnChainReserveId,
});

const supplyRequest: SupplyRequest = {
  reserve,
  amount: {
    erc20: {
      value: bigDecimal('1'),
    },
  },
  sender,
};

const transactionRequest = makeTransactionRequest({
  chainId: ETHEREUM_FORK_ID,
  from: sender,
  operations: [OperationType.SpokeSupply],
});

const api = msw.graphql.link(environment.backend);
const server = setupServer(msw.http.all('*', async () => msw.passthrough()));

describe(`Given the '${useSupply.name}' hook`, () => {
  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    server.use(
      api.query(SupplyQuery, () =>
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
          current: [supply],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);

        return useSupply((plan) => {
          assertTypename(plan, 'TransactionRequest');
          return sendTransaction(plan);
        });
      });

      const result = await supply(supplyRequest);

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
    const client = AaveClient.create({ environment });
    let userPositionsRequestCount = 0;
    let reserveHoldersRequestCount = 0;

    beforeEach(async () => {
      userPositionsRequestCount = 0;
      reserveHoldersRequestCount = 0;

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
        api.query('ReserveHolders', () => {
          reserveHoldersRequestCount++;
          return msw.HttpResponse.json({
            data: {
              value: {
                __typename: 'PaginatedReserveHoldersResult',
                items: [
                  {
                    __typename: 'ReserveHolder',
                    address: randomEvmAddress(),
                    amount: makeErc20Amount(1, 'WETH'),
                    weight: percentNumber(0.5),
                  },
                ],
                pageInfo: {
                  __typename: 'PaginatedResultInfo',
                  prev: null,
                  next: null,
                },
              },
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

      const primedReserveHolders = await reserveHolders(
        client,
        {
          reserve: { reserveId: reserve },
          filter: ReserveHoldersFilter.Supplied,
        },
        {
          requestPolicy: 'cache-and-network',
        },
      );
      assertOk(primedReserveHolders);
      expect(reserveHoldersRequestCount).toBe(1);
    });

    describe('When the transaction succeeds', () => {
      it('Then it should flag the cache entries as stale for the next activation', async () => {
        const {
          result: {
            current: [supply],
          },
        } = renderHookWithinContext(
          () => {
            const [sendTransaction] = useSendTransaction(walletClient);
            return useSupply((plan) => {
              assertTypename(plan, 'TransactionRequest');
              return sendTransaction(plan);
            });
          },
          { client },
        );
        const result = await supply(supplyRequest);
        assertOk(result);
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

        const afterTxReserveHolders = await reserveHolders(
          client,
          {
            reserve: { reserveId: reserve },
            filter: ReserveHoldersFilter.Supplied,
          },
          {
            requestPolicy: 'cache-first',
          },
        );
        assertOk(afterTxReserveHolders);

        expect(userPositionsRequestCount).toBe(2);
        expect(reserveHoldersRequestCount).toBe(2);
      });
    });
  });

  describe('When the user cancels the transaction signing', () => {
    it('Then it should return a CancelError', async () => {
      const {
        result: {
          current: [supply],
        },
      } = renderHookWithinContext(() => {
        return useSupply((_plan, { cancel }) => {
          return cancel('User rejected');
        });
      });

      const result = await supply(supplyRequest);

      assertErr(result);
      expect(result.error).toBeInstanceOf(CancelError);
    });
  });

  describe('When the GraphQL query fails', () => {
    beforeEach(() => {
      server.use(
        api.query(SupplyQuery, () =>
          msw.HttpResponse.json({
            errors: [{ message: 'Something went wrong' }],
          }),
        ),
      );
    });

    it('Then it should return a UnexpectedError', async () => {
      const {
        result: {
          current: [supply],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);

        return useSupply((plan) => {
          assertTypename(plan, 'TransactionRequest');
          return sendTransaction(plan);
        });
      });

      const result = await supply(supplyRequest);

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
          current: [supply],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);

        return useSupply((plan) => {
          assertTypename(plan, 'TransactionRequest');
          return sendTransaction(plan);
        });
      });

      const result = await supply(supplyRequest);

      assertErr(result);
      expect(result.error).toBeInstanceOf(TimeoutError);
    }, 90_000);
  });
});
