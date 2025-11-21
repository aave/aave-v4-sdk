import {
  type AaveClient,
  assertOk,
  bigDecimal,
  evmAddress,
  type Result,
  type ResultAsync,
  type SpokeId,
  type TxHash,
} from '@aave/client';
import {
  activities,
  setUserSupplyAsCollateral,
  userBorrows,
  userPositions,
  userSupplies,
} from '@aave/client/actions';
import {
  ETHEREUM_FORK_ID,
  ETHEREUM_GHO_ADDRESS,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_SPOKE_ETHENA_ID,
  ETHEREUM_WETH_ADDRESS,
  ETHEREUM_WSTETH_ADDRESS,
  fundErc20Address,
} from '@aave/client/test-utils';
import { sendWith } from '@aave/client/viem';
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
import {
  repayFromReserve,
  withdrawFromReserve,
} from '../helpers/withdrawRepay';
import { assertNonEmptyArray } from '../test-utils';

export const recreateUserActivities = async (
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: {
    spoke: SpokeId;
  },
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
  const setCollateralActivities = listActivities.value.items.filter(
    (item) => item.__typename === 'UsingAsCollateralActivity',
  );

  // Supply/Withdraw activities: minimum 3 supply activities
  const listReservesToSupply = await findReservesToSupply(client, user, {
    asCollateral: true,
    spoke: params.spoke,
  });
  if (supplyActivities.length < 3 || withdrawActivities.length < 3) {
    assertOk(listReservesToSupply);
    for (
      let i = Math.max(supplyActivities.length, withdrawActivities.length);
      i < 3;
      i++
    ) {
      const result: Result<TxHash, Error> = await fundErc20Address(
        evmAddress(user.account.address),
        {
          address: listReservesToSupply.value[i]!.asset.underlying.address,
          amount: bigDecimal('0.2'),
          decimals:
            listReservesToSupply.value[i]!.asset.underlying.info.decimals,
        },
      ).andThen(
        (): ResultAsync<TxHash, Error> =>
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

  // SetCollateral activity: at least 1 set collateral activity
  if (setCollateralActivities.length < 1) {
    const supplyPositions = await userSupplies(client, {
      query: {
        userChains: {
          chainIds: [ETHEREUM_FORK_ID],
          user: evmAddress(user.account.address),
        },
      },
    });
    assertOk(supplyPositions);
    assertNonEmptyArray(supplyPositions.value);
    const supplyPosition = supplyPositions.value[0]!;
    const result = await setUserSupplyAsCollateral(client, {
      reserve: supplyPosition.reserve.id,
      sender: evmAddress(user.account.address),
      enableCollateral: !supplyPosition.isCollateral,
    })
      .andThen(sendWith(user))
      .andThen(client.waitForTransaction)
      .andThen(() =>
        setUserSupplyAsCollateral(client, {
          reserve: supplyPosition.reserve.id,
          sender: evmAddress(user.account.address),
          enableCollateral: supplyPosition.isCollateral,
        }),
      )
      .andThen(sendWith(user))
      .andThen(client.waitForTransaction);
    assertOk(result);
  }

  // Borrow and repay activities: minimum 3 borrow and repay activities
  const listReservesToBorrow = await findReservesToBorrow(client, user, {
    spoke: params.spoke,
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
      const result: Result<TxHash, Error> = await fundErc20Address(
        evmAddress(user.account.address),
        {
          address: listReservesToBorrow.value[i]!.asset.underlying.address,
          amount: borrowableAmount.times(100),
          decimals:
            listReservesToBorrow.value[i]!.asset.underlying.info.decimals,
        },
      ).andThen(
        (): ResultAsync<TxHash, Error> =>
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
    .andThen(() =>
      supplyWSTETHAndBorrowETH(client, user, {
        amountToSupply: bigDecimal('0.05'),
        ratioToBorrow: 0.4,
      }),
    );
  assertOk(setup);
};

export const recreateUserBorrows = async (
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: {
    spoke: SpokeId;
  },
) => {
  // First: check borrow positions
  const borrowPositions = await userBorrows(client, {
    query: {
      userSpoke: {
        spoke: params.spoke,
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
        spoke: params.spoke,
        amount: bigDecimal('0.05'),
        asCollateral: true,
      }),
    );
    assertOk(supplyResult);

    const listReservesToBorrow = await findReservesToBorrow(client, user, {
      spoke: params.spoke,
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

export const recreateUserPositions = async (
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params?: {
    spokes: SpokeId[];
  },
) => {
  let [
    firstSpoke = ETHEREUM_SPOKE_CORE_ID,
    secondSpoke = ETHEREUM_SPOKE_ETHENA_ID,
  ] = params?.spokes ?? [];

  // If only one spoke was provided, fill in the missing one
  if (params?.spokes.length === 1) {
    secondSpoke =
      firstSpoke === ETHEREUM_SPOKE_CORE_ID
        ? ETHEREUM_SPOKE_ETHENA_ID
        : ETHEREUM_SPOKE_CORE_ID;
  }

  // Check if at least 2 positions are already created
  const userGlobalPositions = await userPositions(client, {
    user: evmAddress(user.account.address),
    filter: {
      chainIds: [ETHEREUM_FORK_ID],
    },
  });
  assertOk(userGlobalPositions);
  if (userGlobalPositions.value.length < 2) {
    // One position is a supply/borrow in a specific spoke
    const listReservesToSupplyCoreSpoke = await findReservesToSupply(
      client,
      user,
      {
        spoke: firstSpoke,
        asCollateral: true,
      },
    );
    assertOk(listReservesToSupplyCoreSpoke);

    const resultCoreSpoke = await fundErc20Address(
      evmAddress(user.account.address),
      {
        address:
          listReservesToSupplyCoreSpoke.value[0]!.asset.underlying.address,
        amount: bigDecimal('1'),
        decimals:
          listReservesToSupplyCoreSpoke.value[0]!.asset.underlying.info
            .decimals,
      },
    ).andThen(() =>
      supplyToReserve(client, user, {
        reserve: listReservesToSupplyCoreSpoke.value[0]!.id,
        amount: { erc20: { value: bigDecimal('0.2') } },
        sender: evmAddress(user.account.address),
      })
        .andThen(() =>
          findReservesToBorrow(client, user, {
            spoke: firstSpoke,
          }),
        )
        .andThen((listReservesToBorrowCoreSpoke) =>
          borrowFromReserve(client, user, {
            reserve: listReservesToBorrowCoreSpoke[0].id,
            amount: {
              erc20: {
                value:
                  listReservesToBorrowCoreSpoke[0].userState!.borrowable.amount.value.times(
                    0.1,
                  ),
              },
            },
            sender: evmAddress(user.account.address),
          }),
        ),
    );
    assertOk(resultCoreSpoke);

    // Second position is a supply/borrow in a specific spoke
    const listReservesToSupplyEmodeSpoke = await findReservesToSupply(
      client,
      user,
      {
        spoke: secondSpoke,
        asCollateral: true,
      },
    );
    assertOk(listReservesToSupplyEmodeSpoke);

    const resultEmodeSpoke = await fundErc20Address(
      evmAddress(user.account.address),
      {
        address:
          listReservesToSupplyEmodeSpoke.value[0]!.asset.underlying.address,
        amount: bigDecimal('1'),
        decimals:
          listReservesToSupplyEmodeSpoke.value[0]!.asset.underlying.info
            .decimals,
      },
    ).andThen(() =>
      supplyToReserve(client, user, {
        reserve: listReservesToSupplyEmodeSpoke.value[0]!.id,
        amount: { erc20: { value: bigDecimal('0.2') } },
        sender: evmAddress(user.account.address),
      })
        .andThen(() =>
          findReservesToBorrow(client, user, {
            spoke: secondSpoke,
          }),
        )
        .andThen((listReservesToBorrowEmodeSpoke) =>
          borrowFromReserve(client, user, {
            reserve: listReservesToBorrowEmodeSpoke[0].id,
            amount: {
              erc20: {
                value:
                  listReservesToBorrowEmodeSpoke[0].userState!.borrowable.amount.value.times(
                    0.1,
                  ),
              },
            },
            sender: evmAddress(user.account.address),
          }),
        ),
    );
    assertOk(resultEmodeSpoke);
  }
};
