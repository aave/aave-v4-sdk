import {
  type AaveClient,
  assertOk,
  evmAddress,
  type RepayRequest,
  type ResultAsync,
  type SpokeId,
  type TxHash,
  type WithdrawRequest,
} from '@aave/client';
import { repay, userBorrows, withdraw } from '@aave/client/actions';
import { fundErc20Address } from '@aave/client/testing';
import { sendWith } from '@aave/client/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';

export function withdrawFromReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  request: WithdrawRequest,
): ResultAsync<TxHash, Error> {
  return withdraw(client, request)
    .andThen(sendWith(user))
    .andThen(client.waitForTransaction);
}

export function repayFromReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  request: RepayRequest,
): ResultAsync<TxHash, Error> {
  return repay(client, request)
    .andThen(sendWith(user))
    .andThen(client.waitForTransaction);
}

export async function repayAllExistingBorrows(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  spoke: SpokeId,
) {
  const listBorrowsResult = await userBorrows(client, {
    query: {
      userSpoke: {
        spoke: spoke,
        user: evmAddress(user.account.address),
      },
    },
  });
  assertOk(listBorrowsResult);
  if (listBorrowsResult.value.length === 0) {
    return;
  }

  for (const borrow of listBorrowsResult.value) {
    const repayResult = await fundErc20Address(
      evmAddress(user.account.address),
      {
        address: borrow.reserve.asset.underlying.address,
        amount: borrow.principal.amount.value.times(1.1),
        decimals: borrow.reserve.asset.underlying.info.decimals,
      },
    ).andThen(() =>
      repayFromReserve(client, user, {
        reserve: borrow.reserve.id,
        sender: evmAddress(user.account.address),
        amount: {
          erc20: {
            value: {
              max: true,
            },
          },
        },
      }),
    );
    assertOk(repayResult);
  }
}
