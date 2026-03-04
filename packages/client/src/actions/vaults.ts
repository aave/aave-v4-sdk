import { delay, TimeoutError, type UnexpectedError } from '@aave/core';
import {
  type PaginatedStableVaultMovementsResult,
  type PaginatedStableVaultRateUsersResult,
  type StableVault,
  StableVaultAssignRateQuery,
  type StableVaultAssignRateRequest,
  StableVaultClaimStatus,
  StableVaultClaimStatusQuery,
  type StableVaultClaimStatusRequest,
  StableVaultClaimSurplusQuery,
  type StableVaultClaimSurplusRequest,
  type StableVaultDepositExecutionPlan,
  StableVaultDepositQuery,
  type StableVaultDepositRequest,
  StableVaultMovementsQuery,
  type StableVaultMovementsRequest,
  StableVaultQuery,
  StableVaultRateUsersQuery,
  type StableVaultRateUsersRequest,
  type StableVaultRequest,
  StableVaultsQuery,
  type StableVaultsRequest,
  StableVaultUnassignRateQuery,
  type StableVaultUnassignRateRequest,
  type StableVaultUserPosition,
  StableVaultUserPositionsQuery,
  type StableVaultUserPositionsRequest,
  type StableVaultWithdrawExecutionPlan,
  StableVaultWithdrawQuery,
  type StableVaultWithdrawRedeemExecutionPlan,
  StableVaultWithdrawRedeemMutation,
  type StableVaultWithdrawRedeemRequest,
  type StableVaultWithdrawRequest,
  type TransactionRequest,
} from '@aave/graphql';
import { errAsync, okAsync, ResultAsync } from '@aave/types';
import type { AaveClient } from '../AaveClient';
import { DEFAULT_QUERY_OPTIONS, type RequestPolicyOptions } from '../options';

/**
 * Fetches a stable vault by ID.
 *
 * ```ts
 * const result = await stableVault(client, {
 *   id: stableVaultId('vault-123'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The stable vault request parameters.
 * @param options - The query options.
 * @returns The stable vault data, or null if not found.
 */
