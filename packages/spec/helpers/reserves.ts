import {
  type AaveClient,
  type EvmAddress,
  evmAddress,
  invariant,
  type Reserve,
  ReservesRequestFilter,
  type ResultAsync,
} from '@aave/client-next';
import { reserves } from '@aave/client-next/actions';
import { ETHEREUM_FORK_ID } from '@aave/client-next/test-utils';
import type { Account, Chain, Transport, WalletClient } from 'viem';

export function findReservesToSupply(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: {
    spoke?: EvmAddress;
    asCollateral?: boolean;
    native?: boolean;
  } = {},
): ResultAsync<Reserve[], Error> {
  return reserves(client, {
    query: params.spoke
      ? {
          spoke: {
            chainId: ETHEREUM_FORK_ID,
            address: params.spoke,
          },
        }
      : {
          chainIds: [ETHEREUM_FORK_ID],
        },
    user: evmAddress(user.account.address),
    filter: ReservesRequestFilter.Supply,
  }).map((listReserves) => {
    invariant(listReserves.length > 0, 'No reserves found');
    const reservesToSupply = listReserves.filter(
      (reserve) =>
        reserve.canSupply &&
        (params.asCollateral ? reserve.canUseAsCollateral === true : true) &&
        (params.native
          ? reserve.asset.underlying.isWrappedNativeToken === true
          : true),
    );
    invariant(reservesToSupply.length > 0, 'No reserves found to supply');
    return reservesToSupply;
  });
}

export function findReservesToBorrow(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: {
    spoke?: EvmAddress;
  } = {},
): ResultAsync<Reserve[], Error> {
  return reserves(client, {
    query: params.spoke
      ? {
          spoke: {
            chainId: ETHEREUM_FORK_ID,
            address: params.spoke,
          },
        }
      : {
          chainIds: [ETHEREUM_FORK_ID],
        },
    user: evmAddress(user.account.address),
    filter: ReservesRequestFilter.Borrow,
  }).map((listReserves) => {
    invariant(listReserves.length > 0, 'No reserves found');
    const reservesToBorrow = listReserves.filter(
      (reserve) => reserve.canBorrow === true,
    );
    invariant(reservesToBorrow.length > 0, 'No reserves found to borrow');
    return reservesToBorrow;
  });
}
