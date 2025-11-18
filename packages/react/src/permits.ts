import type { UnexpectedError } from '@aave/client-next';
import { permitTypedData } from '@aave/client-next/actions';
import type {
  PermitRequest,
  PermitTypedDataResponse,
} from '@aave/graphql-next';
import { useAaveClient } from './context';
import { type UseAsyncTask, useAsyncTask } from './helpers';

/**
 * @internal
 */
export function usePermitTypedDataAction(): UseAsyncTask<
  PermitRequest,
  PermitTypedDataResponse,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: PermitRequest) => permitTypedData(client, request),
    [client],
  );
}
