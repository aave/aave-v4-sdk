import {
  type BatchUnavailable,
  supportsPermit,
  type TransactionReceipt,
} from '@aave/client';
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
import { errAsync, okAsync, type Signature } from '@aave/types';

import { useAaveClient } from '../context';
import {
  type BatchOptions,
  type BatchRequest,
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

import { asStepHandler, type MaybeBatchHandler, sendAsBatch } from './batch';

type LiquidatePositionStep =
  | TransactionRequest
  | Erc20Approval
  | PreContractActionRequired;

type LiquidatePositionResult = UseAsyncTask<
  LiquidatePositionRequest,
  TransactionReceipt,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
>;

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
    LiquidatePositionStep,
    PendingTransaction | Signature
  >,
): LiquidatePositionResult;
/**
 * A hook that provides a way to liquidate a position, sending any approval or pre-
 * contract-action steps together with the transaction as one atomic batch when the
 * wallet supports it.
 *
 * The handler then also receives a `BatchRequest`, which it sends with `batch.send`.
 * A successful batch is a single handler call; if the wallet can't batch, the hook
 * falls back to calling the handler once per step. See `useSupply` for an example.
 *
 * @param handler - The handler that will be used to handle the transactions.
 * @param options - The batch sender to use.
 */
export function useLiquidatePosition(
  handler: ExecutionPlanHandler<
    LiquidatePositionStep | BatchRequest,
    PendingTransaction | Signature | BatchUnavailable
  >,
  options: BatchOptions,
): LiquidatePositionResult;
export function useLiquidatePosition(
  handler: MaybeBatchHandler<
    LiquidatePositionStep,
    PendingTransaction | Signature
  >,
  options?: BatchOptions,
): LiquidatePositionResult {
  const client = useAaveClient();

  const batch = options?.batch;

  return useAsyncTask(
    (request: LiquidatePositionRequest) => {
      const steps = asStepHandler(handler);

      return liquidatePosition(client, request)
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
                    liquidatePosition(
                      client,
                      injectLiquidatePermitSignature(request, permitSig),
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
        .andThrough(() => refreshUserBalances(client, request.liquidator));
    },
    [client, handler, batch],
  );
}
