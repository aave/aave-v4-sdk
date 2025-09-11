import {
  delay,
  GqlClient,
  TimeoutError,
  UnexpectedError,
} from '@aave/core-next';
import type {
  HasProcessedKnownTransactionRequest,
  SwapCancelled,
  SwapExpired,
  SwapFulfilled,
  SwapReceipt,
} from '@aave/graphql-next';
import {
  type AnyVariables,
  invariant,
  okAsync,
  ResultAsync,
  type TxHash,
} from '@aave/types-next';
import type { TypedDocumentNode } from '@urql/core';
import { hasProcessedKnownTransaction, swapStatus } from './actions';
import { type ClientConfig, configureContext } from './config';
import {
  isHasProcessedKnownTransactionRequest,
  type TransactionExecutionResult,
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
   * @internal
   */
  readonly waitForSupportedTransaction = (
    result: TransactionExecutionResult,
  ): ResultAsync<TxHash, TimeoutError | UnexpectedError> => {
    if (isHasProcessedKnownTransactionRequest(result)) {
      return this.waitForTransaction(result);
    }
    return okAsync(result.txHash);
  };

  /**
   * Waits for a swap to reach a final outcome (cancelled, expired, or fulfilled).
   *
   * ```ts
   * const result = await client.waitForSwapOutcome(receipt);
   *
   * if (result.isErr()) {
   *   console.error(result.error);
   *   return;
   * }
   *
   * switch (result.value.__typename) {
   *   case 'SwapCancelled':
   *     console.log('Swap was cancelled');
   *     break;
   *   case 'SwapExpired':
   *     console.log('Swap expired');
   *     break;
   *   case 'SwapFulfilled':
   *     console.log('Swap fulfilled:', result.value.txHash);
   *     break;
   * }
   * ```
   *
   * @param receipt - The swap receipt to wait for.
   * @returns The swap outcome or a TimeoutError
   */
  readonly waitForSwapOutcome = (
    receipt: SwapReceipt,
  ): ResultAsync<
    SwapCancelled | SwapExpired | SwapFulfilled,
    TimeoutError | UnexpectedError
  > => {
    return ResultAsync.fromPromise(this.pollSwapStatus(receipt), (err) => {
      if (err instanceof TimeoutError || err instanceof UnexpectedError) {
        return err;
      }
      return UnexpectedError.from(err);
    });
  };

  /**
   * Given the transaction hash of an Aave protocol transaction, wait for the transaction to be
   * processed by the Aave v3 API.
   *
   * Returns a {@link TimeoutError} if the transaction is not processed within the expected timeout period.
   *
   * @param result - The transaction execution result to wait for.
   * @returns The transaction hash or a TimeoutError
   */
  readonly waitForTransaction = (
    result: TransactionExecutionResult,
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
  refreshQueryWhere<TVariables extends AnyVariables>(
    document: TypedDocumentNode<unknown, TVariables>,
    predicate: (variables: TVariables) => boolean,
  ): void {
    this.refreshWhere(
      (op) => op.query === document && predicate(op.variables as TVariables),
    );
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

  protected async pollSwapStatus(
    receipt: SwapReceipt,
  ): Promise<SwapCancelled | SwapExpired | SwapFulfilled> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < this.context.environment.indexingTimeout) {
      const status = await swapStatus(this, { id: receipt.id }).match(
        (ok) => ok,
        (err) => {
          throw err;
        },
      );

      switch (status.__typename) {
        case 'SwapCancelled':
        case 'SwapExpired':
        case 'SwapFulfilled':
          return status;

        default:
          await delay(this.context.environment.pollingInterval);
          continue;
      }
    }
    throw TimeoutError.from(
      `Timeout waiting for swap ${receipt.id} to reach final outcome.`,
    );
  }
}
