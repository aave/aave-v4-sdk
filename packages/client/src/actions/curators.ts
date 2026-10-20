import type { UnexpectedError } from '@aave/core';
import {
  type ExternalCurator,
  ExternalCuratorQuery,
  type ExternalCuratorRequest,
  ExternalCuratorsQuery,
  type ExternalCuratorsRequest,
} from '@aave/graphql';
import type { ResultAsync } from '@aave/types';
import type { AaveClient } from '../AaveClient';
import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type RequestPolicyOptions,
} from '../options';

/**
 * Fetches an external curator by ID.
 *
 * ```ts
 * const result = await externalCurator(client, {
 *   id: 'curator-id',
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The external curator request parameters.
 * @param options - The query options.
 * @returns The external curator, or null if not found.
 */
export function externalCurator(
  client: AaveClient,
  request: ExternalCuratorRequest,
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: CurrencyQueryOptions & RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<ExternalCurator | null, UnexpectedError> {
  return client.query(
    ExternalCuratorQuery,
    { request, currency },
    { requestPolicy },
  );
}

/**
 * Fetches the external curators holding a hub on the given chains.
 *
 * ```ts
 * const result = await externalCurators(client, {
 *   query: { chainIds: [chainId(1)] },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The external curators request parameters.
 * @param options - The query options.
 * @returns Array of external curators.
 */
export function externalCurators(
  client: AaveClient,
  request: ExternalCuratorsRequest,
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: CurrencyQueryOptions & RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<ExternalCurator[], UnexpectedError> {
  return client.query(
    ExternalCuratorsQuery,
    { request, currency },
    { requestPolicy },
  );
}
