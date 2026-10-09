import type { ChainId, EvmAddress, HexString } from '@aave/types';
import {
  createWalletClient,
  custom,
  defineChain,
  type EIP1193Provider,
  type WalletClient,
} from 'viem';

/**
 * A scripted response to an EIP-1193 request.
 */
export type Scripted =
  | { result: unknown }
  | { error: { code: number; message: string } }
  | { hang: true }
  | { delayMs: number; respond: Scripted };

/**
 * Per-method script:
 * - a single response, repeated forever;
 * - a queue of responses, where the last one repeats;
 * - a function of the request params, called on every request.
 */
export type ScriptEntry =
  | Scripted
  | Scripted[]
  | ((params: unknown) => Scripted);

export type ScriptedWallet = EIP1193Provider & {
  /** Number of requests received for `method`. */
  calls(method: string): number;
  /** Methods requested without a script entry. */
  unscripted(): string[];
};

function rpcError({ code, message }: { code: number; message: string }) {
  return Object.assign(new Error(message), { code });
}

/**
 * Creates a hermetic EIP-1193 provider that answers only from `script`.
 * Unscripted methods throw and are recorded in `unscripted()`.
 */
export function createScriptedWallet(
  script: Partial<Record<string, ScriptEntry>>,
): ScriptedWallet {
  const counts = new Map<string, number>();
  const queues = new Map<string, Scripted[]>();
  const unscripted: string[] = [];

  const next = (method: string, params: unknown): Scripted | undefined => {
    const entry = script[method];
    if (entry === undefined) return undefined;
    if (typeof entry === 'function') return entry(params);
    if (!Array.isArray(entry)) return entry;

    const queue = queues.get(method) ?? [...entry];
    queues.set(method, queue);
    return queue.length > 1 ? queue.shift() : queue[0];
  };

  const request = async ({
    method,
    params,
  }: {
    method: string;
    params?: unknown;
  }) => {
    counts.set(method, (counts.get(method) ?? 0) + 1);

    let response: Scripted | undefined = next(method, params);

    if (!response) {
      unscripted.push(method);
      throw new Error(`Unscripted method: ${method}`);
    }
    while ('delayMs' in response) {
      const delayed: { delayMs: number; respond: Scripted } = response;
      await new Promise((resolve) => setTimeout(resolve, delayed.delayMs));
      response = delayed.respond;
    }
    if ('hang' in response) {
      return new Promise(() => {});
    }
    if ('error' in response) {
      throw rpcError(response.error);
    }
    return response.result;
  };

  return {
    request,
    on: () => {},
    removeListener: () => {},
    calls: (method: string) => counts.get(method) ?? 0,
    unscripted: () => [...unscripted],
  } as unknown as ScriptedWallet;
}

/**
 * Creates a viem WalletClient over a scripted wallet.
 */
export function walletClientFor(
  provider: EIP1193Provider,
  { account, chainId }: { account: EvmAddress; chainId: ChainId },
): WalletClient {
  return createWalletClient({
    account,
    chain: defineChain({
      id: chainId,
      name: 'Test',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['http://localhost'] } },
    }),
    transport: custom(provider),
  });
}

/**
 * Returns `before` until `ms` have elapsed since the first call, then `later`.
 * Relies on `Date.now()`, so it follows fake timers.
 */
export function after(ms: number, later: Scripted, before: Scripted) {
  let start: number | undefined;
  return () => {
    start ??= Date.now();
    return Date.now() - start >= ms ? later : before;
  };
}

/**
 * Creates an RPC transaction receipt.
 */
export function makeReceipt({
  hash,
  from,
  status,
}: {
  hash: HexString;
  from: EvmAddress;
  status: 'success' | 'reverted';
}) {
  return {
    transactionHash: hash,
    blockHash: `0x${'b'.repeat(64)}`,
    blockNumber: '0x1',
    from,
    to: from,
    status: status === 'success' ? '0x1' : '0x0',
    gasUsed: '0x5208',
    cumulativeGasUsed: '0x5208',
    effectiveGasPrice: '0x1',
    logs: [],
    logsBloom: `0x${'0'.repeat(512)}`,
    transactionIndex: '0x0',
    type: '0x2',
    contractAddress: null,
  };
}

