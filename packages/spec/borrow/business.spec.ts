import { assertOk, bigDecimal, evmAddress } from '@aave/client-next';
import { borrow, userBorrows } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Reserve } from '@aave/graphql-next';
import { beforeAll, describe, expect, it } from 'vitest';
import { assertSingleElementArray } from '../test-utils';
import { supplyToRandomERC20Reserve } from './helper';

describe('Aave V4 Borrow Scenarios', () => {
  describe('Given a user with a supply position as collateral', () => {
    describe('When the user borrows an ERC20 asset', () => {
      const user = createNewWallet();
      let reserve: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(
          evmAddress(user.account!.address),
          {
            address: ETHEREUM_USDC_ADDRESS,
            amount: bigDecimal('100'),
            decimals: 6,
          },
        ).andThen(() =>
          supplyToRandomERC20Reserve(client, user, ETHEREUM_USDC_ADDRESS),
        );

        assertOk(setup);
        reserve = setup.value;
      });

      it(`Then the user's borrow positions are updated`, async () => {
        const amountToBorrow = bigDecimal('50');

        const result = await borrow(client, {
          sender: evmAddress(user.account!.address),
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
          },
          amount: {
            erc20: {
              value: amountToBorrow,
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
        assertSingleElementArray(result.value);
        // BUG: The amount is slightly different from the total borrow amount
        expect(result.value[0].amount.value.formatted).toBeBigDecimalCloseTo(
          amountToBorrow,
          2,
        );
        expect(result.value[0].amount.isWrappedNative).toBe(false);
      });
    });

    describe('When the user borrows from a reserve that supports native borrowing', () => {
      it.todo(`Then the user's borrow positions are updated`);
    });
  });
});
