import { supportsPermit, type TransactionReceipt } from '@aave/client';
import {
  stableVaultDeposit,
  stableVaultWithdraw,
  stableVaultWithdrawRedeem,
} from '@aave/client/actions';
import { UnexpectedError, ValidationError } from '@aave/core';
import type {
  ERC20PermitSignature,
  Erc20Approval,
  InsufficientBalanceError,
  StableVault,
  StableVaultClaimStatus,
  StableVaultDepositRequest,
  StableVaultUserPosition,
  StableVaultWithdrawClaim,
  StableVaultWithdrawRedeemRequest,
  StableVaultWithdrawRequest,
  TransactionRequest,
} from '@aave/graphql';
import {
  StableVaultClaimStatusQuery,
  type StableVaultClaimStatusRequest,
  StableVaultQuery,
  type StableVaultRequest,
  StableVaultsQuery,
  type StableVaultsRequest,
  StableVaultUserPositionsQuery,
  type StableVaultUserPositionsRequest,
} from '@aave/graphql';
import { errAsync, type NullishDeep, type Signature } from '@aave/types';

import { useAaveClient } from './context';
import {
  cancel,
  type ExecutionPlanHandler,
  type Pausable,
  type PausableReadResult,
  type PausableSuspenseResult,
  PendingTransaction,
  type PendingTransactionError,
  type ReadResult,
  type SendTransactionError,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  type UseAsyncTask,
  useAsyncTask,
  useSuspendableQuery,
} from './helpers';
import {
  handleSingleApproval,
  sendApprovalTransactions,
} from './transactions/approvals';

function injectDepositPermitSignature(
  request: StableVaultDepositRequest,
  permitSig: ERC20PermitSignature,
): StableVaultDepositRequest {
  return {
    ...request,
    amount: {
      ...request.amount,
      permitSig,
    },
  };
}

/**
 * A hook that provides a way to deposit assets into a stable vault.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 *
 * const [deposit, { loading, error }] = useStableVaultDeposit((plan) => {
 *   switch (plan.__typename) {
 *     case 'TransactionRequest':
 *       return sendTransaction(plan);
 *
 *     case 'Erc20Approval':
 *       return sendTransaction(plan.byTransaction);
 *   }
 * });
 * ```
 *
 * @param handler - The handler that will be used to handle the transactions.
 */
export function useStableVaultDeposit(
  handler: ExecutionPlanHandler<
    TransactionRequest | Erc20Approval,
    Signature | PendingTransaction
  >,
): UseAsyncTask<
  StableVaultDepositRequest,
  TransactionReceipt,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: StableVaultDepositRequest) =>
      stableVaultDeposit(client, request)
        .andThen((plan) => {
          switch (plan.__typename) {
            case 'TransactionRequest':
              return handler(plan, { cancel });

            case 'Erc20ApprovalRequired':
              if (supportsPermit(plan)) {
                return handleSingleApproval(plan, handler, (permitSig) =>
                  stableVaultDeposit(
                    client,
                    injectDepositPermitSignature(request, permitSig),
                  ),
                ).andThen((transaction) => handler(transaction, { cancel }));
              }
              return sendApprovalTransactions(plan, handler).andThen(
                (transaction) => handler(transaction, { cancel }),
              );

            case 'InsufficientBalanceError':
              return errAsync(ValidationError.fromGqlNode(plan));
          }
        })
        .andThen(PendingTransaction.tryFrom)
        .andThen((pending) => pending.wait())
        .andThen(client.waitForTransaction)
        .andThrough(() =>
          refreshStableVaultUserPositions(client, request.user),
        ),
    [client, handler],
  );
}

type StableVaultWithdrawResult = TransactionReceipt | StableVaultWithdrawClaim;

/**
 * A hook that provides a way to withdraw from a stable vault.
 *
 * The result discriminates between instant and deferred withdrawals:
 * - `TransactionReceipt` — Instant withdraw completed.
 * - `StableVaultWithdrawClaim` — Deferred withdraw; IOU minted, funds need to be redeemed.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 *
 * const [withdraw, { loading, error }] = useStableVaultWithdraw((transaction) =>
 *   sendTransaction(transaction),
 * );
 * ```
 *
 * @param handler - The handler that will be used to handle the transactions.
 */
