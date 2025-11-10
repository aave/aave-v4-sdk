import {
  type AaveClient,
  assertOk,
  bigDecimal,
  evmAddress,
} from '@aave/client-next';
import { userBorrows, withdraw } from '@aave/client-next/actions';
import {
  ETHEREUM_GHO_ADDRESS,
  ETHEREUM_SPOKE_CORE_ADDRESS,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
  ETHEREUM_WSTETH_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';

import { findReservesToBorrow } from '../helpers/reserves';
import {
  borrowFromReserve,
  findReserveAndSupply,
  supplyWSTETHAndBorrowETH,
} from '../helpers/supplyBorrow';
import { sleep } from '../helpers/tools';

// TODO: missing following actions to add: repay, liquidated and swap
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
        },
        sender: evmAddress(user.account.address),
      }),
    )
    .andThen(sendWith(user))
    .andThen(client.waitForTransaction)
    // .andThen(() =>
    //   supplyAndBorrow(client, user, {
    //     tokenToSupply: ETHEREUM_USDS_ADDRESS,
    //     tokenToBorrow: ETHEREUM_WETH_ADDRESS,
    //   }),
    // )
    .andThen(() => supplyWSTETHAndBorrowETH(client, user));
  assertOk(setup);
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
