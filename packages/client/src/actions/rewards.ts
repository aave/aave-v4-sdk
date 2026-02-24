import type { UnexpectedError } from '@aave/core';
import {
  type UserClaimableReward,
  UserClaimableRewardsQuery,
  type UserClaimableRewardsRequest,
} from '@aave/graphql';
import type { ResultAsync } from '@aave/types';
import type { AaveClient } from '../AaveClient';
import { DEFAULT_QUERY_OPTIONS, type RequestPolicyOptions } from '../options';

/**
 * Fetches all claimable rewards for a user.
 *
 * ```ts
 * const result = await userClaimableRewards(client, {
 *   user: evmAddress('0x742d35cc…'),
 * });
 *
 * if (result.isErr()) {
 *   // Handle error
 *   return;
 * }
 *
 * // result.value: UserClaimableReward[]
 * ```
 *
 * @param client - Aave client.
 * @param request - The user claimable rewards request parameters.
 * @param options - The query options.
 * @returns Array of claimable rewards.
 */
export function userClaimableRewards(
  client: AaveClient,
  request: UserClaimableRewardsRequest,
  {
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<UserClaimableReward[], UnexpectedError> {
  return client.query(
    UserClaimableRewardsQuery,
    { request },
    { requestPolicy },
  );
}
