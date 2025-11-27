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
  pipe,
  type Source,
  share,
  subscribe,
  takeUntil,
  tap,
} from 'wonka';

class Batcher {
  private queuesByUrl = new Map<string, Operation[]>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private onBatchReady: (url: string, operations: Operation[]) => void =
    () => {};

  constructor(
    private readonly batchInterval: number,
    private readonly maxBatchSize: number,
  ) {}

  push(operation: Operation): void {
    const url = operation.context.url;
    const queue = this.queuesByUrl.get(url);

    if (queue) {
      queue.push(operation);
    } else {
      this.queuesByUrl.set(url, [operation]);
    }

    if (this.shouldFlush()) {
      this.cancelScheduledFlush();
      this.flushBatch();
      return;
    }

    if (this.isFirstOperation()) {
      this.scheduleFlush();
    }
  }

  onBatch(handler: (url: string, batch: Operation[]) => void): void {
    this.onBatchReady = handler;
  }

  private shouldFlush(): boolean {
    for (const queue of this.queuesByUrl.values()) {
      if (queue.length >= this.maxBatchSize) {
        return true;
      }
    }
    return false;
  }

  private isFirstOperation(): boolean {
    return !this.flushTimer;
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
    for (const [url, operations] of this.queuesByUrl.entries()) {
      if (operations.length === 0) continue;

      const batch = operations.slice(0, this.maxBatchSize);
      const remaining = operations.slice(this.maxBatchSize);

      if (remaining.length > 0) {
        this.queuesByUrl.set(url, remaining);
      } else {
        this.queuesByUrl.delete(url);
      }

      this.onBatchReady(url, batch);
    }

    if (this.hasRemainingOperations()) {
      setTimeout(() => this.flushBatch(), 0);
    } else {
      this.flushTimer = null;
    }
  }

  private hasRemainingOperations(): boolean {
    for (const queue of this.queuesByUrl.values()) {
      if (queue.length > 0) return true;
    }
    return false;
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
 */
export function batchFetchExchange({
  batchInterval,
  maxBatchSize,
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

      const batched$ = pipe(
        shared,
        filter(
          (op: Operation) => op.kind === 'query' && op.context.batch !== false,
        ),
        mergeMap((op: Operation) => {
          batcher.push(op);
          return make<OperationResult>(({ next }) => {
            const sinks = resultSinks.get(op.key);

            if (sinks) {
              sinks.push(next);
            } else {
              resultSinks.set(op.key, [next]);
            }

            return () => {
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

      batcher.onBatch((url, operations) => {
        invariant(
          isNonEmptyArray(operations),
          'Expected non-empty array of operations',
        );

        // Single operation → use standard fetch flow
        if (operations.length === 1) {
          pipe(
            makeSingleRequestSource(operations[0], ops$),
            tap((result: OperationResult) => {
              const sinks = resultSinks.get(operations[0].key);
              if (sinks) {
                for (const sink of sinks) {
                  sink(result);
                }
                resultSinks.delete(operations[0].key);
              }
            }),
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

        fetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(opts.headers || {}),
          },
          body: JSON.stringify(body),
          ...opts,
        })
          .then((res) => res.json() as Promise<ExecutionResult[]>)
          .then((results) => {
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
