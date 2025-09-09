import {
  type AnyVariables,
  errAsync,
  invariant,
  okAsync,
  ResultAsync,
} from '@aave/types-next';
import {
  createClient,
  type Exchange,
  fetchExchange,
  makeOperation,
  type Operation,
  type OperationResult,
  type OperationResultSource,
  type TypedDocumentNode,
  type Client as UrqlClient,
} from '@urql/core';
import { pipe, tap } from 'wonka';
import { BatchQueryBuilder } from './batch';
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

export class GqlClient {
  /**
   * @internal
   */
  public readonly urql: UrqlClient;

  private readonly activeQueries = new Map<number, Operation>();

  private readonly logger: Logger;

  private readonly resolver: FragmentResolver;

  protected constructor(protected readonly context: Context) {
    this.resolver = FragmentResolver.from(context.fragments);
    this.logger = Logger.named(
      this.constructor.name,
      context.debug ? LogLevel.DEBUG : LogLevel.SILENT,
    );

    this.urql = createClient({
      url: context.environment.backend,
      fetchOptions: {
        credentials: 'omit',
        headers: context.headers,
      },
      exchanges: this.exchanges(),
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
  ): ResultAsync<TValue, UnexpectedError> {
    const query = this.resolver.replaceFrom(document);
    return this.resultFrom(this.urql.query(query, variables)).map(takeValue);
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

  /**
   * Execute a batch of GraphQL query operations.
   *
   * @param cb - The callback with the scoped client to execute the actions with.
   * @returns The results of all queries in the same order as they were added.
   */
  batch<T1, T2, E1 extends Error, E2 extends Error>(
    cb: (client: this) => [ResultAsync<T1, E1>, ResultAsync<T2, E2>],
  ): ResultAsync<[T1, T2], E1 | E2>;
  batch<T1, T2, T3, E1 extends Error, E2 extends Error, E3 extends Error>(
    cb: (
      client: this,
    ) => [ResultAsync<T1, E1>, ResultAsync<T2, E2>, ResultAsync<T3, E3>],
  ): ResultAsync<[T1, T2, T3], E1 | E2 | E3>;
  batch<
    T1,
    T2,
    T3,
    T4,
    E1 extends Error,
    E2 extends Error,
    E3 extends Error,
    E4 extends Error,
  >(
    cb: (
      client: this,
    ) => [
      ResultAsync<T1, E1>,
      ResultAsync<T2, E2>,
      ResultAsync<T3, E3>,
      ResultAsync<T4, E4>,
    ],
  ): ResultAsync<[T1, T2, T3, T4], E1 | E2 | E3 | E4>;
  batch<
    T1,
    T2,
    T3,
    T4,
    T5,
    E1 extends Error,
    E2 extends Error,
    E3 extends Error,
    E4 extends Error,
    E5 extends Error,
  >(
    cb: (
      client: this,
    ) => [
      ResultAsync<T1, E1>,
      ResultAsync<T2, E2>,
      ResultAsync<T3, E3>,
      ResultAsync<T4, E4>,
      ResultAsync<T5, E5>,
    ],
  ): ResultAsync<[T1, T2, T3, T4, T5], E1 | E2 | E3 | E4 | E5>;
  batch<
    T1,
    T2,
    T3,
    T4,
    T5,
    T6,
    E1 extends Error,
    E2 extends Error,
    E3 extends Error,
    E4 extends Error,
    E5 extends Error,
    E6 extends Error,
  >(
    cb: (
      client: this,
    ) => [
      ResultAsync<T1, E1>,
      ResultAsync<T2, E2>,
      ResultAsync<T3, E3>,
      ResultAsync<T4, E4>,
      ResultAsync<T5, E5>,
      ResultAsync<T6, E6>,
    ],
  ): ResultAsync<[T1, T2, T3, T4, T5, T6], E1 | E2 | E3 | E4 | E5 | E6>;
  batch<
    T1,
    T2,
    T3,
    T4,
    T5,
    T6,
    T7,
    E1 extends Error,
    E2 extends Error,
    E3 extends Error,
    E4 extends Error,
    E5 extends Error,
    E6 extends Error,
    E7 extends Error,
  >(
    cb: (
      client: this,
    ) => [
      ResultAsync<T1, E1>,
      ResultAsync<T2, E2>,
      ResultAsync<T3, E3>,
      ResultAsync<T4, E4>,
      ResultAsync<T5, E5>,
      ResultAsync<T6, E6>,
      ResultAsync<T7, E7>,
    ],
  ): ResultAsync<
    [T1, T2, T3, T4, T5, T6, T7],
    E1 | E2 | E3 | E4 | E5 | E6 | E7
  >;
  batch<
    T1,
    T2,
    T3,
    T4,
    T5,
    T6,
    T7,
    T8,
    E1 extends Error,
    E2 extends Error,
    E3 extends Error,
    E4 extends Error,
    E5 extends Error,
    E6 extends Error,
    E7 extends Error,
    E8 extends Error,
  >(
    cb: (
      client: this,
    ) => [
      ResultAsync<T1, E1>,
      ResultAsync<T2, E2>,
      ResultAsync<T3, E3>,
      ResultAsync<T4, E4>,
      ResultAsync<T5, E5>,
      ResultAsync<T6, E6>,
      ResultAsync<T7, E7>,
      ResultAsync<T8, E8>,
    ],
  ): ResultAsync<
    [T1, T2, T3, T4, T5, T6, T7, T8],
    E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8
  >;
  batch<
    T1,
    T2,
    T3,
    T4,
    T5,
    T6,
    T7,
    T8,
    T9,
    E1 extends Error,
    E2 extends Error,
    E3 extends Error,
    E4 extends Error,
    E5 extends Error,
    E6 extends Error,
    E7 extends Error,
    E8 extends Error,
    E9 extends Error,
  >(
    cb: (
      client: this,
    ) => [
      ResultAsync<T1, E1>,
      ResultAsync<T2, E2>,
      ResultAsync<T3, E3>,
      ResultAsync<T4, E4>,
      ResultAsync<T5, E5>,
      ResultAsync<T6, E6>,
      ResultAsync<T7, E7>,
      ResultAsync<T8, E8>,
      ResultAsync<T9, E9>,
    ],
  ): ResultAsync<
    [T1, T2, T3, T4, T5, T6, T7, T8, T9],
    E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9
  >;
  batch<
    T1,
    T2,
    T3,
    T4,
    T5,
    T6,
    T7,
    T8,
    T9,
    T10,
    E1 extends Error,
    E2 extends Error,
    E3 extends Error,
    E4 extends Error,
    E5 extends Error,
    E6 extends Error,
    E7 extends Error,
    E8 extends Error,
    E9 extends Error,
    E10 extends Error,
  >(
    cb: (
      client: this,
    ) => [
      ResultAsync<T1, E1>,
      ResultAsync<T2, E2>,
      ResultAsync<T3, E3>,
      ResultAsync<T4, E4>,
      ResultAsync<T5, E5>,
      ResultAsync<T6, E6>,
      ResultAsync<T7, E7>,
      ResultAsync<T8, E8>,
      ResultAsync<T9, E9>,
      ResultAsync<T10, E10>,
    ],
  ): ResultAsync<
    [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10],
    E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10
  >;
  batch<T, E extends Error>(
    cb: (client: this) => ResultAsync<T, E>[],
  ): ResultAsync<T[], E>;
  batch(
    cb: (client: this) => ResultAsync<unknown[], unknown>[],
  ): ResultAsync<unknown[], unknown> {
    const builder = new BatchQueryBuilder();

    const client: this = Object.create(this, {
      query: {
        value: builder.addQuery,
      },
    });

    const combined = ResultAsync.combine(cb(client));
    const [document, variables] = builder.build();

    const query = this.resolver.replaceFrom(document);

    return this.resultFrom(this.urql.query(query, variables))
      .andTee(({ data, error }) => {
        invariant(data, `Expected a value, got: ${error?.message}`);
        builder.resolve(data);
      })
      .andThen(() => combined);
  }

  protected refreshAll(): void {
    const ops = Array.from(this.activeQueries.values());
    this.logger.debug(`Refreshing ${ops.length} active queries`);
    for (const op of ops) {
      this.urql.reexecuteOperation(
        makeOperation(op.kind, op, {
          ...op.context,
          requestPolicy: 'network-only',
        }),
      );
    }
  }

  protected refreshByDocument(document: TypedDocumentNode): void {
    this.refreshWhere((op) => op.query === document);
  }

  protected refreshWhere(predicate: (op: Operation) => boolean): void {
    const ops = Array.from(this.activeQueries.values()).filter(predicate);
    this.logger.debug(`Refreshing ${ops.length} matching queries`);
    for (const op of ops) {
      this.urql.reexecuteOperation(
        makeOperation(op.kind, op, {
          ...op.context,
          requestPolicy: 'network-only',
        }),
      );
    }
  }

  private exchanges(): Exchange[] {
    const exchanges: Exchange[] = [this.activeQueryRegistry()];

    if (this.context.cache) {
      exchanges.push(this.context.cache);
    }

    exchanges.push(fetchExchange);
    return exchanges;
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
