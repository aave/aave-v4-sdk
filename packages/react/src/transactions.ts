import {
  type AaveClient,
  type ActivitiesRequest,
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type PaginatedActivitiesResult,
  type TimeWindowQueryOptions,
  UnexpectedError,
} from '@aave/client';
import {
  activities,
  borrow,
  liquidatePosition,
  preview,
  renounceSpokeUserPositionManager,
  repay,
  setSpokeUserPositionManager,
  setUserSuppliesAsCollateral,
  supply,
  updateUserPositionConditions,
  withdraw,
} from '@aave/client/actions';
import { ValidationError } from '@aave/core';
import {
  ActivitiesQuery,
  type BorrowRequest,
  decodeHubId,
  decodeReserveId,
  type ERC20PermitSignature,
  type Erc20Approval,
  HubQuery,
  HubsQuery,
  type InsufficientBalanceError,
  isChainIdsVariant,
  isHubInputVariant,
  isSpokeInputVariant,
  isTokensVariant,
  type LiquidatePositionRequest,
  type PreContractActionRequired,
  PreviewQuery,
  type PreviewRequest,
  type PreviewUserPosition,
  type RenounceSpokeUserPositionManagerRequest,
  type RepayRequest,
  ReservesQuery,
  type SetSpokeUserPositionManagerRequest,
  type SetUserSuppliesAsCollateralRequest,
  type SpokeInput,
  SpokePositionManagersQuery,
  SpokesQuery,
  type SupplyRequest,
  type TransactionRequest,
  type UpdateUserPositionConditionsRequest,
  UserPositionQuery,
  UserPositionsQuery,
  UserSummaryQuery,
  type WithdrawRequest,
} from '@aave/graphql';
import {
  errAsync,
  expectTypename,
  isSignature,
  type NullishDeep,
  type Prettify,
  type Signature,
  type TxHash,
} from '@aave/types';
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
  refreshHubs,
  refreshReserves,
  refreshSpokes,
  refreshUserBalances,
  refreshUserBorrows,
  refreshUserPositions,
  refreshUserSummary,
  refreshUserSupplies,
  type SendTransactionError,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  type UseAsyncTask,
  useAsyncTask,
  useSuspendableQuery,
} from './helpers';

function refreshQueriesForReserveChange(
  client: AaveClient,
  request: SupplyRequest | BorrowRequest | RepayRequest | WithdrawRequest,
) {
  const { chainId, spoke: address } = decodeReserveId(request.reserve);
  const spoke: SpokeInput = { chainId, address };
  return async () =>
    Promise.all([
      refreshUserPositions(client, request.sender, spoke),
      refreshUserSummary(client, request.sender, spoke),
      refreshReserves(client, request.reserve),
      refreshSpokes(client, spoke),
      refreshUserBalances(client, request.sender),
      refreshUserSupplies(client, request.sender),
      refreshUserBorrows(client, request.sender),
      refreshHubs(client, chainId),
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
  handler: ExecutionPlanHandler<
    TransactionRequest | Erc20Approval | PreContractActionRequired,
    Signature | PendingTransaction
  >,
): UseAsyncTask<
  SupplyRequest,
  TxHash,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: SupplyRequest) =>
      supply(client, request)
        .andThen((plan) => {
          switch (plan.__typename) {
            case 'TransactionRequest':
              return handler(plan, { cancel })
                .map(PendingTransaction.ensure)
                .andThen((pendingTransaction) => pendingTransaction.wait())
                .andThen(client.waitForTransaction);

            case 'Erc20ApprovalRequired':
              return handler(plan.approval, { cancel })
                .andThen((result) => {
                  if (isSignature(result)) {
                    const permitTypedData = plan.approval.bySignature;
                    if (!permitTypedData) {
                      return UnexpectedError.from(
                        'A signature was returned but the ERC-20 involve does not support permit',
                      ).asResultAsync();
                    }
                    const permitSig: ERC20PermitSignature = {
                      deadline: permitTypedData.message.deadline as number,
                      value: result,
                    };
                    return supply(
                      client,
                      injectSupplyPermitSignature(request, permitSig),
                    )
                      .map(expectTypename('TransactionRequest'))
                      .andThen((transaction) =>
                        handler(transaction, { cancel }),
                      )
                      .map(PendingTransaction.ensure);
                  }
                  return result
                    .wait()
                    .andThen(() =>
                      handler(plan.originalTransaction, { cancel }),
                    )
                    .map(PendingTransaction.ensure);
                })
                .andThen((pendingTransaction) => pendingTransaction.wait())
                .andThen(client.waitForTransaction);

            case 'PreContractActionRequired':
              return handler(plan, { cancel })
                .map(PendingTransaction.ensure)
                .andThen((pendingTransaction) => pendingTransaction.wait())
                .andThen(() => handler(plan.originalTransaction, { cancel }))
                .map(PendingTransaction.ensure)
                .andThen((pendingTransaction) => pendingTransaction.wait())
                .andThen(client.waitForTransaction);

            case 'InsufficientBalanceError':
              return errAsync(ValidationError.fromGqlNode(plan));
          }
        })
        .andTee(refreshQueriesForReserveChange(client, request)),
    [client, handler],
  );
}

