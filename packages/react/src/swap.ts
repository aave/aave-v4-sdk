import { swapQuote } from '@aave/client-next';
import type { UnexpectedError } from '@aave/core-next';
import type { SwapQuote, SwapQuoteRequest } from '@aave/graphql-next';
import { useAaveClient } from './context';
import { type UseAsyncTask, useAsyncTask } from './helpers/tasks';

/**
 * Fetches a swap quote for the specified trade parameters.
 *
 * ```tsx
 * const [getQuote, gettingQuote] = useSwapQuote();
 *
 * const loading = gettingQuote.loading;
 * const error = gettingQuote.error;
 *
 * // …
 *
 * const result = await getQuote({
 *   chainId: chainId(1),
 *   buy: { erc20: evmAddress('0xA0b86a33E6...') },
 *   sell: { erc20: evmAddress('0x6B175474E...') },
 *   amount: bigDecimal('1000'),
 *   kind: SwapKind.SELL,
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Swap quote:', result.value);
 * ```
 */
export function useSwapQuote(): UseAsyncTask<
  SwapQuoteRequest,
  SwapQuote,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: SwapQuoteRequest) =>
    swapQuote(client, request),
  );
}
