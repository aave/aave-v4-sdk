import { type ChainId, isObject } from '@aave/types-next';
import type { graphql } from './graphql';

export type HubInput = ReturnType<typeof graphql.scalar<'HubInput'>>;

/**
 * @internal
 */
export function isHubInputVariant<T>(input: T): input is T & { hub: HubInput } {
  return isObject(input) && 'hub' in input && input.hub != null;
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
