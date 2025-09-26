import type { SigningError, UnexpectedError } from '@aave/client-next';
import {
  sendTransaction,
  signERC20PermitWith,
  signSwapTypedDataWith,
  waitForTransactionResult,
} from '@aave/client-next/ethers';
import type {
  CancelSwapTypedData,
  ERC20PermitSignature,
  PermitRequest,
  SwapByIntentTypedData,
  TransactionRequest,
} from '@aave/graphql-next';

import { invariant } from '@aave/types-next';
import type { Signer } from 'ethers';
import {
  PendingTransaction,
  type UseAsyncTask,
  type UseSendTransactionResult,
  useAsyncTask,
} from './helpers';
import { usePermitTypedDataAction } from './permits';

/**
 * A hook that provides a way to send Aave transactions using an ethers Signer instance.
 *
 * Retrieve the `Signer` instance from your ethers provider, then pass it to this hook to create a function that can be used to send transactions.
 *
 * ```ts
 * const provider = new ethers.providers.Web3Provider(window.ethereum);
 * const signer = provider.getSigner();
 *
 * // …
 *
 * const [sendTransaction, { loading, error, data }] = useSendTransaction(signer);
 * ```
 *
 * @param signer - The ethers Signer to use for sending transactions.
 */
export function useSendTransaction(signer: Signer): UseSendTransactionResult {
  return useAsyncTask((request: TransactionRequest) => {
    return sendTransaction(signer, request).map(
      (response) =>
        new PendingTransaction(() =>
          waitForTransactionResult(request, response),
        ),
    );
  });
}

export type SignERC20PermitError = SigningError | UnexpectedError;

/**
 * A hook that provides a way to sign ERC20 permits using an ethers Signer instance.
 *
 * ```ts
 * const provider = new ethers.providers.Web3Provider(window.ethereum);
 * const signer = provider.getSigner();
 *
 * // …
 *
 * const [signERC20Permit, { loading, error, data }] = useERC20Permit(signer);
 *
 * const run = async () => {
 *   const result = await signERC20Permit({
 *     supply: {
 *       sender: evmAddress(await signer.getAddress()), // User's address
 *       reserve: {
 *         reserveId: reserve.id,
 *         chainId: reserve.chain.chainId,
 *         spoke: reserve.spoke.address,
 *       },
 *       amount: {
 *         value: bigDecimal(42), // 42 USDC
 *       },
 *     },
 *   });
 *
 *   if (result.isErr()) {
 *     console.error(result.error);
 *     return;
 *   }
 *
 *   console.log('ERC20 Permit signature:', result.value);
 * };
 * ```
 *
 * @param signer - The ethers Signer to use for signing ERC20 permits.
 */
export function useERC20Permit(
  signer: Signer,
): UseAsyncTask<PermitRequest, ERC20PermitSignature, SignERC20PermitError> {
  const [permitTypedData] = usePermitTypedDataAction();

  return useAsyncTask((request: PermitRequest) => {
    return permitTypedData(request).andThen(signERC20PermitWith(signer));
  });
}

export type SignSwapTypedDataError = SigningError | UnexpectedError;

/**
 * A hook that provides a way to sign swap typed data using an ethers Signer instance.
 *
 * ```ts
 * const provider = new ethers.providers.Web3Provider(window.ethereum);
 * const signer = provider.getSigner();
 *
 * // …
 *
 * const [signSwapTypedData, { loading, error, data }] = useSignSwapTypedDataWith(signer);
 *
 * const run = async () => {
 *   const result = await signSwapTypedData(swapTypedData);
 *
 *   if (result.isErr()) {
 *     console.error(result.error);
 *     return;
 *   }
 *
 *   console.log('Swap typed data signed:', result.value);
 * };
 * ```
 *
 * @param signer - The ethers Signer to use for signing swap typed data.
 */
export function useSignSwapTypedDataWith(
  signer: Signer | undefined,
): UseAsyncTask<
  SwapByIntentTypedData | CancelSwapTypedData,
  ERC20PermitSignature,
  SignSwapTypedDataError
> {
  return useAsyncTask(
    (typedData: SwapByIntentTypedData | CancelSwapTypedData) => {
      invariant(signer, 'Expected a Signer to sign swap typed data');

      return signSwapTypedDataWith(signer)(typedData);
    },
  );
}
