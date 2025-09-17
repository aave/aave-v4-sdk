import { borrow, userBorrows } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Reserve } from '@aave/graphql-next';
import { assertOk, bigDecimal, evmAddress } from '@aave/types-next';
import { beforeAll, describe, expect, it } from 'vitest';
import { supplyToRandomERC20Reserve } from './helper';

describe('Aave V4 Borrow Scenarios', () => {
  describe('Given a user with a supply position as collateral', () => {
    describe('When the user borrows an ERC20 asset', () => {
      const user = createNewWallet();
      let reserve: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(
          ETHEREUM_USDC_ADDRESS,
          evmAddress(user.account!.address),
          bigDecimal('100'),
          6,
        ).andThen(() =>
          supplyToRandomERC20Reserve(client, user, ETHEREUM_USDC_ADDRESS),
        );

        assertOk(setup);
        reserve = setup.value;
      });

      it(`Then the user's borrow positions are updated`, async () => {
        const result = await borrow(client, {
          sender: evmAddress(user.account!.address),
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
          },
          amount: {
            erc20: {
              value: bigDecimal('50'),
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userBorrows(client, {
              query: {
                userSpoke: {
                  spoke: {
                    address: reserve.spoke.address,
                    chainId: reserve.chain.chainId,
                  },
                  user: evmAddress(user.account!.address),
                },
              },
            }),
          );

        assertOk(result);
        expect(result.value.length).toBe(1);
        expect(result.value[0]?.amount.value).toMatchSnapshot();
        expect(result.value[0]?.paid.value).toMatchSnapshot();
        expect(result.value[0]?.amount.isWrappedNative).toBe(false);
      });
    });

    describe('When the user borrows from a reserve that supports native borrowing', () => {
      it.todo(`Then the user's borrow positions are updated`);
    });
  });
});
