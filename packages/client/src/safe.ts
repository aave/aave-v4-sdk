import type { TxHash } from '@aave/types';
import { txHash } from '@aave/types';

let _isSafe: boolean | null = null;
// biome-ignore lint/suspicious/noExplicitAny: Safe SDK loaded dynamically, types not guaranteed
let _sdk: any = null;

const SAFE_POLL_INTERVAL_MS = 2000;
const SAFE_POLL_TIMEOUT_MS = 5 * 60 * 1000;
const SAFE_INFO_TIMEOUT_MS = 200;
const SAFE_ALLOWED_DOMAINS: RegExp[] = [
  /gnosis-safe\.io$/,
  /app\.safe\.global$/,
];

declare const self: unknown;

function isInIframe(): boolean {
  try {
    if (typeof globalThis === 'undefined') return false;
    if (typeof self === 'undefined') return false;
    // biome-ignore lint/suspicious/noExplicitAny: accessing window properties across environments
    const w = globalThis as any;
    return (
      typeof w.self !== 'undefined' &&
      typeof w.top !== 'undefined' &&
      w.self !== w.top
    );
  } catch {
    return true; // cross-origin iframe
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Safe SDK loaded dynamically, types not guaranteed
async function getSafeSDK(): Promise<any | null> {
  if (_sdk) return _sdk;
  try {
    // Dynamic import so consumers without @safe-global/safe-apps-sdk installed
    // don't get a hard failure at module load time (it's an optional peer dep).
    const mod = await import('@safe-global/safe-apps-sdk');
    const SDK = mod.default ?? mod;
    _sdk = new SDK({ allowedDomains: SAFE_ALLOWED_DOMAINS });
    return _sdk;
  } catch {
    return null;
  }
}

/**
 * Returns true if running inside a Safe App iframe.
 * Synchronous false for non-iframe contexts.
 */
export async function isSafeWallet(): Promise<boolean> {
  if (!isInIframe()) return false;
  if (_isSafe !== null) return _isSafe;

  try {
    const sdk = await getSafeSDK();
    if (!sdk) {
      _isSafe = false;
      return false;
    }

    const info = await Promise.race([
      sdk.safe.getInfo(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), SAFE_INFO_TIMEOUT_MS),
      ),
    ]);
    _isSafe = !!info;
  } catch {
    _isSafe = false;
  }
  return _isSafe;
}

/**
 * If running in a Safe iframe, resolves a safeTxHash to the on-chain
 * transaction hash by polling the Safe SDK. Returns the hash unchanged
 * for non-Safe contexts.
 */
export async function resolveTxHash(hash: TxHash): Promise<TxHash> {
  if (!(await isSafeWallet())) return hash;

  const sdk = await getSafeSDK();
  if (!sdk) return hash;

  const deadline = Date.now() + SAFE_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const safeTx = await sdk.txs.getBySafeTxHash(hash);
      if (safeTx?.txHash) return txHash(safeTx.txHash);
    } catch {
      // not yet executed, retry
    }
    await new Promise((r) => setTimeout(r, SAFE_POLL_INTERVAL_MS));
  }

  return hash;
}
