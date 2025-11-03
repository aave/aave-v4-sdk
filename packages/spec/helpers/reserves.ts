import {
  type AaveClient,
  type EvmAddress,
  evmAddress,
  invariant,
  ok,
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
    token?: EvmAddress;
    asCollateral?: boolean;
    native?: boolean;
  } = {},
): ResultAsync<[Reserve, ...Reserve[]], Error> {
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
  }).andThen((listReserves) => {
    invariant(listReserves.length > 0, 'No reserves found');

    const reservesToSupply = listReserves.filter(
      (reserve) =>
        reserve.canSupply &&
        (params.asCollateral ? reserve.canUseAsCollateral === true : true) &&
        (params.native
          ? reserve.asset.underlying.isWrappedNativeToken === true
          : true),
    );
    invariant(
      reservesToSupply.length > 0,
      'No reserves found with the given parameters',
    );
    return ok(reservesToSupply as [Reserve, ...Reserve[]]);
  });
}
