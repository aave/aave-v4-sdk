import {
  SigningError,
  TransactionError,
  ValidationError,
} from '@aave/core-next';
import type {
  CancelSwapTypedData,
  InsufficientBalanceError,
  PermitTypedDataResponse,
  SwapByIntentTypedData,
  TransactionRequest,
} from '@aave/graphql-next';
import {
  errAsync,
  okAsync,
  ResultAsync,
  type Signature,
  signatureFrom,
  type TxHash,
  txHash,
} from '@aave/types-next';
import {
  defineChain,
  Engine,
  type ThirdwebClient,
  waitForReceipt,
} from 'thirdweb';
import type {
  ExecutionPlanHandler,
  PermitHandler,
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

/**
 * Creates an execution plan handler that sends transactions using the provided Thirdweb client and account.
 */
export function sendWith(client: ThirdwebClient): ExecutionPlanHandler {
  return (result) => {
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
  };
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

/**
 * Signs an ERC20 permit using the provided Thirdweb client and account.
 */
export function signERC20PermitWith(client: ThirdwebClient): PermitHandler {
  return (result: PermitTypedDataResponse) => {
    return ResultAsync.fromPromise(signTypedData(client, result), (err) =>
      SigningError.from(err),
    ).map((value) => ({
      deadline: result.message.deadline,
      value,
    }));
  };
}

/**
 * Signs swap typed data using the provided Thirdweb client.
 */
export function signSwapTypedDataWith(
  client: ThirdwebClient,
): SwapSignatureHandler {
  return (result: SwapByIntentTypedData | CancelSwapTypedData) => {
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
  };
}
