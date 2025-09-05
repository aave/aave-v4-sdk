import {
  PermitTypedDataQuery,
  type PermitTypedDataRequest,
  type PermitTypedDataResponse,
} from '@aave/graphql-next';
import {
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  useSuspendableQuery,
} from './helpers';

export type UsePermitTypedDataArgs = PermitTypedDataRequest;

/**
 * Generate EIP-712 typed data for permit signatures.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = usePermitTypedData({
 *   spender: evmAddress('0x87870bca…'),
 *   currency: evmAddress('0xa0b86991c431c924b2047c7094daf21b77e…'),
 *   amount: '1000.5',
 *   suspense: true,
 * });
 *
 * // Use the typed data to create a signature
 * const signature = await wallet.signTypedData(data);
 * ```
 */
export function usePermitTypedData(
  args: UsePermitTypedDataArgs & Suspendable,
): SuspenseResult<PermitTypedDataResponse>;

/**
 * Generate EIP-712 typed data for permit signatures.
 *
 * ```tsx
 * const { data, error, loading } = usePermitTypedData({
 *   spender: evmAddress('0x87870bca…'),
 *   currency: evmAddress('0xa0b86991c431c924b2047c7094daf21b77e…'),
 *   amount: '1000.5',
 * });
 *
 * if (data) {
 *   // Use the typed data to create a signature
 *   const signature = await wallet.signTypedData(data);
 * }
 * ```
 */
export function usePermitTypedData(
  args: UsePermitTypedDataArgs,
): ReadResult<PermitTypedDataResponse>;

export function usePermitTypedData({
  suspense = false,
  ...request
}: UsePermitTypedDataArgs & {
  suspense?: boolean;
}): SuspendableResult<PermitTypedDataResponse> {
  return useSuspendableQuery({
    document: PermitTypedDataQuery,
    variables: {
      request,
    },
    suspense,
  });
}
