import type { UnexpectedError } from '@aave/core';
import {
  type PermitRequest,
  PermitTypedDataQuery,
  type PermitTypedDataResponse,
} from '@aave/graphql';
import type { ResultAsync } from '@aave/types';

import type { AaveClient } from '../AaveClient';

/**
 * Generates EIP-712 typed data for permit signatures.
 *
 * ```ts
 * const result = await permitTypedData(client, {
 *   spender: evmAddress('0x87870bca…'),
 *   currency: evmAddress('0xa0b86991c431c924b2047c7094daf21b77e…'),
 *   amount: '1000.5',
 * });
 *
 * if (result.isOk()) {
 *   // Use the typed data to create a signature
 *   const signature = await wallet.signTypedData(result.value);
 * }
 * ```
 *
 * @param client - Aave client.
 * @param request - The permit request parameters.
 * @returns The EIP-712 typed data for permit signature.
 */
export function permitTypedData(
  client: AaveClient,
  request: PermitRequest,
): ResultAsync<PermitTypedDataResponse, UnexpectedError> {
  return client.query(PermitTypedDataQuery, { request });
}
