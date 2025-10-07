import type { AaveClient, Reserve } from '@aave/client-next';
import {
  bigDecimal,
  type EvmAddress,
  evmAddress,
  type ResultAsync,
} from '@aave/client-next';
import { borrow } from '@aave/client-next/actions';
import { sendWith } from '@aave/client-next/viem';
import type { WalletClient } from 'viem';
import { findReserveToSupply, supplyToReserve } from '../borrow/helper';

export function supplyAndBorrow(
  client: AaveClient,
  user: WalletClient,
  token: EvmAddress,
  amount = bigDecimal('150'),
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
    )
      .andThen(() =>
        borrow(client, {
          sender: evmAddress(user.account!.address),
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
          },
          amount: {
            erc20: {
              value: bigDecimal(Number(amount) / 3),
            },
          },
        }),
      )
      .andThen(sendWith(user))
      .andThen(client.waitForTransaction)
      .map(() => reserve),
  );
}
