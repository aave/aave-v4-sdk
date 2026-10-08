import { type SubmissionId, type TxHash, txHash } from '@aave/types';
import type { WalletClient } from 'viem';
import { type GetCallsStatusReturnType, getCallsStatus } from 'viem/actions';

/**
 * @internal
 */
export const CALLS_STATUS_POLLING_INTERVAL = 4_000;

/**
 * @internal
 */
export type CallsStatusOutcome =
  /** Executed on-chain; `txHash` is the last receipt's hash. */
  | { status: 'success'; txHash: TxHash }
  /** Executed on-chain but failed; `txHash` is the failing receipt's hash. */
  | { status: 'reverted'; txHash: TxHash }
  /** Not executed: rejected or dropped by the wallet. */
  | { status: 'cancelled' }
  /** Not settled within `timeout`. */
  | { status: 'timeout' }
  /** Gave up after `maxConsecutiveErrors` failed probes. */
  | { status: 'error'; error: unknown }
  /** Stopped through `signal`. */
  | { status: 'aborted' };

/**
 * @internal
 */
export type TrackCallsStatusOptions = {
  /**
   * Max wait (ms) before resolving with `{ status: 'timeout' }`.
   */
  timeout: number;
  /**
   * Called after every probe. `recognized` is `true` when the wallet answered
   * with a status code for the id.
   */
  onProbe?: (recognized: boolean) => void;
  /**
   * Give up after this many consecutive failed probes. Unset: errors are
   * ignored and polling continues until `timeout`.
   */
  maxConsecutiveErrors?: number;
  /**
   * Stops polling and resolves with `{ status: 'aborted' }`.
   */
  signal?: AbortSignal;
};

function isRecognized(response: GetCallsStatusReturnType): boolean {
  return Number.isInteger(response.statusCode);
}

/**
 * Maps a `wallet_getCallsStatus` response to an outcome, or `null` to keep
 * polling. Relies on viem's normalised `statusCode` and receipt `status`.
 */
function outcomeFrom(
  response: GetCallsStatusReturnType,
): CallsStatusOutcome | null {
  const { statusCode, receipts = [] } = response;

  const reverted = receipts.find((receipt) => receipt.status === 'reverted');
  if (reverted) {
    return { status: 'reverted', txHash: txHash(reverted.transactionHash) };
  }

  if (statusCode < 200) {
    return null; // pending: awaiting signatures or execution
  }

  if (statusCode >= 400 && statusCode < 500) {
    return { status: 'cancelled' };
  }

  const last = receipts.at(-1);
  if (!last) {
    return null; // terminal status without receipts: wait for them
  }

  return statusCode < 300
    ? { status: 'success', txHash: txHash(last.transactionHash) }
    : { status: 'reverted', txHash: txHash(last.transactionHash) };
}

/**
 * Polls `wallet_getCallsStatus` for `id` until it reaches a final outcome.
 *
 * Works for a tx hash returned by `eth_sendTransaction` (e.g. a Safe
 * `safeTxHash`) and for an EIP-5792 `sendCalls` id.
 *
 * @internal
 */
export function trackCallsStatus(
  walletClient: WalletClient,
  id: SubmissionId,
  options: TrackCallsStatusOptions,
): Promise<CallsStatusOutcome> {
  const { timeout, onProbe, maxConsecutiveErrors, signal } = options;

  return new Promise((resolve) => {
    let done = false;
    let errors = 0;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (outcome: CallsStatusOutcome) => {
      if (done) return;
      done = true;
      clearTimeout(pollTimer);
      clearTimeout(timeoutTimer);
      signal?.removeEventListener('abort', onAbort);
      resolve(outcome);
    };

    const onAbort = () => finish({ status: 'aborted' });

    const timeoutTimer = setTimeout(
      () => finish({ status: 'timeout' }),
      timeout,
    );

    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener('abort', onAbort);

    const probe = async () => {
      let recognized = false;
      let outcome: CallsStatusOutcome | null = null;

      try {
        const response = await getCallsStatus(walletClient, { id });
        errors = 0;
        recognized = isRecognized(response);
        outcome = recognized ? outcomeFrom(response) : null;
      } catch (error) {
        errors++;
        if (
          maxConsecutiveErrors !== undefined &&
          errors >= maxConsecutiveErrors
        ) {
          outcome = { status: 'error', error };
        }
      }

      if (done) return;

      onProbe?.(recognized);

      if (outcome) {
        finish(outcome);
        return;
      }

      if (!done) {
        pollTimer = setTimeout(probe, CALLS_STATUS_POLLING_INTERVAL);
      }
    };

    void probe();
  });
}
