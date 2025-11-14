import { type ChainId, isObject } from '@aave/types-next';
import type { graphql } from './graphql';

export type HubInput = ReturnType<typeof graphql.scalar<'HubInput'>>;

/**
 * @internal
 */
export function isHubInputVariant<T>(
  input: T,
): input is T & { hubInput: HubInput } {
  return isObject(input) && 'hubInput' in input && input.hubInput != null;
}

/**
 * @internal
 */
export function isChainIdsVariant<T>(
  input: T,
): input is T & { chainIds: ChainId[] } {
  return isObject(input) && 'chainIds' in input && input.chainIds != null;
}

export type SpokeInput = ReturnType<typeof graphql.scalar<'SpokeInput'>>;

/**
 * @internal
 */
export function isSpokeInputVariant<T>(
  input: T,
): input is T & { spoke: SpokeInput } {
  return isObject(input) && 'spoke' in input && input.spoke != null;
}

// Common input types used across multiple queries
export type AmountInput = ReturnType<typeof graphql.scalar<'AmountInput'>>;
export type Erc20Input = ReturnType<typeof graphql.scalar<'Erc20Input'>>;
export type TokenInput = ReturnType<typeof graphql.scalar<'TokenInput'>>;
export type ReserveInput = ReturnType<typeof graphql.scalar<'ReserveInput'>>;
export type ReserveAmountInput = ReturnType<
  typeof graphql.scalar<'ReserveAmountInput'>
>;
export type ReserveErc20AmountInput = ReturnType<
  typeof graphql.scalar<'ReserveErc20AmountInput'>
>;
export type ReserveAmountInputWithPermit = ReturnType<
  typeof graphql.scalar<'ReserveAmountInputWithPermit'>
>;
export type ReserveErc20AmountInputWithPermit = ReturnType<
  typeof graphql.scalar<'ReserveErc20AmountInputWithPermit'>
>;
export type TxHashInput = ReturnType<typeof graphql.scalar<'TxHashInput'>>;

/**
 * @internal
 */
export function isTxHashInputVariant<T>(
  input: T,
): input is T & { txHash: TxHashInput } {
  return isObject(input) && 'txHash' in input && input.txHash != null;
}

export type HubTokenInput = ReturnType<typeof graphql.scalar<'HubTokenInput'>>;
export type SpokeTokenInput = ReturnType<
  typeof graphql.scalar<'SpokeTokenInput'>
>;
