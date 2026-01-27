import type {
  AaveClient,
  BorrowRequest,
  Reserve,
  ReserveId,
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

export function fundAndSupplyToReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  { reserveId, amount }: { reserveId: ReserveId; amount: BigDecimal },
): ResultAsync<TxHash, Error> {
  return reserve(client, {
    query: { reserveId: reserveId },
    user: evmAddress(user.account.address),
  }).andThen((reserve) => {
    return fundErc20Address(evmAddress(user.account.address), {
      address: reserve!.asset.underlying.address,
      amount: amount,
      decimals: reserve!.asset.underlying.info.decimals,
    }).andThen(() =>
      supplyToReserve(client, user, {
        reserve: reserveId,
        amount: {
          erc20: {
            value: amount,
          },
        },
        sender: evmAddress(user.account.address),
        enableCollateral: true,
      }),
    );
  });
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
    swappable,
  }: {
    token?: EvmAddress;
    amount?: BigDecimal;
    spoke?: SpokeId;
    asCollateral?: boolean;
    swappable?: boolean;
  },
): ResultAsync<{ reserveInfo: Reserve; amountSupplied: BigDecimal }, Error> {
  return findReservesToSupply(client, user, {
    token: token,
    spoke: spoke,
    canUseAsCollateral: true, // Only consider reserves that support collateral; actual enabling is controlled by `asCollateral` / `enableCollateral` below
  }).andThen((reserves) => {
    const targetReserve = swappable
      ? reserves.find((reserve) => reserve.canSwapFrom === true)
      : reserves[0]!;
    invariant(targetReserve, 'Target reserve not found');
    const amountToSupply =
      amount ??
      targetReserve.supplyCap
        .minus(targetReserve.summary.supplied.amount.value)
        .div(100000);

    return fundErc20Address(evmAddress(user.account.address), {
      address: token ?? targetReserve.asset.underlying.address,
      amount: amountToSupply,
      decimals: targetReserve.asset.underlying.info.decimals,
    }).andThen(() =>
      supplyToReserve(client, user, {
        reserve: targetReserve.id,
        amount: {
          erc20: {
            value: amountToSupply,
          },
        },
        sender: evmAddress(user.account.address),
        enableCollateral: asCollateral ? true : null,
      }).map(() => ({
        reserveInfo: targetReserve,
        amountSupplied: amountToSupply,
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
): ResultAsync<{ reserve: Reserve; amountBorrowed: BigDecimal }, Error> {
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
    }).map(() => ({
      reserve: reserves[0],
      amountBorrowed: reserves[0].userState!.borrowable.amount.value.times(
        params.ratioToBorrow ?? 0.1,
      ),
    }));
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
