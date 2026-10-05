import {
  CancelError,
  delay,
  SigningError,
  TimeoutError,
  TransactionError,
  UnexpectedError,
} from '@aave/core';
import type { TransactionRequest } from '@aave/graphql';
import {
  type ChainId,
  errAsync,
  invariant,
  okAsync,
  ResultAsync,
  type TxHash,
  txHash,
} from '@aave/types';
import {
  type Account,
  AtomicityNotSupportedError,
  BaseError,
  defineChain,
  MethodNotFoundRpcError,
  MethodNotSupportedRpcError,
  UnknownBundleIdError,
  UnsupportedProviderMethodError,
  UserRejectedRequestError,
  type Chain as ViemChain,
  type WalletClient,
} from 'viem';
import {
  getCallsStatus,
  getCapabilities,
  sendCalls as sendCallsWithViem,
} from 'viem/actions';
import {
  type BatchUnavailable,
  batchUnavailable,
  type TransactionResult,
} from './types';

/**
 * The atomic batching support a wallet reports for a chain (EIP-5792 `atomic` capability).
 *
 * @internal
 */
export type AtomicStatus = 'supported' | 'ready' | 'unsupported';

/**
 * @internal
 */
export type WalletCapabilities = {
  atomic: AtomicStatus;
};

/**
 * Identifier returned by `wallet_sendCalls`. Not a transaction hash.
 *
 * @internal
 */
export type CallsId = string & { readonly __brand: 'CallsId' };

/**
 * @internal
 */
export type WaitForResult = () => ResultAsync<
  TransactionResult,
  CancelError | TimeoutError | TransactionError | UnexpectedError
>;

const UNSUPPORTED: WalletCapabilities = { atomic: 'unsupported' };

/** How long a calls status is polled before giving up with a `TimeoutError`. */
const CALLS_STATUS_TIMEOUT = 10 * 60 * 1000;

/**
 * Suffix viem appends to the synthetic id it returns when `experimental_fallback`
 * sent the calls via `eth_sendTransaction`. Not exported from a public viem entry
 * point, hence copied.
 */
const FALLBACK_MAGIC_IDENTIFIER =
  '5792579257925792579257925792579257925792579257925792579257925792';

type CapabilitiesByChain = Record<number, WalletCapabilities>;

const capabilitiesCache = new WeakMap<
  WalletClient,
  Map<string, CapabilitiesByChain | 'unsupported'>
>();

function walkError(
  err: unknown,
  predicate: (err: unknown) => boolean,
): unknown | null {
  if (err instanceof BaseError) {
    return err.walk(predicate);
  }
  return predicate(err) ? err : null;
}

function isMethodUnsupported(err: unknown): boolean {
  return (
    walkError(
      err,
      (e) =>
        e instanceof MethodNotFoundRpcError ||
        e instanceof MethodNotSupportedRpcError ||
        e instanceof UnsupportedProviderMethodError,
    ) !== null
  );
}

function toAtomicStatus(value: unknown): AtomicStatus {
  if (value === 'supported' || value === 'ready') {
    return value;
  }
  return 'unsupported';
}

function normalizeCapabilities(
  raw: Record<number, Record<string, unknown>>,
): CapabilitiesByChain {
  const result: CapabilitiesByChain = {};
  for (const [key, capabilities] of Object.entries(raw)) {
    const atomic = capabilities?.atomic as { status?: unknown } | undefined;
    result[Number(key)] = { atomic: toAtomicStatus(atomic?.status) };
  }
  return result;
}

function resolveForChain(
  capabilities: CapabilitiesByChain | 'unsupported',
  chainId: ChainId,
): WalletCapabilities {
  if (capabilities === 'unsupported') {
    return UNSUPPORTED;
  }
  // `0x0` (all chains) is overridden by the chain-specific entry.
  const atomic =
    capabilities[chainId]?.atomic ?? capabilities[0]?.atomic ?? 'unsupported';
  return { atomic };
}

/**
 * Probes the wallet's EIP-5792 capabilities for the given chain. Never prompts and
 * never fails: anything other than a definitive answer resolves to `unsupported`.
 *
 * Successful responses and definitive "method not supported" errors are cached per
 * wallet client and account; transient errors are not, so the next call probes again.
 *
 * @internal
 */
