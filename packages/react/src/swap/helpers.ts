import {
  type AaveClient,
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
} from '@aave/client';
import { swap } from '@aave/client/actions';
import {
  type CancelError,
  type SigningError,
  UnexpectedError,
  ValidationError,
} from '@aave/core';
import type {
  InsufficientBalanceError,
  InsufficientLiquidityError,
  PositionSwapApproval,
  PositionSwapByIntentApprovalsRequired,
  PreparePositionSwapRequest,
  SwapByIntentInput,
  SwapQuote,
  SwapReceipt,
  SwapStatus,
  SwapTypedData,
} from '@aave/graphql';
import type { Result, ResultAsync, Signature } from '@aave/types';
import { err, isSignature, ok, okAsync } from '@aave/types';

import {
  type CancelOperation,
  cancel,
  PendingTransaction,
  type PendingTransactionError,
  type SendTransactionError,
  trySignatureFrom,
} from '../helpers';
import { type UseAsyncTask, useAsyncTask } from '../helpers/tasks';

export function extractPositionSwapQuote(
  data: PositionSwapByIntentApprovalsRequired | InsufficientLiquidityError,
): Result<
  SwapQuote,
  ValidationError<InsufficientLiquidityError> | UnexpectedError
> {
  switch (data.__typename) {
    case 'PositionSwapByIntentApprovalsRequired':
      return ok(data.quote);
    case 'InsufficientLiquidityError':
      return err(ValidationError.fromGqlNode(data));
    default:
      return err(
        UnexpectedError.upgradeRequired(
          `Unsupported position swap quote result: ${(data as { __typename: string }).__typename}`,
        ),
      );
  }
}

export function isTerminalSwapStatus(data: SwapStatus): boolean {
  return (
    data.__typename === 'SwapFulfilled' ||
    data.__typename === 'SwapCancelled' ||
    data.__typename === 'SwapExpired'
  );
}

// ------------------------------------------------------------

export type SwapHandlerOptions = {
  cancel: CancelOperation;
};

export type SwapSignerError = CancelError | SigningError | UnexpectedError;

// ------------------------------------------------------------

export type PositionSwapPlan = PositionSwapApproval | SwapTypedData;

export type PositionSwapHandler = (
  plan: PositionSwapPlan,
  options: SwapHandlerOptions,
) => ResultAsync<PendingTransaction | Signature, SwapSignerError>;

export type PositionSwapValue = {
  quote?: SwapQuote;
};

export function processApprovals(
  result: PositionSwapByIntentApprovalsRequired,
) {
  return {
    with: (
      handler: PositionSwapHandler,
    ): ResultAsync<PreparePositionSwapRequest, SwapSignerError> =>
      result.approvals.reduce<
        ResultAsync<PreparePositionSwapRequest, SwapSignerError>
      >(
        (acc, approval) =>
          acc.andThen((request) =>
            handler(approval, { cancel }).map((value) => {
              switch (approval.__typename) {
                case 'PositionSwapAdapterContractApproval':
                  request.adapterContractSignature = isSignature(value)
                    ? value
                    : null;
                  break;
                case 'PositionSwapPositionManagerApproval':
                  request.positionManagerSignature = isSignature(value)
                    ? value
                    : null;
                  break;
              }
              return request;
            }),
          ),
        okAsync({
          quoteId: result.quote.quoteId,
          adapterContractSignature: null,
          positionManagerSignature: null,
        }),
      ),
  };
}

export function swapPosition(
  client: AaveClient,
  intent: SwapByIntentInput,
): ResultAsync<
  SwapReceipt,
  ValidationError<InsufficientBalanceError> | UnexpectedError
> {
  return swap(client, { intent }).andThen((plan) => {
    switch (plan.__typename) {
      case 'SwapReceipt':
        return okAsync(plan);
      default:
        return UnexpectedError.from(plan).asResultAsync();
    }
  });
}

export {
  cancel,
  DEFAULT_QUERY_OPTIONS,
  isSignature,
  okAsync,
  PendingTransaction,
  trySignatureFrom,
  useAsyncTask,
};
export type {
  CancelOperation,
  CurrencyQueryOptions,
  PendingTransactionError,
  SendTransactionError,
  UseAsyncTask,
};
