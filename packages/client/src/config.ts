import type { Context } from '@aave/core';
import type { EnvironmentConfig } from '../../core/src/types';
import { exchange } from './cache';
import { production } from './environments';

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
}: ClientConfig): Context {
  return {
    displayName: 'AaveClient',
    environment,
    headers,
    cache: cache ? exchange : null,
    batch,
    debug,
  };
}
