import {
  cancelSwap,
  prepareSwapCancel,
  swapStatus,
} from '@aave/client/actions';
import {
  type CancelError,
  type SigningError,
  type TimeoutError,
  type TransactionError,
  UnexpectedError,
} from '@aave/core';
import type {
  PrepareSwapCancelRequest,
  SwapCancelled,
  SwapCancelledResult,
  SwapTypedData,
  TransactionRequest,
} from '@aave/graphql';
import type { ResultAsync, Signature } from '@aave/types';
import { ResultAwareError } from '@aave/types';

import { useAaveClient } from '../context';

import {
  cancel,
  okAsync,
  PendingTransaction,
  type SwapSignerError,
  trySignatureFrom,
  type UseAsyncTask,
  useAsyncTask,
} from './helpers';

function toSwapCancelledResult(cancelled: SwapCancelled): SwapCancelledResult {
  return {
    __typename: 'SwapCancelledResult',
    swapId: cancelled.swapId,
    createdAt: cancelled.createdAt,
    cancelledAt: cancelled.cancelledAt,
    explorerUrl: cancelled.explorerUrl,
  };
}

export type CancelSwapHandler = (
  data: SwapTypedData | TransactionRequest,
  options: { cancel: typeof cancel },
) => ResultAsync<PendingTransaction | Signature, SwapSignerError>;

export class CannotCancelSwapError extends ResultAwareError {
  name = 'CannotCancelSwapError' as const;
}

export type CancelSwapError =
  | CancelError
  | CannotCancelSwapError
  | SigningError
  | TimeoutError
  | TransactionError
  | UnexpectedError;

/**
 * Executes the complete swap cancellation workflow combining preparation and execution.
 *
 * ```tsx
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [signTypedData] = useSignTypedData(wallet);
 *
 * const [cancelSwap, { loading, error }] = useCancelSwap((plan) => {
 *   switch (plan.__typename) {
 *     case 'TransactionRequest':
 *       return sendTransaction(plan);
 *
 *     case 'SwapTypedData':
 *       return signTypedData(plan);
 *   }
 * });
 *
 * const result = await cancelSwap({
 *   id: swapId('123…'),
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * // result.value: SwapCancelledResult
 * console.log('Swap cancelled:', result.value);
 * ```
 */
export function useCancelSwap(
  handler: CancelSwapHandler,
): UseAsyncTask<
  PrepareSwapCancelRequest,
  SwapCancelledResult,
  CancelSwapError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request) =>
      swapStatus(client, { id: request.id }).andThen((status) => {
        if (status === null) {
          return UnexpectedError.from('Swap not found').asResultAsync();
        }

        switch (status.__typename) {
          case 'SwapOpen':
          case 'SwapPendingSignature':
            return prepareSwapCancel(client, request)
              .andThen((result) => handler(result.data, { cancel }))
              .andThen(trySignatureFrom)
              .andThen((signature) =>
                cancelSwap(client, {
                  intent: { id: request.id, signature },
                }),
              )
              .andThen((plan) => {
                if (plan.__typename === 'SwapCancelledResult') {
                  return okAsync(plan);
                }

                return (
                  handler(plan, { cancel })
                    .andThen(PendingTransaction.tryFrom)
                    .andThen((pendingTransaction) => pendingTransaction.wait())
                    // TODO: verify that if fails cause too early, we need to waitForSwapOutcome(client)({ id: request.id })
                    .andThen(() => swapStatus(client, { id: request.id }))
                    .andThen((status) => {
                      if (status?.__typename === 'SwapCancelled') {
                        return okAsync(toSwapCancelledResult(status));
                      }
                      return new CannotCancelSwapError(
                        'Failed to cancel swap',
                      ).asResultAsync();
                    })
                );
              });

          case 'SwapCancelled':
            return okAsync(toSwapCancelledResult(status));

          case 'SwapExpired':
            return new CannotCancelSwapError(
              'Swap cannot longer be cancelled',
            ).asResultAsync();

          default:
            return UnexpectedError.upgradeRequired(
              `Unsupported swap status: ${status.__typename}`,
            ).asResultAsync();
        }
      }),
    [client, handler],
  );
}
