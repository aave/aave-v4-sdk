import { supportedChains as supportedChainsMap } from '@aave/client/viem';
import type { Chain } from 'viem';

// TODO remove me
export { isRpcError } from '@aave/client/viem';

export * from './adapters';
export * from './useNetworkFee';

/**
 * The list of supported chains typically used with wagmi config.
 */
export const supportedChains: [Chain, ...Chain[]] = Object.values(
  supportedChainsMap,
) as [Chain, ...Chain[]];
/**
 * A hook that provides a way to get the list of supported chains using viem.
 *
 * @returns The list of supported chains using viem.
 */
export function useSupportedChains(): [Chain, ...Chain[]] {
  return supportedChains;
}
