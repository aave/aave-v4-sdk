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
  ETHEREUM_WETH_ADDRESS,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';

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
        spoke: params.spoke ?? ETHEREUM_SPOKE_ISO_GOV_ADDRESS,
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

export function findReserveNativeSupply(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  spoke?: EvmAddress,
  asCollateral?: boolean,
): ResultAsync<Reserve, Error> {
  return reserves(client, {
    query: {
      spokeToken: {
        chainId: ETHEREUM_FORK_ID,
        token: ETHEREUM_WETH_ADDRESS,
        spoke: spoke ?? ETHEREUM_SPOKE_ISO_GOV_ADDRESS,
      },
    },
    user: evmAddress(user.account.address),
    filter: ReservesRequestFilter.Supply,
  }).map((listReserves) => {
    invariant(
      listReserves.length > 0,
      `No reserves found for the token ${ETHEREUM_WETH_ADDRESS}`,
    );
    const reserveToSupply = listReserves.find(
      (reserve) =>
        reserve.canSupply &&
        (asCollateral ? reserve.canUseAsCollateral === true : true) &&
        reserve.asset.underlying.isWrappedNativeToken,
    );
    invariant(
      reserveToSupply,
      `No reserve found to supply to for the token ${ETHEREUM_WETH_ADDRESS}`,
    );
    return reserveToSupply;
  });
}

export function supplyToNativeReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  amount: BigDecimal,
  spoke?: EvmAddress,
): ResultAsync<Reserve, Error> {
  return findReserveNativeSupply(client, user, spoke).andThen((reserve) =>
    supplyToReserve(client, user, {
      reserve: {
        reserveId: reserve.id,
        chainId: reserve.chain.chainId,
        spoke: reserve.spoke.address,
      },
      amount: {
        native: amount,
      },
      sender: evmAddress(user.account.address),
      enableCollateral: false, // TODO: set to true when contracts are deployed
    }).map(() => reserve),
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
