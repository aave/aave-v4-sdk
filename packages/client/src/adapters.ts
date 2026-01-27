import type {
  Erc20Approval,
  Erc20ApprovalRequired,
  ExecutionPlan,
  PermitTypedData,
} from '@aave/graphql';
import { isOneEntryArray, type Override } from '@aave/types';

/**
 * @internal
 */
export function supportsPermit<T extends ExecutionPlan>(
  plan: T,
): plan is Extract<T, Erc20ApprovalRequired> &
  Override<
    Erc20ApprovalRequired,
    {
      approvals: [Override<Erc20Approval, { bySignature: PermitTypedData }>];
    }
  > {
  return (
    plan.__typename === 'Erc20ApprovalRequired' &&
    isOneEntryArray(plan.approvals) &&
    !!plan.approvals[0].bySignature
  );
}
