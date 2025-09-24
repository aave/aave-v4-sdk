import type { UnexpectedError } from '@aave/client-next';
import { permitTypedData } from '@aave/client-next/actions';
import type {
  PermitTypedDataRequest,
  PermitTypedDataResponse,
} from '@aave/graphql-next';
import { useAaveClient } from './context';
import { type UseAsyncTask, useAsyncTask } from './helpers';

/**
 * Low-level hook to execute a {@link permitTypedData} action directly.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 * @remarks
 * This hook **does not** actively watch for updated data on permit typed data.
 * Use this hook to generate permit typed data on demand as part of a larger workflow
 * (e.g., in an event handler when preparing to sign a permit).
 */
export function usePermitTypedDataAction(): UseAsyncTask<
  PermitTypedDataRequest,
  PermitTypedDataResponse,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: PermitTypedDataRequest) =>
    permitTypedData(client, request),
  );
}
