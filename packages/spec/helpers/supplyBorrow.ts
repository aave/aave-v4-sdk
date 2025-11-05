import type {
  AaveClient,
  BorrowRequest,
  Reserve,
  SupplyRequest,
} from '@aave/client-next';
import {
  type BigDecimal,
  type EvmAddress,
  evmAddress,
  type ResultAsync,
  type TxHash,
} from '@aave/client-next';

import { borrow, supply } from '@aave/client-next/actions';

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

export function borrowFromReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  request: BorrowRequest,
): ResultAsync<TxHash, Error> {
  return borrow(client, request)
    .andThen(sendWith(user))
    .andThen(client.waitForTransaction);
}

export function supplyNativeTokenToReserve(
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
      enableCollateral: true,
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
    asCollateral,
  }: {
    token: EvmAddress;
    amount: BigDecimal;
    spoke?: EvmAddress;
    asCollateral?: boolean;
  },
): ResultAsync<Reserve, Error> {
  return findReservesToSupply(client, user, {
    token: token,
    spoke: spoke,
    asCollateral: asCollateral,
  }).andThen((reserves) =>
    supplyToReserve(client, user, {
      reserve: {
        reserveId: reserves[0].id,
        chainId: reserves[0].chain.chainId,
        spoke: reserves[0].spoke.address,
      },
      amount: { erc20: { value: amount } },
      sender: evmAddress(user.account.address),
    }).map(() => reserves[0]),
  );
}
