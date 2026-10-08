import type { Tagged } from 'type-fest';
import { invariant } from './helpers';

/**
 * The identifier a wallet returns when it accepts a transaction request.
 *
 * Not necessarily an on-chain hash: for a Smart Account it may be a Safe
 * `safeTxHash` or an EIP-5792 call id.
 */
export type SubmissionId = Tagged<string, 'SubmissionId'>;

/**
 * Creates a {@link SubmissionId} from a given value.
 */
export function submissionId(value: string): SubmissionId {
  invariant(value.length > 0, 'SubmissionId: empty');
  return value as SubmissionId;
}
