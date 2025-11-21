import {
  assertOk,
  evmAddress,
  OrderDirection,
  ReservesRequestFilter,
} from '@aave/client';
import { reserves } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_HUB_CORE_ADDRESS,
  ETHEREUM_SPOKE_CORE_ADDRESS,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
} from '@aave/client/test-utils';
import { describe, expect, it } from 'vitest';
import { assertNonEmptyArray } from '../test-utils';

const user = await createNewWallet();

describe('Querying Reserves on Aave V4', () => {
  describe('Given a user who wants to fetch reserves', () => {
    describe('When fetching reserves for a specific hub token', () => {
      it('Then it should return the reserves for the specific token', async () => {
        const listReserves = await reserves(client, {
          query: {
            hubToken: {
              token: ETHEREUM_USDC_ADDRESS,
              hub: ETHEREUM_HUB_CORE_ADDRESS,
              chainId: ETHEREUM_FORK_ID,
            },
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        expect(listReserves.value).toBeArrayWithElements(
          expect.objectContaining({
            asset: expect.objectContaining({
              underlying: expect.objectContaining({
                address: ETHEREUM_USDC_ADDRESS,
              }),
              hub: expect.objectContaining({
                address: ETHEREUM_HUB_CORE_ADDRESS,
              }),
            }),
          }),
        );
      });
    });

    describe('When fetching reserves for a specific spoke token', () => {
      it('Then it should return the reserves for the specific token', async () => {
        const listReserves = await reserves(client, {
          query: {
            spokeToken: {
              token: ETHEREUM_USDC_ADDRESS,
              spoke: ETHEREUM_SPOKE_CORE_ID,
            },
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        expect(listReserves.value).toBeArrayWithElements(
          expect.objectContaining({
            spoke: expect.objectContaining({
              id: ETHEREUM_SPOKE_CORE_ID,
            }),
            asset: expect.objectContaining({
              underlying: expect.objectContaining({
                address: ETHEREUM_USDC_ADDRESS,
              }),
            }),
          }),
        );
      });
    });

    describe('When fetching reserves for a specific spoke', () => {
      it('Then it should return the reserves for that specific spoke', async () => {
        let listReserves = await reserves(client, {
          query: {
            spoke: {
              chainId: ETHEREUM_FORK_ID,
              address: ETHEREUM_SPOKE_CORE_ADDRESS,
            },
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);
        expect(listReserves.value).toBeArrayWithElements(
          expect.objectContaining({
            spoke: expect.objectContaining({
              address: ETHEREUM_SPOKE_CORE_ADDRESS,
            }),
          }),
        );

        listReserves = await reserves(client, {
          query: { spokeId: ETHEREUM_SPOKE_CORE_ID },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);
        expect(listReserves.value).toBeArrayWithElements(
          expect.objectContaining({
            spoke: expect.objectContaining({
              id: ETHEREUM_SPOKE_CORE_ID,
            }),
          }),
        );
      });
    });

    describe('When fetching reserves for a specific tokens', () => {
      it('Then it should return the reserves for the specific tokens', async () => {
        const tokens = [ETHEREUM_USDC_ADDRESS, ETHEREUM_WETH_ADDRESS];
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

        expect(listReserves.value).toBeArrayWithElements(
          expect.objectContaining({
            asset: expect.objectContaining({
              underlying: expect.objectContaining({
                address: expect.toBeOneOf(tokens),
              }),
            }),
          }),
        );
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

        expect(listReserves.value).toBeArrayWithElements(
          expect.objectContaining({
            chain: expect.objectContaining({
              chainId: ETHEREUM_FORK_ID,
            }),
          }),
        );
      });
    });

    describe('When fetching reserves for a specific hub', () => {
      it('Then it should return the reserves for the specific hub', async () => {
        const listReserves = await reserves(client, {
          query: {
            hub: {
              chainId: ETHEREUM_FORK_ID,
              address: ETHEREUM_HUB_CORE_ADDRESS,
            },
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);
        expect(listReserves.value).toBeArrayWithElements(
          expect.objectContaining({
            asset: expect.objectContaining({
              hub: expect.objectContaining({
                address: ETHEREUM_HUB_CORE_ADDRESS,
              }),
            }),
          }),
        );
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
        expect(listBorrowApyAsc).toBeSortedNumerically('asc');

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
        expect(listBorrowApyDesc).toBeSortedNumerically('desc');
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
        expect(listSupplyApyAsc).toBeSortedNumerically('asc');

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
        expect(listSupplyApyDesc).toBeSortedNumerically('desc');
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
        expect(listCollateralFactorAsc).toBeSortedNumerically('asc');
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
        expect(listCollateralFactorDesc).toBeSortedNumerically('desc');
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
        expect(listUserBalanceAsc).toBeSortedNumerically('asc');
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
        expect(listUserBalanceDesc).toBeSortedNumerically('desc');
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

          expect(listReserves.value).toBeArrayWithElements(
            expect.objectContaining({
              canBorrow: expect.toSatisfy((canBorrow) =>
                status === ReservesRequestFilter.Borrow ? canBorrow : true,
              ),
              canSupply: expect.toSatisfy((canSupply) =>
                status === ReservesRequestFilter.Supply ? canSupply : true,
              ),
            }),
          );
        },
      );
    });
  });
});
