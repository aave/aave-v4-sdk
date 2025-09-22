import type {
  AaveClient,
  CurrencyQueryOptions,
  UnexpectedError,
} from '@aave/client-next';
import { DEFAULT_QUERY_OPTIONS } from '@aave/client-next';
import {
  borrow,
  liquidatePosition,
  preview,
  renounceSpokeUserPositionManager,
  repay,
  setSpokeUserPositionManager,
  setUserSupplyAsCollateral,
  supply,
  updateUserDynamicConfig,
  updateUserRiskPremium,
  withdraw,
} from '@aave/client-next/actions';
import { ValidationError } from '@aave/core-next';
import {
  type BorrowRequest,
  type ExecutionPlan,
  HubQuery,
  HubsQuery,
  type InsufficientBalanceError,
  isChainIdsVariant,
  isSpokeInputVariant,
  type LiquidatePositionRequest,
  PreviewQuery,
  type PreviewRequest,
  type PreviewUserPosition,
  type RenounceSpokeUserPositionManagerRequest,
  type RepayRequest,
  ReservesQuery,
  type SetSpokeUserPositionManagerRequest,
  type SetUserSupplyAsCollateralRequest,
  SpokePositionManagersQuery,
  SpokesQuery,
  type SupplyRequest,
  type TransactionRequest,
  type UpdateUserDynamicConfigRequest,
  type UpdateUserRiskPremiumRequest,
  UserBalancesQuery,
  UserPositionQuery,
  UserPositionsQuery,
  UserSummaryQuery,
  type WithdrawRequest,
} from '@aave/graphql-next';
import { errAsync, type TxHash } from '@aave/types-next';
import { useAaveClient } from './context';
import {
  cancel,
  type PendingTransactionError,
  type ReadResult,
  type SendTransactionError,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  type TransactionHandler,
  type UseAsyncTask,
  useAsyncTask,
  useSuspendableQuery,
} from './helpers';

function refreshQueriesForReserveChange(
  client: AaveClient,
  request: SupplyRequest | BorrowRequest | RepayRequest | WithdrawRequest,
) {
  return async () =>
    Promise.all([
      // update user positions
      await client.refreshQueryWhere(
        UserPositionsQuery,
        (variables, data) =>
          variables.request.user === request.sender &&
          data.some(
            (position) =>
              position.spoke.chain.chainId === request.reserve.chainId &&
              position.spoke.address === request.reserve.spoke,
          ),
      ),
      await client.refreshQueryWhere(
        UserPositionQuery,
        (_, data) =>
          data?.spoke.chain.chainId === request.reserve.chainId &&
          data?.spoke.address === request.reserve.spoke &&
          data.user === request.sender,
      ),

      // update user summary
      await client.refreshQueryWhere(UserSummaryQuery, (variables) =>
        variables.request.user === request.sender &&
        isSpokeInputVariant(variables.request.filter)
          ? variables.request.filter.spoke.chainId ===
              request.reserve.chainId &&
            variables.request.filter.spoke.address === request.reserve.spoke
          : isChainIdsVariant(variables.request.filter)
            ? variables.request.filter.chainIds.some(
                (chainId) => chainId === request.reserve.chainId,
              )
            : false,
      ),

      // update reserves
      await client.refreshQueryWhere(ReservesQuery, (_, data) =>
        data.some((reserve) => reserve.id === request.reserve.reserveId),
      ),

      // update spokes
      await client.refreshQueryWhere(SpokesQuery, (_, data) =>
        data.some(
          (spoke) =>
            spoke.chain.chainId === request.reserve.chainId &&
            spoke.address === request.reserve.spoke,
        ),
      ),

      // update user balances
      await client.refreshQueryWhere(
        UserBalancesQuery,
        // update any user balances for the given user
        (variables) => variables.request.user === request.sender,
      ),

      // update hubs
      await client.refreshQueryWhere(
        HubsQuery,
        (variables) =>
          isChainIdsVariant(variables.request) &&
          variables.request.chainIds.some(
            (chainId) => chainId === request.reserve.chainId,
          ),
      ),
    ]);
}

