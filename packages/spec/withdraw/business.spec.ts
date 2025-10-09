import { assertOk, bigDecimal, evmAddress } from '@aave/client-next';
import { userSupplies, withdraw } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
  getBalance,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Reserve } from '@aave/graphql-next';
import { beforeEach, describe, expect, it } from 'vitest';
import { supplyToRandomERC20Reserve } from '../borrow/helper';
import { assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

describe('Aave V4 Withdraw Scenario', () => {
  describe('Given a user with a supply position', () => {
    let reserve: Reserve;
    const amountToSupply = 200;

    beforeEach(async () => {
      const setup = await fundErc20Address(evmAddress(user.account!.address), {
        address: ETHEREUM_USDC_ADDRESS,
        amount: bigDecimal('300'),
        decimals: 6,
      }).andThen(() =>
        supplyToRandomERC20Reserve(client, user, {
          token: ETHEREUM_USDC_ADDRESS,
          amount: bigDecimal(amountToSupply),
        }),
      );

      assertOk(setup);
      reserve = setup.value;
    });

    describe('When the user withdraws part of their supply', () => {
      it('Then it should be reflected in the user supply positions', async ({
        annotate,
      }) => {
        annotate(`account address: ${evmAddress(user.account!.address)}`);
        annotate(`reserve id: ${reserve.id}`);
        const amountToWithdraw = 50;
        const balanceBefore = await getBalance(
          evmAddress(user.account.address),
          ETHEREUM_USDC_ADDRESS,
        );

        const withdrawResult = await withdraw(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
          },
          amount: {
            erc20: { exact: bigDecimal(amountToWithdraw) },
          },
          sender: evmAddress(user.account.address),
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userSupplies(client, {
              query: {
                userSpoke: {
                  spoke: {
                    address: reserve.spoke.address,
                    chainId: reserve.chain.chainId,
                  },
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(withdrawResult);
        assertSingleElementArray(withdrawResult.value);
        expect(
          withdrawResult.value[0].amount.value.formatted,
        ).toBeBigDecimalCloseTo(amountToSupply - amountToWithdraw, 2);

        const balanceAfter = await getBalance(
          evmAddress(user.account.address),
          ETHEREUM_USDC_ADDRESS,
        );
        expect(balanceBefore + amountToWithdraw).toEqual(balanceAfter);
      });
    });

    describe('When the user withdraws all of their supply', () => {
      it('Then it should be reflected in the user supply positions', async ({
        annotate,
      }) => {
        annotate(`account address: ${evmAddress(user.account!.address)}`);
        annotate(`reserve id: ${reserve.id}`);
        const balanceBefore = await getBalance(
          evmAddress(user.account.address),
          ETHEREUM_USDC_ADDRESS,
        );

        const withdrawResult = await withdraw(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
          },
          sender: evmAddress(user.account.address),
          amount: {
            erc20: {
              max: true,
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userSupplies(client, {
              query: {
                userSpoke: {
                  spoke: {
                    address: reserve.spoke.address,
                    chainId: reserve.chain.chainId,
                  },
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(withdrawResult);
        expect(withdrawResult.value.length).toBe(0);

        const balanceAfter = await getBalance(
          evmAddress(user.account.address),
          ETHEREUM_USDC_ADDRESS,
        );
        expect(balanceAfter).toBeGreaterThan(balanceBefore);
      });
    });

    describe('Given a user with a supply position in a reserve that allows withdrawals in native tokens', () => {
      describe('When the user withdraws from the reserve in native tokens', () => {
        it.todo('Then the user should receive the amount in native tokens');
      });
    });
  });
});
