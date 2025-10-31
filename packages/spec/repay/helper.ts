import type { AaveClient, Reserve } from '@aave/client-next';
import {
  bigDecimal,
  type EvmAddress,
  evmAddress,
  invariant,
  type ResultAsync,
} from '@aave/client-next';
import { borrow } from '@aave/client-next/actions';
import { ETHEREUM_SPOKES, ETHEREUM_TOKENS } from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import {
  findReserveToBorrow,
  findReserveToSupply,
  supplyToReserve,
} from '../helpers/borrowSupply';
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
  return findReserveToSupply(client, user, {
    token: params.tokenToSupply,
    asCollateral: true,
  }).andThen((reserveToSupply) =>
    supplyToReserve(client, user, {
      reserve: {
        reserveId: reserveToSupply.id,
        chainId: reserveToSupply.chain.chainId,
        spoke: reserveToSupply.spoke.address,
      },
      amount: { erc20: { value: bigDecimal(0.1) } },
      sender: evmAddress(user.account.address),
      enableCollateral: true,
    })
      .andTee(() => sleep(1000)) // TODO: Remove after fixed bug with delays of propagation
      .andThen(() =>
        findReserveToBorrow(client, user, { token: params.tokenToBorrow }),
      )
      .andThen((reserveToBorrow) =>
        borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: {
            spoke: reserveToBorrow.spoke.address,
            reserveId: reserveToBorrow.id,
            chainId: reserveToBorrow.chain.chainId,
          },
          amount: {
            erc20: {
              value: bigDecimal(
                Number(reserveToBorrow.userState!.borrowable.amount.value) *
                  (params.percentToBorrow ?? 0.25),
              ),
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .map(() => ({
            borrowReserve: reserveToBorrow,
            supplyReserve: reserveToSupply,
          })),
      ),
  );
}

export function supplyWSTETHAndBorrowETH(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
): ResultAsync<{ borrowReserve: Reserve; supplyReserve: Reserve }, Error> {
  return findReserveToSupply(client, user, {
    token: ETHEREUM_TOKENS.wstETH,
    spoke: ETHEREUM_SPOKES.E_MODE_SPOKE,
  }).andThen((reserveToSupply) =>
    supplyToReserve(client, user, {
      reserve: {
        reserveId: reserveToSupply.id,
        chainId: reserveToSupply.chain.chainId,
        spoke: reserveToSupply.spoke.address,
      },
      amount: { erc20: { value: bigDecimal(0.2) } },
      sender: evmAddress(user.account.address),
      enableCollateral: true,
    })
      .andTee(() => sleep(1000)) // TODO: Remove after fixed bug with delays of propagation
      .andThen(() =>
        findReserveToBorrow(client, user, {
          token: ETHEREUM_TOKENS.WETH,
          spoke: ETHEREUM_SPOKES.E_MODE_SPOKE,
        }),
      )
      .andThen((reserveToBorrow) =>
        borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: {
            spoke: reserveToBorrow.spoke.address,
            reserveId: reserveToBorrow.id,
            chainId: reserveToBorrow.chain.chainId,
          },
          amount: {
            native: reserveToBorrow.userState!.borrowable.amount.value,
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .map(() => ({
            borrowReserve: reserveToBorrow,
            supplyReserve: reserveToSupply,
          })),
      ),
  );
}