/**
 * A hook that provides a way to supply assets to an Aave reserve.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [supply, { loading, error }] = useSupply((plan, { cancel }) => {
 *   switch (plan.__typename) {
 *     case 'TransactionRequest':
 *       return sendTransaction(plan);
 *     case 'ApprovalRequired':
 *       return sendTransaction(plan.approval);
 *   }
 * });
 *
 * // …
 *
 * const result = await supply({ ... });
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
 * console.log('Transaction sent with hash:', result.value);
 * ```
 *
 * @param handler - The handler that will be used to handle the transactions.
 */
export function useSupply(
  handler: TransactionHandler,
): UseAsyncTask<
  SupplyRequest,
  TxHash,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask((request: SupplyRequest) =>
    supply(client, request)
      .andThen((plan) => {
        switch (plan.__typename) {
          case 'TransactionRequest':
            return handler(plan, { cancel })
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(client.waitForTransaction);

          case 'ApprovalRequired':
            return handler(plan, { cancel })
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(() => handler(plan.originalTransaction, { cancel }))
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(client.waitForTransaction);

          case 'InsufficientBalanceError':
            return errAsync(ValidationError.fromGqlNode(plan));
        }
      })
      .andTee(refreshQueriesForReserveChange(client, request)),
  );
}

/**
 * Low-level hook to execute a {@link supply} action directly.
 *
 * @remarks
 * This hook **does not** update any read/cache state or trigger follow-up effects.
 * Prefer {@link useSupply} for a higher-level API that updates the relevant read hooks.
 */
export function useSupplyAction(): UseAsyncTask<
  SupplyRequest,
  ExecutionPlan,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: SupplyRequest) => supply(client, request));
}

/**
 * A hook that provides a way to borrow assets from an Aave reserve.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [borrow, { loading, error }] = useBorrow((plan, { cancel }) => {
 *   switch (plan.__typename) {
 *     case 'TransactionRequest':
 *       return sendTransaction(plan);
 *     case 'ApprovalRequired':
 *       return sendTransaction(plan.approval);
 *   }
 * });
 *
 * // …
 *
 * const result = await borrow({ ... });
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
 * console.log('Transaction sent with hash:', result.value);
 * ```
 *
 * @param handler - The handler that will be used to handle the transactions.
 */
export function useBorrow(
  handler: TransactionHandler,
): UseAsyncTask<
  BorrowRequest,
  TxHash,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask((request: BorrowRequest) =>
    borrow(client, request)
      .andThen((plan) => {
        switch (plan.__typename) {
          case 'TransactionRequest':
            return handler(plan, { cancel })
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(client.waitForTransaction);

          case 'ApprovalRequired':
            return handler(plan, { cancel })
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(() => handler(plan.originalTransaction, { cancel }))
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(client.waitForTransaction);

          case 'InsufficientBalanceError':
            return errAsync(ValidationError.fromGqlNode(plan));
        }
      })
      .andTee(refreshQueriesForReserveChange(client, request)),
  );
}

/**
 * Low-level hook to execute a {@link borrow} action directly.
 *
 * @remarks
 * This hook **does not** update any read/cache state or trigger follow-up effects.
 * Prefer {@link useBorrow} for a higher-level API that updates the relevant read hooks.
 */
