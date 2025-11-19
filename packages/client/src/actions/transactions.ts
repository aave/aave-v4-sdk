import type { UnexpectedError } from '@aave/core';
import {
  ActivitiesQuery,
  type ActivitiesRequest,
  BorrowQuery,
  type BorrowRequest,
  type ExecutionPlan,
  LiquidatePositionQuery,
  type LiquidatePositionRequest,
  type PaginatedActivitiesResult,
  PreviewQuery,
  type PreviewRequest,
  type PreviewUserPosition,
  RenounceSpokeUserPositionManagerQuery,
  type RenounceSpokeUserPositionManagerRequest,
  RepayQuery,
  type RepayRequest,
  SetSpokeUserPositionManagerQuery,
  type SetSpokeUserPositionManagerRequest,
  SetUserSupplyAsCollateralQuery,
  type SetUserSupplyAsCollateralRequest,
  SupplyQuery,
  type SupplyRequest,
  type TransactionRequest,
  UpdateUserDynamicConfigQuery,
  type UpdateUserDynamicConfigRequest,
  UpdateUserRiskPremiumQuery,
  type UpdateUserRiskPremiumRequest,
  WithdrawQuery,
  type WithdrawRequest,
} from '@aave/graphql';
import type { ResultAsync } from '@aave/types';
import type { AaveClient } from '../AaveClient';
import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type RequestPolicyOptions,
} from '../options';

/**
 * Creates a transaction to borrow from a market.
 *
 * ```ts
 * const result = await borrow(client, {
 *   amount: {
 *     erc20: {
 *       value: bigDecimal('1000'),
 *     },
 *   },
 *   reserve: reserveId('SGVsbG8h'),
 *   sender: evmAddress('0x9abc…'),
 * }).andThen(sendWith(wallet)).andThen(client.waitForTransaction);
 *
 * if (result.isErr()) {
 *   // Handle error, e.g. signing error, etc.
 *   return;
 * }
 *
 * // result.value: TxHash
 * ```
 *
 * @param client - Aave client.
 * @param request - The borrow request parameters.
 * @returns The transaction data, approval requirements, or insufficient balance error.
 */
export function borrow(
  client: AaveClient,
  request: BorrowRequest,
): ResultAsync<ExecutionPlan, UnexpectedError> {
  return client.query(BorrowQuery, { request });
}

/**
 * Creates a transaction to supply to a market.
 *
 * ```ts
 * const result = await supply(client, {
 *   reserve: {
 *     reserveId: "1234567890",
 *     spoke: evmAddress('0x8787…'),
 *     chainId: chainId(1),
 *   },
 *   amount: {
 *     erc20: {
 *       value: bigDecimal('1000'),
 *     },
 *   },
 *   enableCollateral: true, // Optional, defaults to true
 *   sender: evmAddress('0x9abc…'),
 * });
 *
 * if (result.isErr()) {
 *   // Handle error, e.g. insufficient balance, signing error, etc.
 *   return;
 * }
 *
 * // result.value: TxHash
 * ```
 *
 * @param client - Aave client.
 * @param request - The supply request parameters.
 * @returns The transaction data, approval requirements, or insufficient balance error.
 */
export function supply(
  client: AaveClient,
  request: SupplyRequest,
): ResultAsync<ExecutionPlan, UnexpectedError> {
  return client.query(SupplyQuery, { request });
}

/**
 * Creates a transaction to repay to a market.
 *
 * ```ts
 * const result = await repay(client, {
 *   amount: {
 *     erc20: {
 *       value: {
 *         exact: bigDecimal('500'),
 *       },
 *     },
 *   },
 *   sender: evmAddress('0x9abc…'),
 *   reserve: reserveId('SGVsbG8h'),
 * }).andThen(sendWith(wallet)).andThen(client.waitForTransaction);
 *
 * if (result.isErr()) {
 *   // Handle error, e.g. insufficient balance, signing error, etc.
 *   return;
 * }
 *
 * // result.value: TxHash
 * ```
 *
 * @param client - Aave client.
 * @param request - The repay request parameters.
 * @returns The transaction data, approval requirements, or insufficient balance error.
 */
export function repay(
  client: AaveClient,
  request: RepayRequest,
): ResultAsync<ExecutionPlan, UnexpectedError> {
  return client.query(RepayQuery, { request });
}

