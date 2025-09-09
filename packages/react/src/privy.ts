import { SigningError, UnexpectedError } from '@aave/client-next';
import { permitTypedData } from '@aave/client-next/actions';
import {
  sendTransactionAndWait,
  supportedChains,
} from '@aave/client-next/viem';
import type {
  ERC712Signature,
  PermitTypedDataRequest,
  TransactionRequest,
} from '@aave/graphql-next';
import { invariant, ResultAsync, signatureFrom } from '@aave/types-next';
import { useSignTypedData, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom } from 'viem';
import { useAaveClient } from './context';
import {
  type UseAsyncTask,
  type UseSendTransactionResult,
  useAsyncTask,
} from './helpers';

/**
 * A hook that provides a way to send Aave transactions using a Privy wallet.
 *
 * First, use the `useSendTransaction` hook from `@aave/react/privy` entry point.
 *
 * ```ts
 * const [sendTransaction, { loading, error, data }] = useSendTransaction();
 * ```
 *
 * Then, use it to send a {@link TransactionRequest} as shown below.
 *
 * ```ts
 * const account = useAccount(); // wagmi hook
 *
 * const [execute, { loading, error, data }] = useSimpleTransactionHook();
 *
 * const run = async () => {
 *   const result = await execute(args)
 *     .andThen(sendTransaction);
 *
 *   if (result.isErr()) {
 *     console.error(result.error);
 *     return;
 *   }
 *
 *   console.log('Transaction sent with hash:', result.value);
 * };
 * ```
 *
 * Or use it to handle an {@link ExecutionPlan} that may require multiple transactions as shown below.
 *
 * ```ts
 * const account = useAccount(); // wagmi hook
 *
 * const [execute, { loading, error, data }] = useComplexTransactionHook();
 *
 * const run = async () => {
 *   const result = await execute(args)
 *     .andThen((plan) => {
 *       switch (plan.__typename) {
 *         case 'TransactionRequest':
 *           return sendTransaction(plan);
 *
 *         case 'ApprovalRequired':
 *           return sendTransaction(plan.approval).andThen(() =>
 *             sendTransaction(plan.originalTransaction),
 *           );
 *
 *         case 'InsufficientBalanceError':
 *           return errAsync(new Error(`Insufficient balance: ${error.cause.required.value} required.`));
 *        }
 *      });
 *
 *   if (result.isErr()) {
 *     console.error(result.error);
 *     return;
 *   }
 *
 *   console.log('Transaction sent with hash:', result.value);
 * }
 * ```
 */
export function useSendTransaction(): UseSendTransactionResult {
  const client = useAaveClient();
  const { wallets } = useWallets();

  return useAsyncTask((request: TransactionRequest) => {
    const wallet = wallets.find((wallet) => wallet.address === request.from);

    invariant(
      wallet,
      `Expected a connected wallet with address ${request.from} to be found.`,
    );

    return ResultAsync.fromPromise(
      wallet.switchChain(request.chainId),
      (error) => UnexpectedError.from(error),
    )
      .map(() => wallet.getEthereumProvider())
      .andThen((provider) => {
        const walletClient = createWalletClient({
          account: request.from,
          chain: supportedChains[request.chainId],
          transport: custom(provider),
        });

        return sendTransactionAndWait(walletClient, request);
      })
      .andThen(client.waitForSupportedTransaction);
  });
}

export type SignERC20PermitError = SigningError | UnexpectedError;

/**
 * A hook that provides a way to sign ERC20 permits using a Privy wallet.
 *
 * ```ts
 * const [signERC20Permit, { loading, error, data }] = useERC20Permit();
 *
 * const run = async () => {
 *   const result = await signERC20Permit({
 *     chainId: chainId(1), // Ethereum mainnet
 *     market: evmAddress('0x1234…'),
 *     underlyingToken: evmAddress('0x5678…'),
 *     amount: '42.42',
 *     spender: evmAddress('0x9abc…'),
 *     owner: evmAddress(account.address!),
 *   });
 *
 *   if (result.isErr()) {
 *     console.error(result.error);
 *     return;
 *   }
 *
 *   console.log('ERC20 permit signed:', result.value);
 * };
 * ```
 */
export function useERC20Permit(): UseAsyncTask<
  PermitTypedDataRequest,
  ERC712Signature,
  SignERC20PermitError
> {
  const client = useAaveClient();
  const { signTypedData } = useSignTypedData();

  return useAsyncTask((request: PermitTypedDataRequest) => {
    return permitTypedData(client, request).andThen((response) =>
      ResultAsync.fromPromise(
        signTypedData({
          types: response.types,
          primaryType: response.primaryType,
          domain: response.domain,
          message: response.message,
        }),
        (error) => SigningError.from(error),
      ).map(({ signature }) => ({
        deadline: response.message.deadline,
        value: signatureFrom(signature),
      })),
    );
  });
}
