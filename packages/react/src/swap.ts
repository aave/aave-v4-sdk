import {
  type SwapQuote,
  SwapQuoteQuery,
  type SwapQuoteRequest,
} from '@aave/graphql-next';
import {
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  useSuspendableQuery,
} from './helpers';

export type UseSwapQuoteArgs = SwapQuoteRequest;

/**
 * Fetch a swap quote for the specified trade parameters.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useSwapQuote({
 *   chainId: chainId(1),
 *   buy: { erc20: evmAddress('0xA0b86a33E6...') },
 *   sell: { erc20: evmAddress('0x6B175474E...') },
 *   amount: bigDecimal('1000'),
 *   kind: SwapKind.SELL,
 *   suspense: true,
 * });
 * ```
 */
export function useSwapQuote(
  args: UseSwapQuoteArgs & Suspendable,
): SuspenseResult<SwapQuote>;

/**
 * Fetch a swap quote for the specified trade parameters.
 *
 * ```tsx
 * const { data, error, loading } = useSwapQuote({
 *   chainId: chainId(1),
 *   buy: { erc20: evmAddress('0xA0b86a33E6...') },
 *   sell: { erc20: evmAddress('0x6B175474E...') },
 *   amount: bigDecimal('1000'),
 *   kind: SwapKind.SELL,
 * });
 * ```
 */
export function useSwapQuote(args: UseSwapQuoteArgs): ReadResult<SwapQuote>;

export function useSwapQuote({
  suspense = false,
  ...request
}: UseSwapQuoteArgs & {
  suspense?: boolean;
}): SuspendableResult<SwapQuote> {
  return useSuspendableQuery({
    document: SwapQuoteQuery,
    variables: {
      request,
    },
    suspense,
  });
}