function injectSupplyPermitSignature(
  request: SupplyRequest,
  permitSig: ERC20PermitSignature,
): SupplyRequest {
  if ('erc20' in request.amount) {
    return {
      ...request,
      amount: {
        erc20: {
          ...request.amount.erc20,
          permitSig,
        },
      },
    };
  }
  return request;
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
 *
 *     case 'PreContractActionRequired':
 *       return sendTransaction(plan.transaction);
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
  handler: ExecutionPlanHandler<
    TransactionRequest | PreContractActionRequired,
    PendingTransaction
  >,
): UseAsyncTask<
  BorrowRequest,
  TxHash,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: BorrowRequest) =>
      borrow(client, request)
        .andThen((plan) => {
          switch (plan.__typename) {
            case 'TransactionRequest':
              return handler(plan, { cancel })
                .andThen((pendingTransaction) => pendingTransaction.wait())
                .andThen(client.waitForTransaction);

            case 'PreContractActionRequired':
              return handler(plan, { cancel })
                .andThen((pendingTransaction) => pendingTransaction.wait())
                .andThen(() => handler(plan.originalTransaction, { cancel }))
                .map(PendingTransaction.ensure)
                .andThen((pendingTransaction) => pendingTransaction.wait())
                .andThen(client.waitForTransaction);

            case 'InsufficientBalanceError':
              return errAsync(ValidationError.fromGqlNode(plan));

            case 'Erc20ApprovalRequired':
              return UnexpectedError.from(plan).asResultAsync();
          }
        })
        .andTee(refreshQueriesForReserveChange(client, request)),
    [client, handler],
  );
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
 * console.log('Transaction sent with hash:', result.value);
 * ```
 *
 * @param handler - The handler that will be used to handle the transactions.
 */
export function useRepay(
  handler: ExecutionPlanHandler<
    TransactionRequest | Erc20Approval | PreContractActionRequired,
    Signature | PendingTransaction
  >,
): UseAsyncTask<
  RepayRequest,
  TxHash,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: RepayRequest) =>
      repay(client, request)
        .andThen((plan) => {
          switch (plan.__typename) {
            case 'TransactionRequest':
              return handler(plan, { cancel })
                .map(PendingTransaction.ensure)
                .andThen((pendingTransaction) => pendingTransaction.wait())
                .andThen(client.waitForTransaction);

            case 'Erc20ApprovalRequired':
              return handler(plan.approval, { cancel })
                .andThen((result) => {
                  if (isSignature(result)) {
                    const permitTypedData = plan.approval.bySignature;
                    if (!permitTypedData) {
                      return UnexpectedError.from(
                        'A signature was returned but the ERC-20 involve does not support permit',
                      ).asResultAsync();
                    }
                    const permitSig: ERC20PermitSignature = {
                      deadline: permitTypedData.message.deadline as number,
                      value: result,
                    };
                    return repay(
                      client,
                      injectRepayPermitSignature(request, permitSig),
                    )
                      .map(expectTypename('TransactionRequest'))
                      .andThen((transaction) =>
                        handler(transaction, { cancel }),
                      )
                      .map(PendingTransaction.ensure);
                  }
                  return result
                    .wait()
                    .andThen(() =>
                      handler(plan.originalTransaction, { cancel }),
                    )
                    .map(PendingTransaction.ensure);
                })
                .andThen((pendingTransaction) => pendingTransaction.wait())
                .andThen(client.waitForTransaction);

            case 'PreContractActionRequired':
              return handler(plan, { cancel })
                .map(PendingTransaction.ensure)
                .andThen((pendingTransaction) => pendingTransaction.wait())
                .andThen(() => handler(plan.originalTransaction, { cancel }))
                .map(PendingTransaction.ensure)
                .andThen((pendingTransaction) => pendingTransaction.wait())
                .andThen(client.waitForTransaction);

            case 'InsufficientBalanceError':
              return errAsync(ValidationError.fromGqlNode(plan));
          }
        })
        .andTee(refreshQueriesForReserveChange(client, request)),
    [client, handler],
  );
}

function injectRepayPermitSignature(
  request: RepayRequest,
  permitSig: ERC20PermitSignature,
): RepayRequest {
  if ('erc20' in request.amount) {
    return {
      ...request,
      amount: {
        erc20: {
          ...request.amount.erc20,
          permitSig,
        },
      },
    };
  }
  return request;
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
 *
 *     case 'PreContractActionRequired':
 *       return sendTransaction(plan.transaction);
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
  handler: ExecutionPlanHandler<
    TransactionRequest | PreContractActionRequired,
    PendingTransaction
  >,
): UseAsyncTask<
  WithdrawRequest,
  TxHash,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: WithdrawRequest) =>
      withdraw(client, request)
        .andThen((plan) => {
          switch (plan.__typename) {
            case 'TransactionRequest':
              return handler(plan, { cancel })
                .andThen((pendingTransaction) => pendingTransaction.wait())
                .andThen(client.waitForTransaction);

            case 'PreContractActionRequired':
              return handler(plan, { cancel })
                .andThen((pendingTransaction) => pendingTransaction.wait())
                .andThen(() => handler(plan.originalTransaction, { cancel }))
                .andThen((pendingTransaction) => pendingTransaction.wait())
                .andThen(client.waitForTransaction);

            case 'InsufficientBalanceError':
              return errAsync(ValidationError.fromGqlNode(plan));

            case 'Erc20ApprovalRequired':
              return UnexpectedError.from(plan).asResultAsync();
          }
        })
        .andTee(refreshQueriesForReserveChange(client, request)),
    [client, handler],
  );
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
  handler: ExecutionPlanHandler<TransactionRequest, PendingTransaction>,
): UseAsyncTask<
  RenounceSpokeUserPositionManagerRequest,
  TxHash,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: RenounceSpokeUserPositionManagerRequest) =>
      renounceSpokeUserPositionManager(client, request)
        .andThen((transaction) => handler(transaction, { cancel }))
        .andThen((pendingTransaction) => pendingTransaction.wait())
        .andThen(client.waitForTransaction)
        .andTee(() =>
          client.refreshQueryWhere(
            SpokePositionManagersQuery,
            (variables) => variables.request.spoke === request.spoke,
          ),
        ),
    [client, handler],
  );
}

/**
 * Hook for updating user position conditions (dynamic config and/or risk premium).
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [update, { loading, error }] = useUpdateUserPositionConditions((transaction, { cancel }) => {
 *   return sendTransaction(transaction);
 * });
 *
 * // …
 *
 * const result = await update({
 *   userPositionId: userPosition.id,
 *   update: UserPositionConditionsUpdate.AllDynamicConfig,
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

export function useUpdateUserPositionConditions(
  handler: ExecutionPlanHandler<TransactionRequest, PendingTransaction>,
): UseAsyncTask<
  UpdateUserPositionConditionsRequest,
  TxHash,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: UpdateUserPositionConditionsRequest) =>
      updateUserPositionConditions(client, request)
        .andThen((transaction) => handler(transaction, { cancel }))
        .andThen((pendingTransaction) => pendingTransaction.wait())
        .andThen(client.waitForTransaction)
        .andTee(async () => {
          const { userPositionId } = request;
          return Promise.all([
            client.refreshQueryWhere(UserPositionsQuery, (_, data) =>
              data.some((position) => position.id === userPositionId),
            ),
            client.refreshQueryWhere(
              UserPositionQuery,
              (_, data) => data?.id === userPositionId,
            ),
          ]);
        }),
    [client, handler],
  );
}

/**
 * Hook for updating the collateral status of user's supplies.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [setUserSuppliesAsCollateral, { loading, error }] = useSetUserSuppliesAsCollateral((transaction, { cancel }) => {
 *   return sendTransaction(transaction);
 * });
 *
 * const result = await setUserSuppliesAsCollateral({
 *   changes: [
 *     {
 *       reserve: reserve.id,
 *       enableCollateral: true
 *     }
 *   ],
 *   sender: evmAddress('0x456...')
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
export function useSetUserSuppliesAsCollateral(
  handler: ExecutionPlanHandler<TransactionRequest, PendingTransaction>,
): UseAsyncTask<
  SetUserSuppliesAsCollateralRequest,
  TxHash,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: SetUserSuppliesAsCollateralRequest) => {
      const reserveIds = request.changes.map((change) => change.reserve);
      const reserveDetails = reserveIds.map((reserveId) =>
        decodeReserveId(reserveId),
      );
      return setUserSuppliesAsCollateral(client, request)
        .andThen((transaction) => handler(transaction, { cancel }))
        .andThen((pendingTransaction) => pendingTransaction.wait())
        .andThen(client.waitForTransaction)
        .andTee(() =>
          Promise.all([
            // update user positions
            ...reserveDetails.map(({ chainId, spoke }) =>
              client.refreshQueryWhere(
                UserPositionsQuery,
                (variables, data) =>
                  variables.request.user === request.sender &&
                  data.some(
                    (position) =>
                      position.spoke.chain.chainId === chainId &&
                      position.spoke.address === spoke,
                  ),
              ),
            ),
            ...reserveDetails.map(({ chainId, spoke }) =>
              client.refreshQueryWhere(
                UserPositionQuery,
                (_, data) =>
                  data?.spoke.chain.chainId === chainId &&
                  data?.spoke.address === spoke &&
                  data.user === request.sender,
              ),
            ),

            // update user summary
            ...reserveDetails.map(({ chainId, spoke }) =>
              client.refreshQueryWhere(UserSummaryQuery, (variables) =>
                variables.request.user === request.sender &&
                isSpokeInputVariant(variables.request.filter)
                  ? variables.request.filter.spoke.chainId === chainId &&
                    variables.request.filter.spoke.address === spoke
                  : isChainIdsVariant(variables.request.filter)
                    ? variables.request.filter.chainIds.some(
                        (id) => id === chainId,
                      )
                    : false,
              ),
            ),

            // update reserves
            client.refreshQueryWhere(ReservesQuery, (_, data) =>
              data.some((reserve) => reserveIds.includes(reserve.id)),
            ),

            // update spokes
            ...reserveDetails.map(({ chainId, spoke }) =>
              client.refreshQueryWhere(SpokesQuery, (_, data) =>
                data.some(
                  (item) =>
                    item.chain.chainId === chainId && item.address === spoke,
                ),
              ),
            ),

            // update hubs
            ...reserveDetails.map(({ chainId }) =>
              client.refreshQueryWhere(
                HubsQuery,
                (variables) =>
                  isChainIdsVariant(variables.request.query)
                    ? variables.request.query.chainIds.some(
                        (id) => id === chainId,
                      )
                    : isTokensVariant(variables.request.query)
                      ? variables.request.query.tokens.some(
                          (token) => token.chainId === chainId,
                        )
                      : true, // assetIds variant - refresh all
              ),
            ),
            ...reserveDetails.map(({ chainId }) =>
              client.refreshQueryWhere(HubQuery, (variables) =>
                isHubInputVariant(variables.request.query)
                  ? variables.request.query.hubInput.chainId === chainId
                  : decodeHubId(variables.request.query.hubId).chainId ===
                    chainId,
              ),
            ),
          ]),
        );
    },
    [client, handler],
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
 * console.log('Transaction sent with hash:', result.value);
 * ```
 *
 * @param handler - The handler that will be used to handle the transactions.
 */
