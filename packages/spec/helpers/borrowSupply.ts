import type {
  AaveClient,
  BigDecimal,
  BorrowRequest,
  EvmAddress,
  Reserve,
  SupplyRequest,
  TxHash,
} from '@aave/client-next';
import { bigDecimal, evmAddress, type ResultAsync } from '@aave/client-next';
import { borrow, reserve, supply } from '@aave/client-next/actions';
import { ETHEREUM_SPOKES, ETHEREUM_TOKENS } from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';

import { sleep } from '../helpers/tools';
import { findReserveToBorrow, findReserveToSupply } from './reserves';

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
): ResultAsync<{ txHash: TxHash; amountBorrowed: number }, Error> {
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
    .andThen((borrowReserveInfo) => {
      const amountBorrowed =
        Number(borrowReserveInfo!.userState!.borrowable.amount.value) *
        (params.percentToBorrow ?? 0.25);

      return borrow(client, {
        sender: evmAddress(user.account.address),
        reserve: {
          spoke: borrowReserveInfo!.spoke.address,
          reserveId: borrowReserveInfo!.id,
          chainId: borrowReserveInfo!.chain.chainId,
        },
        amount: {
          erc20: {
            value: bigDecimal(amountBorrowed),
          },
        },
      })
        .andThen(sendWith(user))
        .andThen(client.waitForTransaction)
        .map((txHash) => ({ txHash, amountBorrowed }));
    });
}

export function supplyWSTETHAndBorrowETH(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
): ResultAsync<{ borrowReserve: Reserve; supplyReserve: Reserve }, Error> {
  return findReserveToSupply(client, user, {
    token: ETHEREUM_TOKENS.wstETH,
    spoke: ETHEREUM_SPOKES.E_MODE_SPOKE,
  }).andThen((reserveToSupply) =>
    supplyToReserve(client, user, {
      reserve: {
        reserveId: reserveToSupply.id,
        chainId: reserveToSupply.chain.chainId,
        spoke: reserveToSupply.spoke.address,
      },
      amount: { erc20: { value: bigDecimal(0.2) } },
      sender: evmAddress(user.account.address),
      enableCollateral: true,
    })
      .andTee(() => sleep(1000)) // TODO: Remove after fixed bug with delays of propagation
      .andThen(() =>
        findReserveToBorrow(client, user, {
          token: ETHEREUM_TOKENS.WETH,
          spoke: ETHEREUM_SPOKES.E_MODE_SPOKE,
        }),
      )
      .andThen((reserveToBorrow) =>
        borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: {
            spoke: reserveToBorrow.spoke.address,
            reserveId: reserveToBorrow.id,
            chainId: reserveToBorrow.chain.chainId,
          },
          amount: {
            native: reserveToBorrow.userState!.borrowable.amount.value,
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

// ** Deprecated this functions and use the ones above ** //
// ------------------------------------------------------ //

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
