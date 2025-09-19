import {
  delay,
  GqlClient,
  type StandardData,
  TimeoutError,
  UnexpectedError,
} from '@aave/core-next';
import type { HasProcessedKnownTransactionRequest } from '@aave/graphql-next';
import {
  type AnyVariables,
  invariant,
  ResultAsync,
  type TxHash,
} from '@aave/types-next';
import type { TypedDocumentNode } from '@urql/core';
import { hasProcessedKnownTransaction } from './actions';
import { type ClientConfig, configureContext } from './config';
import {
  isHasProcessedKnownTransactionRequest,
  type TransactionResult,
} from './types';

export class AaveClient extends GqlClient {
  /**
   * Create a new instance of the {@link AaveClient}.
   *
   * ```ts
   * const client = AaveClient.create({
   *   environment: production,
   * });
   * ```
   *
   * @param options - The options to configure the client.
   * @returns The new instance of the client.
   */
  static create(options?: ClientConfig): AaveClient {
    return new AaveClient(configureContext(options ?? {}));
  }

  /**
   * Given the transaction hash of an Aave protocol transaction, wait for the transaction to be
   * processed by the Aave v4 API.
   *
   * Returns a {@link TimeoutError} if the transaction is not processed within the expected timeout period.
   *
   * @param result - The transaction execution result to wait for.
   * @returns The transaction hash or a TimeoutError
   */
  readonly waitForTransaction = (
    result: TransactionResult,
  ): ResultAsync<TxHash, TimeoutError | UnexpectedError> => {
    invariant(
      isHasProcessedKnownTransactionRequest(result),
      `Received a transaction result for an untracked operation. Make sure you're following the instructions in the docs.`,
    );

    return ResultAsync.fromPromise(
      this.pollTransactionStatus(result),
      (err) => {
        if (err instanceof TimeoutError || err instanceof UnexpectedError) {
          return err;
        }
        return UnexpectedError.from(err);
      },
    );
  };

  /**
   * @internal
   */
  async refreshQueryWhere<TValue, TVariables extends AnyVariables>(
    document: TypedDocumentNode<StandardData<TValue>, TVariables>,
    predicate: (
      variables: TVariables,
      data: TValue,
    ) => boolean | Promise<boolean>,
  ): Promise<void> {
    await this.refreshWhere(async (op) => {
      if (op.query === document) {
        const result = await this.query(
          document,
          op.variables as TVariables,
          'cache-only',
        );

        if (result.isErr()) {
          return false;
        }

        return predicate(op.variables as TVariables, result.value as TValue);
      }
      return false;
    });
  }

  protected async pollTransactionStatus(
    request: HasProcessedKnownTransactionRequest,
  ): Promise<TxHash> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < this.context.environment.indexingTimeout) {
      const processed = await hasProcessedKnownTransaction(this, request).match(
        (ok) => ok,
        (err) => {
          throw err;
        },
      );

      if (processed) {
        return request.txHash;
      }

      await delay(this.context.environment.pollingInterval);
    }
    throw TimeoutError.from(
      `Timeout waiting for transaction ${request.txHash} to be processed.`,
    );
  }
}
