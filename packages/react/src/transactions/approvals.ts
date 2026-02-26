import type { UnexpectedError } from '@aave/client';
import type {
  ERC20PermitSignature,
  Erc20Approval,
  Erc20ApprovalRequired,
  ExecutionPlan,
  PermitTypedData,
  TransactionRequest,
} from '@aave/graphql';
import {
  expectTypename,
  isSignature,
  okAsync,
  type ResultAsync,
  type Signature,
} from '@aave/types';

import {
  cancel,
  type ExecutionPlanHandler,
  PendingTransaction,
  type PendingTransactionError,
  type SendTransactionError,
} from '../helpers';

export type ApprovalHandler = ExecutionPlanHandler<
  TransactionRequest | Erc20Approval,
  Signature | PendingTransaction
>;

function toPermitSignature(
  signature: Signature,
  permitTypedData: PermitTypedData,
): ERC20PermitSignature {
  return {
    deadline: permitTypedData.message.deadline as number,
    value: signature,
  };
}

/**
 * Sends all approvals sequentially via transactions (no permit).
 */
export function sendApprovalTransactions(
  plan: Erc20ApprovalRequired,
  handler: ApprovalHandler,
): ResultAsync<
  TransactionRequest,
  SendTransactionError | PendingTransactionError
> {
  return plan.approvals
    .reduce<
      ResultAsync<unknown, SendTransactionError | PendingTransactionError>
    >(
      (chain, approval) =>
        chain.andThen(() =>
          handler({ ...approval, bySignature: null }, { cancel })
            .andThen(PendingTransaction.tryFrom)
            .andThen((pending) => pending.wait()),
        ),
      okAsync(undefined),
    )
    .map(() => plan.originalTransaction);
}

type SingleApprovalPlan = Erc20ApprovalRequired & {
  approvals: [Erc20Approval & { bySignature: PermitTypedData }];
};

/**
 * Processes a single approval that supports permit.
 * The handler decides whether to use a permit signature or a transaction.
 * Returns either a new TransactionRequest (from permit callback) or the plan's original transaction.
 */
export function handleSingleApproval(
  plan: SingleApprovalPlan,
  handler: ApprovalHandler,
  onPermit: (
    permitSig: ERC20PermitSignature,
  ) => ResultAsync<ExecutionPlan, UnexpectedError>,
): ResultAsync<
  TransactionRequest,
  SendTransactionError | PendingTransactionError | UnexpectedError
> {
  const approval = plan.approvals[0];

  return handler(approval, { cancel }).andThen((result) => {
    if (isSignature(result)) {
      return onPermit(toPermitSignature(result, approval.bySignature)).map(
        expectTypename('TransactionRequest'),
      );
    }
    return result.wait().map(() => plan.originalTransaction);
  });
}
