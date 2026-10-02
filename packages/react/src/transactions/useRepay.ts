import {
  type BatchUnavailable,
  supportsPermit,
  type TransactionReceipt,
} from '@aave/client';
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
import {
  type BigDecimal,
  errAsync,
  okAsync,
  type Signature,
} from '@aave/types';

import { useAaveClient } from '../context';
import {
  type BatchOptions,
  type BatchRequest,
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

import { asStepHandler, type MaybeBatchHandler, sendAsBatch } from './batch';

type RepayStep = TransactionRequest | Erc20Approval | PreContractActionRequired;

type RepayResult = UseAsyncTask<
  RepayRequest,
  TransactionReceipt,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
>;

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
  handler: ExecutionPlanHandler<RepayStep, Signature | PendingTransaction>,
): RepayResult;
/**
 * A hook that provides a way to repay borrowed assets, sending any approval or
 * pre-contract-action steps together with the transaction as one atomic batch when
 * the wallet supports it.
 *
 * The handler then also receives a `BatchRequest`, which it sends with `batch.send`.
 * A successful batch is a single handler call; if the wallet can't batch, the hook
 * falls back to calling the handler once per step. See `useSupply` for an example.
 *
 * @param handler - The handler that will be used to handle the transactions.
 * @param options - The batch sender to use.
 */
export function useRepay(
  handler: ExecutionPlanHandler<
    RepayStep | BatchRequest,
    Signature | PendingTransaction | BatchUnavailable
  >,
  options: BatchOptions,
): RepayResult;
export function useRepay(
  handler: MaybeBatchHandler<RepayStep, Signature | PendingTransaction>,
  options?: BatchOptions,
): RepayResult {
  const client = useAaveClient();

  const batch = options?.batch;

  return useAsyncTask(
    (request: RepayRequest) => {
      const steps = asStepHandler(handler);

      return repay(client, request)
        .andThen((plan) => {
          switch (plan.__typename) {
            case 'TransactionRequest':
              return steps(plan, { cancel });

            case 'Erc20ApprovalRequired':
              return sendAsBatch(plan, handler, batch).andThen((pending) => {
                if (pending) {
                  return okAsync(pending);
                }
                if (supportsPermit(plan)) {
                  return handleSingleApproval(plan, steps, (permitSig) =>
                    repay(
                      client,
                      injectRepayPermitSignature(
                        request,
                        permitSig,
                        plan.approvals[0].bySignature.signedAmount,
                      ),
                    ),
                  ).andThen((transaction) => steps(transaction, { cancel }));
                }
                return sendApprovalTransactions(plan, steps).andThen(
                  (transaction) => steps(transaction, { cancel }),
                );
              });

            case 'PreContractActionRequired':
              return sendAsBatch(plan, handler, batch).andThen((pending) => {
                if (pending) {
                  return okAsync(pending);
                }
                return steps(plan, { cancel })
                  .andThen(PendingTransaction.tryFrom)
                  .andThen((pending) => pending.wait())
                  .andThen(() => steps(plan.originalTransaction, { cancel }));
              });

            case 'InsufficientBalanceError':
              return errAsync(ValidationError.fromGqlNode(plan));
          }
        })
        .andThen(PendingTransaction.tryFrom)
        .andThen((pending) => pending.wait())
        .andThen(client.waitForTransaction)
        .andThrough(() => refreshQueriesForReserveChange(client, request));
    },
    [client, handler, batch],
  );
}