export function getWalletCapabilities(
  walletClient: WalletClient,
  chainId: ChainId,
): ResultAsync<WalletCapabilities, never> {
  const account = walletClient.account;

  // A local key can't be a 5792 wallet.
  if (!account || account.type === 'local') {
    return okAsync(UNSUPPORTED);
  }

  let byAccount = capabilitiesCache.get(walletClient);
  if (!byAccount) {
    byAccount = new Map();
    capabilitiesCache.set(walletClient, byAccount);
  }

  const key = account.address.toLowerCase();
  const cached = byAccount.get(key);
  if (cached) {
    return okAsync(resolveForChain(cached, chainId));
  }

  const cache = byAccount;
  return ResultAsync.fromPromise(
    getCapabilities(walletClient, { account }),
    (err) => err,
  )
    .map((raw) => {
      const capabilities = normalizeCapabilities(
        raw as Record<number, Record<string, unknown>>,
      );
      cache.set(key, capabilities);
      return resolveForChain(capabilities, chainId);
    })
    .orElse((err) => {
      if (isMethodUnsupported(err)) {
        cache.set(key, 'unsupported');
      }
      return okAsync(UNSUPPORTED);
    });
}

/**
 * Whether sends for this chain should go through `wallet_sendCalls`.
 *
 * @internal
 */
export function canSendCalls(capabilities: WalletCapabilities): boolean {
  return capabilities.atomic === 'supported';
}

function toChain(walletClient: WalletClient, chainId: ChainId): ViemChain {
  if (walletClient.chain?.id === chainId) {
    return walletClient.chain;
  }
  // viem reads only `chain.id` to build the `wallet_sendCalls` request.
  return defineChain({
    id: chainId,
    name: `Chain ${chainId}`,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [] } },
  });
}

/**
 * Maps a send error to the SDK's send-phase errors.
 *
 * @internal
 */
export function toSendError(err: unknown): CancelError | SigningError {
  const rejected = walkError(err, (e) => e instanceof UserRejectedRequestError);
  if (rejected) {
    return CancelError.from(rejected);
  }
  return SigningError.from(err);
}

function isAtomicityUnsupported(err: unknown): boolean {
  return (
    walkError(
      err,
      (e) =>
        e instanceof AtomicityNotSupportedError ||
        (e instanceof BaseError &&
          'code' in e &&
          e.code === AtomicityNotSupportedError.code),
    ) !== null
  );
}

function assertBatchable(
  walletClient: WalletClient,
  requests: TransactionRequest[],
): asserts walletClient is WalletClient & { account: Account } {
  invariant(walletClient.account, 'Wallet client with account is required');

  const [first] = requests;
  invariant(first, 'Expected at least one transaction request');
  invariant(
    first.from.toLowerCase() === walletClient.account.address.toLowerCase(),
    'Transaction requests must be sent from the wallet account',
  );

  for (const request of requests) {
    invariant(
      request.chainId === first.chainId,
      'All transaction requests must share the same chainId',
    );
    invariant(
      request.from.toLowerCase() === first.from.toLowerCase(),
      'All transaction requests must share the same sender',
    );
  }
}

/**
 * Sends the requests via `wallet_sendCalls`: a single call non-atomically, several
 * calls as one atomic Batch. Uses viem's `experimental_fallback`, so a wallet that
 * rejects `wallet_sendCalls` for a single call is served via `eth_sendTransaction`
 * (see {@link decodeFallbackCallsId}).
 *
 * Resolves to {@link BatchUnavailable} when the wallet can't execute a Batch
 * atomically; nothing was submitted in that case.
 *
 * @internal
 */
export function sendCalls(
  walletClient: WalletClient,
  requests: TransactionRequest[],
): ResultAsync<CallsId | BatchUnavailable, CancelError | SigningError> {
  assertBatchable(walletClient, requests);

  const chainId = requests[0]?.chainId as ChainId;

  return ResultAsync.fromPromise(
    sendCallsWithViem(walletClient, {
      account: walletClient.account,
      chain: toChain(walletClient, chainId),
      calls: requests.map((request) => ({
        to: request.to,
        data: request.data,
        value: BigInt(request.value),
      })),
      forceAtomic: requests.length > 1,
      experimental_fallback: true,
    }),
    (err) => err,
  )
    .map(({ id }): CallsId | BatchUnavailable => id as CallsId)
    .orElse((err) => {
      if (isAtomicityUnsupported(err)) {
        return okAsync(batchUnavailable);
      }
      return errAsync(toSendError(err));
    });
}

/**
 * Decodes the synthetic id viem returns when `experimental_fallback` sent a single
 * call via `eth_sendTransaction`: `hash (32 bytes) ‖ chainId (32 bytes) ‖ magic (32 bytes)`.
 * Returns `null` for any other id.
 *
 * @internal
 */
export function decodeFallbackCallsId(
  id: CallsId,
  chainId: ChainId,
): TxHash | null {
  if (!/^0x[0-9a-fA-F]{192}$/.test(id)) {
    return null;
  }
  const body = id.slice(2);
  if (body.slice(128).toLowerCase() !== FALLBACK_MAGIC_IDENTIFIER) {
    return null;
  }
  if (BigInt(`0x${body.slice(64, 128)}`) !== BigInt(chainId)) {
    return null;
  }
  return txHash(`0x${body.slice(0, 64)}`);
}