export function useStableVaultWithdraw(
  handler: ExecutionPlanHandler<TransactionRequest, PendingTransaction>,
): UseAsyncTask<
  StableVaultWithdrawRequest,
  StableVaultWithdrawResult,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: StableVaultWithdrawRequest) =>
      stableVaultWithdraw(client, request).andThen((plan) => {
        switch (plan.__typename) {
          case 'TransactionRequest':
            return handler(plan, { cancel })
              .andThen(PendingTransaction.tryFrom)
              .andThen((pending) => pending.wait())
              .andThen(client.waitForTransaction)
              .andThrough(() =>
                refreshStableVaultUserPositions(client, request.user),
              );

          case 'StableVaultWithdrawClaim':
            return handler(plan.transaction, { cancel })
              .andThen(PendingTransaction.tryFrom)
              .andThen((pending) => pending.wait())
              .andThen(client.waitForTransaction)
              .map(() => plan);
        }
      }),
    [client, handler],
  );
}

/**
 * A hook that provides a way to redeem a deferred withdrawal claim.
 *
 * Use this after the claim status is `READY` (see {@link useStableVaultClaimStatus}).
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 *
 * const [redeem, { loading, error }] = useStableVaultWithdrawRedeem((plan) =>
 *   sendTransaction(plan),
 * );
 * ```
 *
 * @param handler - The handler that will be used to handle the transactions.
 */
export function useStableVaultWithdrawRedeem(
  handler: ExecutionPlanHandler<TransactionRequest, PendingTransaction>,
): UseAsyncTask<
  StableVaultWithdrawRedeemRequest,
  TransactionReceipt,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: StableVaultWithdrawRedeemRequest) =>
      stableVaultWithdrawRedeem(client, request)
        .andThen((plan) => {
          switch (plan.__typename) {
            case 'TransactionRequest':
              return handler(plan, { cancel });

            case 'StableVaultPendingAvailability':
              return UnexpectedError.from(
                `Funds not yet available. Please retry after ${plan.executableAfter.toLocaleString()}`,
              ).asResultAsync();
          }
        })
        .andThen(PendingTransaction.tryFrom)
        .andThen((pending) => pending.wait())
        .andThen(client.waitForTransaction),
    [client, handler],
  );
}

export type UseStableVaultClaimStatusArgs = StableVaultClaimStatusRequest;

/**
 * Poll a deferred withdrawal claim until it is ready.
 *
 * The hook automatically polls until the claim reaches a final status.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useStableVaultClaimStatus({
 *   claimId,
 *   suspense: true,
 * });
 * ```
 */
export function useStableVaultClaimStatus(
  args: UseStableVaultClaimStatusArgs & Suspendable,
): SuspenseResult<StableVaultClaimStatus>;
/**
 * Pausable suspense mode.
 */
export function useStableVaultClaimStatus(
  args: Pausable<UseStableVaultClaimStatusArgs> & Suspendable,
): PausableSuspenseResult<StableVaultClaimStatus>;
/**
 * Poll a deferred withdrawal claim until it is ready.
 *
 * ```tsx
 * const { data, loading, error } = useStableVaultClaimStatus({
 *   claimId,
 * });
 * ```
 */
export function useStableVaultClaimStatus(
  args: UseStableVaultClaimStatusArgs,
): ReadResult<StableVaultClaimStatus>;
/**
 * Pausable loading state mode.
 */
export function useStableVaultClaimStatus(
  args: Pausable<UseStableVaultClaimStatusArgs>,
): PausableReadResult<StableVaultClaimStatus>;

