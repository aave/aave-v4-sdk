import type {
  ExecutionPlan,
  OperationType,
  TransactionRequest,
} from '@aave/graphql';
import type { ChainId, EvmAddress, ResultAsync } from '@aave/types';

/**
 * The transactions of a multi-step execution plan, to be sent as one atomic
 * EIP-5792 batch (`wallet_sendCalls`).
 *
 * The SDK builds it from an {@link ExecutionPlan}; the API never returns it.
 */
export type TransactionBatch = {
  __typename: 'TransactionBatch';
  chainId: ChainId;
  from: EvmAddress;
  /**
   * The plan's transactions in execution order: the prerequisite ones
   * (e.g. approvals) first, the action last.
   */
  transactions: TransactionRequest[];
  /**
   * The operations of the action, used to wait for the batch to be indexed.
   */
  operations: OperationType[] | null;
};

/**
 * Tells whether the connected wallet can send an atomic batch on the given chain.
 *
 * Never fails: anything that prevents a definite answer resolves to `false`.
 */
export type BatchCapability = (chainId: ChainId) => ResultAsync<boolean, never>;

/**
 * Builds the {@link TransactionBatch} for a plan with two or more transactions.
 *
 * Returns `null` when there is nothing to batch.
 *
 * @internal
 */
export function toBatch(plan: ExecutionPlan): TransactionBatch | null {
  switch (plan.__typename) {
    case 'Erc20ApprovalRequired':
      return batchOf(
        plan.approvals.map((approval) => approval.byTransaction),
        plan.originalTransaction,
      );

    case 'PreContractActionRequired':
      return batchOf([plan.transaction], plan.originalTransaction);

    default:
      return null;
  }
}

function batchOf(
  prerequisites: TransactionRequest[],
  action: TransactionRequest,
): TransactionBatch | null {
  // one batch is sent on one chain from one account
  if (
    prerequisites.length === 0 ||
    prerequisites.some(
      (tx) =>
        tx.chainId !== action.chainId ||
        tx.from.toLowerCase() !== action.from.toLowerCase(),
    )
  ) {
    return null;
  }

  return {
    __typename: 'TransactionBatch',
    chainId: action.chainId,
    from: action.from,
    transactions: [...prerequisites, action],
    operations: action.operations,
  };
}
