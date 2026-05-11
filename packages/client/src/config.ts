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
 * Overrides the display name, symbol, or icon for a specific asset.
 * Applied globally across all queries.
 */
export type AssetOverride = {
  /** The chain ID where this asset lives. */
  chainId: number;
  /** The ERC-20 token address (checksummed or lowercase). */
  address: string;
  /** Display fields to override for this asset. */
  display: {
    /** Override the asset's display name. */
    name?: string;
    /** Override the asset's display symbol. */
    symbol?: string;
    /** Override the asset's display icon URL. */
    icon?: string;
  };
};

/**
 * Controls how asset names, symbols, and icons are presented.
 */
export type DisplayConfig = {
  /**
   * When `true`, wrapped native tokens (e.g. WETH) are shown using the
   * native asset's name, symbol, and icon (e.g. ETH) for protocol reserve
   * queries. Has no effect on wallet balance or swap queries.
   */
  showWrappedNativeReserveAsNative?: boolean;
  /**
   * Per-asset display overrides applied globally across all queries.
   * Useful for renaming assets to a more friendly display name.
   */
  assetOverrides?: AssetOverride[];
};

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
  /**
   * Controls how asset names, symbols, and icons are displayed.
   *
   * @defaultValue `undefined` (no transforms applied)
   */
  display?: DisplayConfig;
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
