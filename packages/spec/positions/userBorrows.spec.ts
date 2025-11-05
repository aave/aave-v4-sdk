import { assertOk, evmAddress, OrderDirection } from '@aave/client-next';
import { userBorrows, userPositions } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKE_ISO_STABLE_ADDRESS,
  ETHEREUM_USDC_ADDRESS,
} from '@aave/client-next/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';

import { assertSingleElementArray } from '../test-utils';

const user = await createNewWallet(
  '0x95914dd71f13f28b7f4bac9b2fb3741a53eb784cdab666acb9f40ebe6ec479aa',
);

// TODO: Improve the tests(with multiple borrows in same spoke) when bug AAVE-2151 is fixed
describe('Querying User Borrow Positions on Aave V4', () => {
  describe('Given a user with multiple active borrow positions', () => {
    beforeAll(async () => {
      // NOTE: Enable when needed to create userBorrows position for a new user
      // const setup = await fundErc20Address(evmAddress(user.account.address), {
      //   address: ETHEREUM_USDC_ADDRESS,
      //   amount: bigDecimal('100'),
      //   decimals: 6,
      // })
      //   .andThen(() =>
      //     fundErc20Address(evmAddress(user.account.address), {
      //       address: ETHEREUM_WSTETH_ADDRESS,
      //       amount: bigDecimal('0.5'),
      //     }),
      //   )
      //   .andThen(() =>
      //     supplyToRandomERC20Reserve(client, user, {
      //       token: ETHEREUM_USDC_ADDRESS,
      //       amount: bigDecimal('100'),
      //     }),
      //   )
      //   .andThen(() => supplyAndBorrow(client, user, ETHEREUM_USDS_ADDRESS))
      //   .andThen(() => supplyAndBorrow(client, user, {
      //     tokenToSupply: ETHEREUM_USDS_ADDRESS,
      //     tokenToBorrow: ETHEREUM_WETH_ADDRESS,
      //   }));
      // assertOk(setup);
    }, 120_000);

    describe('When the user queries their borrow positions by spoke', () => {
      it('Then the matching borrow positions are returned', async () => {
        const borrowPositions = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: {
                address: ETHEREUM_SPOKE_ISO_STABLE_ADDRESS,
                chainId: ETHEREUM_FORK_ID,
              },
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(borrowPositions);
        borrowPositions.value.forEach((position) => {
          expect(position.reserve.spoke.address).toBe(
            ETHEREUM_SPOKE_ISO_STABLE_ADDRESS,
          );
          expect(position.reserve.spoke.chain.chainId).toBe(ETHEREUM_FORK_ID);
        });
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
        expect(borrowPositions.value.length).toBeGreaterThanOrEqual(1);
        borrowPositions.value.forEach((position) => {
          expect(position.reserve.spoke.chain.chainId).toBe(ETHEREUM_FORK_ID);
        });

        borrowPositions = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: {
                address: ETHEREUM_SPOKE_ISO_STABLE_ADDRESS,
                chainId: ETHEREUM_FORK_ID,
              },
              user: evmAddress(user.account.address),
            },
          },
          includeZeroBalances: true,
        });
        assertOk(borrowPositions);
        expect(borrowPositions.value.length).toBeGreaterThanOrEqual(1);
        borrowPositions.value.forEach((position) => {
          expect(position.reserve.spoke.address).toBe(
            ETHEREUM_SPOKE_ISO_STABLE_ADDRESS,
          );
        });
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
        expect(borrowPositions.value.length).toBeGreaterThanOrEqual(1);
        borrowPositions.value.forEach((position) => {
          expect(position.reserve.spoke.chain.chainId).toBe(ETHEREUM_FORK_ID);
        });
      });
    });

    describe('When the user queries a specific borrow position by its ID', () => {
      it('Then the corresponding borrow position is returned', async () => {
        const positions = await userPositions(client, {
          filter: {
            tokens: [
              { chainId: ETHEREUM_FORK_ID, address: ETHEREUM_USDC_ADDRESS },
            ],
          },
          user: evmAddress(user.account.address),
        });
        assertOk(positions);
        // Select a position with borrow data
        assertSingleElementArray(positions.value);
        const borrowPositions = await userBorrows(client, {
          query: {
            userPositionId: positions.value[0].id,
          },
        });
        assertOk(borrowPositions);
        expect(borrowPositions.value.length).toBe(1);
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
        expect(borrowPositions.value.length).toBeGreaterThanOrEqual(2);
        let listOrderAmount = borrowPositions.value.map(
          (elem) => elem.debt.amount.value,
        );
        expect(listOrderAmount).toBeOrderedNumerically('desc');

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
        expect(borrowPositions.value.length).toBeGreaterThanOrEqual(2);
        listOrderAmount = borrowPositions.value.map(
          (elem) => elem.debt.amount.value,
        );
        expect(listOrderAmount).toBeOrderedNumerically('asc');
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
        expect(borrowPositions.value.length).toBeGreaterThanOrEqual(2);
        let listOrderApy = borrowPositions.value.map(
          (elem) => elem.reserve.summary.borrowApy.value,
        );
        expect(listOrderApy).toBeOrderedNumerically('desc');

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
        expect(borrowPositions.value.length).toBeGreaterThanOrEqual(2);

        listOrderApy = borrowPositions.value.map(
          (elem) => elem.reserve.summary.borrowApy.value,
        );
        expect(listOrderApy).toBeOrderedNumerically('asc');
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
        expect(borrowPositions.value.length).toBeGreaterThanOrEqual(2);
        let listOrderAssetName = borrowPositions.value.map(
          (elem) => elem.reserve.asset.underlying.info.name,
        );
        expect(listOrderAssetName).toBeOrderedAlphabetically('desc');

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
        expect(borrowPositions.value.length).toBeGreaterThanOrEqual(2);
        listOrderAssetName = borrowPositions.value.map(
          (elem) => elem.reserve.asset.underlying.info.name,
        );
        expect(listOrderAssetName).toBeOrderedAlphabetically('asc');
      });
    });
  });
});
