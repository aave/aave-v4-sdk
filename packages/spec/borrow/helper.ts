import type { AaveClient, Reserve, SupplyRequest } from '@aave/client-next';
import {
  bigDecimal,
  type EvmAddress,
  evmAddress,
  invariant,
  ReservesRequestFilter,
  type ResultAsync,
  type TxHash,
} from '@aave/client-next';
import { reserves, supply } from '@aave/client-next/actions';
import { ETHEREUM_FORK_ID } from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';

export function supplyToReserve(
  client: AaveClient,
  request: SupplyRequest,
  user: WalletClient<Transport, Chain, Account>,
): ResultAsync<TxHash, Error> {
  return supply(client, request)
    .andThen(sendWith(user))
    .andThen(client.waitForTransaction);
}

export function findReserveToSupply(
  client: AaveClient,
  token: EvmAddress,
): ResultAsync<Reserve, Error> {
  return reserves(client, {
    query: {
      tokens: [
        {
          chainId: ETHEREUM_FORK_ID,
          address: token,
        },
      ],
    },
    filter: ReservesRequestFilter.Supply,
  }).map((listReserves) => {
    invariant(
      listReserves.length > 0,
      `No reserves found for the token ${token}`,
    );
    const reserveToSupply = listReserves.find(
      (reserve) => reserve.canSupply === true,
    );
    invariant(
      reserveToSupply,
      `No reserve found to supply to for the token ${token}`,
    );
    return reserveToSupply;
  });
}

export function supplyToRandomERC20Reserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  token: EvmAddress,
  amount = bigDecimal('100'),
): ResultAsync<Reserve, Error> {
  return findReserveToSupply(client, token).andThen((reserve) =>
    supplyToReserve(
      client,
      {
        reserve: {
          reserveId: reserve.id,
          chainId: reserve.chain.chainId,
          spoke: reserve.spoke.address,
        },
        amount: { erc20: { value: amount } },
        sender: evmAddress(user.account.address),
      },
      user,
    ).map(() => reserve),
  );
}
