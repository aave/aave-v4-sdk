import type { UnexpectedError } from '@aave/client';
import { permitTypedData } from '@aave/client/actions';
import type { PermitRequest, PermitTypedDataResponse } from '@aave/graphql';
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
