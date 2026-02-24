import type { UnexpectedError } from '@aave/client';
import { userClaimableRewards } from '@aave/client/actions';
import {
  type UserClaimableReward,
  UserClaimableRewardsQuery,
  type UserClaimableRewardsRequest,
} from '@aave/graphql';
import type { NullishDeep, Prettify } from '@aave/types';
import { useAaveClient } from './context';
import {
  type Pausable,
  type PausableReadResult,
  type PausableSuspenseResult,
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  type UseAsyncTask,
  useAsyncTask,
  useSuspendableQuery,
} from './helpers';

export type UseUserClaimableRewardsArgs = Prettify<UserClaimableRewardsRequest>;

/**
 * Fetch all claimable rewards for a user.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useUserClaimableRewards({
 *   user: evmAddress('0x742d35cc…'),
 *   suspense: true,
 * });
 * ```
 */
export function useUserClaimableRewards(
  args: UseUserClaimableRewardsArgs & Suspendable,
): SuspenseResult<UserClaimableReward[]>;
/**
 * Fetch all claimable rewards for a user.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useUserClaimableRewards({
 *   user: evmAddress('0x742d35cc…'),
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useUserClaimableRewards(
  args: Pausable<UseUserClaimableRewardsArgs> & Suspendable,
): PausableSuspenseResult<UserClaimableReward[]>;
/**
 * Fetch all claimable rewards for a user.
 *
 * ```tsx
 * const { data, error, loading } = useUserClaimableRewards({
 *   user: evmAddress('0x742d35cc…'),
 * });
 * ```
 */
export function useUserClaimableRewards(
  args: UseUserClaimableRewardsArgs,
): ReadResult<UserClaimableReward[]>;
/**
 * Fetch all claimable rewards for a user.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useUserClaimableRewards({
 *   user: evmAddress('0x742d35cc…'),
 *   pause: true,
 * });
 * ```
 */
export function useUserClaimableRewards(
  args: Pausable<UseUserClaimableRewardsArgs>,
): PausableReadResult<UserClaimableReward[]>;

export function useUserClaimableRewards({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseUserClaimableRewardsArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<UserClaimableReward[], UnexpectedError> {
  return useSuspendableQuery({
    document: UserClaimableRewardsQuery,
    variables: { request },
    suspense,
    pause,
  });
}

/**
 * Low-level hook to execute a {@link userClaimableRewards} action directly.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 * @remarks
 * This hook **does not** actively watch for updated data on claimable rewards.
 * Use this hook to retrieve data on demand as part of a larger workflow
 * (e.g., in an event handler in order to move to the next step).
 *
 * ```ts
 * const [execute, { called, data, error, loading }] = useUserClaimableRewardsAction();
 *
 * // …
 *
 * const result = await execute({
 *   user: evmAddress('0x742d35cc…'),
 * });
 *
 * if (result.isOk()) {
 *   console.log(result.value); // UserClaimableReward[]
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useUserClaimableRewardsAction(): UseAsyncTask<
  UserClaimableRewardsRequest,
  UserClaimableReward[],
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: UserClaimableRewardsRequest) =>
      userClaimableRewards(client, request, {
        requestPolicy: 'cache-first',
      }),
    [client],
  );
}
