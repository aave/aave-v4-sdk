import { SigningError, TransactionError, ValidationError } from '@aave/core';
import type {
  CancelSwapTypedData,
  ExecutionPlan,
  PermitTypedDataResponse,
  SwapByIntentTypedData,
  TransactionRequest,
} from '@aave/graphql';
import {
  errAsync,
  okAsync,
  ResultAsync,
  type Signature,
  signatureFrom,
  type TxHash,
  txHash,
} from '@aave/types';
import {
  defineChain,
  Engine,
  type ThirdwebClient,
  waitForReceipt,
} from 'thirdweb';
import type {
  ERC20PermitHandler,
  ExecutionPlanHandler,
  SwapSignatureHandler,
  TransactionResult,
} from './types';

async function sendTransaction(
  wallet: Engine.ServerWallet,
  request: TransactionRequest,
): Promise<TxHash> {
  const txResponse = await wallet.sendTransaction({
    type: 'eip1559',
    chainId: request.chainId,
    to: request.to,
    value: BigInt(request.value),
    data: request.data,
  });
  return txHash(txResponse.transactionHash);
}

function sendTransactionAndWait(
  client: ThirdwebClient,
  request: TransactionRequest,
): ResultAsync<TransactionResult, SigningError | TransactionError> {
  const wallet = Engine.serverWallet({
    client,
    address: request.from,
  });

  return ResultAsync.fromPromise(sendTransaction(wallet, request), (err) =>
    SigningError.from(err),
  )
    .map(async (hash) =>
      waitForReceipt({
        client,
        chain: {
          id: request.chainId,
          rpc: `https://${request.chainId}.rpc.thirdweb.com/${client.clientId}`,
        },
        transactionHash: hash,
      }),
    )
    .andThen((receipt) => {
      const hash = txHash(receipt.transactionHash);

      if (receipt.status === 'reverted') {
        return errAsync(
          TransactionError.new({
            txHash: hash,
            request,
          }),
        );
      }
      return okAsync({
        txHash: hash,
        operations: request.operations,
      });
    });
}

function executePlan(
  client: ThirdwebClient,
  result: ExecutionPlan,
): ReturnType<ExecutionPlanHandler> {
  switch (result.__typename) {
    case 'TransactionRequest':
      return sendTransactionAndWait(client, result);

    case 'Erc20ApprovalRequired':
    case 'PreContractActionRequired':
      return sendTransactionAndWait(client, result.transaction).andThen(() =>
        sendTransactionAndWait(client, result.originalTransaction),
      );

    case 'InsufficientBalanceError':
      return errAsync(ValidationError.fromGqlNode(result));
  }
}

/**
 * Creates an execution plan handler that sends transactions using the provided Thirdweb client and account.
 */
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  client: ThirdwebClient,
): ExecutionPlanHandler<T>;
/**
 * Sends execution plan transactions using the provided Thirdweb client.
 */
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  client: ThirdwebClient,
  result: T,
): ReturnType<ExecutionPlanHandler<T>>;
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  client: ThirdwebClient,
  result?: T,
): ExecutionPlanHandler<T> | ReturnType<ExecutionPlanHandler<T>> {
  return result ? executePlan(client, result) : executePlan.bind(null, client);
}

async function signTypedData(
  client: ThirdwebClient,
  result: PermitTypedDataResponse,
): Promise<Signature> {
  const wallet = Engine.serverWallet({
    client,
    chain: defineChain({ id: result.domain.chainId }),
    address: result.message.owner,
  });

  const signature = await wallet.signTypedData({
    // silence the rest of the type inference
    types: result.types as Record<string, unknown>,
    domain: result.domain,
    primaryType: result.primaryType,
    message: result.message,
  });

  return signatureFrom(signature);
}

function signERC20Permit(
  client: ThirdwebClient,
  result: PermitTypedDataResponse,
): ReturnType<ERC20PermitHandler> {
  return ResultAsync.fromPromise(signTypedData(client, result), (err) =>
    SigningError.from(err),
  ).map((value) => ({
    deadline: result.message.deadline,
    value,
  }));
}

/**
 * Creates an ERC20 permit handler that signs ERC20 permits using the provided Thirdweb client and account.
 */
export function signERC20PermitWith(
  client: ThirdwebClient,
): ERC20PermitHandler {
  return signERC20Permit.bind(null, client);
}

function signSwapTypedData(
  client: ThirdwebClient,
  result: SwapByIntentTypedData | CancelSwapTypedData,
): ReturnType<SwapSignatureHandler> {
  const message = JSON.parse(result.message);

  const signTypedDataPromise = async (): Promise<Signature> => {
    const wallet = Engine.serverWallet({
      client,
      chain: defineChain({ id: result.domain.chainId }),
      address: message.user,
    });

    const signature = await wallet.signTypedData({
      // silence the rest of the type inference
      types: result.types as Record<string, unknown>,
      domain: result.domain,
      primaryType: result.primaryType,
      message,
    });

    return signatureFrom(signature);
  };

  return ResultAsync.fromPromise(signTypedDataPromise(), (err) =>
    SigningError.from(err),
  ).map((value) => ({
    deadline: message.deadline,
    value,
  }));
}

/**
 * @internal
 * Creates a swap signature handler that signs swap typed data using the provided Thirdweb client.
 */
export function signSwapTypedDataWith(
  client: ThirdwebClient,
): SwapSignatureHandler;
/**
 * @internal
 * Signs swap typed data using the provided Thirdweb client.
 */
export function signSwapTypedDataWith(
  client: ThirdwebClient,
  result: SwapByIntentTypedData | CancelSwapTypedData,
): ReturnType<SwapSignatureHandler>;
export function signSwapTypedDataWith(
  client: ThirdwebClient,
  result?: SwapByIntentTypedData | CancelSwapTypedData,
): SwapSignatureHandler | ReturnType<SwapSignatureHandler> {
  return result
    ? signSwapTypedData(client, result)
    : signSwapTypedData.bind(null, client);
}
