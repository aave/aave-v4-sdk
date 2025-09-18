import type { AaveClient, Reserve, SupplyRequest } from '@aave/client-next';
import { reserves, supply } from '@aave/client-next/actions';
import { sendWith } from '@aave/client-next/viem';
import {
  bigDecimal,
  chainId,
  type EvmAddress,
  evmAddress,
  invariant,
  type ResultAsync,
  type TxHash,
} from '@aave/types-next';
import type { WalletClient } from 'viem';

export function supplyToReserve(
  client: AaveClient,
  request: SupplyRequest,
  user: WalletClient,
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
          chainId: chainId(1),
          address: token,
        },
      ],
    },
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
  user: WalletClient,
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
        sender: evmAddress(user.account!.address),
      },
      user,
    ).map(() => reserve),
  );
}
