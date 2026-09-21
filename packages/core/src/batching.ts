import { invariant, isNonEmptyArray } from '@aave/types';
import {
  CombinedError,
  type ErrorLike,
  type Exchange,
  type ExecutionResult,
  getOperationName,
  type Operation,
  type OperationResult,
  stringifyDocument,
} from '@urql/core';
import {
  type FetchBody,
  makeFetchBody,
  makeFetchOptions,
  makeFetchSource,
  makeFetchURL,
} from '@urql/core/internal';
import {
  filter,
  make,
  merge,
  mergeMap,
  onEnd,
  pipe,
  type Source,
  share,
  subscribe,
  takeUntil,
  tap,
} from 'wonka';

class Batcher {
  private queue = new Map<number, Operation>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private flushing = false;
  private onBatchReady: (operations: Operation[]) => void = () => {};

  constructor(
    private readonly batchInterval: number,
    private readonly maxBatchSize: number,
  ) {}

  push(operation: Operation): void {
    this.queue.set(operation.key, operation);

    if (this.shouldFlush() && !this.flushing) {
      this.cancelScheduledFlush();
      this.flushBatch();
      return;
    }

    if (!this.flushTimer && !this.flushing) {
      this.scheduleFlush();
    }
  }

  remove(operation: Operation): void {
    this.queue.delete(operation.key);
  }

  onBatch(handler: (operations: Operation[]) => void): void {
    this.onBatchReady = handler;
  }

  private shouldFlush(): boolean {
    return this.queue.size >= this.maxBatchSize;
  }

  private scheduleFlush(): void {
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flushBatch();
    }, this.batchInterval);
  }

  private cancelScheduledFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private flushBatch(): void {
    if (this.flushing) return;
    this.flushing = true;

    if (this.queue.size === 0) {
      this.flushing = false;
      return;
    }

    const batch = Array.from(this.queue.values()).slice(0, this.maxBatchSize);

    this.onBatchReady(batch);

    for (const op of batch) {
      this.queue.delete(op.key);
    }

    if (this.queue.size > 0) {
      setTimeout(() => this.flushBatch(), 0);
    } else {
      this.flushing = false;
    }
  }
}

function makeSingleRequestSource(
  operation: Operation,
  ops$: Source<Operation>,
): Source<OperationResult> {
  const body = makeFetchBody(operation);
  const url = makeFetchURL(operation, body);
  const fetchOptions = makeFetchOptions(operation, body);

  return pipe(
    makeFetchSource(operation, url, fetchOptions),
    takeUntil(
      pipe(
        ops$,
        filter((op) => op.kind === 'teardown' && op.key === operation.key),
      ),
    ),
  );
}

export type BatchFetchExchangeConfig = {
  batchInterval: number;
  maxBatchSize: number;
  url: string;
  fetchOptions?: RequestInit | (() => RequestInit);
};

/**
 * A urql exchange that batches GraphQL query operations into single HTTP requests.
 *
 * @remarks
 * - Query operations are automatically batched together within the `batchInterval` window
 * - Batches are limited to `maxBatchSize` operations
 * - Single-operation batches use standard GraphQL request format (not array)
 * - Mutations and subscriptions are never batched
 * - Queries can opt-out of batching by setting `context.batch = false`
 * - Torn-down operations are automatically removed from pending batches
 * - While a request for a given operation key is in flight, further operations
 *   with the same key are coalesced onto it instead of issuing a duplicate
 *   request — their subscribers receive the in-flight response when it lands
 */
