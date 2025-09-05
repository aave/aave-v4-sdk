import type { UnexpectedError } from '@aave/core-next';
import {
  BorrowQuery,
  type BorrowRequest,
  type ExecutionPlan,
  LiquidatePositionQuery,
  type LiquidatePositionRequest,
  PreviewQuery,
  type PreviewRequest,
  type PreviewUserPositionResult,
  RepayQuery,
  type RepayRequest,
  SetSpokeUserPositionManagerQuery,
  type SetSpokeUserPositionManagerRequest,
  SupplyQuery,
  type SupplyRequest,
  type TransactionRequest,
  UpdateUserDynamicConfigQuery,
  type UpdateUserDynamicConfigRequest,
  UpdateUserRiskPremiumQuery,
  type UpdateUserRiskPremiumRequest,
  WithdrawQuery,
  type WithdrawRequest,
} from '@aave/graphql-next';
import type { ResultAsync } from '@aave/types-next';
import type { AaveClient } from '../AaveClient';

/**
 * Creates a transaction to borrow from a market.
 *
 * ```ts
 * const result = await borrow(client, {
 *   market: market.address,
 *   amount: {
 *     erc20: {
 *       currency: evmAddress('0x5678…'),
 *       value: bigDecimal('1000'),
 *     },
 *   },
 *   borrower: evmAddress('0x9abc…'),
 *   chainId: market.chain.chainId,
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
 *   market: market.address,
 *   amount: {
 *     erc20: {
 *       currency: evmAddress('0x5678…'),
 *       value: bigDecimal('1000'),
 *     },
 *   },
 *   supplier: evmAddress('0x9abc…'),
 *   chainId: market.chain.chainId,
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
 *   market: market.address,
 *   amount: {
 *     erc20: {
 *       currency: evmAddress('0x5678…'),
 *       value: {
 *         exact: bigDecimal('500'),
 *       },
 *     },
 *   },
 *   borrower: evmAddress('0x9abc…'),
 *   chainId: market.chain.chainId,
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
 *   reserve: {
 *     chainId: chainId(1),
 *     spoke: evmAddress('0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2'),
 *     reserveId: reserveId('0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e'),
 *   },
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
 * **On behalf of another user (position manager only):**
 * ```ts
 * {
 *   // ... other fields
 *   sender: evmAddress('0xManager…'),
 *   onBehalfOf: evmAddress('0xUser…'),
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
 * Creates a transaction to update user dynamic config for a specific spoke.
 *
 * ```ts
 * const result = await updateUserDynamicConfig(client, {
 *   sender: evmAddress('0x9abc…'),
 *   spoke: {
 *     chainId: chainId(1),
 *     address: evmAddress('0x878…'),
 *   }
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
 *   spoke: {
 *     chainId: chainId(1),
 *     address: evmAddress('0x878…'),
 *   }
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
 * Creates a transaction to enable/disable a specific supplied asset as collateral.
 *
 * ```ts
 * const result = await collateralToggle(client, {
 *   market: market.address,
 *   underlyingToken: market.supplyReserves[n].underlyingToken.address,
 *   user: evmAddress('0x9abc…'),
 *   chainId: market.chain.chainId,
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
 * @param request - The collateral toggle request parameters.
 * @returns The transaction request data to toggle collateral.
 */
// export function collateralToggle(
//   client: AaveClient,
//   request: CollateralToggleRequest,
// ): ResultAsync<TransactionRequest, UnexpectedError> {
//   return client.query(CollateralToggleQuery, { request });
// }

/**
 * Creates a transaction to liquidate a non-healthy position with Health Factor below 1.
 *
 * ```ts
 * const result = await liquidate(client, {
 *   collateralToken: evmAddress('0x1234…'),
 *   debtToken: evmAddress('0x5678…'),
 *   user: evmAddress('0x9abc…'),
 *   debtToCover: { max: true },
 *   chainId: chainId(1),
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
 * @param request - The liquidate request parameters.
 * @returns The transaction request data to liquidate position.
 */
// export function liquidate(
//   client: AaveClient,
//   request: LiquidateRequest,
// ): ResultAsync<TransactionRequest, UnexpectedError> {
//   return client.query(LiquidateQuery, { request });
// }

/**
 * Creates a transaction to liquidate a user's position.
 *
 * ```ts
 * const result = await liquidatePosition(client, {
 *   spoke: {
 *     address: evmAddress('0x87870bca…'),
 *     chainId: chainId(1),
 *   },
 *   collateral: reserveId(1),
 *   debt: reserveId(2),
 *   amount: {
 *     erc20: {
 *       currency: evmAddress('0x5678…'),
 *       value: '1000',
 *     },
 *   },
 *   liquidator: evmAddress('0x9abc…'),
 *   borrower: evmAddress('0xdef0…'),
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
 * const result = await setSpokeUserPositionManager(client, {
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
 *
 * @param client - Aave client.
 * @param request - The preview request parameters containing the action to preview.
 * @returns The preview result showing position changes.
 */
export function preview(
  client: AaveClient,
  request: PreviewRequest,
): ResultAsync<PreviewUserPositionResult, UnexpectedError> {
  return client.query(PreviewQuery, { request });
}
