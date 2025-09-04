import {
  SwappableTokensQuery,
  type SwappableTokensRequest,
  type SwapQuote,
  SwapQuoteQuery,
  type SwapQuoteRequest,
  type Token,
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

export type UseSwappableTokensArgs = SwappableTokensRequest;

/**
 * Fetch the list of tokens available for swapping on a specific chain.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useSwappableTokens({
 *   query: { chainId: chainId(1) },
 *   suspense: true,
 * });
 * ```
 */
export function useSwappableTokens(
  args: UseSwappableTokensArgs & Suspendable,
): SuspenseResult<Token[]>;

/**
 * Fetch the list of tokens available for swapping on a specific chain.
 *
 * ```tsx
 * const { data, error, loading } = useSwappableTokens({
 *   query: { chainId: chainId(1) },
 * });
 * ```
 */
export function useSwappableTokens(
  args: UseSwappableTokensArgs,
): ReadResult<Token[]>;

export function useSwappableTokens({
  suspense = false,
  ...request
}: UseSwappableTokensArgs & {
  suspense?: boolean;
}): SuspendableResult<Token[]> {
  return useSuspendableQuery({
    document: SwappableTokensQuery,
    variables: {
      request,
    },
    suspense,
  });
}