export function useLiquidatePosition(
  handler: ExecutionPlanHandler<
    TransactionRequest | Erc20Approval | PreContractActionRequired,
    PendingTransaction
  >,
): UseAsyncTask<
  LiquidatePositionRequest,
  TxHash,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: LiquidatePositionRequest) =>
      // TODO: update the relevant read queries
      liquidatePosition(client, request).andThen((plan) => {
        switch (plan.__typename) {
          case 'TransactionRequest':
            return handler(plan, { cancel })
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(client.waitForTransaction);

          case 'Erc20ApprovalRequired':
            return handler(plan.approval, { cancel })
              .andThen((result) => {
                if (isSignature(result)) {
                  const permitTypedData = plan.approval.bySignature;
                  if (!permitTypedData) {
                    return UnexpectedError.from(
                      'A signature was returned but the ERC-20 involve does not support permit',
                    ).asResultAsync();
                  }
                  const permitSig: ERC20PermitSignature = {
                    deadline: permitTypedData.message.deadline as number,
                    value: result,
                  };
                  return liquidatePosition(
                    client,
                    injectLiquidatePermitSignature(request, permitSig),
                  )
                    .map(expectTypename('TransactionRequest'))
                    .andThen((transaction) => handler(transaction, { cancel }))
                    .map(PendingTransaction.ensure);
                }
                return result
                  .wait()
                  .andThen(() => handler(plan.originalTransaction, { cancel }))
                  .map(PendingTransaction.ensure);
              })
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(client.waitForTransaction);

          case 'PreContractActionRequired':
            return handler(plan, { cancel })
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(() => handler(plan.originalTransaction, { cancel }))
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(client.waitForTransaction);

          case 'InsufficientBalanceError':
            return errAsync(ValidationError.fromGqlNode(plan));
        }
      }),
    [client, handler],
  );
}

