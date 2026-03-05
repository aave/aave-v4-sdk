import { supportsPermit, type TransactionReceipt } from '@aave/client';
import { liquidatePosition } from '@aave/client/actions';
import { ValidationError } from '@aave/core';
import type {
  ERC20PermitSignature,
  Erc20Approval,
  InsufficientBalanceError,
  LiquidatePositionRequest,
  PreContractActionRequired,
  TransactionRequest,
} from '@aave/graphql';
import { errAsync, type Signature } from '@aave/types';

import { useAaveClient } from '../context';
import {
  cancel,
  type ExecutionPlanHandler,
  PendingTransaction,
  type PendingTransactionError,
  refreshUserBalances,
  type SendTransactionError,
  type UseAsyncTask,
  useAsyncTask,
} from '../helpers';

import { handleSingleApproval, sendApprovalTransactions } from './approvals';

function injectLiquidatePermitSignature(
  request: LiquidatePositionRequest,
  permitSig: ERC20PermitSignature,
): LiquidatePositionRequest {
  if ('exact' in request.amount && request.amount.exact) {
    return {
      ...request,
      amount: {
        exact: {
          ...request.amount.exact,
          permitSig,
        },
      },
    };
  }

  return request;
}

/**
 * A hook that provides a way to liquidate a user's position.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [liquidatePosition, { loading, error }] = useLiquidatePosition((plan, { cancel }) => {
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
 * const result = await liquidatePosition({
 *   collateral: reserveId('SGVsbG8h'),
 *   debt: reserveId('Q2lhbyE= '),
 *   amount: amount,
 *   liquidator: liquidator,
 *   borrower: borrower,
 * });
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
export function useLiquidatePosition(
  handler: ExecutionPlanHandler<
    TransactionRequest | Erc20Approval | PreContractActionRequired,
    PendingTransaction | Signature
  >,
): UseAsyncTask<
  LiquidatePositionRequest,
  TransactionReceipt,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: LiquidatePositionRequest) =>
      liquidatePosition(client, request)
        .andThen((plan) => {
          switch (plan.__typename) {
            case 'TransactionRequest':
              return handler(plan, { cancel });

            case 'Erc20ApprovalRequired':
              if (supportsPermit(plan)) {
                return handleSingleApproval(plan, handler, (permitSig) =>
                  liquidatePosition(
                    client,
                    injectLiquidatePermitSignature(request, permitSig),
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
        .andThrough(() => refreshUserBalances(client, request.liquidator)),
    [client, handler],
  );
}
