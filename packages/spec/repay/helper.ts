import type { AaveClient, Reserve } from '@aave/client-next';
import {
  bigDecimal,
  type EvmAddress,
  evmAddress,
  invariant,
  type ResultAsync,
} from '@aave/client-next';
import { borrow } from '@aave/client-next/actions';
import {
  ETHEREUM_SPOKE_EMODE_ADDRESS,
  ETHEREUM_SPOKE_ISO_GOV_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
  ETHEREUM_WSTETH_ADDRESS,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import { supplyToReserve } from '../borrow/helper';
import {
  findReservesToBorrow,
  findReservesToSupply,
} from '../helpers/reserves';
import { sleep } from '../helpers/tools';

export function supplyAndBorrow(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: {
    tokenToSupply: EvmAddress;
    tokenToBorrow: EvmAddress;
    percentToBorrow?: number;
  },
): ResultAsync<{ borrowReserve: Reserve; supplyReserve: Reserve }, Error> {
  if (params.percentToBorrow) {
    invariant(
      params.percentToBorrow >= 0 && params.percentToBorrow <= 1,
      'Percent to borrow must be between 0 and 1',
    );
  }
  return findReservesToSupply(client, user, {
    token: params.tokenToSupply,
    spoke: ETHEREUM_SPOKE_ISO_GOV_ADDRESS,
    asCollateral: true,
  }).andThen((listSupplyReserves) =>
    supplyToReserve(client, user, {
      reserve: {
        reserveId: listSupplyReserves[0].id,
        chainId: listSupplyReserves[0].chain.chainId,
        spoke: listSupplyReserves[0].spoke.address,
      },
      amount: { erc20: { value: bigDecimal(0.1) } },
      sender: evmAddress(user.account.address),
      enableCollateral: true,
    })
      .andTee(() => sleep(1000)) // TODO: Remove after fixed bug with delays of propagation
      .andThen(() =>
        findReservesToBorrow(client, user, {
          token: params.tokenToBorrow,
          spoke: ETHEREUM_SPOKE_ISO_GOV_ADDRESS,
        }),
      )
      .andThen((reservesToBorrow) =>
        borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: {
            spoke: reservesToBorrow[0].spoke.address,
            reserveId: reservesToBorrow[0].id,
            chainId: reservesToBorrow[0].chain.chainId,
          },
          amount: {
            erc20: {
              value: bigDecimal(
                Number(reservesToBorrow[0].userState!.borrowable.amount.value) *
                  (params.percentToBorrow ?? 0.25),
              ),
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .map(() => ({
            borrowReserve: reservesToBorrow[0],
            supplyReserve: listSupplyReserves[0],
          })),
      ),
  );
}

export function supplyWSTETHAndBorrowETH(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
): ResultAsync<{ borrowReserve: Reserve; supplyReserve: Reserve }, Error> {
  return findReservesToSupply(client, user, {
    token: ETHEREUM_WSTETH_ADDRESS,
    spoke: ETHEREUM_SPOKE_EMODE_ADDRESS,
  }).andThen((listSupplyReserves) =>
    supplyToReserve(client, user, {
      reserve: {
        reserveId: listSupplyReserves[0].id,
        chainId: listSupplyReserves[0].chain.chainId,
        spoke: listSupplyReserves[0].spoke.address,
      },
      amount: { erc20: { value: bigDecimal(0.2) } },
      sender: evmAddress(user.account.address),
      enableCollateral: true,
    })
      .andTee(() => sleep(1000)) // TODO: Remove after fixed bug with delays of propagation
      .andThen(() =>
        findReservesToBorrow(client, user, {
          token: ETHEREUM_WETH_ADDRESS,
          spoke: ETHEREUM_SPOKE_EMODE_ADDRESS,
        }),
      )
      .andThen((reservesToBorrow) =>
        borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: {
            spoke: reservesToBorrow[0].spoke.address,
            reserveId: reservesToBorrow[0].id,
            chainId: reservesToBorrow[0].chain.chainId,
          },
          amount: {
            native: reservesToBorrow[0].userState!.borrowable.amount.value,
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .map(() => ({
            borrowReserve: reservesToBorrow[0],
            supplyReserve: listSupplyReserves[0],
          })),
      ),
  );
}
