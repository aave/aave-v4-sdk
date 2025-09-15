import type { UnexpectedError } from '@aave/client-next';
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
  HubsQuery,
  type InsufficientBalanceError,
  type LiquidatePositionRequest,
  type PreviewRequest,
  type PreviewUserPositionResult,
  type RenounceSpokeUserPositionManagerRequest,
  type RepayRequest,
  ReservesQuery,
  type SetSpokeUserPositionManagerRequest,
  type SetUserSupplyAsCollateralRequest,
  SpokesQuery,
  type SupplyRequest,
  type TransactionRequest,
  type UpdateUserDynamicConfigRequest,
  type UpdateUserRiskPremiumRequest,
  UserBalancesQuery,
  UserPositionQuery,
  UserPositionsQuery,
  type WithdrawRequest,
} from '@aave/graphql-next';
import { errAsync, type TxHash } from '@aave/types-next';
import { useAaveClient } from './context';
import {
  type ComplexTransactionHandler,
  cancel,
  type SendTransactionError,
  type SimpleTransactionHandler,
  type UseAsyncTask,
  useAsyncTask,
} from './helpers';

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
 *       return sendTransaction(plan.approval).andThen(() => sendTransaction(plan.originalTransaction));
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
  handler: ComplexTransactionHandler,
): UseAsyncTask<
  SupplyRequest,
  TxHash,
  SendTransactionError | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask((request: SupplyRequest) =>
    supply(client, request)
      .andThen((plan) => {
        switch (plan.__typename) {
          case 'TransactionRequest':
          case 'ApprovalRequired':
            return handler(plan, { cancel });

          case 'InsufficientBalanceError':
            return errAsync(ValidationError.fromGqlNode(plan));
        }
      })
      .andTee(async () =>
        Promise.all([
          // update user positions
          await client.refreshQueryWhere(
            UserPositionsQuery,
            (variables) =>
              'chainIds' in variables.request &&
              variables.request.user === request.sender &&
              variables.request.chainIds.some(
                (chainId) => chainId === request.reserve.chainId,
              ),
          ),
          await client.refreshQueryWhere(
            UserPositionQuery,
            (_, data) =>
              data?.spoke.chain.chainId === request.reserve.chainId &&
              data?.spoke.address === request.reserve.spoke &&
              data.user === request.sender,
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
              'chainIds' in variables.request &&
              variables.request.chainIds.some(
                (chainId) => chainId === request.reserve.chainId,
              ),
          ),
        ]),
      ),
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
 *       return sendTransaction(plan.approval).andThen(() => sendTransaction(plan.originalTransaction));
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
  handler: ComplexTransactionHandler,
): UseAsyncTask<
  BorrowRequest,
  TxHash,
  SendTransactionError | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask((request: BorrowRequest) =>
    borrow(client, request)
      .andThen((plan) => {
        switch (plan.__typename) {
          case 'TransactionRequest':
          case 'ApprovalRequired':
            return handler(plan, { cancel });

          case 'InsufficientBalanceError':
            return errAsync(ValidationError.fromGqlNode(plan));
        }
      })
      .andTee(async () => {
        await client.refreshQueryWhere(
          HubsQuery,
          (variables) =>
            'chainIds' in variables.request &&
            variables.request.chainIds.some(
              (chainId) => chainId === request.reserve.chainId,
            ),
        );
      }),
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
 *       return sendTransaction(plan.approval).andThen(() => sendTransaction(plan.originalTransaction));
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
  handler: ComplexTransactionHandler,
): UseAsyncTask<
  RepayRequest,
  TxHash,
  SendTransactionError | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask((request: RepayRequest) =>
    repay(client, request)
      .andThen((plan) => {
        switch (plan.__typename) {
          case 'TransactionRequest':
          case 'ApprovalRequired':
            return handler(plan, { cancel });

          case 'InsufficientBalanceError':
            return errAsync(ValidationError.fromGqlNode(plan));
        }
      })
      .andTee(async () => {
        await client.refreshQueryWhere(
          HubsQuery,
          (variables) =>
            'chainIds' in variables.request &&
            variables.request.chainIds.some(
              (chainId) => chainId === request.reserve.chainId,
            ),
        );
      }),
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
 *       return sendTransaction(plan.approval).andThen(() => sendTransaction(plan.originalTransaction));
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
  handler: ComplexTransactionHandler,
): UseAsyncTask<
  WithdrawRequest,
  TxHash,
  SendTransactionError | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask((request: WithdrawRequest) =>
    withdraw(client, request)
      .andThen((plan) => {
        switch (plan.__typename) {
          case 'TransactionRequest':
          case 'ApprovalRequired':
            return handler(plan, { cancel });

          case 'InsufficientBalanceError':
            return errAsync(ValidationError.fromGqlNode(plan));
        }
      })
      .andTee(async () => {
        await client.refreshQueryWhere(
          HubsQuery,
          (variables) =>
            'chainIds' in variables.request &&
            variables.request.chainIds.some(
              (chainId) => chainId === request.reserve.chainId,
            ),
        );
      }),
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
  handler: SimpleTransactionHandler,
): UseAsyncTask<
  RenounceSpokeUserPositionManagerRequest,
  TxHash,
  SendTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask((request: RenounceSpokeUserPositionManagerRequest) =>
    renounceSpokeUserPositionManager(client, request).andThen((transaction) =>
      handler(transaction, { cancel }),
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
  handler: SimpleTransactionHandler,
): UseAsyncTask<UpdateUserRiskPremiumRequest, TxHash, SendTransactionError> {
  const client = useAaveClient();

  return useAsyncTask((request: UpdateUserRiskPremiumRequest) =>
    updateUserRiskPremium(client, request).andThen((transaction) =>
      handler(transaction, { cancel }),
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
  handler: SimpleTransactionHandler,
): UseAsyncTask<UpdateUserDynamicConfigRequest, TxHash, SendTransactionError> {
  const client = useAaveClient();

  return useAsyncTask((request: UpdateUserDynamicConfigRequest) =>
    updateUserDynamicConfig(client, request).andThen((transaction) =>
      handler(transaction, { cancel }),
    ),
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
  handler: SimpleTransactionHandler,
): UseAsyncTask<
  SetUserSupplyAsCollateralRequest,
  TxHash,
  SendTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask((request: SetUserSupplyAsCollateralRequest) =>
    setUserSupplyAsCollateral(client, request).andThen((transaction) =>
      handler(transaction, { cancel }),
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
 *       return sendTransaction(plan.approval).andThen(() => sendTransaction(plan.originalTransaction));
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
  handler: ComplexTransactionHandler,
): UseAsyncTask<
  LiquidatePositionRequest,
  TxHash,
  SendTransactionError | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask((request: LiquidatePositionRequest) =>
    liquidatePosition(client, request)
      .andThen((plan) => {
        switch (plan.__typename) {
          case 'TransactionRequest':
          case 'ApprovalRequired':
            return handler(plan, { cancel });

          case 'InsufficientBalanceError':
            return errAsync(ValidationError.fromGqlNode(plan));
        }
      })
      .andTee(async () => {
        await client.refreshQueryWhere(
          HubsQuery,
          (variables) =>
            'chainIds' in variables.request &&
            variables.request.chainIds.some(
              (chainId) => chainId === request.spoke.chainId,
            ),
        );
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
  handler: SimpleTransactionHandler,
): UseAsyncTask<
  SetSpokeUserPositionManagerRequest,
  TxHash,
  SendTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask((request: SetSpokeUserPositionManagerRequest) =>
    setSpokeUserPositionManager(client, request).andThen((transaction) =>
      handler(transaction, { cancel }),
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
 * const [getPreview, previewing] = usePreview();
 *
 * const loading = previewing.loading;
 * const error = previewing.error;
 *
 * // …
 *
 * const result = await getPreview({
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
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Preview result:', result.value);
 * ```
 */
export function usePreview(): UseAsyncTask<
  PreviewRequest,
  PreviewUserPositionResult,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: PreviewRequest) => preview(client, request));
}