function injectLiquidatePermitSignature(
  request: LiquidatePositionRequest,
  _permitSig: ERC20PermitSignature,
): LiquidatePositionRequest {
  // TODO inject permitSig in the appropriate place once supported in the GQL schema
  return request;
}

/**
 * A hook that provides a way to set or remove a position manager for a user on a specific spoke.
 *
 * **Position managers** can perform transactions on behalf of other users, including:
 * - Supply assets
 * - Borrow assets
 * - Withdraw assets
 * - Enable/disable collateral
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
 *   spoke: spokeId('SGVsbG8h'),
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
  handler: ExecutionPlanHandler<TransactionRequest, PendingTransaction>,
): UseAsyncTask<
  SetSpokeUserPositionManagerRequest,
  TxHash,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: SetSpokeUserPositionManagerRequest) =>
      setSpokeUserPositionManager(client, request)
        .andThen((transaction) => handler(transaction, { cancel }))
        .andThen((pendingTransaction) => pendingTransaction.wait())
        .andThen(client.waitForTransaction)
        .andTee(() =>
          client.refreshQueryWhere(
            SpokePositionManagersQuery,
            (variables) => variables.request.spoke === request.spoke,
          ),
        ),
    [client, handler],
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
 *       reserve: reserveId('SGVsbG8h'),
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
export function usePreviewAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<PreviewRequest, PreviewUserPosition, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: PreviewRequest) =>
      preview(client, request, {
        currency: options.currency,
        requestPolicy: 'network-only',
      }),
    [client, options.currency],
  );
}

export type UsePreviewArgs = Prettify<PreviewRequest & CurrencyQueryOptions>;

/**
 * Fetch a preview of the impact of a potential action on a user's position.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = usePreview({
 *   action: {
 *     supply: {
 *       reserve: reserveId('SGVsbG8h'),
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
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = usePreview({
 *   action: {
 *     supply: {
 *       reserve: reserveId('SGVsbG8h'),
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
 *   pause: true,
 * });
 * ```
 */
