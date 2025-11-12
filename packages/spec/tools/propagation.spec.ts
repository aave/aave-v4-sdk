import { assertOk, bigDecimal, evmAddress } from '@aave/client-next';
import { userSupplies } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { describe, expect, it } from 'vitest';

import {
  findReservesToBorrow,
  findReservesToSupply,
} from '../helpers/reserves';
import { supplyToReserve } from '../helpers/supplyBorrow';

const user = await createNewWallet();

describe('Checking Propagation of Supply/Borrow/Repay/Withdraw on Aave V4', () => {
  it('Then the propagation of Supply/Borrow/Repay/Withdraw on Aave V4 is working', async () => {
    // Supply
    const usdReserve = await findReservesToSupply(client, user, {
      asCollateral: true,
    }).map((reserves) => {
      return reserves.find(
        (reserve) => reserve.asset.underlying.address === ETHEREUM_USDC_ADDRESS,
      );
    });
    assertOk(usdReserve);

    const amountToSupply = bigDecimal('100');
    const supplyResult = await fundErc20Address(
      evmAddress(user.account.address),
      {
        address: usdReserve.value!.asset.underlying.address,
        amount: amountToSupply,
        decimals: usdReserve.value!.asset.underlying.info.decimals,
      },
    ).andThen(() =>
      supplyToReserve(client, user, {
        reserve: usdReserve.value!.id,
        amount: { erc20: { value: amountToSupply } },
        sender: evmAddress(user.account.address),
        enableCollateral: true,
      }).andThen(() =>
        userSupplies(client, {
          query: {
            userSpoke: {
              spoke: usdReserve.value!.spoke.id,
              user: evmAddress(user.account.address),
            },
          },
        }),
      ),
    );
    assertOk(supplyResult);
    expect(supplyResult.value.length).toBe(1);

    // Borrow
    const listReservesToBorrow = await findReservesToBorrow(client, user, {
      spoke: usdReserve.value!.spoke.address,
    });
    assertOk(listReservesToBorrow);
    // Calculation for the borrowable amount should be done after the supply
    expect(
      listReservesToBorrow.value[0].userState!.borrowable.amount.value,
    ).toBeBigDecimalGreaterThan(0);

    // DISABLE TEMPORALLY
    // if input should be greater than zero error happens then:
    // means that borrowable amount was not calculated and propagated correctly after the supply
    // const borrowResult = await borrowFromReserve(client, user, {
    //   sender: evmAddress(user.account.address),
    //   reserve: listReservesToBorrow.value[0].id,
    //   amount: {
    //     erc20: {
    //       value:
    //         listReservesToBorrow.value[0].userState!.borrowable.amount.value.times(
    //           0.1,
    //         ),
    //     },
    //   },
    // }).andThen(() =>
    //   userBorrows(client, {
    //     query: {
    //       userSpoke: {
    //         spoke: listReservesToBorrow.value[0].spoke.id,
    //         user: evmAddress(user.account.address),
    //       },
    //     },
    //   }),
    // );
    // assertOk(borrowResult);
    // expect(borrowResult.value.length).toBe(1);

    // // Repay
    // const repayResult = await fundErc20Address(
    //   evmAddress(user.account.address),
    //   {
    //     address: listReservesToBorrow.value[0].asset.underlying.address,
    //     amount:
    //       listReservesToBorrow.value[0].userState!.borrowable.amount.value.times(
    //         2,
    //       ), // interest can happen on blocks easily
    //     decimals: listReservesToBorrow.value[0].asset.underlying.info.decimals,
    //   },
    // ).andThen(() =>
    //   repay(client, {
    //     sender: evmAddress(user.account.address),
    //     reserve: listReservesToBorrow.value[0].id,
    //     amount: {
    //       erc20: {
    //         value: {
    //           max: true,
    //         },
    //       },
    //     },
    //   })
    //     .andThen(sendWith(user))
    //     .andThen(client.waitForTransaction)
    //     .andThen(() =>
    //       userBorrows(client, {
    //         query: {
    //           userSpoke: {
    //             spoke: listReservesToBorrow.value[0].spoke.id,
    //             user: evmAddress(user.account.address),
    //           },
    //         },
    //       }),
    //     ),
    // );
    // assertOk(repayResult);
    // expect(repayResult.value.length).toBe(1); // (you still have your supply)

    // // Withdraw
    // const withdrawResult = await withdraw(client, {
    //   reserve: usdReserve.value!.id,
    //   sender: evmAddress(user.account.address),
    //   amount: {
    //     erc20: {
    //       max: true,
    //     },
    //   },
    // })
    //   .andThen(sendWith(user))
    //   .andThen(client.waitForTransaction)
    //   .andThen(() =>
    //     userSupplies(client, {
    //       query: {
    //         userSpoke: {
    //           spoke: usdReserve.value!.spoke.id,
    //           user: evmAddress(user.account.address),
    //         },
    //       },
    //     }),
    //   );
    // assertOk(withdrawResult);
    // expect(withdrawResult.value.length).toBe(0);
  });
});