export function useBorrowAction(): UseAsyncTask<
  BorrowRequest,
  ExecutionPlan,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: BorrowRequest) => borrow(client, request));
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
 *     case 'ApprovalRequired':
 *       return sendTransaction(plan.approval);
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
 * console.log('Transaction sent with hash:', result.value);
 * ```
 *
 * @param handler - The handler that will be used to handle the transactions.
 */
export function useRepay(
  handler: TransactionHandler,
): UseAsyncTask<
  RepayRequest,
  TxHash,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask((request: RepayRequest) =>
    repay(client, request)
      .andThen((plan) => {
        switch (plan.__typename) {
          case 'TransactionRequest':
            return handler(plan, { cancel })
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(client.waitForTransaction);

          case 'ApprovalRequired':
            return handler(plan, { cancel })
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(() => handler(plan.originalTransaction, { cancel }))
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(client.waitForTransaction);

          case 'InsufficientBalanceError':
            return errAsync(ValidationError.fromGqlNode(plan));
        }
      })
      .andTee(refreshQueriesForReserveChange(client, request)),
  );
}

/**
 * Low-level hook to execute a {@link repay} action directly.
 *
 * @remarks
 * This hook **does not** update any read/cache state or trigger follow-up effects.
 * Prefer {@link useRepay} for a higher-level API that updates the relevant read hooks.
 */
export function useRepayAction(): UseAsyncTask<
  RepayRequest,
  ExecutionPlan,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: RepayRequest) => repay(client, request));
}

/**
 * A hook that provides a way to withdraw supplied assets from an Aave reserve.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [withdraw, { loading, error }] = useWithdraw((plan, { cancel }) => {
 *   switch (plan.__typename) {
 *     case 'TransactionRequest':
 *       return sendTransaction(plan);
 *     case 'ApprovalRequired':
 *       return sendTransaction(plan.approval);
 *   }
 * });
 *
 * // …
 *
 * const result = await withdraw({ ... });
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
 * console.log('Transaction sent with hash:', result.value);
 * ```
 *
 * @param handler - The handler that will be used to handle the transactions.
 */
export function useWithdraw(
  handler: TransactionHandler,
): UseAsyncTask<
  WithdrawRequest,
  TxHash,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask((request: WithdrawRequest) =>
    withdraw(client, request)
      .andThen((plan) => {
        switch (plan.__typename) {
          case 'TransactionRequest':
            return handler(plan, { cancel })
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(client.waitForTransaction);

          case 'ApprovalRequired':
            return handler(plan, { cancel })
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(() => handler(plan.originalTransaction, { cancel }))
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(client.waitForTransaction);

          case 'InsufficientBalanceError':
            return errAsync(ValidationError.fromGqlNode(plan));
        }
      })
      .andTee(refreshQueriesForReserveChange(client, request)),
  );
}

/**
 * Low-level hook to execute a {@link withdraw} action directly.
 *
 * @remarks
 * This hook **does not** update any read/cache state or trigger follow-up effects.
 * Prefer {@link useWithdraw} for a higher-level API that updates the relevant read hooks.
 */
export function useWithdrawAction(): UseAsyncTask<
  WithdrawRequest,
  ExecutionPlan,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: WithdrawRequest) => withdraw(client, request));
}

/**
 * A hook that provides a way to renounce a position manager of a user for a specific spoke.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [renounceSpokeUserPositionManager, { loading, error }] = useRenounceSpokeUserPositionManager(sendTransaction);
 *
 * // …
 *
 * const result = await renounceSpokeUserPositionManager({ ... });
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
 *     case 'UnexpectedError':
 *       console.error(result.error.message);
 *       break;
 *   }
 *   return;
 * }
 *
 * console.log('Transaction sent with hash:', result.value);
 * ```
 *
 * @param handler - The handler that will be used to handle the transaction.
 */

export function useRenounceSpokeUserPositionManager(
  handler: TransactionHandler,
): UseAsyncTask<
  RenounceSpokeUserPositionManagerRequest,
  TxHash,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask((request: RenounceSpokeUserPositionManagerRequest) =>
    renounceSpokeUserPositionManager(client, request)
      .andThen((transaction) => handler(transaction, { cancel }))
      .andThen((pendingTransaction) => pendingTransaction.wait())
      .andThen(client.waitForTransaction)
      .andTee(() =>
        client.refreshQueryWhere(
          SpokePositionManagersQuery,
          (variables) =>
            variables.request.spoke.chainId === request.spoke.chainId &&
            variables.request.spoke.address === request.spoke.address,
        ),
      ),
  );
}