export function usePreview(
  args: Pausable<UsePreviewArgs> & Suspendable,
): PausableSuspenseResult<PreviewUserPosition>;
/**
 * Fetch a preview of the impact of a potential action on a user's position.
 *
 * ```tsx
 * const { data, error, loading } = usePreview({
 *   action: {
 *     supply: {
 *       reserve: reserveId('SGVsbG8h'),
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
/**
 * Fetch a preview of the impact of a potential action on a user's position.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = usePreview({
 *   action: {
 *     supply: {
 *       reserve: reserveId('SGVsbG8h'),
 *       amount: {
 *         erc20: {
 *           currency: evmAddress('0x5678…'),
 *           value: '1000',
 *         },
 *       },
 *       supplier: evmAddress('0x9abc…'),
 *     },
 *   },
 *   pause: true,
 * });
 * ```
 */
export function usePreview(
  args: Pausable<UsePreviewArgs>,
): PausableReadResult<PreviewUserPosition>;

export function usePreview({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UsePreviewArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<PreviewUserPosition, UnexpectedError> {
  return useSuspendableQuery({
    document: PreviewQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}

export type UseActivitiesArgs = Prettify<
  ActivitiesRequest & CurrencyQueryOptions & TimeWindowQueryOptions
>;

/**
 * Fetch paginated list of activities.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useActivities({
 *   query: {
 *     chainId: chainId(1),
 *   },
 *   user: evmAddress('0x742d35cc…'),
 *   suspense: true,
 * });
 *
 * // data.items: ActivityItem[]
 * ```
 */
export function useActivities(
  args: UseActivitiesArgs & Suspendable,
): SuspenseResult<PaginatedActivitiesResult>;
/**
 * Fetch paginated list of activities.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useActivities({
 *   query: {
 *     chainId: chainId(1),
 *   },
 *   user: evmAddress('0x742d35cc…'),
 *   suspense: true,
 *   pause: true,
 * });
 *
 * // data?.items: ActivityItem[] | undefined
 * ```
 */
export function useActivities(
  args: Pausable<UseActivitiesArgs> & Suspendable,
): PausableSuspenseResult<PaginatedActivitiesResult>;
/**
 * Fetch paginated list of activities.
 *
 * ```tsx
 * const { data, error, loading } = useActivities({
 *   query: {
 *     chainId: chainId(1),
 *   },
 *   user: evmAddress('0x742d35cc…'),
 * });
 * ```
 */
export function useActivities(
  args: UseActivitiesArgs,
): ReadResult<PaginatedActivitiesResult>;
/**
 * Fetch paginated list of activities.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading } = useActivities({
 *   query: {
 *     chainId: chainId(1),
 *   },
 *   user: evmAddress('0x742d35cc…'),
 *   pause: true,
 * });
 *
 * // data?.items: ActivityItem[] | undefined
 * // error: UnexpectedError | undefined
 * // loading: boolean | undefined
 * ```
 */
export function useActivities(
  args: Pausable<UseActivitiesArgs>,
): PausableReadResult<PaginatedActivitiesResult>;

export function useActivities({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: NullishDeep<UseActivitiesArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<PaginatedActivitiesResult, UnexpectedError> {
  return useSuspendableQuery({
    document: ActivitiesQuery,
    variables: {
      request,
      currency,
      timeWindow,
    },
    suspense,
    pause,
  });
}

/**
 * Low-level hook to execute a {@link activities} action directly.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 * @remarks
 * This hook does not actively watch for updates. Use it to fetch activities on demand
 * (e.g., in an event handler when paginating or refining filters).
 *
 * @param options - The query options.
 * @returns The user history.
 */
export function useActivitiesAction(
  options: CurrencyQueryOptions &
    TimeWindowQueryOptions = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<ActivitiesRequest, PaginatedActivitiesResult, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: ActivitiesRequest) =>
      activities(client, request, {
        currency: options.currency ?? DEFAULT_QUERY_OPTIONS.currency,
        timeWindow: options.timeWindow ?? DEFAULT_QUERY_OPTIONS.timeWindow,
        requestPolicy: 'cache-first',
      }),
    [client, options.currency, options.timeWindow],
  );
}
