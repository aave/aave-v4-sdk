import {
  type AaveClient,
  assertOk,
  bigDecimal,
  evmAddress,
  invariant,
} from '@aave/client-next';
import {
  ETHEREUM_SPOKES,
  ETHEREUM_TOKENS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import { borrowFromReserve, supplyToReserve } from '../helpers/borrowSupply';
import {
  findReservesToBorrow,
  findReservesToSupply,
} from '../helpers/reserves';
import { supplyAndBorrow, supplyWSTETHAndBorrowETH } from '../repay/helper';
import { supplyToRandomERC20Reserve } from './borrowSupply';
import { withdrawFromReserve } from './withdrawRepay';

// TODO: missing following actions to add: repay, liquidated and swap
export const recreateUserActivities = async (
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
) => {
  const supplyReserves = await findReservesToSupply(client, user, {
    asCollateral: true,
    spoke: ETHEREUM_SPOKES.ISO_STABLE_SPOKE,
  });
  assertOk(supplyReserves);

  for (const reserve of supplyReserves.value) {
    const result = await fundErc20Address(evmAddress(user.account.address), {
      address: reserve.asset.underlying.address,
      amount: bigDecimal('2'),
    }).andThen(() =>
      supplyToReserve(client, user, {
        reserve: {
          reserveId: reserve.id,
          chainId: reserve.chain.chainId,
          spoke: reserve.spoke.address,
        },
        amount: {
          erc20: {
            value: bigDecimal('1.5'),
          },
        },
        sender: evmAddress(user.account.address),
      }).andThen(() =>
        withdrawFromReserve(client, user, {
          reserve: {
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
            spoke: reserve.spoke.address,
          },
          amount: {
            erc20: {
              exact: bigDecimal('0.1'),
            },
          },
          sender: evmAddress(user.account.address),
        }),
      ),
    );
    assertOk(result);
  }

  const borrowReserves = await findReservesToBorrow(client, user, {
    spoke: ETHEREUM_SPOKES.ISO_STABLE_SPOKE,
  });
  assertOk(borrowReserves);

  for (const reserve of borrowReserves.value) {
    const result = await borrowFromReserve(client, user, {
      sender: evmAddress(user.account.address),
      reserve: {
        reserveId: reserve.id,
        chainId: reserve.chain.chainId,
        spoke: reserve.spoke.address,
      },
      amount: {
        erc20: {
          value: bigDecimal(
            Number(reserve.userState!.borrowable.amount.value) * 0.1,
          ),
        },
      },
    });
    assertOk(result);
  }
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

export const recreateUserSupplies = async (
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
) => {
  const supplyReserves = await findReservesToSupply(client, user, {
    spoke: ETHEREUM_SPOKES.CORE_SPOKE,
  });
  assertOk(supplyReserves);
  const wethReserve = supplyReserves.value.find(
    (reserve) => reserve.asset.underlying.address === ETHEREUM_TOKENS.WETH,
  );
  invariant(wethReserve, 'WETH reserve not found');

  const usdcReserve = supplyReserves.value.find(
    (reserve) => reserve.asset.underlying.address === ETHEREUM_TOKENS.USDC,
  );
  invariant(usdcReserve, 'USDC reserve not found');

  const usdsReserve = supplyReserves.value.find(
    (reserve) => reserve.asset.underlying.address === ETHEREUM_TOKENS.USDS,
  );
  invariant(usdsReserve, 'USDS reserve not found');

  const setup = await fundErc20Address(evmAddress(user.account.address), {
    address: ETHEREUM_TOKENS.WETH,
    amount: bigDecimal('0.5'),
  })
    .andThen(() =>
      supplyToReserve(client, user, {
        reserve: {
          reserveId: wethReserve.id,
          chainId: wethReserve.chain.chainId,
          spoke: wethReserve.spoke.address,
        },
        amount: {
          erc20: {
            value: bigDecimal('0.3'),
          },
        },
        sender: evmAddress(user.account.address),
      }),
    )
    .andThen(() =>
      fundErc20Address(evmAddress(user.account.address), {
        address: ETHEREUM_TOKENS.USDC,
        amount: bigDecimal('50'),
        decimals: 6,
      }),
    )
    .andThen(() =>
      supplyToReserve(client, user, {
        reserve: {
          reserveId: usdcReserve.id,
          chainId: usdcReserve.chain.chainId,
          spoke: usdcReserve.spoke.address,
        },
        amount: {
          erc20: {
            value: bigDecimal('40'),
          },
        },
        sender: evmAddress(user.account.address),
      }),
    )
    .andThen(() =>
      fundErc20Address(evmAddress(user.account.address), {
        address: ETHEREUM_TOKENS.USDS,
        amount: bigDecimal('50'),
      }),
    )
    .andThen(() =>
      supplyToReserve(client, user, {
        reserve: {
          reserveId: usdsReserve.id,
          chainId: usdsReserve.chain.chainId,
          spoke: usdsReserve.spoke.address,
        },
        amount: {
          erc20: {
            value: bigDecimal('40'),
          },
        },
        sender: evmAddress(user.account.address),
      }),
    );
  assertOk(setup);
};