export function useStableVaultClaimStatus({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseStableVaultClaimStatusArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<StableVaultClaimStatus, UnexpectedError> {
  const client = useAaveClient();

  return useSuspendableQuery({
    document: StableVaultClaimStatusQuery,
    variables: { request },
    suspense,
    pause,
    pollInterval: client.context.environment.pollingInterval,
  });
}

export type UseStableVaultUserPositionsArgs = StableVaultUserPositionsRequest;

/**
 * Fetch all stable vault positions for a given user.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useStableVaultUserPositions({
 *   user: evmAddress('0x…'),
 *   suspense: true,
 * });
 * ```
 */
export function useStableVaultUserPositions(
  args: UseStableVaultUserPositionsArgs & Suspendable,
): SuspenseResult<StableVaultUserPosition[]>;
/**
 * Pausable suspense mode.
 */
export function useStableVaultUserPositions(
  args: Pausable<UseStableVaultUserPositionsArgs> & Suspendable,
): PausableSuspenseResult<StableVaultUserPosition[]>;
/**
 * Fetch all stable vault positions for a given user.
 *
 * ```tsx
 * const { data, loading, error } = useStableVaultUserPositions({
 *   user: evmAddress('0x…'),
 * });
 * ```
 */
export function useStableVaultUserPositions(
  args: UseStableVaultUserPositionsArgs,
): ReadResult<StableVaultUserPosition[]>;
/**
 * Pausable loading state mode.
 */
export function useStableVaultUserPositions(
  args: Pausable<UseStableVaultUserPositionsArgs>,
): PausableReadResult<StableVaultUserPosition[]>;

export function useStableVaultUserPositions({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseStableVaultUserPositionsArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<StableVaultUserPosition[], UnexpectedError> {
  return useSuspendableQuery({
    document: StableVaultUserPositionsQuery,
    variables: { request },
    suspense,
    pause,
  });
}

export type UseStableVaultArgs = StableVaultRequest;

/**
 * Fetch a stable vault by ID.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useStableVault({
 *   id: stableVaultId('vault-123'),
 *   suspense: true,
 * });
 * ```
 */
export function useStableVault(
  args: UseStableVaultArgs & Suspendable,
): SuspenseResult<StableVault | null>;
/**
 * Pausable suspense mode.
 */
export function useStableVault(
  args: Pausable<UseStableVaultArgs> & Suspendable,
): PausableSuspenseResult<StableVault | null>;
/**
 * Fetch a stable vault by ID.
 *
 * ```tsx
 * const { data, loading, error } = useStableVault({
 *   id: stableVaultId('vault-123'),
 * });
 * ```
 */
export function useStableVault(
  args: UseStableVaultArgs,
): ReadResult<StableVault | null>;
/**
 * Pausable loading state mode.
 */
export function useStableVault(
  args: Pausable<UseStableVaultArgs>,
): PausableReadResult<StableVault | null>;

export function useStableVault({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseStableVaultArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<StableVault | null, UnexpectedError> {
  return useSuspendableQuery({
    document: StableVaultQuery,
    variables: { request },
    suspense,
    pause,
  });
}

export type UseStableVaultsArgs = StableVaultsRequest;

/**
 * Fetch all stable vaults managed by a given admin address.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useStableVaults({
 *   adminAddress: evmAddress('0x…'),
 *   suspense: true,
 * });
 * ```
 */
export function useStableVaults(
  args: UseStableVaultsArgs & Suspendable,
): SuspenseResult<StableVault[]>;
/**
 * Pausable suspense mode.
 */
export function useStableVaults(
  args: Pausable<UseStableVaultsArgs> & Suspendable,
): PausableSuspenseResult<StableVault[]>;
/**
 * Fetch all stable vaults managed by a given admin address.
 *
 * ```tsx
 * const { data, loading, error } = useStableVaults({
 *   adminAddress: evmAddress('0x…'),
 * });
 * ```
 */
export function useStableVaults(
  args: UseStableVaultsArgs,
): ReadResult<StableVault[]>;
/**
 * Pausable loading state mode.
 */
export function useStableVaults(
  args: Pausable<UseStableVaultsArgs>,
): PausableReadResult<StableVault[]>;

export function useStableVaults({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseStableVaultsArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<StableVault[], UnexpectedError> {
  return useSuspendableQuery({
    document: StableVaultsQuery,
    variables: { request },
    suspense,
    pause,
  });
}

/**
 * @internal
 */
function refreshStableVaultUserPositions(
  client: ReturnType<typeof useAaveClient>,
  user: StableVaultDepositRequest['user'] | StableVaultWithdrawRequest['user'],
) {
  return client.refreshQueryWhere(
    StableVaultUserPositionsQuery,
    (variables) => variables.request.user === user,
  );
}
