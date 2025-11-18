import type {
  AaveClient,
  RepayRequest,
  WithdrawRequest,
} from '@aave/client-next';
import { repay, withdraw } from '@aave/client-next/actions';
import { sendWith } from '@aave/client-next/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';

export function withdrawFromReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  request: WithdrawRequest,
) {
  return withdraw(client, request)
    .andThen(sendWith(user))
    .andThen(client.waitForTransaction);
}

export function repayFromReserve(
  client: AaveClient,
  user: WalletClient<Transport, Chain, Account>,
  request: RepayRequest,
) {
  return repay(client, request)
    .andThen(sendWith(user))
    .andThen(client.waitForTransaction);
}
