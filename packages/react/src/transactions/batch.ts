import {
  type BatchCapability,
  type TransactionBatch,
  toBatch,
} from '@aave/client';
import type { ExecutionPlan } from '@aave/graphql';
import { okAsync, type ResultAsync, type Signature } from '@aave/types';

import {
  cancel,
  type ExecutionPlanHandler,
  type PendingTransaction,
  type SendTransactionError,
} from '../helpers';

export type TransactionBatchOptions = {
  /**
   * Sends a multi-step plan (e.g. an approval and the action) to the handler
   * as one `TransactionBatch` when this resolves to `true` for the plan's
   * chain. Use `batchCapability(walletClient)` from your wallet adapter.
   *
   * `undefined` hands every step to the handler on its own, as without this
   * option.
   */
  batch: BatchCapability | undefined;
};

/**
 * The handler a write hook with a `batch` overload receives: the overload
 * without `batch` never sees a {@link TransactionBatch}.
 *
 * @internal
 */
export type BatchableHandler<T, R extends Signature | PendingTransaction> =
  | ExecutionPlanHandler<T, R>
  | ExecutionPlanHandler<T | TransactionBatch, R>;

/**
 * Hands the plan to `handler` as one {@link TransactionBatch} when it has two
 * or more transactions and the wallet can batch them. Resolves to `null`
 * otherwise, so the caller runs its per-step flow.
 *
 * @internal
 */
export function tryBatch<T, R extends Signature | PendingTransaction>(
  plan: ExecutionPlan,
  capability: BatchCapability | undefined,
  handler: BatchableHandler<T, R>,
): ResultAsync<R | null, SendTransactionError> {
  const batch = capability ? toBatch(plan) : null;

  if (!capability || !batch) {
    return okAsync(null);
  }

  // `capability` is only set through the overload whose handler takes a batch
  const send = handler as ExecutionPlanHandler<TransactionBatch, R>;

  return capability(batch.chainId).andThen((supported) =>
    supported ? send(batch, { cancel }) : okAsync(null),
  );
}
