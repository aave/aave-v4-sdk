import { supportsPermit, type TransactionReceipt } from '@aave/client';
import { repay } from '@aave/client/actions';
import { ValidationError } from '@aave/core';
import type {
  ERC20PermitSignature,
  Erc20Approval,
  InsufficientBalanceError,
  PreContractActionRequired,
  RepayRequest,
  TransactionRequest,
} from '@aave/graphql';
import { type BigDecimal, errAsync, type Signature } from '@aave/types';

import { useAaveClient } from '../context';
import {
  cancel,
  type ExecutionPlanHandler,
  PendingTransaction,
  type PendingTransactionError,
  refreshQueriesForReserveChange,
  type SendTransactionError,
  type UseAsyncTask,
  useAsyncTask,
} from '../helpers';
import { handleSingleApproval, sendApprovalTransactions } from './approvals';

function injectRepayPermitSignature(
  request: RepayRequest,
  permitSig: ERC20PermitSignature,
  signedAmount: BigDecimal,
): RepayRequest {
  if ('erc20' in request.amount) {
    return {
      ...request,
      amount: {
        erc20: {
          ...request.amount.erc20,
          permit: { permitSig, signedAmount },
        },
      },
    };
  }
  return request;
}

/**
 * A hook that provides a way to repay borrowed assets to an Aave reserve.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [repay, { loading, error }] = useRepay((plan, { cancel }) => {
 *   switch (plan.__typename) {
 *     case 'TransactionRequest':
 *       return sendTransaction(plan);
 *
 *     case 'Erc20Approval':
 *       return sendTransaction(plan.byTransaction);
 *
 *     case 'PreContractActionRequired':
 *       return sendTransaction(plan.transaction);
 *   }
 * });
 *
 * // …
 *
 * const result = await repay({ ... });
 *
 * if (result.isErr()) {
 *   switch (result.error.name) {
 *     case 'CancelError':
 *       // The user cancelled the operation
 *       return;
 *
 *     case 'SigningError':
 *       console.error(`Failed to sign the transaction: ${result.error.message}`);
 *       break;
 *
 *     case 'TimeoutError':
 *       console.error(`Transaction timed out: ${result.error.message}`);
 *       break;
 *
 *     case 'TransactionError':
 *       console.error(`Transaction failed: ${result.error.message}`);
 *       break;
 *
 *     case 'ValidationError':
 *       console.error(`Insufficient balance: ${result.error.cause.required.value} required.`);
 *       break;
 *
 *     case 'UnexpectedError':
 *       console.error(result.error.message);
 *       break;
 *   }
 *   return;
 * }
 *
 * console.log('Transaction sent with hash:', result.value.txHash);
 * ```
 *
 * @param handler - The handler that will be used to handle the transactions.
 */
export function useRepay(
  handler: ExecutionPlanHandler<
    TransactionRequest | Erc20Approval | PreContractActionRequired,
    Signature | PendingTransaction
  >,
): UseAsyncTask<
  RepayRequest,
  TransactionReceipt,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: RepayRequest) =>
      repay(client, request)
        .andThen((plan) => {
          switch (plan.__typename) {
            case 'TransactionRequest':
              return handler(plan, { cancel });

            case 'Erc20ApprovalRequired':
              if (supportsPermit(plan)) {
                return handleSingleApproval(plan, handler, (permitSig) =>
                  repay(
                    client,
                    injectRepayPermitSignature(
                      request,
                      permitSig,
                      plan.approvals[0].bySignature.signedAmount,
                    ),
                  ),
                ).andThen((transaction) => handler(transaction, { cancel }));
              }
              return sendApprovalTransactions(plan, handler).andThen(
                (transaction) => handler(transaction, { cancel }),
              );

            case 'PreContractActionRequired':
              return handler(plan, { cancel })
                .andThen(PendingTransaction.tryFrom)
                .andThen((pending) => pending.wait())
                .andThen(() => handler(plan.originalTransaction, { cancel }));

            case 'InsufficientBalanceError':
              return errAsync(ValidationError.fromGqlNode(plan));
          }
        })
        .andThen(PendingTransaction.tryFrom)
        .andThen((pending) => pending.wait())
        .andThen(client.waitForTransaction)
        .andThrough(() => refreshQueriesForReserveChange(client, request)),
    [client, handler],
  );
}
