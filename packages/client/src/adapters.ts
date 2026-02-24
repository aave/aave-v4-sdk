import type { Erc20Approval, PermitTypedData } from '@aave/graphql';
import { isOneEntryArray } from '@aave/types';

type WithApprovals = { approvals: Erc20Approval[] };

function hasApprovals(plan: unknown): plan is WithApprovals {
  return (
    typeof plan === 'object' &&
    plan !== null &&
    'approvals' in plan &&
    Array.isArray(plan.approvals)
  );
}

/**
 * Checks if a plan supports permit (single approval with bySignature).
 * Works with union types - picks any member that has an `approvals` array
 * with a single entry containing `bySignature`.
 *
 * @internal
 */
export function supportsPermit<T>(plan: T): plan is T &
  Extract<T, WithApprovals> & {
    approvals: [Erc20Approval & { bySignature: PermitTypedData }];
  } {
  return (
    hasApprovals(plan) &&
    isOneEntryArray(plan.approvals) &&
    !!plan.approvals[0].bySignature
  );
}
