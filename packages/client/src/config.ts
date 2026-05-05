import type { Context } from '@aave/core';
import { type SSRData, ssrExchange } from '@urql/core';
import type { EnvironmentConfig } from '../../core/src/types';
import { exchange } from './cache';
import { production } from './environments';

/**
 * Server-side rendering configuration.
 *
 * On the server, set `{ isServer: true }`, run your queries via actions,
 * then call `client.extractData()` to obtain a serializable snapshot.
 *
 * On the client, set `{ isServer: false, initialState }` where `initialState`
 * is the value previously returned by `extractData()` on the server.
 */
export type SSRConfig =
  | { isServer: true }
  | { isServer: false; initialState?: SSRData };

/**
 * The client configuration.
 */
export type ClientConfig = {
  /**
   * @internal
   * @defaultValue `production`
   */
  environment?: EnvironmentConfig;
  /**
   * @internal
   */
  headers?: Record<string, string>;
  /**
   * Whether to enable caching.
   *
   * @defaultValue `true`
   */
  cache?: boolean;
  /**
   * Whether to enable query batching.
   *
   * @defaultValue `true`
   */
  batch?: boolean;
  /**
   * Whether to enable debug mode.
   *
   * @defaultValue `false`
   */
  debug?: boolean;
  /**
   * Enables server-side rendering hand-off between a server-side instance
   * (`{ isServer: true }`) and a client-side one (`{ isServer: false, initialState }`).
   *
   * @defaultValue `undefined` (disabled)
   */
  ssr?: SSRConfig;
};

/**
 * @internal
 */
export function configureContext({
  environment = production,
  headers,
  cache = true,
  batch = true,
  debug = false,
  ssr,
}: ClientConfig): Context {
  return {
    displayName: 'AaveClient',
    environment,
    headers,
    cache: cache ? exchange : null,
    ssr: ssr
      ? ssrExchange({
          isClient: !ssr.isServer,
          initialState: ssr.isServer ? undefined : ssr.initialState,
        })
      : null,
    batch,
    debug,
  };
}
