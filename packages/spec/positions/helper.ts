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
  findReserveAndSupply,
  supplyWSTETHAndBorrowETH,
} from '../helpers/supplyBorrow';
import {
  repayFromReserve,
  withdrawFromReserve,
} from '../helpers/withdrawRepay';

export const recreateUserActivities = async (
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
        amount: bigDecimal('1000'),
      }),
    )
    .andThen(() =>
      findReserveAndSupply(client, user, {
        token: ETHEREUM_GHO_ADDRESS,
        amount: bigDecimal('100'),
      }),
    )
    .andThen(() =>
      fundErc20Address(evmAddress(user.account.address), {
        address: ETHEREUM_USDC_ADDRESS,
        amount: bigDecimal('1000'),
      }),
    )
    .andThen(() =>
      findReserveAndSupply(client, user, {
        token: ETHEREUM_USDC_ADDRESS,
        amount: bigDecimal('100'),
      }),
    )
    .andThen((reserve) =>
      withdraw(client, {
        reserve: reserve.id,
        amount: {
          erc20: {
            exact: bigDecimal('50'),
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
