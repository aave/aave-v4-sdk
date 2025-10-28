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
import {
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKE_ISO_GOV_ADDRESS,
  ETHEREUM_USDC_ADDRESS,
} from '@aave/client-next/test-utils';
import type { Account, Chain, Transport, WalletClient } from 'viem';

export function findReservesToSupply(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: {
    spoke?: EvmAddress;
    token?: EvmAddress;
    asCollateral?: boolean;
  } = {},
): ResultAsync<Reserve[], Error> {
  return reserves(client, {
    query:
      params.spoke || params.token
        ? {
            spokeToken: {
              chainId: ETHEREUM_FORK_ID,
              token: params.token ?? ETHEREUM_USDC_ADDRESS,
              spoke: params.spoke ?? ETHEREUM_SPOKE_ISO_GOV_ADDRESS,
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
        (params.asCollateral ? reserve.canUseAsCollateral === true : true),
    );
    invariant(reservesToSupply.length > 0, 'No reserves found to supply');
    return reservesToSupply;
  });
}