/**
 * Creates a transaction to withdraw from a reserve.
 *
 * ```ts
 * const result = await withdraw(client, {
 *   reserve: reserveId('SGVsbG8h'),
 *   amount: {
 *     erc20: {
 *       exact: bigDecimal('750.5'),
 *     },
 *   },
 *   sender: evmAddress('0x9abc…'),
 * }).andThen(sendWith(wallet)).andThen(client.waitForTransaction);
 *
 * if (result.isErr()) {
 *   // Handle error, e.g. insufficient balance, signing error, etc.
 *   return;
 * }
 *
 * // result.value: TxHash
 * ```
 *
 * **Withdraw specific amount:**
 * ```ts
 * amount: {
 *   erc20: {
 *     exact: bigDecimal('100.5'), // Exact amount to withdraw
 *   }
 * }
 * ```
 *
 * **Withdraw all available:**
 * ```ts
 * amount: {
 *   erc20: {
 *     max: true, // Withdraw the full position
 *   }
 * }
 * ```
 *
 * **Withdraw native token:**
 * ```ts
 * amount: {
 *   native: bigDecimal('0.5'), // For ETH on Ethereum
 * }
 * ```
 *
 * @param client - Aave client.
 * @param request - The withdraw request parameters.
 * @returns The transaction data, approval requirements, or insufficient balance error.
 */
export function withdraw(
  client: AaveClient,
  request: WithdrawRequest,
): ResultAsync<ExecutionPlan, UnexpectedError> {
  return client.query(WithdrawQuery, { request });
}

/**
 * Creates a transaction to renounce a position manager of a user in a specific spoke.
 *
 * ```ts
 * const result = await renounceSpokeUserPositionManager(client, {
 *   manager: evmAddress('0x9abc…'),
 *   managing: evmAddress('0xdef0…'),
 *   spoke: spokeId('SGVsbG8h'),
 * }).andThen(sendWith(wallet)).andThen(client.waitForTransaction);
 *
 * if (result.isErr()) {
 *   // Handle error
 *   return;
 * }
 *
 * // result.value: TxHash
 * ```
 *
 *
 * @param client - Aave client.
 * @param request - The renounce spoke user position manager request parameters.
 * @returns The transaction data.
 */
export function renounceSpokeUserPositionManager(
  client: AaveClient,
  request: RenounceSpokeUserPositionManagerRequest,
): ResultAsync<TransactionRequest, UnexpectedError> {
  return client.query(RenounceSpokeUserPositionManagerQuery, { request });
}

/**
 * Creates a transaction to update user dynamic config for a specific spoke.
 *
 * ```ts
 * const result = await updateUserDynamicConfig(client, {
 *   sender: evmAddress('0x9abc…'),
 *   spoke: spokeId('SGVsbG8h'),
 * }).andThen(sendWith(wallet)).andThen(client.waitForTransaction);
 *
 * if (result.isErr()) {
 *   // Handle error
 *   return;
 * }
 *
 * // result.value: TxHash
 * ```
 *
 *
 * @param client - Aave client.
 * @param request - The update user dynamic config request parameters.
 * @returns The transaction data.
 */

export function updateUserDynamicConfig(
  client: AaveClient,
  request: UpdateUserDynamicConfigRequest,
): ResultAsync<TransactionRequest, UnexpectedError> {
  return client.query(UpdateUserDynamicConfigQuery, { request });
}

/**
 * Creates a transaction to update user risk premium for a specific spoke.
 *
 * ```ts
 * const result = await updateUserRiskPremium(client, {
 *   sender: evmAddress('0x9abc…'),
 *   spoke: spokeId('SGVsbG8h'),
 * }).andThen(sendWith(wallet)).andThen(client.waitForTransaction);
 *
 * if (result.isErr()) {
 *   // Handle error
 *   return;
 * }
 *
 * // result.value: TxHash
 * ```
 *
 *
 * @param client - Aave client.
 * @param request - The update user risk premium request parameters.
 * @returns The transaction data.
 */
export function updateUserRiskPremium(
  client: AaveClient,
  request: UpdateUserRiskPremiumRequest,
): ResultAsync<TransactionRequest, UnexpectedError> {
  return client.query(UpdateUserRiskPremiumQuery, { request });
}

