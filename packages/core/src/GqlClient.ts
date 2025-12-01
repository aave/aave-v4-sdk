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
import { pipe, tap } from 'wonka';
import { batchFetchExchange } from './batching';
import type { Context } from './context';
import { UnexpectedError } from './errors';
import { FragmentResolver } from './fragments';
import { Logger, LogLevel } from './logger';
import type { StandardData } from './types';
import {
  extractOperationName,
  isActiveQueryOperation,
  isTeardownOperation,
  takeValue,
} from './utils';

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

export class GqlClient {
  /**
   * @internal
   */
  public readonly urql: UrqlClient;

  private readonly activeQueries = new Map<number, Operation>();

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
    ).map(takeValue);
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
    return this.resultFrom(this.urql.mutation(document, variables)).map(
      takeValue,
    );
  }

  protected async refreshWhere(
    predicate: (op: Operation) => boolean | Promise<boolean>,
  ): Promise<void> {
    const allOps = Array.from(this.activeQueries.values());
    const predicateResults = await Promise.all(
      allOps.map(async (op) => ({
        op,
        matches: await predicate(op),
      })),
    );

    const ops = predicateResults
      .filter(({ matches }) => matches)
      .map(({ op }) => op);
    this.logger.debug(`Refreshing ${ops.length} matching queries`);
    for (const op of ops) {
      this.urql.reexecuteOperation(
        makeOperation(op.kind, op, {
          ...op.context,
          requestPolicy: 'network-only',
          batch: false, // never batch, run ASAP!
        }),
      );
    }
  }

  private exchanges(): Exchange[] {
    const exchanges: Exchange[] = [this.activeQueryRegistry()];

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

  private registerQuery(op: Operation): void {
    this.activeQueries.set(op.key, op);
    this.logger.debug(
      `Registered query: ${extractOperationName(op)} (key: ${op.key})`,
    );
  }

  private unregisterQuery(key: number): void {
    const op = this.activeQueries.get(key);
    if (op) {
      this.activeQueries.delete(key);
      this.logger.debug(
        `Unregistered query: ${extractOperationName(op)} (key: ${key})`,
      );
    }
  }

  private activeQueryRegistry(): Exchange {
    return ({ forward }) =>
      (ops$) =>
        pipe(
          ops$,
          tap((op: Operation) => {
            if (isActiveQueryOperation(op)) this.registerQuery(op);
            else if (isTeardownOperation(op)) this.unregisterQuery(op.key);
          }),
          forward,
        );
  }

  private resultFrom<TData, TVariables extends AnyVariables>(
    source: OperationResultSource<OperationResult<TData, TVariables>>,
  ): ResultAsync<OperationResult<TData, TVariables>, UnexpectedError> {
    return ResultAsync.fromPromise(source.toPromise(), (err: unknown) => {
      this.logger.error(err);
      return UnexpectedError.from(err);
    }).andThen((result) => {
      if (result.error?.networkError) {
        return errAsync(UnexpectedError.from(result.error.networkError));
      }
      return okAsync(result);
    });
  }
}
