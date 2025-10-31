import type {
  AaveClient,
  BigDecimal,
  BorrowRequest,
  Reserve,
  SupplyRequest,
  TxHash,
  WithdrawRequest,
} from '@aave/client-next';
import { bigDecimal, evmAddress, type ResultAsync } from '@aave/client-next';
import { borrow, reserve, supply, withdraw } from '@aave/client-next/actions';
import { sendWith } from '@aave/client-next/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';

import { sleep } from '../helpers/tools';

export function supplyToReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  request: SupplyRequest,
): ResultAsync<TxHash, Error> {
  return supply(client, request)
    .andThen(sendWith(user))
    .andThen(client.waitForTransaction);
}

export function borrowFromReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  request: BorrowRequest,
): ResultAsync<TxHash, Error> {
  return borrow(client, request)
    .andThen(sendWith(user))
    .andThen(client.waitForTransaction);
}

export function withdrawFromReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  request: WithdrawRequest,
): ResultAsync<TxHash, Error> {
  return withdraw(client, request)
    .andThen(sendWith(user))
    .andThen(client.waitForTransaction);
}

export function supplyAndBorrow(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: {
    supplyReserve: Reserve;
    borrowReserve: Reserve;
    amountToSupply?: BigDecimal;
    percentToBorrow?: number;
  },
): ResultAsync<TxHash, Error> {
  return supplyToReserve(client, user, {
    reserve: {
      reserveId: params.supplyReserve.id,
      chainId: params.supplyReserve.chain.chainId,
      spoke: params.supplyReserve.spoke.address,
    },
    amount: { erc20: { value: params.amountToSupply ?? bigDecimal(1) } },
    sender: evmAddress(user.account.address),
    enableCollateral: true,
  })
    .andTee(() => sleep(1000)) // TODO: Remove after fixed bug with delays of propagation
    .andThen(() =>
      reserve(client, {
        query: {
          reserve: {
            chainId: params.borrowReserve.chain.chainId,
            spoke: params.borrowReserve.spoke.address,
            reserveId: params.borrowReserve.id,
          },
        },
        user: evmAddress(user.account.address),
      }),
    )
    .andThen((borrowReserveInfo) =>
      borrow(client, {
        sender: evmAddress(user.account.address),
        reserve: {
          spoke: borrowReserveInfo!.spoke.address,
          reserveId: borrowReserveInfo!.id,
          chainId: borrowReserveInfo!.chain.chainId,
        },
        amount: {
          erc20: {
            value: bigDecimal(
              Number(borrowReserveInfo!.userState!.borrowable.amount.value) *
                (params.percentToBorrow ?? 0.25),
            ),
          },
        },
      })
        .andThen(sendWith(user))
        .andThen(client.waitForTransaction),
    );
}
