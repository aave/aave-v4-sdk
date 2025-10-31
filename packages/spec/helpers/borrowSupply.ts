import type {
  AaveClient,
  BigDecimal,
  BorrowRequest,
  EvmAddress,
  Reserve,
  SupplyRequest,
  TxHash,
} from '@aave/client-next';
import {
  bigDecimal,
  evmAddress,
  invariant,
  ReservesRequestFilter,
  type ResultAsync,
} from '@aave/client-next';
import { borrow, reserve, reserves, supply } from '@aave/client-next/actions';
import {
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKES,
} from '@aave/client-next/test-utils';
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

// ** Deprecated this functions and use the ones above ** //
// ------------------------------------------------------ //

export function findReserveToSupply(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: { token: EvmAddress; spoke?: EvmAddress; asCollateral?: boolean },
): ResultAsync<Reserve, Error> {
  return reserves(client, {
    query: {
      spokeToken: {
        chainId: ETHEREUM_FORK_ID,
        token: params.token,
        spoke: params.spoke ?? ETHEREUM_SPOKES.ISO_GOV_SPOKE,
      },
    },
    user: evmAddress(user.account.address),
    filter: ReservesRequestFilter.Supply,
  }).map((listReserves) => {
    invariant(
      listReserves.length > 0,
      `No reserves found for the token ${params.token}`,
    );
    const reserveToSupply = listReserves.find(
      (reserve) =>
        reserve.canSupply &&
        (params.asCollateral ? reserve.canUseAsCollateral === true : true),
    );
    invariant(
      reserveToSupply,
      `No reserve found to supply to for the token ${params.token}`,
    );
    return reserveToSupply;
  });
}

export function findReserveToBorrow(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  params: { token: EvmAddress; spoke?: EvmAddress },
): ResultAsync<Reserve, Error> {
  return reserves(client, {
    query: {
      spokeToken: {
        chainId: ETHEREUM_FORK_ID,
        token: params.token,
        spoke: params.spoke ?? ETHEREUM_SPOKES.ISO_GOV_SPOKE,
      },
    },
    user: evmAddress(user.account.address),
    filter: ReservesRequestFilter.Borrow,
  }).map((listReserves) => {
    invariant(
      listReserves.length > 0,
      `No reserves found for the token ${params.token}`,
    );
    const reserveToBorrow = listReserves.find(
      (reserve) => reserve.canBorrow === true,
    );
    invariant(
      reserveToBorrow,
      `No reserve found to borrow from for the token ${params.token}`,
    );
    return reserveToBorrow;
  });
}

export function supplyToRandomERC20Reserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  {
    token,
    amount,
    spoke,
  }: {
    token: EvmAddress;
    amount: BigDecimal;
    spoke?: EvmAddress;
  },
): ResultAsync<Reserve, Error> {
  return findReserveToSupply(client, user, {
    token,
    spoke,
    asCollateral: true,
  }).andThen((reserve) =>
    supplyToReserve(client, user, {
      reserve: {
        reserveId: reserve.id,
        chainId: reserve.chain.chainId,
        spoke: reserve.spoke.address,
      },
      amount: { erc20: { value: amount } },
      sender: evmAddress(user.account.address),
    }).map(() => reserve),
  );
}
