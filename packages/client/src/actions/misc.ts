import type { UnexpectedError } from '@aave/core';
import {
  type Chain,
  ChainQuery,
  type ChainRequest,
  ChainsFilter,
  ChainsQuery,
  ExchangeRateQuery,
  type ExchangeRateRequest,
  type FiatAmount,
  HasProcessedKnownTransactionQuery,
  type HasProcessedKnownTransactionRequest,
} from '@aave/graphql';
import type { ResultAsync } from '@aave/types';
import type { AaveClient } from '../AaveClient';

/**
 * Fetches a specific chain by chain ID.
 *
 * ```ts
 * const result = await chain(client, {
 *   chainId: chainId(1),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The chain request parameters.
 * @returns The chain data, or null if not found.
 */
export function chain(
  client: AaveClient,
  request: ChainRequest,
): ResultAsync<Chain | null, UnexpectedError> {
  return client.query(ChainQuery, { request });
}

/**
 * Fetches the list of supported chains.
 *
 * ```ts
 * const chains = await chains(client, { filter: ChainsFilter.ALL });
 * ```
 *
 * @param client - Aave client.
 * @param filter - The filter for chains.
 * @returns Array of supported chains.
 */
export function chains(
  client: AaveClient,
  filter: ChainsFilter = ChainsFilter.ALL,
): ResultAsync<Chain[], UnexpectedError> {
  return client.query(ChainsQuery, { filter });
}

/**
 * Check if a transaction has been processed by the Aave API.
 *
 * @param client - Aave client.
 * @param request - The request containing transaction hash and operations to check.
 * @returns True if the transaction has been processed, false otherwise.
 */
export function hasProcessedKnownTransaction(
  client: AaveClient,
  request: HasProcessedKnownTransactionRequest,
): ResultAsync<boolean, UnexpectedError> {
  return client.query(
    HasProcessedKnownTransactionQuery,
    { request },
    {
      requestPolicy: 'network-only', // alwats hit the network
      batch: false, // never batch, always run ASAP
    },
  );
}

/**
 * Fetches the exchange rate between tokens and fiat currencies.
 *
 * ```ts
 * const result = await exchangeRate(client, {
 *   from: { erc20: { chainId: chainId(1), address: evmAddress('0xA0b86a33E6...') } },
 *   to: Currency.Usd,
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The exchange rate request parameters.
 * @returns The exchange rate information as a fiat amount.
 */
export function exchangeRate(
  client: AaveClient,
  request: ExchangeRateRequest,
): ResultAsync<FiatAmount, UnexpectedError> {
  return client.query(ExchangeRateQuery, { request });
}
