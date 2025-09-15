import { type ChainId, isObject } from '@aave/types-next';
import type { graphql } from './graphql';

export type HubInput = ReturnType<typeof graphql.scalar<'HubInput'>>;

export function isHubInput<T>(input: T): input is T & { hub: HubInput } {
  return isObject(input) && 'hub' in input && input.hub != null;
}

export function isChainIdsInput<T>(
  input: T,
): input is T & { chainIds: ChainId[] } {
  return isObject(input) && 'chainIds' in input && input.chainIds != null;
}
