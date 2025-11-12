import {
  type AaveClient,
  assertOk,
  bigDecimal,
  evmAddress,
} from '@aave/client-next';
import { activities, userBorrows } from '@aave/client-next/actions';
import {
  ETHEREUM_FORK_ID,
  ETHEREUM_GHO_ADDRESS,
  ETHEREUM_SPOKE_CORE_ADDRESS,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_WETH_ADDRESS,
  ETHEREUM_WSTETH_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import {
  findReservesToBorrow,
  findReservesToSupply,
} from '../helpers/reserves';
import {
  borrowFromReserve,
  findReserveAndSupply,
  supplyToReserve,
  supplyWSTETHAndBorrowETH,
} from '../helpers/supplyBorrow';
import { sleep } from '../helpers/tools';
import {
  repayFromReserve,
  withdrawFromReserve,
} from '../helpers/withdrawRepay';

export const recreateUserActivities = async (
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
): Promise<void> => {
  // First: check activities
  const listActivities = await activities(client, {
    user: evmAddress(user.account.address),
    query: {
      chainIds: [ETHEREUM_FORK_ID],
    },
  });
  assertOk(listActivities);
  const supplyActivities = listActivities.value.items.filter(
    (item) => item.__typename === 'SupplyActivity',
  );
  const borrowActivities = listActivities.value.items.filter(
    (item) => item.__typename === 'BorrowActivity',
  );
  const withdrawActivities = listActivities.value.items.filter(
    (item) => item.__typename === 'WithdrawActivity',
  );
  const repayActivities = listActivities.value.items.filter(
    (item) => item.__typename === 'RepayActivity',
  );
  // const setCollateralActivities = listActivities.value.items.filter(
  //   (item) => item.__typename === 'UsingAsCollateralActivity',
  // );

  // Supply/Withdraw activities: minimum 3 supply activities
  const listReservesToSupply = await findReservesToSupply(client, user, {
    asCollateral: true,
    spoke: ETHEREUM_SPOKE_CORE_ADDRESS,
  });
  if (supplyActivities.length < 3 || withdrawActivities.length < 3) {
    assertOk(listReservesToSupply);
    for (
      let i = Math.max(supplyActivities.length, withdrawActivities.length);
      i < 3;
      i++
    ) {
      const result: any = await fundErc20Address(
        evmAddress(user.account.address),
        {
          address: listReservesToSupply.value[i]!.asset.underlying.address,
          amount: bigDecimal('0.2'),
          decimals:
            listReservesToSupply.value[i]!.asset.underlying.info.decimals,
        },
      ).andThen(() =>
        supplyToReserve(client, user, {
          reserve: listReservesToSupply.value[i]!.id,
          amount: { erc20: { value: bigDecimal('0.2') } },
          sender: evmAddress(user.account.address),
        }).andThen(() =>
          withdrawFromReserve(client, user, {
            reserve: listReservesToSupply.value[i]!.id,
            amount: { erc20: { exact: bigDecimal('0.1') } },
            sender: evmAddress(user.account.address),
          }),
        ),
      );
      assertOk(result);
    }
  }

  // TODO: Enable when fixed AAVE-2555
  // SetCollateral activity: at least 1 set collateral activity
  // if (setCollateralActivities.length < 1) {
  //   const supplyPositions = await userSupplies(client, {
  //     query: {
  //       userChains: {
  //         chainIds: [ETHEREUM_FORK_ID],
  //         user: evmAddress(user.account.address),
  //       },
  //     },
  //   });
  //   assertOk(supplyPositions);
  //   assertNonEmptyArray(supplyPositions.value);
  //   const supplyPosition = supplyPositions.value[0]!;
  //   const result = await setUserSupplyAsCollateral(client, {
  //     reserve: supplyPosition.reserve.id,
  //     sender: evmAddress(user.account.address),
  //     enableCollateral: !supplyPosition.isCollateral,
  //   })
  //     .andThen(sendWith(user))
  //     .andThen(client.waitForTransaction)
  //     .andTee(() => sleep(1000)) // TODO: Remove after fixed bug with delays of propagation
  //     .andThen(() =>
  //       setUserSupplyAsCollateral(client, {
  //         reserve: supplyPosition.reserve.id,
  //         sender: evmAddress(user.account.address),
  //         enableCollateral: supplyPosition.isCollateral,
  //       }),
  //     )
  //     .andThen(sendWith(user))
  //     .andThen(client.waitForTransaction);
  //   assertOk(result);
  // }

  // Borrow and repay activities: minimum 3 borrow and repay activities
  const listReservesToBorrow = await findReservesToBorrow(client, user, {
    spoke: ETHEREUM_SPOKE_CORE_ADDRESS,
  });
  assertOk(listReservesToBorrow);
  if (borrowActivities.length < 3 || repayActivities.length < 3) {
    for (
      let i = Math.max(borrowActivities.length, repayActivities.length);
      i < 3;
      i++
    ) {
      const borrowableAmount =
        listReservesToBorrow.value[i]!.userState!.borrowable.amount.value.div(
          100,
        );
      const result: any = await fundErc20Address(
        evmAddress(user.account.address),
        {
          address: listReservesToBorrow.value[i]!.asset.underlying.address,
          amount: borrowableAmount.times(100),
          decimals:
            listReservesToBorrow.value[i]!.asset.underlying.info.decimals,
        },
      ).andThen(() =>
        borrowFromReserve(client, user, {
          reserve: listReservesToBorrow.value[i]!.id,
          amount: {
            erc20: {
              value: borrowableAmount,
            },
          },
          sender: evmAddress(user.account.address),
        }).andThen(() =>
          repayFromReserve(client, user, {
            reserve: listReservesToBorrow.value[i]!.id,
            amount: {
              erc20: {
                value: {
                  exact: borrowableAmount.times(0.5),
                },
              },
            },
            sender: evmAddress(user.account.address),
          }),
        ),
      );
      assertOk(result);
    }
  }
};

export const recreateUserSummary = async (
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
) => {
  const setup = await fundErc20Address(evmAddress(user.account.address), {
    address: ETHEREUM_WETH_ADDRESS,
    amount: bigDecimal('0.5'),
  })
    .andThen(() =>
      fundErc20Address(evmAddress(user.account.address), {
        address: ETHEREUM_WSTETH_ADDRESS,
        amount: bigDecimal('0.5'),
      }),
    )
    .andThen(() =>
      fundErc20Address(evmAddress(user.account.address), {
        address: ETHEREUM_GHO_ADDRESS,
        amount: bigDecimal('100'),
      }),
    )
    .andThen(() =>
      findReserveAndSupply(client, user, {
        token: ETHEREUM_GHO_ADDRESS,
        amount: bigDecimal('100'),
      }),
    )
    // .andThen(() =>
    //   supplyAndBorrow(client, user, {
    //     tokenToSupply: ETHEREUM_USDS_ADDRESS,
    //     tokenToBorrow: ETHEREUM_WETH_ADDRESS,
    //   }),
    // )
    .andThen(() => supplyWSTETHAndBorrowETH(client, user));
  assertOk(setup);
};

export const recreateUserBorrows = async (
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
) => {
  // First: check borrow positions
  const borrowPositions = await userBorrows(client, {
    query: {
      userSpoke: {
        spoke: ETHEREUM_SPOKE_CORE_ID,
        user: evmAddress(user.account.address),
      },
    },
  });
  assertOk(borrowPositions);
  if (borrowPositions.value.length < 3) {
    const supplyResult = await fundErc20Address(
      evmAddress(user.account.address),
      {
        address: ETHEREUM_WETH_ADDRESS,
        amount: bigDecimal('0.1'),
      },
    ).andThen(() =>
      findReserveAndSupply(client, user, {
        token: ETHEREUM_WETH_ADDRESS,
        spoke: ETHEREUM_SPOKE_CORE_ADDRESS,
        amount: bigDecimal('0.05'),
        asCollateral: true,
      }),
    );
    assertOk(supplyResult);

    await sleep(1000); // TODO: Remove after fixed bug with delays of propagation
    const listReservesToBorrow = await findReservesToBorrow(client, user, {
      spoke: ETHEREUM_SPOKE_CORE_ADDRESS,
    });
    assertOk(listReservesToBorrow);

    for (let i = borrowPositions.value.length; i < 3; i++) {
      const borrowResult = await borrowFromReserve(client, user, {
        sender: evmAddress(user.account.address),
        reserve: listReservesToBorrow.value[i]!.id,
        amount: {
          erc20: {
            value:
              listReservesToBorrow.value[
                i
              ]!.userState!.borrowable.amount.value.times(0.1),
          },
        },
      });
      assertOk(borrowResult);
    }
  }
};
