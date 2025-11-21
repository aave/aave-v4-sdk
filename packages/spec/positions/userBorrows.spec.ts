import { assertOk, evmAddress, OrderDirection } from '@aave/client';
import { userBorrows, userPositions } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKE_CORE_ID,
} from '@aave/client/test-utils';

import { beforeAll, describe, expect, it } from 'vitest';

import { assertNonEmptyArray } from '../test-utils';
import { recreateUserBorrows } from './helper';

const user = await createNewWallet(
  '0x40e7024d48c43beb83f2328465b31b0d8e38835688cd7d9e24301f1aa1961d4b',
);

describe('Querying User Borrow Positions on Aave V4', () => {
  describe('Given a user with multiple active borrow positions', () => {
    beforeAll(async () => {
      await recreateUserBorrows(client, user);
    }, 120_000);

    describe('When the user queries their borrow positions by spoke', () => {
      it('Then the matching borrow positions are returned', async () => {
        const userPositionsResult = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(userPositionsResult);
        assertNonEmptyArray(userPositionsResult.value);

        const borrowPositions = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: userPositionsResult.value[0].spoke.id,
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(borrowPositions);

        expect(borrowPositions.value).toBeArrayWithElements(
          expect.objectContaining({
            reserve: expect.objectContaining({
              spoke: expect.objectContaining({
                id: userPositionsResult.value[0].spoke.id,
              }),
            }),
          }),
        );
      });
    });

    describe('When the user queries their borrow positions including zero balances', () => {
      it('Then all borrow positions, including those with zero balances, are returned', async () => {
        let borrowPositions = await userBorrows(client, {
          query: {
            userChains: {
              chainIds: [ETHEREUM_FORK_ID],
              user: evmAddress(user.account.address),
            },
          },
          includeZeroBalances: true,
        });
        assertOk(borrowPositions);

        expect(borrowPositions.value).toBeArrayWithElements(
          expect.objectContaining({
            reserve: expect.objectContaining({
              spoke: expect.objectContaining({
                chain: expect.objectContaining({
                  chainId: ETHEREUM_FORK_ID,
                }),
              }),
            }),
          }),
        );

        borrowPositions = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: ETHEREUM_SPOKE_CORE_ID,
              user: evmAddress(user.account.address),
            },
          },
          includeZeroBalances: true,
        });
        assertOk(borrowPositions);
        expect(borrowPositions.value).toBeArrayWithElements(
          expect.objectContaining({
            reserve: expect.objectContaining({
              spoke: expect.objectContaining({
                id: ETHEREUM_SPOKE_CORE_ID,
              }),
            }),
          }),
        );
      });
    });

    describe('When the user queries their borrow positions by chain ID', () => {
      it('Then the borrow positions matching the specified chain IDs are returned', async () => {
        const borrowPositions = await userBorrows(client, {
          query: {
            userChains: {
              chainIds: [ETHEREUM_FORK_ID],
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(borrowPositions);

        expect(borrowPositions.value).toBeArrayWithElements(
          expect.objectContaining({
            reserve: expect.objectContaining({
              spoke: expect.objectContaining({
                chain: expect.objectContaining({
                  chainId: ETHEREUM_FORK_ID,
                }),
              }),
            }),
          }),
        );
      });
    });

    describe('When the user queries a specific borrow position by its ID', () => {
      it('Then the corresponding borrow position is returned', async () => {
        const positions = await userPositions(client, {
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          user: evmAddress(user.account.address),
        });
        assertOk(positions);
        assertNonEmptyArray(positions.value);

        const borrowPositions = await userBorrows(client, {
          query: {
            userPositionId: positions.value[0].id,
          },
        });
        assertOk(borrowPositions);
        expect(borrowPositions.value.length).toBe(3);
      });
    });

    describe('When the user fetches borrow positions ordered by amount', () => {
      it('Then the borrow positions are returned in order of amount', async () => {
        let borrowPositions = await userBorrows(client, {
          query: {
            userChains: {
              chainIds: [ETHEREUM_FORK_ID],
              user: evmAddress(user.account.address),
            },
          },
          orderBy: { amount: OrderDirection.Desc },
        });
        assertOk(borrowPositions);

        let listOrderAmount = borrowPositions.value.map(
          (elem) => elem.principal.amount.value,
        );
        expect(listOrderAmount).toBeSortedNumerically('desc');

        borrowPositions = await userBorrows(client, {
          query: {
            userChains: {
              chainIds: [ETHEREUM_FORK_ID],
              user: evmAddress(user.account.address),
            },
          },
          orderBy: { amount: OrderDirection.Asc },
        });
        assertOk(borrowPositions);

        listOrderAmount = borrowPositions.value.map(
          (elem) => elem.principal.amount.value,
        );
        expect(listOrderAmount).toBeSortedNumerically('asc');
      });
    });

    describe('When the user fetches borrow positions ordered by APY', () => {
      it('Then the borrow positions are returned in order of APY', async () => {
        let borrowPositions = await userBorrows(client, {
          query: {
            userChains: {
              chainIds: [ETHEREUM_FORK_ID],
              user: evmAddress(user.account.address),
            },
          },
          orderBy: { apy: OrderDirection.Desc },
        });
        assertOk(borrowPositions);

        let listOrderApy = borrowPositions.value.map(
          (elem) => elem.reserve.summary.borrowApy.value,
        );
        expect(listOrderApy).toBeSortedNumerically('desc');

        borrowPositions = await userBorrows(client, {
          query: {
            userChains: {
              chainIds: [ETHEREUM_FORK_ID],
              user: evmAddress(user.account.address),
            },
          },
          orderBy: { apy: OrderDirection.Asc },
        });
        assertOk(borrowPositions);

        listOrderApy = borrowPositions.value.map(
          (elem) => elem.reserve.summary.borrowApy.value,
        );
        expect(listOrderApy).toBeSortedNumerically('asc');
      });
    });

    describe('When the user fetches borrow positions ordered by asset name', () => {
      it('Then the borrow positions are returned in order of asset name', async () => {
        let borrowPositions = await userBorrows(client, {
          query: {
            userChains: {
              chainIds: [ETHEREUM_FORK_ID],
              user: evmAddress(user.account.address),
            },
          },
          orderBy: { assetName: OrderDirection.Desc },
        });
        assertOk(borrowPositions);

        let listOrderAssetName = borrowPositions.value.map(
          (elem) => elem.reserve.asset.underlying.info.name,
        );
        expect(listOrderAssetName).toBeSortedAlphabetically('desc');

        borrowPositions = await userBorrows(client, {
          query: {
            userChains: {
              chainIds: [ETHEREUM_FORK_ID],
              user: evmAddress(user.account.address),
            },
          },
          orderBy: { assetName: OrderDirection.Asc },
        });
        assertOk(borrowPositions);

        listOrderAssetName = borrowPositions.value.map(
          (elem) => elem.reserve.asset.underlying.info.name,
        );
        expect(listOrderAssetName).toBeSortedAlphabetically('asc');
      });
    });
  });
});