/**
 * Low-level hook to execute a {@link renounceSpokeUserPositionManager} action directly.
 *
 * @remarks
 * This hook **does not** update any read/cache state or trigger follow-up effects.
 * Prefer {@link useRenounceSpokeUserPositionManager} for a higher-level API that handles transactions.
 */
export function useRenounceSpokeUserPositionManagerAction(): UseAsyncTask<
  RenounceSpokeUserPositionManagerRequest,
  TransactionRequest,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: RenounceSpokeUserPositionManagerRequest) =>
    renounceSpokeUserPositionManager(client, request),
  );
}

/**
 * A hook that provides a way to update the user risk premium for a spoke.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [updateUserRiskPremium, { loading, error }] = useUpdateUserRiskPremium((transaction, { cancel }) => {
 *   return sendTransaction(transaction);
 * });
 *
 * // …
 *
 * const result = await updateUserRiskPremium({ ... });
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
 *     case 'UnexpectedError':
 *       console.error(result.error.message);
 *       break;
 *   }
 *   return;
 * }
 *
 * console.log('Transaction sent with hash:', result.value);
 * ```
 *
 * @param handler - The handler that will be used to handle the transaction.
 */

export function useUpdateUserRiskPremium(
  handler: TransactionHandler,
): UseAsyncTask<
  UpdateUserRiskPremiumRequest,
  TxHash,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask((request: UpdateUserRiskPremiumRequest) =>
    updateUserRiskPremium(client, request)
      .andThen((transaction) => handler(transaction, { cancel }))
      .andThen((pendingTransaction) => pendingTransaction.wait())
      .andThen(client.waitForTransaction)
      .andTee(async () =>
        Promise.all([
          client.refreshQueryWhere(
            UserPositionsQuery,
            (variables, data) =>
              variables.request.user === request.sender &&
              data.some(
                (position) =>
                  position.spoke.chain.chainId === request.spoke.chainId &&
                  position.spoke.address === request.spoke.address,
              ),
          ),
          client.refreshQueryWhere(
            UserPositionQuery,
            (_, data) =>
              data?.spoke.chain.chainId === request.spoke.chainId &&
              data?.spoke.address === request.spoke.address &&
              data.user === request.sender,
          ),
        ]),
      ),
  );
}

/**
 * Low-level hook to execute a {@link updateUserRiskPremium} action directly.
 *
 * @remarks
 * This hook **does not** update any read/cache state or trigger follow-up effects.
 * Prefer {@link useUpdateUserRiskPremium} for a higher-level API that handles transactions.
 */
export function useUpdateUserRiskPremiumAction(): UseAsyncTask<
  UpdateUserRiskPremiumRequest,
  TransactionRequest,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: UpdateUserRiskPremiumRequest) =>
    updateUserRiskPremium(client, request),
  );
}

/**
 * A hook that provides a way to update the user dynamic configuration for a spoke.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [updateUserDynamicConfig, { loading, error }] = useUpdateUserDynamicConfig((transaction, { cancel }) => {
 *   return sendTransaction(transaction);
 * });
 *
 * // …
 *
 * const result = await updateUserDynamicConfig({ ... });
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
 *     case 'UnexpectedError':
 *       console.error(result.error.message);
 *       break;
 *   }
 *   return;
 * }
 *
 * console.log('Transaction sent with hash:', result.value);
 * ```
 *
 * @param handler - The handler that will be used to handle the transaction.
 */

export function useUpdateUserDynamicConfig(
  handler: TransactionHandler,
): UseAsyncTask<
  UpdateUserDynamicConfigRequest,
  TxHash,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  // TODO update relevant active queries once the location of dynamic config is clarified
  return useAsyncTask((request: UpdateUserDynamicConfigRequest) =>
    updateUserDynamicConfig(client, request)
      .andThen((transaction) => handler(transaction, { cancel }))
      .andThen((pendingTransaction) => pendingTransaction.wait())
      .andThen(client.waitForTransaction),
  );
}

