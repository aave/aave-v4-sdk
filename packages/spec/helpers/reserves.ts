import {
  type AaveClient,
  type EvmAddress,
  evmAddress,
  type Reserve,
  ReservesRequestFilter,
  type ResultAsync,
  type SpokeId,
} from '@aave/client';
import { reserves } from '@aave/client/actions';
import { ETHEREUM_FORK_ID } from '@aave/client/testing';
import type { NonEmptyTuple } from 'type-fest';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import { assertNonEmptyArray } from '../test-utils';

export function findReservesToSupply(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: {
    spoke?: SpokeId;
    token?: EvmAddress;
    asCollateral?: boolean;
    native?: boolean;
  } = {},
): ResultAsync<NonEmptyTuple<Reserve>, Error> {
  return reserves(client, {
    query:
      params.token && params.spoke
        ? {
            spokeToken: {
              token: params.token,
              spoke: params.spoke,
            },
          }
        : params.spoke
          ? {
              spokeId: params.spoke,
            }
          : params.token
            ? {
                tokens: [{ chainId: ETHEREUM_FORK_ID, address: params.token }],
              }
            : { chainIds: [ETHEREUM_FORK_ID] },
    user: evmAddress(user.account.address),
    filter: ReservesRequestFilter.Supply,
  }).map((listReserves) => {
    assertNonEmptyArray(listReserves);
    const reservesToSupply = listReserves.filter(
      (reserve) =>
        reserve.canSupply &&
        (params.asCollateral !== undefined
          ? reserve.canUseAsCollateral === params.asCollateral
          : true) &&
        (params.native
          ? reserve.asset.underlying.isWrappedNativeToken === true
          : true),
    );
    assertNonEmptyArray(reservesToSupply);
    return reservesToSupply;
  });
}

export function findReservesToBorrow(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: {
    spoke?: SpokeId;
    token?: EvmAddress;
  } = {},
): ResultAsync<NonEmptyTuple<Reserve>, Error> {
  return reserves(client, {
    query:
      params.spoke && params.token
        ? {
            spokeToken: {
              token: params.token,
              spoke: params.spoke,
            },
          }
        : params.spoke
          ? {
              spokeId: params.spoke,
            }
          : { chainIds: [ETHEREUM_FORK_ID] },
    user: evmAddress(user.account.address),
    filter: ReservesRequestFilter.Borrow,
  }).map((listReserves) => {
    assertNonEmptyArray(listReserves);
    const reservesToBorrow = listReserves.filter(
      (reserve) => reserve.canBorrow === true,
    );
    assertNonEmptyArray(reservesToBorrow);
    return reservesToBorrow;
  });
}
