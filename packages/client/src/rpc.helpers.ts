import { type HexString, invariant, isObject } from '@aave/types';
import type { Eip1193Provider } from 'ethers';
import * as msw from 'msw';
import { setupServer } from 'msw/node';
import { createPublicClient, http } from 'viem';
import { afterAll, beforeAll } from 'vitest';
import { ETHEREUM_FORK_RPC_URL } from './test-utils';

export type JsonRpcId = number | string | null;

export interface JsonRpcRequest<M extends string, P = unknown> {
  jsonrpc: '2.0';
  id: JsonRpcId;
  method: M;
  params: P;
}

export interface JsonRpcSuccess<T = unknown> {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result: T;
}

export interface JsonRpcError<E = unknown> {
  jsonrpc: '2.0';
  id: JsonRpcId;
  error: {
    code: number;
    message: string;
    data?: E;
  };
}

export type JsonRpcResponse<T = unknown, E = unknown> =
  | JsonRpcSuccess<T>
  | JsonRpcError<E>;

export type AnyOtherJsonRpcRequest = JsonRpcRequest<'__ANY_METHOD__'>;

export type EthChainIdRequest = JsonRpcRequest<'eth_chainId', []>;

export type WalletSwitchEthereumChainRequest = JsonRpcRequest<
  'wallet_switchEthereumChain',
  [{ chainId: HexString }]
>;

export type WalletAddEthereumChainRequest = JsonRpcRequest<
  'wallet_addEthereumChain',
  [
    {
      chainId: HexString;
      chainName?: string;
      nativeCurrency?: {
        name: string;
        symbol: string;
        decimals: number;
      };
      rpcUrls?: string[];
      blockExplorerUrls?: string[];
      iconUrls?: string[];
    },
  ]
>;

export type EthSendTransactionParams = {
  from: HexString;
  to?: HexString;
  gas?: HexString;
  gasPrice?: HexString;
  maxFeePerGas?: HexString;
  maxPriorityFeePerGas?: HexString;
  value?: HexString;
  data?: HexString;
  nonce?: HexString;
  type?: string | number;
};

export type EthSendTransactionRequest = JsonRpcRequest<
  'eth_sendTransaction',
  [EthSendTransactionParams]
>;

export type EthAccountsRequest = JsonRpcRequest<'eth_accounts', []>;

export type SupportedJsonRpcRequest =
  | EthChainIdRequest
  | EthAccountsRequest
  | WalletSwitchEthereumChainRequest
  | WalletAddEthereumChainRequest
  | EthSendTransactionRequest
  | AnyOtherJsonRpcRequest;

export type SupportedJsonRpcBatchRequest = SupportedJsonRpcRequest[];

function isJsonRpcRequest(body: unknown): body is SupportedJsonRpcRequest {
  return isObject(body) && 'jsonrpc' in body && 'method' in body;
}

function isJsonRpcBatchRequest(
  body: unknown,
): body is SupportedJsonRpcBatchRequest {
  return Array.isArray(body) && body.every(isJsonRpcRequest);
}

export function setupRpcInterceptor(
  handler: (body: SupportedJsonRpcRequest) => JsonRpcResponse | undefined,
) {
  const server = setupServer(
    msw.http.post<msw.PathParams, SupportedJsonRpcRequest>(
      ETHEREUM_FORK_RPC_URL,
      async ({ request }) => {
        const body = await request.clone().json();

        // single request
        if (isJsonRpcRequest(body)) {
          const res = handler(body);
          return res ? msw.HttpResponse.json(res) : msw.passthrough();
        }

        // batch request
        if (isJsonRpcBatchRequest(body)) {
          const responses = body.map((req) => handler(req));

          if (responses.some((res) => res === undefined)) {
            return msw.passthrough();
          }

          return msw.HttpResponse.json(responses);
        }

        invariant(false, 'body is not a valid JSON-RPC request or batch');
      },
    ),
    msw.http.post(ETHEREUM_FORK_RPC_URL, () => msw.passthrough()),
  );

  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  return server;
}

export type Eip1193Handler = (
  request: SupportedJsonRpcRequest,
) => JsonRpcResponse | undefined;

export function setupEip1193Interceptor(
  handler: Eip1193Handler,
): Eip1193Provider {
  const fallbackClient = createPublicClient({
    transport: http(ETHEREUM_FORK_RPC_URL),
  });

  async function forwardToRpc(
    method: string,
    params: unknown[] | undefined,
  ): Promise<unknown> {
    return fallbackClient.request({
      method,
      params: (params ?? []) as unknown[],
      // biome-ignore lint/suspicious/noExplicitAny: keep it simple
    } as any);
  }

  return {
    async request(req): Promise<unknown> {
      const result = await handler(req as SupportedJsonRpcRequest);

      // handled
      if (result !== undefined) {
        if ('error' in result) throw result.error;
        return result.result; // unwrap
      }

      // fallback
      return forwardToRpc(req.method, req.params as unknown[]);
    },
  };
}