export function batchFetchExchange({
  batchInterval,
  maxBatchSize,
  url,
  fetchOptions,
}: BatchFetchExchangeConfig): Exchange {
  return ({ forward }) => {
    const batcher = new Batcher(batchInterval, maxBatchSize);

    return (ops$) => {
      const shared = share(ops$);

      const forward$ = pipe(
        shared,
        filter((operation) => {
          return (
            operation.kind === 'teardown' ||
            (operation.kind === 'subscription' &&
              !operation.context.fetchSubscriptions)
          );
        }),
        forward,
      );

      const unbatched$ = pipe(
        shared,
        filter(
          (op) =>
            op.kind === 'mutation' ||
            (op.kind === 'subscription' && !!op.context.fetchSubscriptions) ||
            (op.kind === 'query' && op.context.batch === false),
        ),
        mergeMap((operation) => makeSingleRequestSource(operation, ops$)),
      );

      const resultSinks = new Map<
        number,
        Array<(result: OperationResult) => void>
      >();

      // Keys of operations whose network request is currently in flight.
      //
      // urql's React bindings dispatch every query twice per hook mount (once
      // during render to compute the initial state, once from the effect that
      // subscribes for real) with a teardown in between. The teardown clears
      // the Client's own dedup state, so both dispatches reach this exchange.
      // Coalescing onto the in-flight request keeps that — and any other
      // same-key overlap, such as several components mounting the same
      // `cache-and-network` query — down to a single request; every
      // subscriber's sink receives the shared response. Operations that must
      // never be coalesced (post-transaction refreshes, poll ticks) already
      // opt out of batching via `context.batch = false` and bypass this path.
      const inFlight = new Set<number>();

      const batched$ = pipe(
        shared,
        filter(
          (op: Operation) => op.kind === 'query' && op.context.batch !== false,
        ),
        mergeMap((op: Operation) => {
          invariant(
            op.context.url === url,
            `Operation URL mismatch: expected "${url}", got "${op.context.url}"`,
          );
          if (!inFlight.has(op.key)) {
            batcher.push(op);
          }
          return make<OperationResult>(({ next }) => {
            const sinks = resultSinks.get(op.key);

            if (sinks) {
              sinks.push(next);
            } else {
              resultSinks.set(op.key, [next]);
            }

            return () => {
              batcher.remove(op);

              const remaining = resultSinks.get(op.key);
              if (!remaining) return;

              const idx = remaining.indexOf(next);
              if (idx !== -1) remaining.splice(idx, 1);

              if (remaining.length === 0) {
                resultSinks.delete(op.key);
              }
            };
          });
        }),
      );

      batcher.onBatch((operations) => {
        invariant(
          isNonEmptyArray(operations),
          'Expected non-empty array of operations',
        );

        // Single operation → use standard fetch flow
        if (operations.length === 1) {
          const operation = operations[0];
          inFlight.add(operation.key);
          pipe(
            makeSingleRequestSource(operation, ops$),
            tap((result: OperationResult) => {
              const sinks = resultSinks.get(operation.key);
              if (sinks) {
                for (const sink of sinks) {
                  sink(result);
                }
                resultSinks.delete(operation.key);
              }
            }),
            // Fires on completion and on teardown-triggered abort alike, so an
            // aborted request can never leave its key stuck as in-flight.
            onEnd(() => inFlight.delete(operation.key)),
            subscribe(() => {}), // Activate the source (Wonka sources are lazy)
          );
          return;
        }

        const body = operations.map(
          (op): FetchBody => ({
            query: stringifyDocument(op.query),
            variables: op.variables ?? {},
            operationName: getOperationName(op.query),
            extensions: op.extensions,
          }),
        );

        const opts =
          typeof fetchOptions === 'function'
            ? fetchOptions()
            : fetchOptions || {};

        for (const op of operations) {
          inFlight.add(op.key);
        }

        fetch(url, {
          ...opts,
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(opts.headers || {}),
          },
          body: JSON.stringify(body),
        })
          .then((res) => res.json() as Promise<ExecutionResult[]>)
          .then((results) => {
            for (const op of operations) {
              inFlight.delete(op.key);
            }
            for (let i = 0; i < results.length && i < operations.length; i++) {
              const response = results[i];
              const op = operations[i];
              if (!op || !response) continue;

              const result: OperationResult = {
                operation: op,
                data: response.data,
                error: response.errors
                  ? new CombinedError({
                      graphQLErrors: response.errors as Array<ErrorLike>,
                    })
                  : undefined,
                extensions: response.extensions,
                stale: false,
                hasNext: false,
              };
              const sinks = resultSinks.get(op.key);
              if (sinks) {
                for (const sink of sinks) {
                  sink(result);
                }
                resultSinks.delete(op.key);
              }
            }
          })
          .catch((err) => {
            for (const op of operations) {
              inFlight.delete(op.key);
              const result: OperationResult = {
                operation: op,
                data: undefined,
                error: new CombinedError({ networkError: err }),
                stale: false,
                hasNext: false,
              };
              const sinks = resultSinks.get(op.key);
              if (sinks) {
                for (const sink of sinks) {
                  sink(result);
                }
                resultSinks.delete(op.key);
              }
            }
          });
      });

      return merge([unbatched$, batched$, forward$]);
    };
  };
}
