import { chainId, evmAddress, submissionId, txHash } from '@aave/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type CallsStatusOutcome,
  type TrackCallsStatusOptions,
  trackCallsStatus,
} from './callsStatus';
import {
  createScriptedWallet,
  makeCallsStatus,
  rpcErrors,
  type ScriptEntry,
  walletClientFor,
} from './testing-wallet';

const account = evmAddress('0x1111111111111111111111111111111111111111');
const first = txHash(`0x${'1'.repeat(64)}`);
const last = txHash(`0x${'2'.repeat(64)}`);
const ambireId = submissionId(`UserOperation:0x${'a'.repeat(64)}:pimlico`);

async function run(
  status: ScriptEntry,
  options: Partial<TrackCallsStatusOptions> = {},
  advanceMs = 30_000,
) {
  const provider = createScriptedWallet({ wallet_getCallsStatus: status });
  const walletClient = walletClientFor(provider, {
    account,
    chainId: chainId(1),
  });

  let outcome: CallsStatusOutcome | undefined;
  void trackCallsStatus(walletClient, ambireId, {
    timeout: 60_000,
    ...options,
  }).then((value) => {
    outcome = value;
  });
  await vi.advanceTimersByTimeAsync(advanceMs);
  return { outcome, provider };
}

describe(`Given the '${trackCallsStatus.name}' function`, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Then it accepts a non-hex EIP-5792 call id', async () => {
    const { outcome, provider } = await run({
      result: makeCallsStatus({
        status: 200,
        receipts: [{ hash: last, status: 'success' }],
      }),
    });

    expect(outcome).toEqual({ status: 'success', txHash: last });
    expect(provider.unscripted()).toEqual([]);
  });

  it('Then it resolves with the last receipt hash for non-atomic batches', async () => {
    const { outcome } = await run({
      result: makeCallsStatus({
        status: 200,
        receipts: [
          { hash: first, status: 'success' },
          { hash: last, status: 'success' },
        ],
      }),
    });

    expect(outcome).toEqual({ status: 'success', txHash: last });
  });

  it('Then any reverted receipt resolves as reverted with its hash', async () => {
    const { outcome } = await run({
      result: makeCallsStatus({
        status: 200,
        receipts: [
          { hash: first, status: 'reverted' },
          { hash: last, status: 'success' },
        ],
      }),
    });

    expect(outcome).toEqual({ status: 'reverted', txHash: first });
  });

  it('Then a 4xx status resolves as cancelled', async () => {
    const { outcome } = await run({
      result: makeCallsStatus({ status: 400 }),
    });

    expect(outcome).toEqual({ status: 'cancelled' });
  });

  it('Then a terminal status without receipts keeps polling', async () => {
    const { outcome } = await run([
      { result: makeCallsStatus({ status: 200 }) },
      {
        result: makeCallsStatus({
          status: 200,
          receipts: [{ hash: last, status: 'success' }],
        }),
      },
    ]);

    expect(outcome).toEqual({ status: 'success', txHash: last });
  });

  it('Then it handles the legacy 1.0 PENDING / CONFIRMED shape', async () => {
    const { outcome } = await run([
      { result: makeCallsStatus({ status: 'PENDING', version: '1.0' }) },
      {
        result: makeCallsStatus({
          status: 'CONFIRMED',
          version: '1.0',
          receipts: [{ hash: last, status: 'success' }],
        }),
      },
    ]);

    expect(outcome).toEqual({ status: 'success', txHash: last });
  });

  it('Then it reports whether each probe was recognised', async () => {
    const onProbe = vi.fn();
    await run(
      [
        { error: rpcErrors.safeMobileNotFound },
        { result: makeCallsStatus({ status: 100 }) },
      ],
      { onProbe },
      10_000,
    );

    expect(onProbe.mock.calls.slice(0, 3)).toEqual([[false], [true], [true]]);
  });

  it('Then it ignores errors until the timeout when maxConsecutiveErrors is unset', async () => {
    const { outcome } = await run({ error: rpcErrors.transport }, {}, 61_000);

    expect(outcome).toEqual({ status: 'timeout' });
  });

  it('Then it gives up after maxConsecutiveErrors failed probes', async () => {
    const { outcome } = await run(
      { error: rpcErrors.methodNotFound },
      { maxConsecutiveErrors: 3 },
    );

    expect(outcome).toMatchObject({ status: 'error' });
  });

  it('Then it stops polling when aborted', async () => {
    const controller = new AbortController();
    const { provider } = await run(
      { result: makeCallsStatus({ status: 100 }) },
      { signal: controller.signal },
      10_000,
    );

    controller.abort();
    const calls = provider.calls('wallet_getCallsStatus');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(provider.calls('wallet_getCallsStatus')).toBe(calls);
  });
});