/**
 * Low-level hook to execute a {@link updateUserDynamicConfig} action directly.
 *
 * @remarks
 * This hook **does not** update any read/cache state or trigger follow-up effects.
 * Prefer {@link useUpdateUserDynamicConfig} for a higher-level API that handles transactions.
 */
export function useUpdateUserDynamicConfigAction(): UseAsyncTask<
  UpdateUserDynamicConfigRequest,
  TransactionRequest,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: UpdateUserDynamicConfigRequest) =>
    updateUserDynamicConfig(client, request),
  );
}

/**
 * Hook for setting whether a user's supply should be used as collateral.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [setUserSupplyAsCollateral, { loading, error }] = useSetUserSupplyAsCollateral((transaction, { cancel }) => {
 *   return sendTransaction(transaction);
 * });
 *
 * const result = await setUserSupplyAsCollateral({
 *   reserve: {
 *     chainId: chainId(1),
 *     spoke: evmAddress('0x123...'),
 *     reserveId: reserveId(1)
 *   },
 *   sender: evmAddress('0x456...'),
 *   enableCollateral: true,
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
 *     case 'UnexpectedError':
 *       console.error(result.error.message);
 *       break;
 *   }
 *   return;
 * }
 *
 * console.log('Transaction sent with hash:', result.value);
 * ```
 *
 * @param handler - The handler that will be used to handle the transaction.
 */
export function useSetUserSupplyAsCollateral(
  handler: TransactionHandler,
): UseAsyncTask<
  SetUserSupplyAsCollateralRequest,
  TxHash,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask((request: SetUserSupplyAsCollateralRequest) =>
    setUserSupplyAsCollateral(client, request)
      .andThen((transaction) => handler(transaction, { cancel }))
      .andThen((pendingTransaction) => pendingTransaction.wait())
      .andThen(client.waitForTransaction)
      .andTee(() =>
        Promise.all([
          // update user positions
          client.refreshQueryWhere(
            UserPositionsQuery,
            (variables, data) =>
              variables.request.user === request.sender &&
              data.some(
                (position) =>
                  position.spoke.chain.chainId === request.reserve.chainId &&
                  position.spoke.address === request.reserve.spoke,
              ),
          ),
          client.refreshQueryWhere(
            UserPositionQuery,
            (_, data) =>
              data?.spoke.chain.chainId === request.reserve.chainId &&
              data?.spoke.address === request.reserve.spoke &&
              data.user === request.sender,
          ),

          // update user summary
          client.refreshQueryWhere(UserSummaryQuery, (variables) =>
            variables.request.user === request.sender &&
            isSpokeInputVariant(variables.request.filter)
              ? variables.request.filter.spoke.chainId ===
                  request.reserve.chainId &&
                variables.request.filter.spoke.address === request.reserve.spoke
              : isChainIdsVariant(variables.request.filter)
                ? variables.request.filter.chainIds.some(
                    (chainId) => chainId === request.reserve.chainId,
                  )
                : false,
          ),

          // update reserves
          client.refreshQueryWhere(ReservesQuery, (_, data) =>
            data.some((reserve) => reserve.id === request.reserve.reserveId),
          ),

          // update spokes
          client.refreshQueryWhere(SpokesQuery, (_, data) =>
            data.some(
              (spoke) =>
                spoke.chain.chainId === request.reserve.chainId &&
                spoke.address === request.reserve.spoke,
            ),
          ),

          // update hubs
          client.refreshQueryWhere(HubsQuery, (variables) =>
            isChainIdsVariant(variables.request)
              ? variables.request.chainIds.some(
                  (chainId) => chainId === request.reserve.chainId,
                )
              : variables.request.tokens.some(
                  (token) => token.chainId === request.reserve.chainId,
                ),
          ),
          client.refreshQueryWhere(
            HubQuery,
            (variables) =>
              variables.request.chainId === request.reserve.chainId,
          ),
        ]),
      ),
  );
}