/**
 * Creates an RPC transaction, pending unless `blockNumber` is given.
 */
export function makeTransaction({
  hash,
  from,
  to = from,
  input = '0x',
  value = '0x0',
  nonce = '0x0',
  blockNumber = null,
}: {
  hash: HexString;
  from: EvmAddress;
  to?: EvmAddress;
  input?: HexString;
  value?: HexString;
  nonce?: HexString;
  blockNumber?: HexString | null;
}) {
  return {
    hash,
    from,
    to,
    nonce,
    value,
    input,
    gas: '0x5208',
    maxFeePerGas: '0x1',
    maxPriorityFeePerGas: '0x1',
    type: '0x2',
    chainId: '0x1',
    accessList: [],
    blockHash: blockNumber ? `0x${'b'.repeat(64)}` : null,
    blockNumber,
    transactionIndex: blockNumber ? '0x0' : null,
    r: '0x1',
    s: '0x1',
    v: '0x0',
    yParity: '0x0',
  };
}

/**
 * Creates an RPC block, empty unless `transactions` is given.
 */
export function makeBlock({
  number,
  transactions = [],
}: {
  number: HexString;
  transactions?: unknown[];
}) {
  return {
    number,
    hash: `0x${'c'.repeat(64)}`,
    parentHash: `0x${'d'.repeat(64)}`,
    timestamp: number,
    nonce: '0x0000000000000000',
    difficulty: '0x0',
    gasLimit: '0x1c9c380',
    gasUsed: '0x0',
    miner: `0x${'0'.repeat(40)}`,
    extraData: '0x',
    logsBloom: `0x${'0'.repeat(512)}`,
    transactionsRoot: `0x${'0'.repeat(64)}`,
    stateRoot: `0x${'0'.repeat(64)}`,
    receiptsRoot: `0x${'0'.repeat(64)}`,
    sha3Uncles: `0x${'0'.repeat(64)}`,
    size: '0x0',
    baseFeePerGas: '0x1',
    transactions,
    uncles: [],
  };
}

/**
 * A block number that advances every second. Relies on `Date.now()`, so it
 * follows fake timers.
 */
export function advancingBlockNumber(): Scripted {
  return { result: `0x${Math.floor(Date.now() / 1000).toString(16)}` };
}

/**
 * Creates a `wallet_getCallsStatus` response.
 */
export function makeCallsStatus({
  status,
  receipts,
  version = '2.0.0',
}: {
  status: number | 'PENDING' | 'CONFIRMED';
  receipts?: { hash: HexString; status: 'success' | 'reverted' }[];
  version?: '2.0.0' | '1.0';
}) {
  return {
    version,
    id: '0x01',
    chainId: '0x1',
    atomic: true,
    status,
    receipts: receipts?.map(({ hash, status }) => ({
      transactionHash: hash,
      blockHash: `0x${'b'.repeat(64)}`,
      blockNumber: '0x1',
      gasUsed: '0x5208',
      logs: [],
      status: status === 'success' ? '0x1' : '0x0',
    })),
  };
}

/**
 * Default responses for the chain reads viem makes while sending and waiting:
 * chain id, an advancing block number, the sent transaction, blocks and gas.
 */
export function chainScript({
  account,
  chainId,
}: {
  account: EvmAddress;
  chainId: ChainId;
}): Partial<Record<string, ScriptEntry>> {
  return {
    eth_chainId: { result: `0x${chainId.toString(16)}` },
    eth_blockNumber: advancingBlockNumber,
    eth_getTransactionByHash: (params) => {
      const [hash] = params as [HexString];
      return { result: makeTransaction({ hash, from: account }) };
    },
    eth_getBlockByNumber: (params) => {
      const [number] = params as [HexString];
      return { result: makeBlock({ number }) };
    },
    eth_estimateGas: { result: '0x5208' },
  };
}

/**
 * Common wallet errors.
 */
export const rpcErrors = {
  methodNotFound: { code: -32601, message: 'Method not found' },
  unknownBundle: { code: 5730, message: 'Unknown bundle id' },
  safeMobileNotFound: { code: -32000, message: 'Transaction not found' },
  userRejected: { code: 4001, message: 'User rejected the request' },
  transport: { code: -32000, message: 'Transport error' },
} as const;