function isTerminalStatusError(err: unknown): boolean {
  return (
    walkError(
      err,
      (e) =>
        e instanceof UnknownBundleIdError ||
        e instanceof MethodNotFoundRpcError ||
        e instanceof MethodNotSupportedRpcError ||
        e instanceof UnsupportedProviderMethodError,
    ) !== null
  );
}

function callsTransactionError(
  chain: ViemChain | undefined,
  hash: TxHash,
  request: TransactionRequest,
): TransactionError {
  const baseUrl = chain?.blockExplorers?.default?.url;
  const link = baseUrl && new URL(`/tx/${hash}`, baseUrl).toString();
  return TransactionError.new({ txHash: hash, request, link });
}

const DEADLINE_REACHED = Symbol('DeadlineReached');

/**
 * Settles with the promise, or with `DEADLINE_REACHED` once `deadline` passes. The
 * `custom` transport applies no request timeout, so a stalled wallet request would
 * otherwise never settle. The timer is cleared so it can't keep the process alive.
 */
function beforeDeadline<T>(
  promise: Promise<T>,
  deadline: number,
): Promise<T | typeof DEADLINE_REACHED> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<typeof DEADLINE_REACHED>((resolve) => {
    timer = setTimeout(
      () => resolve(DEADLINE_REACHED),
      Math.max(0, deadline - Date.now()),
    );
  });
  return Promise.race([promise, expired]).finally(() => clearTimeout(timer));
}

type PollOutcome =
  | { kind: 'ok'; result: TransactionResult }
  | { kind: 'error'; error: TimeoutError | TransactionError | UnexpectedError };

async function pollCallsStatus(
  walletClient: WalletClient,
  requests: TransactionRequest[],
  id: CallsId,
  timeout: number,
): Promise<PollOutcome> {
  const last = requests[requests.length - 1];
  invariant(last, 'Expected at least one transaction request');
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    let status: Awaited<ReturnType<typeof getCallsStatus>>;
    try {
      const next = await beforeDeadline(
        getCallsStatus(walletClient, { id }),
        deadline,
      );
      if (next === DEADLINE_REACHED) {
        break;
      }
      status = next;
    } catch (err) {
      if (isTerminalStatusError(err)) {
        return { kind: 'error', error: UnexpectedError.from(err) };
      }
      // Transport errors (e.g. a dropped WalletConnect session) say nothing about
      // the calls themselves: keep polling until the deadline.
      await delay(walletClient.pollingInterval);
      continue;
    }

    const receipts = status.receipts ?? [];
    const lastReceipt = receipts[receipts.length - 1];

    if (status.statusCode >= 300) {
      return {
        kind: 'error',
        error: lastReceipt
          ? callsTransactionError(
              walletClient.chain,
              txHash(lastReceipt.transactionHash),
              last,
            )
          : new UnexpectedError(
              `Calls failed with status ${status.statusCode}`,
              { cause: { callsId: id, statusCode: status.statusCode } },
            ),
      };
    }

    if (status.statusCode >= 200 && lastReceipt) {
      const reverted = receipts.find(
        (receipt) => receipt.status === 'reverted',
      );
      if (reverted) {
        return {
          kind: 'error',
          error: callsTransactionError(
            walletClient.chain,
            txHash(reverted.transactionHash),
            last,
          ),
        };
      }
      return {
        kind: 'ok',
        result: {
          txHash: txHash(lastReceipt.transactionHash),
          operations: last.operations,
        },
      };
    }

    await delay(walletClient.pollingInterval);
  }

  return {
    kind: 'error',
    error: new TimeoutError(
      `Transaction still pending after ${Math.round(timeout / 60_000)} minutes`,
      { cause: { callsId: id } },
    ),
  };
}

/**
 * Waits for calls sent via {@link sendCalls} to reach a final status.
 *
 * @internal
 */
export function waitForCallsResult(
  walletClient: WalletClient,
  requests: TransactionRequest[],
  id: CallsId,
  { timeout = CALLS_STATUS_TIMEOUT }: { timeout?: number } = {},
): ResultAsync<
  TransactionResult,
  TimeoutError | TransactionError | UnexpectedError
> {
  return ResultAsync.fromPromise(
    pollCallsStatus(walletClient, requests, id, timeout),
    (err) => UnexpectedError.from(err),
  ).andThen((outcome) =>
    outcome.kind === 'ok' ? okAsync(outcome.result) : errAsync(outcome.error),
  );
}
