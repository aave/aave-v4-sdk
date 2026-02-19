import { type AnyVariables, errAsync, okAsync, ResultAsync } from '@aave/types';
import {
  createClient,
  type Exchange,
  makeOperation,
  type Operation,
  type OperationResult,
  type OperationResultSource,
  type RequestPolicy,
  type TypedDocumentNode,
  type Client as UrqlClient,
} from '@urql/core';
import { map, pipe, tap } from 'wonka';
import { batchFetchExchange } from './batching';
import type { Context } from './context';
import { UnexpectedError } from './errors';
import { FragmentResolver } from './fragments';
import { Logger, LogLevel } from './logger';
import type { StandardData } from './types';
import { extractOperationName } from './utils';

/**
 * @internal
 */
export type QueryOptions = {
  /**
   * @default 'cache-and-network'
   */
  requestPolicy?: RequestPolicy;
  /**
   * @default true
   */
  batch?: boolean;
};

const refetching = Symbol('refetching');

export class GqlClient {
  /**
   * @internal
   */
  public readonly urql: UrqlClient;

  private readonly queryRegistry = new Map<
    number,
    { operation: Operation; watching: number }
  >();

  private readonly staleQueries = new Set<number>();

  private readonly pendingRefreshes = new Set<number>();

  private readonly logger: Logger;

  private readonly resolver: FragmentResolver;

  constructor(
    /**
     * @internal
     */
    public readonly context: Context,
  ) {
    this.resolver = FragmentResolver.from(context.fragments);
    this.logger = Logger.named(
      context.displayName,
      context.debug ? LogLevel.DEBUG : LogLevel.SILENT,
    );

    this.urql = createClient({
      url: context.environment.backend,
      requestPolicy: context.cache ? 'cache-and-network' : 'network-only',
      preferGetMethod: false, // since @urql/core@6.0.1
      exchanges: this.exchanges(),
      fetchOptions: this.getFetchOptions(),
    });
  }

  /**
   * Execute a GraphQL query operation.
   *
   * @param document - The GraphQL document to execute.
   * @param variables - The variables to pass to the operation.
   * @returns The result of the operation.
   */
  public query<TValue, TVariables extends AnyVariables>(
    document: TypedDocumentNode<StandardData<TValue>, TVariables>,
    variables: TVariables,
  ): ResultAsync<TValue, UnexpectedError>;
  /**
   * @internal
   */
  public query<TValue, TVariables extends AnyVariables>(
    document: TypedDocumentNode<StandardData<TValue>, TVariables>,
    variables: TVariables,
    options: QueryOptions,
  ): ResultAsync<TValue, UnexpectedError>;

  public query<TValue, TVariables extends AnyVariables>(
    document: TypedDocumentNode<StandardData<TValue>, TVariables>,
    variables: TVariables,
    { requestPolicy, batch = true }: QueryOptions = {},
  ): ResultAsync<TValue, UnexpectedError> {
    const query = this.resolver.replaceFrom(document);
    return this.resultFrom(
      this.urql.query(query, variables, { batch, requestPolicy }),
    );
  }

  /**
   * Execute a GraphQL mutation operation.
   *
   * @param document - The GraphQL document to execute.
   * @param variables - The variables to pass to the operation.
   * @returns The result of the operation.
   */
  public mutation<TValue, TVariables extends AnyVariables>(
    document: TypedDocumentNode<StandardData<TValue>, TVariables>,
    variables: TVariables,
  ): ResultAsync<TValue, UnexpectedError> {
    return this.resultFrom(this.urql.mutation(document, variables));
  }

  /**
   * Refresh active queries matching the predicate, or mark the query as stale
   * if no active queries match (so it refreshes when next activated).
   *
   * @internal
   */
  refreshQueryWhere<TValue, TVariables extends AnyVariables>(
    document: TypedDocumentNode<StandardData<TValue>, TVariables>,
    predicate: (
      variables: TVariables,
      data: TValue,
    ) => boolean | Promise<boolean>,
  ): ResultAsync<void, UnexpectedError> {
    return this.refreshWhere(async (op) => {
      if (op.query === document) {
        const result = this.urql.readQuery(
          document,
          op.variables as TVariables,
          { requestPolicy: 'cache-only' },
        );

        if (!result?.data?.value) {
          return false;
        }

        return predicate(
          op.variables as TVariables,
          result.data.value as TValue,
        );
      }
      return false;
    });
  }

