import type {
  AaveClient,
  ResultAsync,
  TxHash,
  WithdrawRequest,
} from '@aave/client-next';
import { withdraw } from '@aave/client-next/actions';
import { sendWith } from '@aave/client-next/viem';
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
