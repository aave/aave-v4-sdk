import type { Tagged } from 'type-fest';
import { invariant } from './helpers';

/**
 * The id a wallet returns when the user signs a transaction.
 *
 * For a regular wallet (EOA) it is the on-chain transaction hash. For a Smart
 * Account it may be a wallet-specific id, such as a Safe `safeTxHash` or an
 * EIP-5792 call id.
 */
export type SubmissionId = Tagged<string, 'SubmissionId'>;

/**
 * Creates a {@link SubmissionId} from a given value.
 */
export function submissionId(value: string): SubmissionId {
  invariant(value.length > 0, 'SubmissionId: empty');
  return value as SubmissionId;
}
