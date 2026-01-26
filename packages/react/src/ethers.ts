import type { SignTypedDataError, TypedData } from '@aave/client';
import {
  sendTransaction,
  signTypedDataWith,
  waitForTransactionResult,
} from '@aave/client/ethers';
import type { TransactionRequest } from '@aave/graphql';
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
 * A hook that provides a way to sign EIP-712 typed data (ERC-20 permits, swap intents, etc.)
 * using an ethers Signer instance.
 *
 * ```ts
 * const [signTypedData, { loading, error, data }] = useSignTypedData(signer);
 * ```
 *
 * @param signer - The ethers Signer to use for signing typed data.
 */
export function useSignTypedData(
  signer: Signer | undefined,
): UseAsyncTask<TypedData, Signature, SignTypedDataError> {
  return useAsyncTask(
    (typedData: TypedData) => {
      invariant(signer, 'Expected a Signer to sign typed data');

      return signTypedDataWith(signer, typedData);
    },
    [signer],
  );
}