/**
 * Low-level hook to execute a {@link setUserSupplyAsCollateral} action directly.
 *
 * @remarks
 * This hook **does not** update any read/cache state or trigger follow-up effects.
 * Prefer {@link useSetUserSupplyAsCollateral} for a higher-level API that handles transactions.
 */
export function useSetUserSupplyAsCollateralAction(): UseAsyncTask<
  SetUserSupplyAsCollateralRequest,
  TransactionRequest,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: SetUserSupplyAsCollateralRequest) =>
    setUserSupplyAsCollateral(client, request),
  );
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
 *     case 'ApprovalRequired':
 *       return sendTransaction(plan.approval);
 *   }
 * });
 *
 * // …
 *
 * const result = await liquidatePosition({
 *   spoke: {
 *     address: evmAddress('0x87870bca…'),
 *     chainId: chainId(1),
 *   },
 *   collateral: reserveId(1),
 *   debt: reserveId(2),
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
 * console.log('Transaction sent with hash:', result.value);
 * ```
 *
 * @param handler - The handler that will be used to handle the transactions.
 */
export function useLiquidatePosition(
  handler: TransactionHandler,
): UseAsyncTask<
  LiquidatePositionRequest,
  TxHash,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask((request: LiquidatePositionRequest) =>
    // TODO: update the relevant read queries
    liquidatePosition(client, request).andThen((plan) => {
      switch (plan.__typename) {
        case 'TransactionRequest':
          return handler(plan, { cancel })
            .andThen((pendingTransaction) => pendingTransaction.wait())
            .andThen(client.waitForTransaction);

        case 'ApprovalRequired':
          return handler(plan, { cancel })
            .andThen((pendingTransaction) => pendingTransaction.wait())
            .andThen(() => handler(plan.originalTransaction, { cancel }))
            .andThen((pendingTransaction) => pendingTransaction.wait())
            .andThen(client.waitForTransaction);

        case 'InsufficientBalanceError':
          return errAsync(ValidationError.fromGqlNode(plan));
      }
    }),
  );
}

/**
 * Low-level hook to execute a {@link liquidatePosition} action directly.
 *
 * @remarks
 * This hook **does not** update any read/cache state or trigger follow-up effects.
 * Prefer {@link useLiquidatePosition} for a higher-level API that updates the relevant read hooks.
 */
export function useLiquidatePositionAction(): UseAsyncTask<
  LiquidatePositionRequest,
  ExecutionPlan,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: LiquidatePositionRequest) =>
    liquidatePosition(client, request),
  );
}

/**
 * A hook that provides a way to set or remove a position manager for a user on a specific spoke.
 *
 * **Position managers** can perform transactions on behalf of other users, including:
 * - Supply assets using `onBehalfOf`
 * - Borrow assets using `onBehalfOf`
 * - Withdraw assets using `onBehalfOf`
 * - Enable/disable collateral using `onBehalfOf`
 *
 * The `signature` parameter is an **ERC712 signature** that must be signed by the **user**
 * (the account granting permissions) to authorize the position manager. The signature contains:
 * - `value`: The actual cryptographic signature
 * - `deadline`: Unix timestamp when the authorization expires
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [setSpokeUserPositionManager, { loading, error }] = useSetSpokeUserPositionManager((transaction, { cancel }) => {
 *   return sendTransaction(transaction);
 * });
 *
 * const result = await setSpokeUserPositionManager({
 *   spoke: {
 *     address: evmAddress('0x87870bca…'),
 *     chainId: chainId(1),
 *   },
 *   manager: evmAddress('0x9abc…'), // Address that will become the position manager
 *   approve: true, // true to approve, false to remove the manager
 *   user: evmAddress('0xdef0…'), // User granting the permission (must sign the signature)
 *   signature: {
 *     value: '0x1234...', // ERC712 signature signed by the user
 *     deadline: 1735689600, // Unix timestamp when signature expires
 *   },
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
 *     case 'UnexpectedError':
 *       console.error(result.error.message);
 *       break;
 *   }
 *   return;
 * }
 *
 * console.log('Transaction sent with hash:', result.value);
 * ```
 *
 * @param handler - The handler that will be used to handle the transaction.
 */
export function useSetSpokeUserPositionManager(
  handler: TransactionHandler,
): UseAsyncTask<
  SetSpokeUserPositionManagerRequest,
  TxHash,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask((request: SetSpokeUserPositionManagerRequest) =>
    setSpokeUserPositionManager(client, request)
      .andThen((transaction) => handler(transaction, { cancel }))
      .andThen((pendingTransaction) => pendingTransaction.wait())
      .andThen(client.waitForTransaction)
      .andTee(() =>
        client.refreshQueryWhere(
          SpokePositionManagersQuery,
          (variables) =>
            variables.request.spoke.chainId === request.spoke.chainId &&
            variables.request.spoke.address === request.spoke.address,
        ),
      ),
  );
}

/**
 * Low-level hook to execute a {@link setSpokeUserPositionManager} action directly.
 *
 * @remarks
 * This hook **does not** update any read/cache state or trigger follow-up effects.
 * Prefer {@link useSetSpokeUserPositionManager} for a higher-level API that handles transactions.
 */
export function useSetSpokeUserPositionManagerAction(): UseAsyncTask<
  SetSpokeUserPositionManagerRequest,
  TransactionRequest,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: SetSpokeUserPositionManagerRequest) =>
    setSpokeUserPositionManager(client, request),
  );
}

