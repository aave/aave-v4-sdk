import type { Exchange, Operation, OperationResult } from '@urql/core';
import { filter, pipe, tap } from 'wonka';

/**
 * Marks operations dispatched by the SDK's own refresh machinery (e.g.
 * post-transaction refreshes), which must always reach the network: they exist
 * to force fresh data, so serving them from an older in-flight request would
 * defeat their purpose.
 *
 * @internal
 */
export const refetching = Symbol('refetching');

/**
 * A urql exchange that drops query operations whose key already has a network
 * request in flight downstream, so concurrent subscribers to the same query
 * share a single request. The surviving request's result is routed to every
 * active subscriber by the urql `Client` (results are matched by operation
 * key), so dropped duplicates still receive it.
 *
 * @remarks
 * urql v4 removed its standalone `dedupExchange` in favour of dedup state kept
 * on the `Client`, but that state is keyed to subscription liveness: it is
 * cleared both by teardowns (which React bindings interleave into every hook
 * mount) and by stale cached results under `cache-and-network`, letting
 * same-key operations reach the network concurrently. This exchange restores
 * deduplication keyed to what is actually in flight.
 *
 * - Only `query` operations are deduplicated; mutations, subscriptions and
 *   teardowns always pass through
 * - Operations marked with the {@link refetching} context symbol always pass
 *   through, and start tracking their key so later duplicates coalesce onto
 *   the fresher request
 * - A teardown releases its key: the downstream `fetchExchange` aborts the
 *   request on teardown, so no result would ever arrive to release it
 *   otherwise
 * - Intended for the non-batched pipeline. `batchFetchExchange` performs its
 *   own coalescing instead, keyed to actual wire state — its batched requests
 *   survive teardowns, so releasing keys on teardown would be wrong there
 *
 * @internal
 */
export function inFlightDedupExchange(): Exchange {
  return ({ forward }) => {
    const inFlight = new Set<number>();

    return (ops$) => {
      const forwarded$ = pipe(
        ops$,
        filter((operation: Operation) => {
          if (operation.kind === 'teardown' || operation.kind === 'mutation') {
            inFlight.delete(operation.key);
            return true;
          }

          if (operation.kind !== 'query') {
            return true;
          }

          if (
            !(refetching in operation.context) &&
            inFlight.has(operation.key)
          ) {
            return false;
          }

          inFlight.add(operation.key);
          return true;
        }),
      );

      return pipe(
        forward(forwarded$),
        tap((result: OperationResult) => {
          if (!result.hasNext) {
            inFlight.delete(result.operation.key);
          }
        }),
      );
    };
  };
}
