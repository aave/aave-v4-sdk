import type {
  AaveClient,
  RepayRequest,
  ResultAsync,
  TxHash,
  WithdrawRequest,
} from '@aave/client';
import { repay, withdraw } from '@aave/client/actions';
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
