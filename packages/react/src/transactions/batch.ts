import type { BatchUnavailable } from '@aave/client';
import { isBatchUnavailable } from '@aave/client';
import { UnexpectedError } from '@aave/core';
import type {
  Erc20ApprovalRequired,
  PreContractActionRequired,
  TransactionRequest,
} from '@aave/graphql';
import { okAsync, type ResultAsync, type Signature } from '@aave/types';

import {
  type BatchRequest,
  type BatchSender,
  cancel,
  type ExecutionPlanHandler,
  PendingTransaction,
  type SendTransactionError,
} from '../helpers';

type HandlerResult = Signature | PendingTransaction;

/**
 * A handler given to a hook, with or without the `BatchRequest` case.
 *
 * @internal
 */
export type MaybeBatchHandler<T, R extends HandlerResult> =
  | ExecutionPlanHandler<T, R>
  | ExecutionPlanHandler<T | BatchRequest, R | BatchUnavailable>;

/**
 * Narrows a handler to the per-step handler the existing step-by-step flows use.
 * A step never resolves to `BatchUnavailable`; if a handler returns it anyway the
 * step fails with an `UnexpectedError`.
 *
 * @internal
 */
export function asStepHandler<T, R extends HandlerResult>(
  handler: MaybeBatchHandler<T, R>,
): ExecutionPlanHandler<T, R> {
  return (plan, options) =>
    (handler as ExecutionPlanHandler<T, R | BatchUnavailable>)(
      plan,
      options,
    ).andThen((result) =>
      isBatchUnavailable(result)
        ? UnexpectedError.from(
            `Unexpected BatchUnavailable for a ${String((plan as { __typename?: string }).__typename)} step`,
          ).asResultAsync()
        : okAsync(result),
    );
}

function batchRequestsOf(
  plan: Erc20ApprovalRequired | PreContractActionRequired,
): TransactionRequest[] {
  switch (plan.__typename) {
    case 'Erc20ApprovalRequired':
      return [
        ...plan.approvals.map((approval) => approval.byTransaction),
        plan.originalTransaction,
      ];

    case 'PreContractActionRequired':
      return [plan.transaction, plan.originalTransaction];
  }
}

/**
 * Sends the plan's steps and original transaction as one atomic batch through the
 * handler's `BatchRequest` case, when a `batch` sender was given and the wallet
 * supports it.
 *
 * Resolves to the batch's `PendingTransaction`, or to `null` when the plan should be
 * sent step by step instead (no `batch`, wallet doesn't support it, or the wallet
 * reported `BatchUnavailable`).
 *
 * @internal
 */
export function sendAsBatch<T, R extends HandlerResult>(
  plan: Erc20ApprovalRequired | PreContractActionRequired,
  handler: MaybeBatchHandler<T, R>,
  batch: BatchSender | null | undefined,
): ResultAsync<PendingTransaction | null, SendTransactionError> {
  const requests = batchRequestsOf(plan);
  const [first] = requests;

  if (!batch || !first) {
    return okAsync(null);
  }

  return batch.supports(first.chainId).andThen((supported) => {
    if (!supported) {
      return okAsync(null);
    }

    // `batch` is only accepted together with a handler that takes `BatchRequest`.
    const batchHandler = handler as ExecutionPlanHandler<
      BatchRequest,
      R | BatchUnavailable
    >;

    return batchHandler(
      { __typename: 'BatchRequest', requests },
      { cancel },
    ).andThen(
      (result): ResultAsync<PendingTransaction | null, UnexpectedError> => {
        if (isBatchUnavailable(result)) {
          return okAsync(null);
        }
        if (PendingTransaction.isInstanceOf(result)) {
          return okAsync(result);
        }
        return UnexpectedError.from(
          'Expected the BatchRequest handler to return batch.send(plan)',
        ).asResultAsync();
      },
    );
  });
}
