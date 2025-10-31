import {
  assertOk,
  evmAddress,
  OrderDirection,
  ReservesRequestFilter,
} from '@aave/client-next';
import { reserves } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_HUBS,
  ETHEREUM_SPOKES,
  ETHEREUM_TOKENS,
} from '@aave/client-next/test-utils';
import { describe, expect, it } from 'vitest';
import { assertNonEmptyArray, isOrderedNumerically } from '../test-utils';

const user = await createNewWallet();

describe('Aave V4 Reserve Scenario', () => {
  describe('Given a user who wants to fetch reserves', () => {
    describe('When fetching reserves for a specific hub token', () => {
      it('Then it should return the reserves for the specific token', async () => {
        const listReserves = await reserves(client, {
          query: {
            hubToken: {
              token: ETHEREUM_TOKENS.USDC,
              hub: ETHEREUM_HUBS.CORE_HUB,
              chainId: ETHEREUM_FORK_ID,
            },
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        listReserves.value.forEach((elem) => {
          expect(elem.asset.hub.address).toEqual(ETHEREUM_HUBS.CORE_HUB);
          expect(elem.asset.underlying.address).toEqual(ETHEREUM_TOKENS.USDC);
        });
      });
    });

    describe('When fetching reserves for a specific spoke token', () => {
      it('Then it should return the reserves for the specific token', async () => {
        const listReserves = await reserves(client, {
          query: {
            spokeToken: {
              token: ETHEREUM_TOKENS.USDC,
              spoke: ETHEREUM_SPOKES.CORE_SPOKE,
              chainId: ETHEREUM_FORK_ID,
            },
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        listReserves.value.forEach((elem) => {
          expect(elem.spoke.address).toEqual(ETHEREUM_SPOKES.CORE_SPOKE);
          expect(elem.asset.underlying.address).toEqual(ETHEREUM_TOKENS.USDC);
        });
      });
    });

    describe('When fetching reserves for a specific spoke', () => {
      it('Then it should return the reserves for that specific spoke', async () => {
        const listReserves = await reserves(client, {
          query: {
            spoke: {
              chainId: ETHEREUM_FORK_ID,
              address: ETHEREUM_SPOKES.CORE_SPOKE,
            },
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        listReserves.value.forEach((elem) => {
          expect(elem.spoke.address).toEqual(ETHEREUM_SPOKES.CORE_SPOKE);
        });
      });
    });

    describe('When fetching reserves for a specific tokens', () => {
      it('Then it should return the reserves for the specific tokens', async () => {
        const tokens = [ETHEREUM_TOKENS.USDC, ETHEREUM_TOKENS.WETH];
        const listReserves = await reserves(client, {
          query: {
            tokens: tokens.map((token) => ({
              chainId: ETHEREUM_FORK_ID,
              address: token,
            })),
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        listReserves.value.forEach((elem) => {
          expect(tokens.includes(elem.asset.underlying.address)).toBe(true);
        });
      });
    });

    describe('When fetching reserves for a specific chainId', () => {
      it('Then it should return the reserves for the specific chainId', async () => {
        const listReserves = await reserves(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        listReserves.value.forEach((elem) => {
          expect(elem.chain.chainId).toEqual(ETHEREUM_FORK_ID);
        });
      });
    });

    describe('When fetching reserves for a specific hub', () => {
      it('Then it should return the reserves for the specific hub', async () => {
        const listReserves = await reserves(client, {
          query: {
            hub: {
              chainId: ETHEREUM_FORK_ID,
              address: ETHEREUM_HUBS.CORE_HUB,
            },
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        listReserves.value.forEach((elem) => {
          expect(elem.asset.hub.address).toEqual(ETHEREUM_HUBS.CORE_HUB);
        });
      });
    });

    describe('When fetching reserves ordered by', () => {
      it('Then it should return reserves ordered by assetName', async () => {
        let listReserves = await reserves(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { assetName: OrderDirection.Asc },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        const listNamesAsc = listReserves.value.map(
          (elem) => elem.asset.underlying.info.name,
        );
        expect(listNamesAsc).toEqual(listNamesAsc.sort());

        listReserves = await reserves(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { assetName: OrderDirection.Desc },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);
        const listNamesDesc = listReserves.value.map(
          (elem) => elem.asset.underlying.info.name,
        );
        expect(listNamesDesc).toEqual(listNamesAsc.reverse());
      });

      it('Then it should return reserves ordered by borrowApy', async () => {
        let listReserves = await reserves(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { borrowApy: OrderDirection.Asc },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);
        const listBorrowApyAsc = listReserves.value.map(
          (elem) => elem.summary.borrowApy.value,
        );
        expect(isOrderedNumerically(listBorrowApyAsc, 'asc')).toBe(true);

        listReserves = await reserves(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { borrowApy: OrderDirection.Desc },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);
        const listBorrowApyDesc = listReserves.value.map(
          (elem) => elem.summary.borrowApy.value,
        );
        expect(isOrderedNumerically(listBorrowApyDesc, 'desc')).toBe(true);
      });

      it('Then it should return reserves ordered by supplyApy', async () => {
        let listReserves = await reserves(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { supplyApy: OrderDirection.Asc },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);
        const listSupplyApyAsc = listReserves.value.map(
          (elem) => elem.summary.supplyApy.value,
        );
        expect(isOrderedNumerically(listSupplyApyAsc, 'asc')).toBe(true);

        listReserves = await reserves(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { supplyApy: OrderDirection.Desc },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);
        const listSupplyApyDesc = listReserves.value.map(
          (elem) => elem.summary.supplyApy.value,
        );
        expect(isOrderedNumerically(listSupplyApyDesc, 'desc')).toBe(true);
      });

      it('Then it should return reserves ordered by collateralFactor', async () => {
        let listReserves = await reserves(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { collateralFactor: OrderDirection.Asc },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);
        const listCollateralFactorAsc = listReserves.value.map(
          (elem) => elem.settings.collateralFactor.value,
        );
        expect(isOrderedNumerically(listCollateralFactorAsc, 'asc')).toBe(true);
        listReserves = await reserves(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { collateralFactor: OrderDirection.Desc },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);
        const listCollateralFactorDesc = listReserves.value.map(
          (elem) => elem.settings.collateralFactor.value,
        );
        expect(isOrderedNumerically(listCollateralFactorDesc, 'desc')).toBe(
          true,
        );
      });

      it('Then it should return reserves ordered by userBalance', async () => {
        let listReserves = await reserves(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { userBalance: OrderDirection.Asc },
          user: evmAddress(user.account.address),
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);
        const listUserBalanceAsc = listReserves.value.map(
          (elem) => elem.userState!.balance.amount.value,
        );
        expect(isOrderedNumerically(listUserBalanceAsc, 'asc')).toBe(true);
        listReserves = await reserves(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { userBalance: OrderDirection.Desc },
          user: evmAddress(user.account.address),
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);
        const listUserBalanceDesc = listReserves.value.map(
          (elem) => elem.userState!.balance.amount.value,
        );
        expect(isOrderedNumerically(listUserBalanceDesc, 'desc')).toBe(true);
      });
    });

    describe('When fetching reserves filtered by', () => {
      const status = Object.values(ReservesRequestFilter);
      it.each(status)(
        'Then it should return only reserves with a status: %s',
        async (status) => {
          const listReserves = await reserves(client, {
            query: {
              chainIds: [ETHEREUM_FORK_ID],
            },
            filter: status,
          });
          assertOk(listReserves);
          assertNonEmptyArray(listReserves.value);

          listReserves.value.forEach((elem) => {
            if (status === ReservesRequestFilter.Borrow) {
              expect(elem.canBorrow).toBeTrue();
            }
            if (status === ReservesRequestFilter.Supply) {
              expect(elem.canSupply).toBeTrue();
            }
          });
        },
      );
    });
  });
});
