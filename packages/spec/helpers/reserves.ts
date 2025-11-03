import {
  type AaveClient,
  type EvmAddress,
  evmAddress,
  type Reserve,
  ReservesRequestFilter,
  type ResultAsync,
} from '@aave/client-next';
import { reserves } from '@aave/client-next/actions';
import { ETHEREUM_FORK_ID } from '@aave/client-next/test-utils';
import type { NonEmptyTuple } from 'type-fest';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import { assertNonEmptyArray } from '../test-utils';

export function findReservesToSupply(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: {
    spoke?: EvmAddress;
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
              chainId: ETHEREUM_FORK_ID,
              token: params.token,
              spoke: params.spoke,
            },
          }
        : params.spoke
          ? {
              spoke: {
                chainId: ETHEREUM_FORK_ID,
                address: params.spoke,
              },
            }
          : { chainIds: [ETHEREUM_FORK_ID] },
    user: evmAddress(user.account.address),
    filter: ReservesRequestFilter.Supply,
  }).map((listReserves) => {
    assertNonEmptyArray(listReserves);
    const reservesToSupply = listReserves.filter(
      (reserve) =>
        reserve.canSupply &&
        (params.asCollateral ? reserve.canUseAsCollateral === true : true) &&
        (params.native
          ? reserve.asset.underlying.isWrappedNativeToken === true
          : true),
    );
    assertNonEmptyArray(reservesToSupply);
    return reservesToSupply;
  });
}
