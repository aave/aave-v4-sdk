import {
  CancelError,
  SigningError,
  TransactionError,
  UnexpectedError,
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
  type ChainId,
  chainId,
  errAsync,
  invariant,
  okAsync,
  ResultAsync,
  signatureFrom,
  type TxHash,
  txHash,
} from '@aave/types-next';
import {
  type Chain,
  type defineChain,
  TransactionExecutionError,
  type TypedData,
  type TypedDataDomain,
  UserRejectedRequestError,
  type WalletClient,
} from 'viem';
import {
  sendTransaction as sendEip1559Transaction,
  signTypedData,
  waitForTransactionReceipt,
} from 'viem/actions';
import { mainnet } from 'viem/chains';
import type {
  ExecutionPlanHandler,
  PermitHandler,
  SwapSignatureHandler,
  TransactionResult,
} from './types';

/**
 * @internal
 */
export const supportedChains: Record<
  ChainId,
  ReturnType<typeof defineChain>
> = {
  [chainId(mainnet.id)]: mainnet,
};

/**
 * @internal
 */
export function sendTransaction(
  walletClient: WalletClient,
  request: TransactionRequest,
): ResultAsync<TxHash, CancelError | SigningError> {
  // TODO: verify it's on the correct chain, ask to switch if possible
  // TODO: verify if wallet account is correct, switch if possible

  return ResultAsync.fromPromise(
    sendEip1559Transaction(walletClient, {
      account: request.from,
      data: request.data,
      to: request.to,
      value: BigInt(request.value),
      chain: walletClient.chain,
    }),
    (err) => {
      if (err instanceof TransactionExecutionError) {
        const rejected = err.walk(
          (err) => err instanceof UserRejectedRequestError,
        );

        if (rejected) {
          return CancelError.from(rejected);
        }
      }
      return SigningError.from(err);
    },
  ).map(txHash);
}

/**
 * @internal
 */
export function transactionError(
  chain: Chain | undefined,
  txHash: TxHash,
  request: TransactionRequest,
): TransactionError {
  const baseUrl = chain?.blockExplorers?.default?.url;
  const link = baseUrl && `${baseUrl.replace(/\/+$/, '')}/tx/${txHash}`;

  return TransactionError.new({ txHash, request, link });
}

/**
 * @internal
 */
export function waitForTransactionResult(
  walletClient: WalletClient,
  request: TransactionRequest,
  initialTxHash: TxHash,
): ResultAsync<
  TransactionResult,
  CancelError | TransactionError | UnexpectedError
> {
  return ResultAsync.fromPromise(
    waitForTransactionReceipt(walletClient, {
      hash: initialTxHash,
      pollingInterval: 100,
      retryCount: 20,
      retryDelay: 50,
    }),
    (err) => UnexpectedError.from(err),
  ).andThen((receipt) => {
    const hash = txHash(receipt.transactionHash);

    switch (receipt.status) {
      case 'reverted':
        if (initialTxHash !== hash) {
          return errAsync(CancelError.from(`Transaction replaced by ${hash}`));
        }
        return errAsync(transactionError(walletClient.chain, hash, request));
      case 'success':
        return okAsync({
          // viem's waitForTransactionReceipt supports transaction replacement
          // so it's important to use the transaction hash from the receipt
          txHash: hash,
          operations: request.operations,
        });
    }
  });
}

function sendTransactionAndWait(
  walletClient: WalletClient,
  request: TransactionRequest,
): ResultAsync<
  TransactionResult,
  CancelError | SigningError | TransactionError | UnexpectedError
> {
  return sendTransaction(walletClient, request).andThen((hash) =>
    waitForTransactionResult(walletClient, request, hash),
  );
}

/**
 * Creates a transaction handler that sends transactions using the provided wallet client.
 *
 * The handler handles {@link TransactionRequest} by signing and sending, {@link ApprovalRequired} by sending both approval and original transactions, and returns validation errors for {@link InsufficientBalanceError}.
 */
export function sendWith(walletClient: WalletClient): ExecutionPlanHandler {
  return (result) => {
    switch (result.__typename) {
      case 'TransactionRequest':
        return sendTransactionAndWait(walletClient, result);

      case 'Erc20ApprovalRequired':
      case 'PreContractActionRequired':
        return sendTransactionAndWait(walletClient, result.transaction).andThen(
          () =>
            sendTransactionAndWait(walletClient, result.originalTransaction),
        );

      case 'InsufficientBalanceError':
        return errAsync(ValidationError.fromGqlNode(result));
    }
  };
}

/**
 * Signs an ERC20 permit using the provided wallet client.
 */
export function signERC20PermitWith(walletClient: WalletClient): PermitHandler {
  return (result: PermitTypedDataResponse) => {
    invariant(walletClient.account, 'Wallet account is required');

    return ResultAsync.fromPromise(
      signTypedData(walletClient, {
        account: walletClient.account,
        domain: result.domain as TypedDataDomain,
        types: result.types as TypedData,
        primaryType: result.primaryType as keyof typeof result.types,
        message: result.message,
      }),
      (err) => SigningError.from(err),
    ).map((hex) => ({
      deadline: result.message.deadline,
      value: signatureFrom(hex),
    }));
  };
}

/**
 * Signs swap typed data using the provided wallet client.
 */
export function signSwapTypedDataWith(
  walletClient: WalletClient,
): SwapSignatureHandler {
  return (result: SwapByIntentTypedData | CancelSwapTypedData) => {
    invariant(walletClient.account, 'Wallet account is required');

    return ResultAsync.fromPromise(
      signTypedData(walletClient, {
        account: walletClient.account,
        domain: result.domain as TypedDataDomain,
        types: result.types as TypedData,
        primaryType: result.primaryType,
        message: JSON.parse(result.message),
      }),
      (err) => SigningError.from(err),
    ).map((hex) => ({
      deadline: JSON.parse(result.message).deadline,
      value: signatureFrom(hex),
    }));
  };
}
