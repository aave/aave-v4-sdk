import { assertOk, evmAddress, OrderDirection } from '@aave/client-next';
import { userPosition, userPositions } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDS_ADDRESS,
} from '@aave/client-next/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { assertSingleElementArray } from '../test-utils';

const user = await createNewWallet(
  '0x619fd37ca0d128348949b8fb9e93d22176bea39251b73e7a3a9697c7462dd313',
);

describe('Aave V4 Positions Scenario', () => {
  describe('Given a user with more than one supply/borrow positions', () => {
    beforeAll(async () => {
      // NOTE: Enable when you want to recreate the user positions
      // const setup = await fundErc20Address(evmAddress(user.account.address), {
      //   address: ETHEREUM_WETH_ADDRESS,
      //   amount: bigDecimal('0.5'),
      // })
      //   .andThen(() =>
      //     fundErc20Address(evmAddress(user.account.address), {
      //       address: ETHEREUM_WSTETH_ADDRESS,
      //       amount: bigDecimal('0.5'),
      //     }),
      //   )
      //   .andThen(() => supplyWETHAndBorrow(client, user, ETHEREUM_USDS_ADDRESS))
      //   .andThen(() => supplyWSTETHAndBorrowETH(client, user));
      // assertOk(setup);
    });

    describe('When fetching a specific position', () => {
      it('Then it should return the position details', async () => {
        const positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(positions);
        for (const position of positions.value) {
          const positionDetails = await userPosition(client, {
            id: position.id,
          });
          assertOk(positionDetails);
          expect(positionDetails.value?.id).toBe(position.id);
        }
      });
    });

    describe('When fetching positions filtered by chainId', () => {
      it('Then it should return the positions filtered by chainId', async () => {
        const positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(positions);
        positions.value.forEach((position) => {
          expect(position.spoke.chain.chainId).toBe(ETHEREUM_FORK_ID);
        });
      });
    });

    describe('When fetching positions filtered by token', () => {
      it('Then it should return the positions filtered by token', async () => {
        const positionUsds = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            tokens: [
              { chainId: ETHEREUM_FORK_ID, address: ETHEREUM_USDS_ADDRESS },
            ],
          },
        });
        assertOk(positionUsds);
        assertSingleElementArray(positionUsds.value);
        expect(positionUsds.value[0].spoke.chain.chainId).toBe(
          ETHEREUM_FORK_ID,
        );
      });
    });

    // TODO: order is still not implemented in the backend
    describe.skip('When fetching positions ordered by', () => {
      it('Then it should return the positions ordered by balance', async () => {
        let positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { balance: OrderDirection.Desc },
        });
        assertOk(positions);
        expect(
          positions.value[0]?.netBalance.amount.value,
        ).toBeBigDecimalLessThan(positions.value[1]?.netBalance.amount.value);

        positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { balance: OrderDirection.Asc },
        });
        assertOk(positions);
        expect(
          positions.value[0]?.netBalance.amount.value,
        ).toBeBigDecimalGreaterThan(
          positions.value[1]?.netBalance.amount.value,
        );
      });

      it('Then it should return the positions ordered by apy', async () => {
        let positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { netApy: OrderDirection.Desc },
        });
        assertOk(positions);
        expect(positions.value[0]?.netApy.value).toBeBigDecimalGreaterThan(
          positions.value[1]?.netApy.value,
        );

        positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { netApy: OrderDirection.Asc },
        });
        assertOk(positions);
        expect(positions.value[0]?.netApy.value).toBeBigDecimalLessThan(
          positions.value[1]?.netApy.value,
        );
      });

      it('Then it should return the positions ordered by healthFactor', async () => {
        let positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { healthFactor: OrderDirection.Desc },
        });
        assertOk(positions);
        expect(
          positions.value[0]?.healthFactor.value,
        ).toBeBigDecimalGreaterThan(positions.value[1]?.healthFactor.value);

        positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { healthFactor: OrderDirection.Asc },
        });
        assertOk(positions);
        expect(positions.value[0]?.healthFactor.value).toBeBigDecimalLessThan(
          positions.value[1]?.healthFactor.value,
        );
      });

      it('Then it should return the positions ordered by created', async () => {
        let positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { created: OrderDirection.Desc },
        });
        assertOk(positions);
        expect(positions.value.length).toBeGreaterThan(0);

        positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { created: OrderDirection.Asc },
        });
        assertOk(positions);
        expect(positions.value.length).toBeGreaterThan(0);
      });

      it('Then it should return the positions ordered by netCollateral', async () => {
        let positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { netCollateral: OrderDirection.Desc },
        });
        assertOk(positions);
        expect(
          positions.value[0]?.netCollateral.amount.value,
        ).toBeBigDecimalGreaterThan(
          positions.value[1]?.netCollateral.amount.value,
        );

        positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { netCollateral: OrderDirection.Asc },
        });
        assertOk(positions);
        expect(
          positions.value[0]?.netCollateral.amount.value,
        ).toBeBigDecimalLessThan(
          positions.value[1]?.netCollateral.amount.value,
        );
      });
    });
  });
});
