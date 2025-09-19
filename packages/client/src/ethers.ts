import {
  SigningError,
  TransactionError,
  UnexpectedError,
  ValidationError,
} from '@aave/core-next';
import type {
  InsufficientBalanceError,
  PermitTypedDataResponse,
  TransactionRequest,
} from '@aave/graphql-next';
import {
  errAsync,
  nonNullable,
  okAsync,
  ResultAsync,
  signatureFrom,
  txHash,
} from '@aave/types-next';
import type { Signer, TransactionResponse } from 'ethers';
import type {
  ExecutionPlanHandler,
  PermitHandler,
  TransactionResult,
} from './types';

/**
 * @internal
 */
export function sendTransaction(
  signer: Signer,
  request: TransactionRequest,
): ResultAsync<TransactionResponse, SigningError> {
  return ResultAsync.fromPromise(
    signer.sendTransaction({
      to: request.to,
      data: request.data,
      value: request.value,
      from: request.from,
    }),
    (err) => SigningError.from(err),
  );
}

/**
 * @internal
 */
export function waitForTransactionResult(
  request: TransactionRequest,
  response: TransactionResponse,
): ResultAsync<TransactionResult, TransactionError | UnexpectedError> {
  return ResultAsync.fromPromise(response.wait(), (err) =>
    UnexpectedError.from(err),
  ).andThen((receipt) => {
    const hash = txHash(nonNullable(receipt?.hash));

    if (receipt?.status === 0) {
      return errAsync(
        TransactionError.new({
          txHash: hash,
          request,
        }),
      );
    }
    return okAsync({
      txHash: hash,
      operations: request.operations, // TODO: check if this is correct
    });
  });
}

function sendTransactionAndWait(
  signer: Signer,
  request: TransactionRequest,
): ResultAsync<
  TransactionResult,
  SigningError | TransactionError | UnexpectedError
> {
  return sendTransaction(signer, request).andThen((tx) =>
    waitForTransactionResult(request, tx),
  );
}

/**
 * Creates a transaction handler that sends transactions using the provided ethers signer.
 *
 * The handler handles {@link TransactionRequest} by signing and sending, {@link ApprovalRequired} by sending both approval and original transactions, and returns validation errors for {@link InsufficientBalanceError}.
 */
export function sendWith(signer: Signer): ExecutionPlanHandler {
  return (result) => {
    switch (result.__typename) {
      case 'TransactionRequest':
        return sendTransactionAndWait(signer, result);

      case 'ApprovalRequired':
        return sendTransactionAndWait(signer, result.approval).andThen(() =>
          sendTransactionAndWait(signer, result.originalTransaction),
        );

      case 'InsufficientBalanceError':
        return errAsync(ValidationError.fromGqlNode(result));
    }
  };
}

/**
 * Signs an ERC20 permit using the provided ethers signer.
 */
export function signERC20PermitWith(signer: Signer): PermitHandler {
  return (result: PermitTypedDataResponse) => {
    return ResultAsync.fromPromise(
      signer.signTypedData(result.domain, result.types, result.message),
      (err) => SigningError.from(err),
    ).map((signature) => ({
      deadline: result.message.deadline,
      value: signatureFrom(signature),
    }));
  };
}