  protected refreshWhere(
    predicate: (op: Operation) => boolean | Promise<boolean>,
  ): ResultAsync<void, UnexpectedError> {
    return ResultAsync.fromPromise(
      (async () => {
        const predicateResults = await Promise.all(
          Array.from(this.queryRegistry.values()).map(async (entry) => ({
            entry,
            matches: await predicate(entry.operation),
          })),
        );

        const matchingEntries = predicateResults.filter(
          ({ matches }) => matches,
        );

        for (const { entry } of matchingEntries) {
          if (entry.watching > 0) {
            this.pendingRefreshes.add(entry.operation.key);

            // Active query: reexecute immediately
            this.urql.reexecuteOperation(
              makeOperation(entry.operation.kind, entry.operation, {
                ...entry.operation.context,
                requestPolicy: 'network-only',
                batch: false, // never batch, run ASAP!
                [refetching]: true,
              }),
            );
          } else {
            // Flag as stale for next activation
            this.staleQueries.add(entry.operation.key);
          }
        }
      })(),
      (err) => UnexpectedError.from(err),
    );
  }

  private exchanges(): Exchange[] {
    const exchanges: Exchange[] = [this.queryTrackingExchange()];

    if (this.context.cache) {
      exchanges.push(this.context.cache);
    }

    exchanges.push(
      batchFetchExchange({
        batchInterval: 1,
        maxBatchSize: 10,
        url: this.context.environment.backend,
        fetchOptions: this.getFetchOptions(),
      }),
    );

    return exchanges;
  }

  private getFetchOptions(): RequestInit {
    return {
      credentials: 'omit',
      headers: this.context.headers,
    };
  }

  private addQueryReference(op: Operation): void {
    const existing = this.queryRegistry.get(op.key);

    if (existing) {
      existing.watching++;
      this.logger.debug(
        `Added query reference: ${extractOperationName(op)} (key: ${op.key}, count: ${existing.watching})`,
      );
    } else {
      this.queryRegistry.set(op.key, { operation: op, watching: 1 });
      this.logger.debug(
        `Added first query reference: ${extractOperationName(op)} (key: ${op.key}, count: 1)`,
      );
    }
  }

  private releaseQueryReference(key: number): void {
    const entry = this.queryRegistry.get(key);
    if (entry && entry.watching > 0) {
      entry.watching--;
      this.logger.debug(
        `Released query reference: ${extractOperationName(entry.operation)} (key: ${key}, count: ${entry.watching})`,
      );
    }
  }

  private queryTrackingExchange(): Exchange {
    return ({ forward }) =>
      (ops$) =>
        pipe(
          pipe(
            ops$,
            map((op: Operation) => {
              switch (op.kind) {
                case 'query':
                  if (op.context.pause || refetching in op.context) {
                    break;
                  }

                  this.addQueryReference(op);

                  if (this.staleQueries.has(op.key)) {
                    this.staleQueries.delete(op.key);
                    return makeOperation(op.kind, op, {
                      ...op.context,
                      requestPolicy: 'network-only',
                    });
                  }
                  break;

                case 'teardown':
                  this.releaseQueryReference(op.key);

                  if (this.pendingRefreshes.has(op.key)) {
                    this.pendingRefreshes.delete(op.key);
                    this.staleQueries.add(op.key);
                  }
                  break;
              }

              return op;
            }),
            forward,
          ),
          tap((result) => {
            if (refetching in result.operation.context) {
              this.pendingRefreshes.delete(result.operation.key);
            }
          }),
        );
  }

  private resultFrom<TValue, TVariables extends AnyVariables>(
    source: OperationResultSource<
      OperationResult<StandardData<TValue>, TVariables>
    >,
  ): ResultAsync<TValue, UnexpectedError> {
    return ResultAsync.fromPromise(source.toPromise(), (err: unknown) => {
      this.logger.error(err);
      return UnexpectedError.from(err);
    }).andThen((result) => {
      if (result.error?.networkError) {
        return errAsync(UnexpectedError.from(result.error.networkError));
      }

      if (result.data) {
        return okAsync(result.data.value);
      }

      return errAsync(UnexpectedError.from(result.error));
    });
  }
}
