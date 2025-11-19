import type { Context } from '@aave/core';
import type { TypedDocumentNode } from '@urql/core';
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
   * Whether to enable debug mode.
   *
   * @defaultValue `false`
   */
  debug?: boolean;
  /**
   * The custom fragments to use.
   *
   * @experimental This is an experimental API and may be subject to breaking changes.
   */
  fragments?: TypedDocumentNode[];
};

/**
 * @internal
 */
export function configureContext({
  environment = production,
  headers,
  cache = true,
  debug = false,
  fragments = [],
}: ClientConfig): Context {
  return {
    displayName: 'AaveClient',
    environment,
    headers,
    cache: cache ? exchange : null,
    debug,
    fragments,
  };
}
