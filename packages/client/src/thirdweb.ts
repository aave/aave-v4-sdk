import {
  SigningError,
  TransactionError,
  type UnexpectedError,
  ValidationError,
} from '@aave/core';
import type {
  Chain,
  ExecutionPlan,
  PermitTypedDataResponse,
  SwapTypedData,
  TransactionRequest,
} from '@aave/graphql';
import {
  type ChainId,
  chainId,
  errAsync,
  invariant,
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
  type Chain as ThirdwebChain,
  type ThirdwebClient,
  waitForReceipt,
} from 'thirdweb';
import { mainnet, sepolia } from 'thirdweb/chains';
import type { AaveClient } from './AaveClient';
import { chain as fetchChain } from './actions';
import type {
  ERC20PermitHandler,
  ExecutionPlanHandler,
  SwapSignatureHandler,
  TransactionResult,
} from './types';

/**
 * @internal
 */
export function toThirdwebChain(chain: Chain): ThirdwebChain {
  // known chains
  switch (chain.chainId) {
    case chainId(mainnet.id):
      return mainnet;

    case chainId(sepolia.id):
      return sepolia;
  }

  // most likely a tenderly fork
  return defineChain({
    id: chain.chainId,
    name: chain.name,
    nativeCurrency: {
      name: chain.nativeInfo.name,
      symbol: chain.nativeInfo.symbol,
      decimals: chain.nativeInfo.decimals,
    },
    rpcUrls: { default: { http: [chain.rpcUrl] } },
    blockExplorers: {
      default: {
        name: `${chain.name} Explorer`,
        url: chain.explorerUrl,
      },
    },
  });
}

function fetchThirdwebChain(
  client: AaveClient,
  id: ChainId,
): ResultAsync<ThirdwebChain, UnexpectedError> {
  switch (id) {
    case chainId(mainnet.id):
      return okAsync(mainnet);
    case chainId(sepolia.id):
      return okAsync(sepolia);
  }

  return fetchChain(client, { chainId: id }, { batch: false }).andThen(
    (chain) => {
      invariant(chain, `Chain ${id} is not supported`);
      return okAsync(toThirdwebChain(chain));
    },
  );
}

async function sendTransaction(
  thirdwebClient: ThirdwebClient,
  chain: ThirdwebChain,
  request: TransactionRequest,
): Promise<TxHash> {
  const wallet = Engine.serverWallet({
    client: thirdwebClient,
    chain,
    address: request.from,
  });

  const txResponse = await wallet.sendTransaction({
    type: 'eip1559',
    chainId: chain.id,
    to: request.to,
    value: BigInt(request.value),
    data: request.data,
  });
  return txHash(txResponse.transactionHash);
}

function sendTransactionAndWait(
  aaveClient: AaveClient,
  thirdwebClient: ThirdwebClient,
  request: TransactionRequest,
): ResultAsync<
  TransactionResult,
  SigningError | TransactionError | UnexpectedError
> {
  return fetchThirdwebChain(aaveClient, request.chainId).andThen((chain) => {
    return ResultAsync.fromPromise(
      sendTransaction(thirdwebClient, chain, request),
      (err) => SigningError.from(err),
    )
      .map(async (hash) =>
        waitForReceipt({
          client: thirdwebClient,
          chain,
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
  });
}

function executePlan(
  aaveClient: AaveClient,
  thirdwebClient: ThirdwebClient,
  result: ExecutionPlan,
): ReturnType<ExecutionPlanHandler> {
  switch (result.__typename) {
    case 'TransactionRequest':
      return sendTransactionAndWait(aaveClient, thirdwebClient, result);

    case 'Erc20ApprovalRequired':
    case 'PreContractActionRequired':
      return sendTransactionAndWait(
        aaveClient,
        thirdwebClient,
        result.transaction,
      ).andThen(() =>
        sendTransactionAndWait(
          aaveClient,
          thirdwebClient,
          result.originalTransaction,
        ),
      );

    case 'InsufficientBalanceError':
      return errAsync(ValidationError.fromGqlNode(result));
  }
}

/**
 * Creates an execution plan handler that sends transactions using the provided Thirdweb client and account.
 */
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  aaveClient: AaveClient,
  thirdwebClient: ThirdwebClient,
): ExecutionPlanHandler<T>;
/**
 * Sends execution plan transactions using the provided Thirdweb client.
 */
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  aaveClient: AaveClient,
  thirdwebClient: ThirdwebClient,
  result: T,
): ReturnType<ExecutionPlanHandler<T>>;
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  aaveClient: AaveClient,
  thirdwebClient: ThirdwebClient,
  result?: T,
): ExecutionPlanHandler<T> | ReturnType<ExecutionPlanHandler<T>> {
  return result
    ? executePlan(aaveClient, thirdwebClient, result)
    : executePlan.bind(null, aaveClient, thirdwebClient);
}

async function signTypedData(
  wallet: Engine.ServerWallet,
  result: PermitTypedDataResponse,
): Promise<Signature> {
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
 * Creates an ERC20 permit handler that signs ERC20 permits using the provided Thirdweb client and account.
 */
export function signERC20PermitWith(
  wallet: Engine.ServerWallet,
): ERC20PermitHandler {
  return function signERC20Permit(
    result: PermitTypedDataResponse,
  ): ReturnType<ERC20PermitHandler> {
    return ResultAsync.fromPromise(signTypedData(wallet, result), (err) =>
      SigningError.from(err),
    ).map((value) => ({
      deadline: result.message.deadline,
      value,
    }));
  };
}

function signSwapTypedData(
  wallet: Engine.ServerWallet,
  result: SwapTypedData,
): ReturnType<SwapSignatureHandler> {
  const signTypedDataPromise = async (): Promise<Signature> => {
    const signature = await wallet.signTypedData({
      // silence the rest of the type inference
      types: result.types as Record<string, unknown>,
      domain: result.domain,
      primaryType: result.primaryType,
      message: result.message,
    });

    return signatureFrom(signature);
  };

  return ResultAsync.fromPromise(signTypedDataPromise(), (err) =>
    SigningError.from(err),
  ).map(signatureFrom);
}

/**
 * Creates a swap signature handler that signs swap typed data using the provided Thirdweb client.
 */
export function signSwapTypedDataWith(
  wallet: Engine.ServerWallet,
): SwapSignatureHandler;
/**
 * Signs swap typed data using the provided Thirdweb client.
 */
export function signSwapTypedDataWith(
  wallet: Engine.ServerWallet,
  result: SwapTypedData,
): ReturnType<SwapSignatureHandler>;
export function signSwapTypedDataWith(
  wallet: Engine.ServerWallet,
  result?: SwapTypedData,
): SwapSignatureHandler | ReturnType<SwapSignatureHandler> {
  return result
    ? signSwapTypedData(wallet, result)
    : signSwapTypedData.bind(null, wallet);
}
