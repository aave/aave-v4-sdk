import type {
  SignERC20PermitError,
  SignSwapTypedDataError,
} from '@aave/client';
import {
  sendTransaction,
  signERC20PermitWith,
  signSwapTypedDataWith,
  waitForTransactionResult,
} from '@aave/client/ethers';
import type {
  ERC20PermitSignature,
  PermitTypedData,
  SwapTypedData,
  TransactionRequest,
} from '@aave/graphql';
import { invariant, type Signature } from '@aave/types';
import type { Signer } from 'ethers';
import {
  PendingTransaction,
  type UseAsyncTask,
  type UseSendTransactionResult,
  useAsyncTask,
} from './helpers';

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
  return useAsyncTask(
    (request: TransactionRequest) => {
      return sendTransaction(signer, request).map(
        (response) =>
          new PendingTransaction(() =>
            waitForTransactionResult(request, response),
          ),
      );
    },
    [signer],
  );
}

/**
 * A hook that provides a way to sign ERC20 permits using an ethers Signer instance.
 *
 * ```ts
 * const [signERC20Permit, { loading, error, data }] = useSignERC20Permit(signer);
 * ```
 *
 * @param signer - The ethers Signer to use for signing ERC20 permits.
 */
export function useSignERC20Permit(
  signer: Signer,
): UseAsyncTask<PermitTypedData, ERC20PermitSignature, SignERC20PermitError> {
  return useAsyncTask(
    (data: PermitTypedData) => {
      return signERC20PermitWith(signer, data);
    },
    [signer],
  );
}

/**
 * A hook that provides a way to sign swap typed data using an ethers Signer instance.
 *
 * ```ts
 * const [signSwapTypedData, { loading, error, data }] = useSignSwapTypedData(signer);
 * ```
 *
 * @param signer - The ethers Signer to use for signing swap typed data.
 */
export function useSignSwapTypedData(
  signer: Signer | undefined,
): UseAsyncTask<SwapTypedData, Signature, SignSwapTypedDataError> {
  return useAsyncTask(
    (typedData: SwapTypedData) => {
      invariant(signer, 'Expected a Signer to sign swap typed data');

      return signSwapTypedDataWith(signer, typedData);
    },
    [signer],
  );
}
