import type { Exchange } from '@urql/core';
import type { EnvironmentConfig } from './types';

/**
 * @internal
 */
export type Context = {
  displayName: string;
  environment: EnvironmentConfig;
  headers?: Record<string, string>;
  cache: Exchange | null;
  batch: boolean;
  debug: boolean;
};
