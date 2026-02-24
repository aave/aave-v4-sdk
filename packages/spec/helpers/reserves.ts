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
import {
  ETHEREUM_1INCH_ADDRESS,
  ETHEREUM_AAVE_ADDRESS,
  ETHEREUM_FORK_ID,
  ETHEREUM_GHO_ADDRESS,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_USDS_ADDRESS,
  ETHEREUM_WSTETH_ADDRESS,
} from '@aave/client/testing';
import type { NonEmptyTuple } from 'type-fest';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import { assertNonEmptyArray } from '../test-utils';

const PERMIT_SUPPORTED_TOKENS_SHORTLIST: EvmAddress[] = [
  ETHEREUM_1INCH_ADDRESS,
  ETHEREUM_AAVE_ADDRESS,
  ETHEREUM_GHO_ADDRESS,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_USDS_ADDRESS,
  ETHEREUM_WSTETH_ADDRESS,
];

export function findReservesToSupply(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: {
    spoke?: SpokeId;
    token?: EvmAddress;
    canUseAsCollateral?: boolean;
    native?: boolean;
    permitSupported?: boolean;
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
        (params.canUseAsCollateral !== undefined
          ? reserve.canUseAsCollateral === params.canUseAsCollateral
          : true) &&
        (params.native
          ? reserve.asset.underlying.isWrappedNativeToken === true
          : true) &&
        (params.permitSupported
          ? PERMIT_SUPPORTED_TOKENS_SHORTLIST.includes(
              reserve.asset.underlying.address,
            )
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
    permitSupported?: boolean;
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
      (reserve) =>
        reserve.canBorrow === true &&
        (params.permitSupported
          ? PERMIT_SUPPORTED_TOKENS_SHORTLIST.includes(
              reserve.asset.underlying.address,
            )
          : true),
    );
    assertNonEmptyArray(reservesToBorrow);
    return reservesToBorrow;
  });
}
