import SafeAppsSDK, {
  type BaseTransaction,
  type SafeInfo,
} from '@safe-global/safe-apps-sdk';
import { useEffect, useMemo, useState } from 'react';
import {
  type Address,
  createWalletClient,
  custom,
  type EIP1193Provider,
  type Hex,
  numberToHex,
  type WalletClient,
} from 'viem';
import { mainnet } from 'viem/chains';

const SAFE_INFO_TIMEOUT_MS = 5000;

type SafeWalletState = {
  error: string | null;
  loading: boolean;
  safe: SafeInfo | null;
  walletClient: WalletClient | null;
};

type RpcTransaction = {
  data?: Hex;
  to?: Address;
  value?: string;
};

function firstParam(params: unknown): unknown {
  return Array.isArray(params) ? params[0] : undefined;
}

function firstStringParam(params: unknown): string {
  const value = firstParam(params);
  if (typeof value !== 'string') {
    throw new Error('Expected the first RPC parameter to be a string.');
  }
  return value;
}

function transactionFrom(params: unknown): BaseTransaction {
  const value = firstParam(params);
  if (!value || typeof value !== 'object') {
    throw new Error('Expected an RPC transaction object.');
  }

  const transaction = value as RpcTransaction;
  if (!transaction.to) {
    throw new Error('Safe transactions require a recipient address.');
  }

  return {
    to: transaction.to,
    value: transaction.value ?? '0',
    data: transaction.data ?? '0x',
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error('Timed out while reading Safe context.')),
        timeoutMs,
      ),
    ),
  ]);
}

function createSafeProvider(sdk: SafeAppsSDK, safe: SafeInfo): EIP1193Provider {
  const chainHex = numberToHex(safe.chainId);

  return {
    request: async ({ method, params }) => {
      switch (method) {
        case 'eth_accounts':
        case 'eth_requestAccounts':
          return [safe.safeAddress];

        case 'eth_chainId':
          return chainHex;

        case 'net_version':
          return String(safe.chainId);

        case 'eth_sendTransaction': {
          const tx = await sdk.txs.send({
            txs: [transactionFrom(params)],
          });
          return tx.safeTxHash;
        }

        case 'eth_estimateGas': {
          const tx = transactionFrom(params);
          const gas = await sdk.eth.getEstimateGas({
            from: safe.safeAddress,
            to: tx.to,
            value: tx.value,
            data: tx.data,
          });
          return numberToHex(gas);
        }

        case 'eth_call':
          return sdk.eth.call(params as Parameters<typeof sdk.eth.call>[0]);

        case 'eth_getBalance':
          return sdk.eth.getBalance(
            params as Parameters<typeof sdk.eth.getBalance>[0],
          );

        case 'eth_getCode':
          return sdk.eth.getCode(
            params as Parameters<typeof sdk.eth.getCode>[0],
          );

        case 'eth_getStorageAt':
          return sdk.eth.getStorageAt(
            params as Parameters<typeof sdk.eth.getStorageAt>[0],
          );

        case 'eth_getLogs':
          return sdk.eth.getPastLogs(
            params as Parameters<typeof sdk.eth.getPastLogs>[0],
          );

        case 'eth_getBlockByHash':
          return sdk.eth.getBlockByHash(
            params as Parameters<typeof sdk.eth.getBlockByHash>[0],
          );

        case 'eth_getBlockByNumber':
          return sdk.eth.getBlockByNumber(
            params as Parameters<typeof sdk.eth.getBlockByNumber>[0],
          );

        case 'eth_getTransactionByHash':
          return sdk.eth.getTransactionByHash([firstStringParam(params)]);

        case 'eth_getTransactionReceipt':
          return sdk.eth.getTransactionReceipt([firstStringParam(params)]);

        case 'eth_getTransactionCount':
          return sdk.eth.getTransactionCount(
            params as Parameters<typeof sdk.eth.getTransactionCount>[0],
          );

        case 'eth_gasPrice':
          return sdk.eth.getGasPrice();

        default:
          throw new Error(`Unsupported Safe RPC method: ${method}`);
      }
    },
  } as EIP1193Provider;
}

function createSafeWalletClient(
  sdk: SafeAppsSDK,
  safe: SafeInfo,
): WalletClient {
  return createWalletClient({
    account: safe.safeAddress as Address,
    chain: mainnet,
    transport: custom(createSafeProvider(sdk, safe)),
  });
}

export function useSafeWallet(): SafeWalletState {
  const sdk = useMemo(() => new SafeAppsSDK(), []);
  const [state, setState] = useState<SafeWalletState>({
    error: null,
    loading: true,
    safe: null,
    walletClient: null,
  });

  useEffect(() => {
    let cancelled = false;

    withTimeout(sdk.safe.getInfo(), SAFE_INFO_TIMEOUT_MS)
      .then((safe) => {
        if (cancelled) return;
        setState({
          error: null,
          loading: false,
          safe,
          walletClient: createSafeWalletClient(sdk, safe),
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({
          error: message,
          loading: false,
          safe: null,
          walletClient: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [sdk]);

  return state;
}
