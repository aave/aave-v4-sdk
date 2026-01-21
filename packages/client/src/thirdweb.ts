import {
  SigningError,
  TransactionError,
  type UnexpectedError,
  ValidationError,
} from '@aave/core';
import type {
  Chain,
  ERC20PermitSignature,
  ExecutionPlan,
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
  ExecutionPlanHandler,
  SignTypedDataError,
  TransactionResult,
  TypedData,
  TypedDataHandler,
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
      return sendTransactionAndWait(
        aaveClient,
        thirdwebClient,
        result.approval.byTransaction,
      ).andThen(() =>
        sendTransactionAndWait(
          aaveClient,
          thirdwebClient,
          result.originalTransaction,
        ),
      );

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

/**
 * Handles ERC20 permit signing for actions that require token approval.
 *
 * Calls the action to get an initial execution plan. If the plan requires ERC20 approval
 * and the token supports permit signatures, signs the permit and re-calls the action
 * with the signature to get a new plan that can be sent directly.
 *
 * ```ts
 * const result = await permitWith(wallet, (permitSig) =>
 *   supply(client, {
 *     reserve: reserve.id,
 *     amount: { erc20: { value: amount, permitSig } },
 *     sender: evmAddress(wallet.address),
 *   })
 * )
 *   .andThen(sendWith(wallet))
 *   .andThen(client.waitForTransaction);
 * ```
 *
 * @param wallet - The Thirdweb server wallet for signing permits.
 * @param action - A function that returns an execution plan, accepting an optional permit signature.
 * @returns A ResultAsync containing the resolved ExecutionPlan ready to be sent with `sendWith`.
 */
export function permitWith<E>(
  wallet: Engine.ServerWallet,
  action: (permitSig?: ERC20PermitSignature) => ResultAsync<ExecutionPlan, E>,
): ResultAsync<ExecutionPlan, E | SignTypedDataError> {
  return action().andThen((result) => {
    if (
      result.__typename === 'Erc20ApprovalRequired' &&
      result.approval.bySignature
    ) {
      const permitTypedData = result.approval.bySignature;
      return signTypedDataWith(wallet, permitTypedData)
        .map((signature) => ({
          deadline: permitTypedData.message.deadline,
          value: signature,
        }))
        .andThen((permitSig) => action(permitSig));
    }
    return okAsync(result);
  });
}

function signTypedData(
  wallet: Engine.ServerWallet,
  data: TypedData,
): ResultAsync<Signature, SigningError> {
  return ResultAsync.fromPromise(
    wallet.signTypedData({
      types: data.types,
      domain: data.domain,
      primaryType: data.primaryType,
      message: data.message,
    }),
    (err) => SigningError.from(err),
  ).map(signatureFrom);
}

/**
 * Creates a function that signs EIP-712 typed data (ERC-20 permits, swap intents, etc.) using the provided Thirdweb wallet.
 *
 * @param wallet - The Thirdweb server wallet to use for signing.
 * @returns A function that takes typed data and returns a ResultAsync containing the raw signature.
 *
 * ```ts
 * const result = await prepareSwapCancel(client, request)
 *   .andThen(signTypedDataWith(wallet));
 * ```
 */
export function signTypedDataWith(
  wallet: Engine.ServerWallet,
): TypedDataHandler;

/**
 * Signs EIP-712 typed data (ERC-20 permits, swap intents, etc.) using the provided Thirdweb wallet.
 *
 * @param wallet - The Thirdweb server wallet to use for signing.
 * @param data - The typed data to sign.
 * @returns A ResultAsync containing the raw signature.
 *
 * ```ts
 * const result = await signTypedDataWith(wallet, typedData);
 * ```
 */
export function signTypedDataWith(
  wallet: Engine.ServerWallet,
  data: TypedData,
): ReturnType<TypedDataHandler>;

export function signTypedDataWith(
  wallet: Engine.ServerWallet,
  data?: TypedData,
): TypedDataHandler | ReturnType<TypedDataHandler> {
  if (data === undefined) {
    return (typedData: TypedData) => signTypedData(wallet, typedData);
  }
  return signTypedData(wallet, data);
}
