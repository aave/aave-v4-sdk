import type {
  AaveClient,
  RepayRequest,
  ResultAsync,
  TransactionReceipt,
  WithdrawRequest,
} from '@aave/client';
import { repay, withdraw } from '@aave/client/actions';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import { sendWith } from './tools';

export function withdrawFromReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  request: WithdrawRequest,
): ResultAsync<TransactionReceipt, Error> {
  return withdraw(client, request)
    .andThen(sendWith(user))
    .andThen(client.waitForTransaction);
}

export function repayFromReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  request: RepayRequest,
): ResultAsync<TransactionReceipt, Error> {
  return repay(client, request)
    .andThen(sendWith(user))
    .andThen(client.waitForTransaction);
}