/**
 * Preview the impact of a potential action on a user's position.
 *
 * ```tsx
 * const [getPreview, previewing] = usePreviewAction();
 *
 * const loading = previewing.loading;
 * const error = previewing.error;
 *
 * // …
 *
 * const result = await getPreview({
 *   action: {
 *     supply: {
 *       reserve: {
 *         spoke: evmAddress('0x87870bca…'),
 *         reserveId: reserveId(1),
 *         chainId: chainId(1),
 *       },
 *       amount: {
 *         erc20: {
 *           value: '1000',
 *         },
 *       },
 *       sender: evmAddress('0x9abc…'),
 *     },
 *   },
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Preview result:', result.value);
 * ```
 */
export function usePreviewAction(): UseAsyncTask<
  PreviewRequest,
  PreviewUserPosition,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: PreviewRequest) => preview(client, request));
}

export type UsePreviewArgs = PreviewRequest & CurrencyQueryOptions;

/**
 * Fetch a preview of the impact of a potential action on a user's position.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = usePreview({
 *   action: {
 *     supply: {
 *       spoke: {
 *         address: evmAddress('0x87870bca…'),
 *         chainId: chainId(1),
 *       },
 *       reserve: reserveId(1),
 *       amount: {
 *         erc20: {
 *           currency: evmAddress('0x5678…'),
 *           value: '1000',
 *         },
 *       },
 *       supplier: evmAddress('0x9abc…'),
 *     },
 *   },
 *   suspense: true,
 * });
 * ```
 */
export function usePreview(
  args: UsePreviewArgs & Suspendable,
): SuspenseResult<PreviewUserPosition>;

/**
 * Fetch a preview of the impact of a potential action on a user's position.
 *
 * ```tsx
 * const { data, error, loading } = usePreview({
 *   action: {
 *     supply: {
 *       spoke: {
 *         address: evmAddress('0x87870bca…'),
 *         chainId: chainId(1),
 *       },
 *       reserve: reserveId(1),
 *       amount: {
 *         erc20: {
 *           currency: evmAddress('0x5678…'),
 *           value: '1000',
 *         },
 *       },
 *       supplier: evmAddress('0x9abc…'),
 *     },
 *   },
 * });
 * ```
 */
export function usePreview(
  args: UsePreviewArgs,
): ReadResult<PreviewUserPosition>;

export function usePreview({
  suspense = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: UsePreviewArgs & {
  suspense?: boolean;
}): SuspendableResult<PreviewUserPosition> {
  return useSuspendableQuery({
    document: PreviewQuery,
    variables: {
      request,
      currency,
    },
    suspense,
  });
}