export function stableVault(
  client: AaveClient,
  request: StableVaultRequest,
  {
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<StableVault | null, UnexpectedError> {
  return client.query(StableVaultQuery, { request }, { requestPolicy });
}

/**
 * Fetches all stable vaults managed by a given admin address.
 *
 * ```ts
 * const result = await stableVaults(client, {
 *   adminAddress: evmAddress('0x1234…'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The stable vaults request parameters.
 * @param options - The query options.
 * @returns Array of stable vaults.
 */
export function stableVaults(
  client: AaveClient,
  request: StableVaultsRequest,
  {
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<StableVault[], UnexpectedError> {
  return client.query(StableVaultsQuery, { request }, { requestPolicy });
}

/**
 * Fetches paginated list of users assigned to a specific boosted rate tier.
 *
 * ```ts
 * const result = await stableVaultRateUsers(client, {
 *   vaultId: stableVaultId('vault-123'),
 *   rateId: boostedRateId('gold'),
 *   pageSize: 10,
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The rate users request parameters.
 * @param options - The query options.
 * @returns Paginated list of user addresses.
 */
export function stableVaultRateUsers(
  client: AaveClient,
  request: StableVaultRateUsersRequest,
  {
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<PaginatedStableVaultRateUsersResult, UnexpectedError> {
  return client.query(
    StableVaultRateUsersQuery,
    { request },
    { requestPolicy },
  );
}

/**
 * Creates a transaction to assign users to a boosted rate tier.
 *
 * ```ts
 * const result = await stableVaultAssignRate(client, {
 *   vaultId: stableVaultId('vault-123'),
 *   rateId: boostedRateId('gold'),
 *   users: [evmAddress('0x1234…')],
 * }).andThen(sendWith(wallet));
 * ```
 *
 * @param client - Aave client.
 * @param request - The assign rate request parameters.
 * @param options - The query options.
 * @returns The transaction data.
 */
export function stableVaultAssignRate(
  client: AaveClient,
  request: StableVaultAssignRateRequest,
  {
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<TransactionRequest, UnexpectedError> {
  return client.query(
    StableVaultAssignRateQuery,
    { request },
    { requestPolicy },
  );
}

/**
 * Creates a transaction to remove users from a boosted rate tier.
 *
 * ```ts
 * const result = await stableVaultUnassignRate(client, {
 *   vaultId: stableVaultId('vault-123'),
 *   rateId: boostedRateId('gold'),
 *   users: [evmAddress('0x1234…')],
 * }).andThen(sendWith(wallet));
 * ```
 *
 * @param client - Aave client.
 * @param request - The unassign rate request parameters.
 * @param options - The query options.
 * @returns The transaction data.
 */
export function stableVaultUnassignRate(
  client: AaveClient,
  request: StableVaultUnassignRateRequest,
  {
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<TransactionRequest, UnexpectedError> {
  return client.query(
    StableVaultUnassignRateQuery,
    { request },
    { requestPolicy },
  );
}

/**
 * Creates a transaction to claim accumulated surplus from a stable vault.
 *
 * ```ts
 * const result = await stableVaultClaimSurplus(client, {
 *   vaultId: stableVaultId('vault-123'),
 *   claims: [{ address: evmAddress('0xUSDC…'), value: bigDecimal('1000') }],
 * }).andThen(sendWith(wallet));
 * ```
 *
 * @param client - Aave client.
 * @param request - The claim surplus request parameters.
 * @param options - The query options.
 * @returns The transaction data.
 */
export function stableVaultClaimSurplus(
  client: AaveClient,
  request: StableVaultClaimSurplusRequest,
  {
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<TransactionRequest, UnexpectedError> {
  return client.query(
    StableVaultClaimSurplusQuery,
    { request },
    { requestPolicy },
  );
}

/**
 * Fetches paginated cross-chain fund movements for a stable vault.
 *
 * ```ts
 * const result = await stableVaultMovements(client, {
 *   vaultId: stableVaultId('vault-123'),
 *   pageSize: 10,
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The movements request parameters.
 * @param options - The query options.
 * @returns Paginated list of token movement records.
 */
export function stableVaultMovements(
  client: AaveClient,
  request: StableVaultMovementsRequest,
  {
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<PaginatedStableVaultMovementsResult, UnexpectedError> {
  return client.query(
    StableVaultMovementsQuery,
    { request },
    { requestPolicy },
  );
}

/**
 * Creates a transaction to deposit into a stable vault.
 *
 * ```ts
 * const result = await stableVaultDeposit(client, {
 *   vault: { id: stableVaultId('vault-123') },
 *   user: evmAddress('0x1234…'),
 *   amount: {
 *     address: evmAddress('0xUSDC…'),
 *     value: { exact: bigDecimal('1000') },
 *   },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The deposit request parameters.
 * @returns The transaction data, approval requirements, or insufficient balance error.
 */
export function stableVaultDeposit(
  client: AaveClient,
  request: StableVaultDepositRequest,
): ResultAsync<StableVaultDepositExecutionPlan, UnexpectedError> {
  return client.query(StableVaultDepositQuery, { request });
}

/**
 * Creates a transaction to request a withdrawal from a stable vault.
 *
 * Withdrawals may be instant if sufficient liquidity exists, or deferred
 * if funds must be bridged from earning chains.
 *
 * ```ts
 * const result = await stableVaultWithdraw(client, {
 *   vault: { id: stableVaultId('vault-123') },
 *   user: evmAddress('0x1234…'),
 *   amount: {
 *     address: evmAddress('0xUSDC…'),
 *     value: { exact: bigDecimal('500') },
 *   },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The withdraw request parameters.
 * @returns The withdraw execution plan with either an instant transaction or a deferred claim.
 */
export function stableVaultWithdraw(
  client: AaveClient,
  request: StableVaultWithdrawRequest,
): ResultAsync<StableVaultWithdrawExecutionPlan, UnexpectedError> {
  return client.query(StableVaultWithdrawQuery, { request });
}

/**
 * Redeems a deferred withdrawal claim once funds become available.
 *
 * ```ts
 * const result = await stableVaultWithdrawRedeem(client, {
 *   claimId: stableVaultWithdrawClaimId('claim-456'),
 * }).andThen(sendWith(wallet));
 * ```
 *
 * @param client - Aave client.
 * @param request - The redeem request with the claim ID.
 * @returns The redeem execution plan.
 */
export function stableVaultWithdrawRedeem(
  client: AaveClient,
  request: StableVaultWithdrawRedeemRequest,
): ResultAsync<StableVaultWithdrawRedeemExecutionPlan, UnexpectedError> {
  return client.query(StableVaultWithdrawRedeemMutation, { request });
}

/**
 * Checks the status of a deferred withdrawal claim.
 *
 * ```ts
 * const result = await stableVaultClaimStatus(client, {
 *   claimId: stableVaultWithdrawClaimId('claim-456'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The claim status request parameters.
 * @param options - The query options.
 * @returns The claim status (READY, PENDING, or UNKNOWN).
 */
export function stableVaultClaimStatus(
  client: AaveClient,
  request: StableVaultClaimStatusRequest,
  {
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<StableVaultClaimStatus, UnexpectedError> {
  return client.query(
    StableVaultClaimStatusQuery,
    { request },
    { requestPolicy },
  );
}

/**
 * Fetches all stable vault positions for a given user.
 *
 * ```ts
 * const result = await stableVaultUserPositions(client, {
 *   user: evmAddress('0x1234…'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The user positions request parameters.
 * @param options - The query options.
 * @returns Array of stable vault positions with principal, interests, and APY.
 */
export function stableVaultUserPositions(
  client: AaveClient,
  request: StableVaultUserPositionsRequest,
  {
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<StableVaultUserPosition[], UnexpectedError> {
  return client.query(
    StableVaultUserPositionsQuery,
    { request },
    { requestPolicy },
  );
}

/**
 * Waits for a deferred withdrawal claim to become ready for redemption.
 *
 * Polls the claim status until it reaches `READY`, then resolves.
 *
 * ```ts
 * const result = await waitForStableVaultWithdrawClaim(client, {
 *   claimId: plan.claimId,
 * });
 * ```
 *
 * @param client - Aave client configured with polling settings.
 * @param request - The claim status request with the claim ID.
 * @returns Resolves when the claim is ready, or rejects with a TimeoutError.
 */
export function waitForStableVaultWithdrawClaim(
  client: AaveClient,
  request: StableVaultClaimStatusRequest,
): ResultAsync<void, TimeoutError | UnexpectedError> {
  const startedAt = Date.now();

  const poll = (): ResultAsync<void, TimeoutError | UnexpectedError> => {
    if (Date.now() - startedAt >= client.context.environment.indexingTimeout) {
      return TimeoutError.from(
        `Timeout waiting for withdrawal claim ${request.claimId} to become ready.`,
      ).asResultAsync();
    }

    return stableVaultClaimStatus(client, request, {
      requestPolicy: 'network-only',
    }).andThen((status) => {
      switch (status) {
        case StableVaultClaimStatus.Ready:
          return okAsync();

        case StableVaultClaimStatus.Pending:
        case StableVaultClaimStatus.Unknown:
          return ResultAsync.fromSafePromise(
            delay(client.context.environment.pollingInterval),
          ).andThen(() => poll());
      }
    });
  };

  return poll();
}
