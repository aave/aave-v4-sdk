import {
  type AaveClient,
  assertOk,
  bigDecimal,
  evmAddress,
} from '@aave/client-next';
import { withdraw } from '@aave/client-next/actions';
import {
  ETHEREUM_SPOKES,
  ETHEREUM_TOKENS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import { supplyToRandomERC20Reserve } from '../borrow/helper';
import {
  findReservesToBorrow,
  findReservesToSupply,
} from '../helpers/reserves';
import { supplyAndBorrow, supplyWSTETHAndBorrowETH } from '../repay/helper';

// TODO: missing following actions to add: repay, liquidated and swap
export const recreateUserActivities = async (
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
) => {
  const supplyReserves = await findReservesToSupply(client, user, {
    asCollateral: true,
    spoke: ETHEREUM_SPOKES.ISO_STABLE_SPOKE,
  });
  const borrowReserves = await findReservesToBorrow(client, user, {
    spoke: ETHEREUM_SPOKES.ISO_STABLE_SPOKE,
  });

  const setup = await fundErc20Address(evmAddress(user.account.address), {
    address: ETHEREUM_TOKENS.WETH,
    amount: bigDecimal('0.5'),
  })
    .andThen(() =>
      fundErc20Address(evmAddress(user.account.address), {
        address: ETHEREUM_TOKENS.wstETH,
        amount: bigDecimal('0.5'),
      }),
    )
    .andThen(() =>
      fundErc20Address(evmAddress(user.account.address), {
        address: ETHEREUM_TOKENS.GHO,
        amount: bigDecimal('1000'),
      }),
    )
    .andThen(() =>
      supplyToRandomERC20Reserve(client, user, {
        token: ETHEREUM_TOKENS.GHO,
        amount: bigDecimal('100'),
      }),
    )
    .andThen(() =>
      fundErc20Address(evmAddress(user.account.address), {
        address: ETHEREUM_TOKENS.USDC,
        amount: bigDecimal('1000'),
      }),
    )
    .andThen(() =>
      supplyToRandomERC20Reserve(client, user, {
        token: ETHEREUM_TOKENS.USDC,
        amount: bigDecimal('100'),
      }),
    )
    .andThen((reserve) =>
      withdraw(client, {
        reserve: {
          reserveId: reserve.id,
          chainId: reserve.chain.chainId,
          spoke: reserve.spoke.address,
        },
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
    .andThen(() =>
      supplyAndBorrow(client, user, {
        tokenToSupply: ETHEREUM_TOKENS.USDS,
        tokenToBorrow: ETHEREUM_TOKENS.WETH,
      }),
    )
    .andThen(() => supplyWSTETHAndBorrowETH(client, user));
  assertOk(setup);
};

export const recreateUserSummary = async (
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
) => {
  const setup = await fundErc20Address(evmAddress(user.account.address), {
    address: ETHEREUM_TOKENS.WETH,
    amount: bigDecimal('0.5'),
  })
    .andThen(() =>
      fundErc20Address(evmAddress(user.account.address), {
        address: ETHEREUM_TOKENS.wstETH,
        amount: bigDecimal('0.5'),
      }),
    )
    .andThen(() =>
      fundErc20Address(evmAddress(user.account.address), {
        address: ETHEREUM_TOKENS.GHO,
        amount: bigDecimal('100'),
      }),
    )
    .andThen(() =>
      supplyToRandomERC20Reserve(client, user, {
        token: ETHEREUM_TOKENS.GHO,
        amount: bigDecimal('100'),
      }),
    )
    .andThen(() =>
      supplyAndBorrow(client, user, {
        tokenToSupply: ETHEREUM_TOKENS.USDS,
        tokenToBorrow: ETHEREUM_TOKENS.WETH,
      }),
    )
    .andThen(() => supplyWSTETHAndBorrowETH(client, user));
  assertOk(setup);
};
