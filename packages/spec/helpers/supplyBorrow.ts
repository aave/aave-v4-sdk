import type {
  AaveClient,
  BorrowRequest,
  Reserve,
  SupplyRequest,
} from '@aave/client-next';
import {
  type BigDecimal,
  bigDecimal,
  type EvmAddress,
  evmAddress,
  invariant,
  type ResultAsync,
  type TxHash,
} from '@aave/client-next';

import { borrow, reserve, supply } from '@aave/client-next/actions';
import {
  ETHEREUM_SPOKE_EMODE_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
  ETHEREUM_WSTETH_ADDRESS,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import {
  findReservesToBorrow,
  findReservesToSupply,
} from '../helpers/reserves';
import { sleep } from './tools';

export function supplyToReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  request: SupplyRequest,
): ResultAsync<TxHash, Error> {
  return supply(client, request)
    .andThen(sendWith(user))
    .andThen(client.waitForTransaction);
}

export function borrowFromReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  request: BorrowRequest,
): ResultAsync<TxHash, Error> {
  return borrow(client, request)
    .andThen(sendWith(user))
    .andThen(client.waitForTransaction);
}

export function supplyNativeTokenToReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  amount: BigDecimal,
  spoke?: EvmAddress,
): ResultAsync<Reserve, Error> {
  return findReservesToSupply(client, user, {
    spoke: spoke,
    native: true,
  }).andThen((reserves) =>
    supplyToReserve(client, user, {
      reserve: {
        reserveId: reserves[0].id,
        chainId: reserves[0].chain.chainId,
        spoke: reserves[0].spoke.address,
      },
      amount: {
        native: amount,
      },
      sender: evmAddress(user.account.address),
      enableCollateral: true,
    }).map(() => reserves[0]),
  );
}

export function findReserveAndSupply(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  {
    token,
    amount,
    spoke,
    asCollateral,
  }: {
    token: EvmAddress;
    amount: BigDecimal;
    spoke?: EvmAddress;
    asCollateral?: boolean;
  },
): ResultAsync<Reserve, Error> {
  return findReservesToSupply(client, user, {
    token: token,
    spoke: spoke,
    asCollateral: asCollateral,
  }).andThen((reserves) =>
    supplyToReserve(client, user, {
      reserve: {
        reserveId: reserves[0].id,
        chainId: reserves[0].chain.chainId,
        spoke: reserves[0].spoke.address,
      },
      amount: { erc20: { value: amount } },
      sender: evmAddress(user.account.address),
    }).map(() => reserves[0]),
  );
}

export function supplyAndBorrow(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: {
    reserveToSupply: Reserve;
    amountToSupply: BigDecimal;
    reserveToBorrow: Reserve;
    ratioToBorrow?: number;
  },
): ResultAsync<{ borrowReserve: Reserve; supplyReserve: Reserve }, Error> {
  if (params.ratioToBorrow) {
    invariant(
      params.ratioToBorrow >= 0 && params.ratioToBorrow <= 1,
      'Ratio to borrow must be between 0 and 1',
    );
  }
  return supplyToReserve(client, user, {
    reserve: {
      reserveId: params.reserveToSupply.id,
      chainId: params.reserveToSupply.chain.chainId,
      spoke: params.reserveToSupply.spoke.address,
    },
    amount: { erc20: { value: params.amountToSupply } },
    sender: evmAddress(user.account.address),
    enableCollateral: true,
  })
    .andTee(() => sleep(1000)) // TODO: Remove after fixed bug with delays of propagation
    .andThen(() =>
      reserve(client, {
        user: evmAddress(user.account.address),
        query: {
          reserve: {
            reserveId: params.reserveToBorrow.id,
            chainId: params.reserveToBorrow.chain.chainId,
            spoke: params.reserveToBorrow.spoke.address,
          },
        },
      }).andThen((reserve) =>
        borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: {
            reserveId: reserve!.id,
            chainId: reserve!.chain.chainId,
            spoke: reserve!.spoke.address,
          },
          amount: {
            erc20: {
              value: reserve!.userState!.borrowable.amount.value.times(
                params.ratioToBorrow ?? 0.25,
              ),
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .map(() => ({
            borrowReserve: params.reserveToBorrow,
            supplyReserve: params.reserveToSupply,
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
