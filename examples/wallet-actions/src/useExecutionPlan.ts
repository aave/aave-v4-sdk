import {
  type Erc20ApprovalRequired,
  errAsync,
  nonNullable,
  okAsync,
  PendingTransaction,
  type PendingTransactionError,
  type PreContractActionRequired,
  ResultAsync,
  type SendTransactionError,
  SigningError,
  TransactionError,
  type TransactionHandler,
  type TransactionResult,
  txHash,
  type UnexpectedError,
} from '@aave/react';
import { useSendTransaction } from '@aave/react/viem';
import type { WalletClient } from 'viem';
import {
  getCapabilities as getCapabilitiesWithViem,
  sendCalls,
  waitForCallsStatus,
} from 'viem/actions';

function supportsAtomicBatch(
  walletClient: WalletClient,
): ResultAsync<boolean, UnexpectedError> {
  return ResultAsync.fromPromise(
    getCapabilitiesWithViem(walletClient),
    (error) => error,
  )
    .orElse(() => okAsync(false))
    .andThen((_capabilities) => {
      console.log('supportsAtomicBatch', _capabilities); // TODO: check for the current chain
      return okAsync(true);
    });
}

function waitForAtomicBatch(
  walletClient: WalletClient,
  plan: Erc20ApprovalRequired | PreContractActionRequired,
  actionId: string,
): ResultAsync<TransactionResult, PendingTransactionError> {
  return ResultAsync.fromPromise(
    waitForCallsStatus(walletClient, { id: actionId }),
    // TODO: handle timeout error
    (error) => TransactionError.from(error),
  ).andThen((result) => {
    if (result.statusCode !== 200 || !result.receipts) {
      // TODO: proper error handling from result.receipts if available
      return errAsync(TransactionError.from(result.statusCode));
    }

    return okAsync({
      txHash: txHash(
        nonNullable(result.receipts.slice().pop()?.transactionHash),
      ),
      operations: plan.transaction.operations,
    });
  });
}

function batchCalls(
  walletClient: WalletClient,
  plan: Erc20ApprovalRequired | PreContractActionRequired,
): ResultAsync<string, SendTransactionError> {
  return ResultAsync.fromPromise(
    sendCalls(walletClient, {
      account: walletClient.account,
      calls: [plan.transaction, plan.originalTransaction].map(
        (transaction) => ({
          to: transaction.to,
          data: transaction.data,
        }),
      ),
    }),
    (error) => {
      // TODO handle CancelError
      return SigningError.from(error);
    },
  ).map((result) => result.id);
}

export function useExecutionPlan(
  walletClient: WalletClient,
): TransactionHandler {
  const [sendTransaction] = useSendTransaction(walletClient);

  return (plan) => {
    switch (plan.__typename) {
      case 'TransactionRequest':
        return sendTransaction(plan);
      case 'Erc20ApprovalRequired':
      case 'PreContractActionRequired':
        return supportsAtomicBatch(walletClient).andThen((supports) => {
          if (supports) {
            return batchCalls(walletClient, plan).map(
              (actionId) =>
                new PendingTransaction(() =>
                  waitForAtomicBatch(walletClient, plan, actionId),
                ),
            );
          }

          return sendTransaction(plan.transaction);
        });
    }
  };
}
