import {
  type AaveClient,
  assertOk,
  bigDecimal,
  evmAddress,
} from '@aave/client-next';
import { activities } from '@aave/client-next/actions';
import {
  ETHEREUM_FORK_ID,
  ETHEREUM_GHO_ADDRESS,
  ETHEREUM_SPOKE_CORE_ADDRESS,
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
  supplyToRandomERC20Reserve,
  supplyToReserve,
  supplyWSTETHAndBorrowETH,
} from '../helpers/supplyBorrow';
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
          reserve: {
            reserveId: listReservesToSupply.value[i]!.id,
            chainId: listReservesToSupply.value[i]!.chain.chainId,
            spoke: listReservesToSupply.value[i]!.spoke.address,
          },
          amount: { erc20: { value: bigDecimal('0.2') } },
          sender: evmAddress(user.account.address),
        }).andThen(() =>
          withdrawFromReserve(client, user, {
            reserve: {
              reserveId: listReservesToSupply.value[i]!.id,
              chainId: listReservesToSupply.value[i]!.chain.chainId,
              spoke: listReservesToSupply.value[i]!.spoke.address,
            },
            amount: { erc20: { exact: bigDecimal('0.1') } },
            sender: evmAddress(user.account.address),
          }),
        ),
      );
      assertOk(result);
    }
  }

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
          reserve: {
            reserveId: listReservesToBorrow.value[i]!.id,
            chainId: listReservesToBorrow.value[i]!.chain.chainId,
            spoke: listReservesToBorrow.value[i]!.spoke.address,
          },
          amount: {
            erc20: {
              value: borrowableAmount,
            },
          },
          sender: evmAddress(user.account.address),
        }).andThen(() =>
          repayFromReserve(client, user, {
            reserve: {
              reserveId: listReservesToBorrow.value[i]!.id,
              chainId: listReservesToBorrow.value[i]!.chain.chainId,
              spoke: listReservesToBorrow.value[i]!.spoke.address,
            },
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
      supplyToRandomERC20Reserve(client, user, {
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
