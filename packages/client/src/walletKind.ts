/**
 * On-chain classification of an account, from CoW's signing-scheme
 * perspective. Drives the choice between EIP-712 (raw ECDSA), EIP-1271
 * off-chain (raw wallet bytes), and on-chain pre-signature.
 *
 * Vendored from the cow-sdk proposal at
 * https://github.com/cowprotocol/cow-sdk/pull/878. When that ships in a
 * cow-sdk release, replace `classifyWallet` with the upstream
 * `classifyAccount` import.
 *
 * - `eoa`                    — empty code at the address.
 * - `delegated-eoa-plain`    — EIP-7702 marker (`0xef0100 || delegate`)
 *                              whose delegate is NOT in the wrapping
 *                              registry. Sign EIP-712 normally; the
 *                              delegate returns raw ECDSA from
 *                              `signTypedData_v4` that ecrecovers to the
 *                              EOA address.
 * - `delegated-eoa-wrapping` — EIP-7702 marker whose delegate IS in the
 *                              wrapping registry. `signTypedData_v4`
 *                              returns wrapped bytes (ERC-7739 nested
 *                              typed data, ERC-7579 MA v2 validator
 *                              prefix, or both). Forward the bytes
 *                              verbatim to the backend via the
 *                              `signatureBytes` input field; the backend
 *                              tags the order as `eip1271` so CoW resolves
 *                              verification via `isValidSignature` on the
 *                              EOA, which EIP-7702 dispatches to the
 *                              delegate.
 * - `contract`               — non-trivial code (Safe, custom AA wallet).
 *                              Use the transaction (presign) path.
 */
export type WalletKind =
  | 'eoa'
  | 'delegated-eoa-plain'
  | 'delegated-eoa-wrapping'
  | 'contract';

/**
 * Reads the on-chain bytecode at an address. The function shape lets
 * callers adapt their provider library without us picking sides:
 *
 * - ethers v5/v6: `(addr) => provider.getCode(addr)`
 * - viem:        `(addr) => publicClient.getCode({ address: addr as `0x${string}` })`
 */
export type GetCodeFn = (address: string) => Promise<string | null | undefined>;

const EIP7702_DELEGATION_PREFIX = '0xef0100';
const EIP7702_DELEGATION_HEX_LENGTH = 2 + 23 * 2; // "0x" + 23 bytes

/**
 * Delegate addresses (lowercase, no `0x`) known to force signature wrapping
 * at `signTypedData_v4` time. Empty today — populate as wrapping delegates
 * are confirmed in production (Alchemy Modular Account v2, ZeroDev Kernel
 * v3, Biconomy Nexus, Safe-via-7702 with 7579 modules, etc.).
 */
const WRAPPING_DELEGATES = new Set<string>();

function normalizeDelegateAddress(address: string): string {
  const lower = address.toLowerCase();
  return lower.startsWith('0x') ? lower.slice(2) : lower;
}

function isEip7702DelegationCode(code: string): boolean {
  const lower = code.toLowerCase();
  return (
    lower.length === EIP7702_DELEGATION_HEX_LENGTH &&
    lower.startsWith(EIP7702_DELEGATION_PREFIX)
  );
}

function extractEip7702Delegate(code: string): string | null {
  if (!isEip7702DelegationCode(code)) return null;
  return code.slice(2 + 6).toLowerCase();
}

/**
 * Classify an account by inspecting on-chain code. Reads `getCode(owner)`
 * once; callers should cache the result if they need to (no caching here).
 */
export async function classifyWallet(
  getCode: GetCodeFn,
  owner: string,
): Promise<WalletKind> {
  const code = (await getCode(owner)) ?? '0x';
  if (code === '0x') return 'eoa';

  const delegate = extractEip7702Delegate(code);
  if (delegate !== null) {
    return WRAPPING_DELEGATES.has(delegate)
      ? 'delegated-eoa-wrapping'
      : 'delegated-eoa-plain';
  }
  return 'contract';
}

/**
 * Add a delegate address to the wrapping registry at runtime. Useful for
 * SDK consumers that want to opt a known-wrapping delegate into the
 * eip1271 path before the static allowlist is updated. Tolerates checksum
 * casing and `0x` prefix.
 */
export function registerWrappingDelegate(address: string): void {
  WRAPPING_DELEGATES.add(normalizeDelegateAddress(address));
}
