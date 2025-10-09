import { type HexString, invariant, isObject } from '@aave/types-next';
import { type HttpResponse, http, type PathParams, passthrough } from 'msw';
import { setupServer } from 'msw/node';
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

export type SupportedJsonRpcRequest =
  | EthChainIdRequest
  | WalletSwitchEthereumChainRequest
  | WalletAddEthereumChainRequest
  | AnyOtherJsonRpcRequest;

function isJsonRpcRequest(body: unknown): body is SupportedJsonRpcRequest {
  return isObject(body) && 'jsonrpc' in body && 'method' in body;
}

export function setupRpcInterceptor(
  handler: (
    body: SupportedJsonRpcRequest,
  ) => HttpResponse<JsonRpcResponse> | undefined,
) {
  const server = setupServer(
    http.post<PathParams, SupportedJsonRpcRequest>(
      ETHEREUM_FORK_RPC_URL,
      async ({ request }) => {
        const body = await request.clone().json();

        invariant(
          isJsonRpcRequest(body),
          'body is not a valid JSON-RPC request',
        );

        return handler(body);
      },
    ),
    http.post(ETHEREUM_FORK_RPC_URL, () => passthrough()),
  );

  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  return server;
}
