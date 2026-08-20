import {
  type AaveClient,
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
} from '@aave/client';
import { submitOrder } from '@aave/client/actions';
import {
  type CancelError,
  type SigningError,
  UnexpectedError,
  ValidationError,
} from '@aave/core';
import type {
  ERC20PermitSignature,
  InsufficientBalanceError,
  InsufficientLiquidityError,
  LeverageApprovalsRequired,
  OrderApproval,
  OrderQuote,
  OrderReceipt,
  OrderStatus,
  OrderTransactionRequest,
  OrderTypedData,
  PositionSwapApproval,
  PositionSwapByIntentApprovalsRequired,
  PrepareOrderRequest,
  SubmitOrderBySignatureInput,
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

export function extractLeverageQuote(
  data: LeverageApprovalsRequired | InsufficientLiquidityError,
): Result<
  LeverageApprovalsRequired,
  ValidationError<InsufficientLiquidityError> | UnexpectedError
> {
  switch (data.__typename) {
    // Returned whole rather than narrowed to `.quote` so callers keep
    // `maxSafeMultiplier`, which a leverage UI needs to bound its input.
    case 'LeverageApprovalsRequired':
      return ok(data);
    case 'InsufficientLiquidityError':
      return err(ValidationError.fromGqlNode(data));
    default:
      return err(
        UnexpectedError.upgradeRequired(
          `Unsupported leverage quote result: ${(data as { __typename: string }).__typename}`,
        ),
      );
  }
}

export function isTerminalOrderStatus(data: OrderStatus): boolean {
  return (
    data.__typename === 'OrderFulfilled' ||
    data.__typename === 'OrderCancelled' ||
    data.__typename === 'OrderExpired'
  );
}

// ------------------------------------------------------------

export type OrderHandlerOptions = {
  cancel: CancelOperation;
};

export type OrderSignerError = CancelError | SigningError | UnexpectedError;

// ------------------------------------------------------------

export type OrderPlan =
  | OrderApproval
  | OrderTypedData
  | OrderTransactionRequest;

export type OrderHandler = (
  plan: OrderPlan,
  options: OrderHandlerOptions,
) => ResultAsync<PendingTransaction | Signature, OrderSignerError>;

export type OrderValue = {
  quote?: OrderQuote;
};

/**
 * Resolves a handler's approval outcome to the signature to record in the
 * {@link PrepareOrderRequest}: the signature itself for signature-based
 * approvals, or null for transaction-based approvals — after waiting for the
 * approval transaction to be mined, so the order isn't prepared against
 * on-chain state that doesn't exist yet.
 */
function resolveApprovalSignature(
  value: PendingTransaction | Signature,
): ResultAsync<Signature | null, PendingTransactionError> {
  if (isSignature(value)) {
    return okAsync(value);
  }
  return value.wait().map(() => null);
}

/**
 * Collects the signatures an order requires, in order, into a
 * {@link PrepareOrderRequest}.
 *
 * `permitSig` is threaded through rather than collected: the ERC-20 top-up
 * permit is client-built, so the server never returns an approval for it.
 */
export function processOrderApprovals(
  result: LeverageApprovalsRequired,
  permitSig: ERC20PermitSignature | null = null,
) {
  return {
    with: (
      handler: OrderHandler,
    ): ResultAsync<
      PrepareOrderRequest,
      OrderSignerError | PendingTransactionError
    > =>
      result.approvals.reduce<
        ResultAsync<
          PrepareOrderRequest,
          OrderSignerError | PendingTransactionError
        >
      >(
        (acc, approval) =>
          acc.andThen((request) =>
            handler(approval, { cancel })
              .andThen(resolveApprovalSignature)
              .map((signature) => {
                switch (approval.__typename) {
                  case 'OrderAdapterApproval':
                    request.adapterContractSignature = signature;
                    break;
                  case 'OrderPositionManagerApproval':
                    request.positionManagerSignature = signature;
                    break;
                  case 'OrderSetCollateralApproval':
                    request.setCollateralSignature = signature;
                    break;
                }
                return request;
              }),
          ),
        okAsync({
          quoteId: result.quote.quoteId,
          permitSig,
          adapterContractSignature: null,
          positionManagerSignature: null,
          setCollateralSignature: null,
        }),
      ),
  };
}

export type PositionOrderHandler = (
  plan: PositionSwapApproval | OrderTypedData | OrderTransactionRequest,
  options: OrderHandlerOptions,
) => ResultAsync<PendingTransaction | Signature, OrderSignerError>;

/**
 * Collects the signatures a position-swap order requires, in order, into a
 * {@link PrepareOrderRequest}.
 *
 * The position-swap counterpart of {@link processOrderApprovals}: the approvals
 * arrive as `PositionSwap*Approval` nodes and the order id comes from
 * `SwapQuote.orderQuoteId`, but they map onto the same three
 * `PrepareOrderRequest` signature fields the Order API consumes. Position swaps
 * carry no wallet top-up permit, so `permitSig` is always null.
 */
export function processPositionOrderApprovals(
  result: PositionSwapByIntentApprovalsRequired,
) {
  return {
    with: (
      handler: PositionOrderHandler,
    ): ResultAsync<
      PrepareOrderRequest,
      OrderSignerError | PendingTransactionError
    > =>
      result.approvals.reduce<
        ResultAsync<
          PrepareOrderRequest,
          OrderSignerError | PendingTransactionError
        >
      >(
        (acc, approval) =>
          acc.andThen((request) =>
            handler(approval, { cancel })
              .andThen(resolveApprovalSignature)
              .map((signature) => {
                switch (approval.__typename) {
                  case 'PositionSwapAdapterContractApproval':
                    request.adapterContractSignature = signature;
                    break;
                  case 'PositionSwapPositionManagerApproval':
                    request.positionManagerSignature = signature;
                    break;
                  case 'PositionSwapSetCollateralApproval':
                    request.setCollateralSignature = signature;
                    break;
                }
                return request;
              }),
          ),
        okAsync({
          quoteId: result.quote.orderQuoteId,
          permitSig: null,
          adapterContractSignature: null,
          positionManagerSignature: null,
          setCollateralSignature: null,
        }),
      ),
  };
}

export function submitOrderIntent(
  client: AaveClient,
  bySignature: SubmitOrderBySignatureInput,
  handler: (
    plan: OrderTransactionRequest,
    options: OrderHandlerOptions,
  ) => ResultAsync<PendingTransaction | Signature, OrderSignerError>,
): ResultAsync<
  OrderReceipt,
  | ValidationError<InsufficientBalanceError>
  | OrderSignerError
  | PendingTransactionError
  | UnexpectedError
> {
  return submitOrder(client, { bySignature }).andThen((plan) => {
    switch (plan.__typename) {
      case 'OrderReceipt':
        return okAsync(plan);
      // The server may answer an intent submission with a transaction to
      // send; the order is already registered, so the transaction must be
      // dispatched rather than dead-ending a fully signed flow.
      case 'OrderTransactionRequest':
        return handler(plan, { cancel })
          .andThen(PendingTransaction.tryFrom)
          .andThen((pendingTransaction) => pendingTransaction.wait())
          .map(() => plan.orderReceipt);
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
