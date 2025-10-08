import { assertOk, bigDecimal, evmAddress } from '@aave/client-next';
import { permitTypedData, repay, userBorrows } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_GHO_ADDRESS,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith, signERC20PermitWith } from '@aave/client-next/viem';
import type { Reserve } from '@aave/graphql-next';
import { beforeAll, describe, expect, it } from 'vitest';
import { assertSingleElementArray } from '../test-utils';
import { supplyAndBorrow } from './helper';

const user = await createNewWallet();

describe('Aave V4 Repay Scenario', () => {
  describe('Given a user with a borrow position', () => {
    describe('When the user repays their loan', () => {
      let reserve: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_USDC_ADDRESS,
          amount: bigDecimal('300'),
          decimals: 6,
        }).andThen(() => supplyAndBorrow(client, user, ETHEREUM_USDC_ADDRESS));

        assertOk(setup);
        reserve = setup.value;
      });
      // TODO: Enable when bug is fixed
      it.skip('Then it should be reflected in the user positions', async () => {
        const repayResult = await repay(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
          },
          sender: evmAddress(user.account.address),
          amount: {
            erc20: {
              value: {
                max: true,
              },
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
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(repayResult);
        expect(repayResult.value.length).toBe(0);
      });
    });

    describe('When the user repays a partial amount of their loan', () => {
      let reserve: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_USDC_ADDRESS,
          amount: bigDecimal('300'),
          decimals: 6,
        }).andThen(() => supplyAndBorrow(client, user, ETHEREUM_USDC_ADDRESS));

        assertOk(setup);
        reserve = setup.value;
      });

      it('Then it should be reflected in the user positions', async () => {
        const amountToRepay = bigDecimal('25');

        const repayResult = await repay(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
          },
          sender: evmAddress(user.account.address),
          amount: {
            erc20: {
              value: {
                exact: amountToRepay,
              },
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
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(repayResult);
        assertSingleElementArray(repayResult.value);
        expect(
          repayResult.value[0].amount.value.formatted,
        ).toBeBigDecimalCloseTo(amountToRepay, 2);
      });
    });

    describe('When the user repays a loan with a permit signature', () => {
      let reserve: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_GHO_ADDRESS,
          amount: bigDecimal('300'),
        }).andThen(() => supplyAndBorrow(client, user, ETHEREUM_GHO_ADDRESS));

        assertOk(setup);
        reserve = setup.value;
      });

      it('Then it should allow to repay their own loan without needing for an ERC20 Approval transaction', async ({
        annotate,
      }) => {
        const amountToRepay = bigDecimal('25');

        const signature = await permitTypedData(client, {
          repay: {
            amount: {
              exact: amountToRepay,
            },
            reserve: {
              reserveId: reserve.id,
              chainId: reserve.chain.chainId,
              spoke: reserve.spoke.address,
            },
            sender: evmAddress(user.account!.address),
          },
        }).andThen(signERC20PermitWith(user));
        assertOk(signature);

        const repayResult = await repay(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
          },
          sender: evmAddress(user.account!.address),
          amount: {
            erc20: {
              permitSig: signature.value,
              value: {
                exact: amountToRepay,
              },
            },
          },
        })
          .andTee((tx) => expect(tx.__typename).toEqual('TransactionRequest'))
          .andThen(sendWith(user))
          .andTee((tx) => annotate(`tx hash: ${tx.txHash}`))
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
        assertOk(repayResult);
        assertSingleElementArray(repayResult.value);
        expect(
          repayResult.value[0].amount.value.formatted,
        ).toBeBigDecimalCloseTo(amountToRepay, 2);
      });
    });
  });
});