/**
 * Creates a transaction to liquidate a user's position.
 *
 * ```ts
 * const result = await liquidatePosition(client, {
 *   collateral: reserveId('SGVsbG8h'),
 *   debt: reserveId('Q2lhbyE= '),
 *   amount: {
 *     exact: bigDecimal('1000'),
 *   },
 *   liquidator: evmAddress('0x9abc…'),
 *   user: evmAddress('0xdef0…'),
 * }).andThen(sendWith(wallet)).andThen(client.waitForTransaction);
 *
 * if (result.isErr()) {
 *   // Handle error, e.g. signing error, etc.
 *   return;
 * }
 *
 * // result.value: TxHash
 * ```
 *
 * @param client - Aave client.
 * @param request - The liquidate position request parameters.
 * @returns The transaction data, approval requirements, or insufficient balance error.
 */
export function liquidatePosition(
  client: AaveClient,
  request: LiquidatePositionRequest,
): ResultAsync<ExecutionPlan, UnexpectedError> {
  return client.query(LiquidatePositionQuery, { request });
}

/**
 * Sets or removes a position manager for a user on a specific spoke.
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
 * const result = await setSpokeUserPositionManager(client, {
 *   spoke: spokeId('SGVsbG8h'),
 *   manager: evmAddress('0x9abc…'), // Address that will become the position manager
 *   approve: true, // true to approve, false to remove the manager
 *   user: evmAddress('0xdef0…'), // User granting the permission (must sign the signature)
 *   signature: {
 *     value: '0x1234...', // ERC712 signature signed by the user
 *     deadline: 1735689600, // Unix timestamp when signature expires
 *   },
 * }).andThen(sendWith(wallet)).andThen(client.waitForTransaction);
 *
 * if (result.isErr()) {
 *   // Handle error, e.g. signing error, etc.
 *   return;
 * }
 *
 * // result.value: TxHash
 * ```
 *
 * @param client - Aave client.
 * @param request - The spoke set for the position manager request parameters.
 * @returns The transaction request data to set position manager.
 */
export function setSpokeUserPositionManager(
  client: AaveClient,
  request: SetSpokeUserPositionManagerRequest,
): ResultAsync<TransactionRequest, UnexpectedError> {
  return client.query(SetSpokeUserPositionManagerQuery, { request });
}

/**
 * Previews the impact of a potential action on a user's position.
 *
 * ```ts
 * const result = await preview(client, {
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
 * ```
 *
 * @param client - Aave client.
 * @param request - The preview request parameters containing the action to preview.
 * @param options - The query options.
 * @returns The preview result showing position changes.
 */
export function preview(
  client: AaveClient,
  request: PreviewRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<PreviewUserPosition, UnexpectedError> {
  return client.query(PreviewQuery, { request, ...options });
}

/**
 * Sets whether a user's supply should be used as collateral.
 *
 * ```ts
 * const result = await setUserSupplyAsCollateral(client, {
 *   reserve: reserveId('SGVsbG8h'),
 *   sender: evmAddress('0x456...'),
 *   enableCollateral: true
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The set user supply as collateral request parameters.
 * @returns The transaction request to set collateral status.
 */
export function setUserSupplyAsCollateral(
  client: AaveClient,
  request: SetUserSupplyAsCollateralRequest,
): ResultAsync<TransactionRequest, UnexpectedError> {
  return client.query(SetUserSupplyAsCollateralQuery, { request });
}

/**
 * Fetches paginated list of activities.
 *
 * ```ts
 * const result = await activities(client, {
 *   query: {
 *     chainIds: [chainId(1)],
 *   },
 *   user: evmAddress('0x742d35cc…'), // Optional
 *   types: [ActivityType.Supply, ActivityType.Borrow, ActivityType.Withdraw, ActivityType.Repay],
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The activities request parameters.
 * @param options - The query options.
 * @returns The paginated list of activities.
 */
export function activities(
  client: AaveClient,
  request: ActivitiesRequest,
  options: CurrencyQueryOptions & RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<PaginatedActivitiesResult, UnexpectedError> {
  return client.query(
    ActivitiesQuery,
    { request, currency: options.currency ?? DEFAULT_QUERY_OPTIONS.currency },
    options.requestPolicy ?? DEFAULT_QUERY_OPTIONS.requestPolicy,
  );
}
