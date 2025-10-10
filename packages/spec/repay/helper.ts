import type { AaveClient, Reserve } from '@aave/client-next';
import {
  bigDecimal,
  type EvmAddress,
  evmAddress,
  type ResultAsync,
} from '@aave/client-next';
import { borrow } from '@aave/client-next/actions';
import { ETHEREUM_WETH_ADDRESS } from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import {
  findReserveToBorrow,
  findReserveToSupply,
  supplyToReserve,
} from '../borrow/helper';

export function supplyWETHAndBorrowMax(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  token: EvmAddress,
): ResultAsync<{ borrowReserve: Reserve; supplyReserve: Reserve }, Error> {
  return findReserveToSupply(client, user, {
    token: ETHEREUM_WETH_ADDRESS,
  }).andThen((reserveToSupply) =>
    supplyToReserve(
      client,
      {
        reserve: {
          reserveId: reserveToSupply.id,
          chainId: reserveToSupply.chain.chainId,
          spoke: reserveToSupply.spoke.address,
        },
        amount: { erc20: { value: bigDecimal(0.1) } },
        sender: evmAddress(user.account.address),
        enableCollateral: true,
      },
      user,
    )
      .andThen(() => findReserveToBorrow(client, user, { token }))
      .andThen((reserveToBorrow) =>
        borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: {
            spoke: reserveToBorrow.spoke.address,
            reserveId: reserveToBorrow.id,
            chainId: reserveToBorrow.chain.chainId,
          },
          amount: {
            erc20: {
              value: reserveToBorrow.userState!.borrowable.value.formatted,
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .map(() => ({
            borrowReserve: reserveToBorrow,
            supplyReserve: reserveToSupply,
          })),
      ),
  );
}
