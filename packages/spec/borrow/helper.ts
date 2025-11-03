import type { AaveClient, Reserve, SupplyRequest } from '@aave/client-next';
import {
  type BigDecimal,
  type EvmAddress,
  evmAddress,
  invariant,
  ReservesRequestFilter,
  type ResultAsync,
  type TxHash,
} from '@aave/client-next';
import { reserves, supply } from '@aave/client-next/actions';
import {
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKE_ISO_GOV_ADDRESS,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';

import { findReservesToSupply } from '../helpers/reserves';

export function supplyToReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  request: SupplyRequest,
): ResultAsync<TxHash, Error> {
  return supply(client, request)
    .andThen(sendWith(user))
    .andThen(client.waitForTransaction);
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
        spoke: params.spoke ?? ETHEREUM_SPOKE_ISO_GOV_ADDRESS,
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

export function supplyToNativeReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  amount: BigDecimal,
  spoke?: EvmAddress,
): ResultAsync<Reserve, Error> {
  return findReservesToSupply(client, user, {
    spoke: spoke,
    native: true,
  }).andThen((reserves) =>
    supplyToReserve(client, user, {
      reserve: {
        reserveId: reserves[0].id,
        chainId: reserves[0].chain.chainId,
        spoke: reserves[0].spoke.address,
      },
      amount: {
        native: amount,
      },
      sender: evmAddress(user.account.address),
      enableCollateral: false, // TODO: set to true when contracts are deployed
    }).map(() => reserves[0]),
  );
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
  return findReservesToSupply(client, user, {
    token,
    spoke,
    asCollateral: true,
  }).andThen((reserve) =>
    supplyToReserve(client, user, {
      reserve: {
        reserveId: reserve[0].id,
        chainId: reserve[0].chain.chainId,
        spoke: reserve[0].spoke.address,
      },
      amount: { erc20: { value: amount } },
      sender: evmAddress(user.account.address),
    }).map(() => reserve[0]),
  );
}
