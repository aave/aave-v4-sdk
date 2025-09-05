import type { Exchange, TypedDocumentNode } from '@urql/core';
import type { EnvironmentConfig } from './types';

/**
 * @internal
 */
export type Context = {
  environment: EnvironmentConfig;
  headers?: Record<string, string>;
  cache: Exchange | null;
  debug: boolean;
  fragments: TypedDocumentNode[];
};
