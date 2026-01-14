import type {
  AaveClient,
  BorrowRequest,
  Reserve,
  SpokeId,
  SupplyRequest,
} from '@aave/client';
import {
  type BigDecimal,
  type EvmAddress,
  evmAddress,
  invariant,
  type ResultAsync,
  type TxHash,
} from '@aave/client';

import { borrow, reserve, supply } from '@aave/client/actions';
import { fundErc20Address } from '@aave/client/testing';
import { sendWith } from '@aave/client/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import {
  findReservesToBorrow,
  findReservesToSupply,
} from '../helpers/reserves';

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
  spoke?: SpokeId,
): ResultAsync<Reserve, Error> {
  return findReservesToSupply(client, user, {
    spoke: spoke,
    native: true,
  }).andThen((reserves) =>
    supplyToReserve(client, user, {
      reserve: reserves[0].id,
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
    token?: EvmAddress;
    amount?: BigDecimal;
    spoke?: SpokeId;
    asCollateral?: boolean;
  },
): ResultAsync<{ reserveInfo: Reserve; amountSupplied: BigDecimal }, Error> {
  return findReservesToSupply(client, user, {
    token: token,
    spoke: spoke,
    canUseAsCollateral: asCollateral,
  }).andThen((reserves) => {
    return fundErc20Address(evmAddress(user.account.address), {
      address: token ?? reserves[0]!.asset.underlying.address,
      amount:
        amount ??
        reserves[0]!.supplyCap
          .minus(reserves[0]!.summary.supplied.amount.value)
          .div(100000),
      decimals: reserves[0]!.asset.underlying.info.decimals,
    }).andThen(() =>
      supplyToReserve(client, user, {
        reserve: reserves[0]!.id,
        amount: {
          erc20: {
            value:
              amount ??
              reserves[0]!.supplyCap
                .minus(reserves[0]!.summary.supplied.amount.value)
                .div(100000),
          },
        },
        sender: evmAddress(user.account.address),
        enableCollateral: asCollateral ? true : null,
      }).map(() => ({
        reserveInfo: reserves[0]!,
        amountSupplied:
          amount ??
          reserves[0]!.supplyCap
            .minus(reserves[0]!.summary.supplied.amount.value)
            .div(100000),
      })),
    );
  });
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
    reserve: params.reserveToSupply.id,
    amount: { erc20: { value: params.amountToSupply } },
    sender: evmAddress(user.account.address),
    enableCollateral: true,
  }).andThen(() =>
    reserve(client, {
      user: evmAddress(user.account.address),
      query: {
        reserveId: params.reserveToBorrow.id,
      },
    }).andThen((reserve) =>
      borrow(client, {
        sender: evmAddress(user.account.address),
        reserve: reserve!.id,
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

export function borrowFromRandomReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: {
    spoke?: SpokeId;
    token?: EvmAddress;
    ratioToBorrow?: number;
  },
): ResultAsync<Reserve, Error> {
  return findReservesToBorrow(client, user, {
    spoke: params.spoke,
    token: params.token,
  }).andThen((reserves) => {
    return borrowFromReserve(client, user, {
      reserve: reserves[0].id,
      amount: {
        erc20: {
          value: reserves[0].userState!.borrowable.amount.value.times(
            params.ratioToBorrow ?? 0.1,
          ),
        },
      },
      sender: evmAddress(user.account.address),
    }).map(() => reserves[0]);
  });
}

export function supplyAndBorrowNativeToken(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: {
    spoke: SpokeId;
    ratioToBorrow?: number;
  },
): ResultAsync<{ borrowReserve: Reserve; supplyReserve: Reserve }, Error> {
  return findReservesToSupply(client, user, {
    spoke: params.spoke,
  }).andThen((listSupplyReserves) => {
    const amountToSupply = listSupplyReserves[0].supplyCap
      .minus(listSupplyReserves[0].summary.supplied.amount.value)
      .div(10000);

    // Fund the wallet with the amount to supply
    return fundErc20Address(evmAddress(user.account.address), {
      address: listSupplyReserves[0].asset.underlying.address,
      amount: amountToSupply,
      decimals: listSupplyReserves[0].asset.underlying.info.decimals,
    })
      .andThen(() =>
        supplyToReserve(client, user, {
          reserve: listSupplyReserves[0].id,
          amount: { erc20: { value: amountToSupply } },
          sender: evmAddress(user.account.address),
          enableCollateral: true,
        }),
      )
      .andThen(() =>
        findReservesToBorrow(client, user, {
          spoke: params.spoke,
        }),
      )
      .andThen((reservesToBorrow) => {
        const nativeReserve = reservesToBorrow.find(
          (reserve) => reserve.asset.underlying.isWrappedNativeToken === true,
        );
        invariant(nativeReserve, 'Native reserve not found');

        return borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: nativeReserve.id,
          amount: {
            native: nativeReserve.userState!.borrowable.amount.value.times(
              params.ratioToBorrow ?? 0.2,
            ),
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .map(() => ({
            borrowReserve: nativeReserve,
            supplyReserve: listSupplyReserves[0],
          }));
      });
  });
}
