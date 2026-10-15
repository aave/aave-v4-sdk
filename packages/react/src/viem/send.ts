import type { TransactionBatch } from '@aave/client';
import {
  sendBatch,
  sendTransaction,
  waitForTransactionResult,
} from '@aave/client/viem';
import type { TransactionRequest } from '@aave/graphql';
import type { ResultAsync } from '@aave/types';
import type { WalletClient } from 'viem';
import { PendingTransaction, type SendTransactionError } from '../helpers';

/**
 * Sends a transaction, or a batch as one atomic `wallet_sendCalls` prompt,
 * with a wallet client already on the right chain.
 *
 * @internal
 */
export function send(
  walletClient: WalletClient,
  request: TransactionRequest | TransactionBatch,
): ResultAsync<PendingTransaction, SendTransactionError> {
  if (request.__typename === 'TransactionBatch') {
    return sendBatch(walletClient, request).map(
      (id) =>
        new PendingTransaction(() =>
          waitForTransactionResult(walletClient, request, id),
        ),
    );
  }

  return sendTransaction(walletClient, request).map(
    (hash) =>
      new PendingTransaction(() =>
        waitForTransactionResult(walletClient, request, hash),
      ),
  );
}
