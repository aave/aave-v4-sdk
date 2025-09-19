import { type StandardData, UnexpectedError } from '@aave/client-next';
import { type AnyVariables, identity, invariant } from '@aave/types-next';
import { useEffect, useMemo } from 'react';
import { type RequestPolicy, type TypedDocumentNode, useQuery } from 'urql';
import { ReadResult, type SuspendableResult } from './results';

export type Selector<T, V> = (data: T) => V;

export type Suspendable = { suspense: true };

/**
 * @internal
 */
export type UseSuspendableQueryArgs<
  Value,
  Output,
  Variables extends AnyVariables,
  Suspense extends boolean = boolean,
> = {
  document: TypedDocumentNode<StandardData<Value>, Variables>;
  variables: Variables;
  suspense: Suspense;
  selector?: Selector<Value, Output>;
  pollInterval?: number;
  requestPolicy?: RequestPolicy;
};

/**
 * @internal
 */
export function useSuspendableQuery<
  Value,
  Output,
  Variables extends AnyVariables,
>({
  document,
  variables,
  suspense,
  selector = identity as Selector<Value, Output>,
  pollInterval,
  requestPolicy,
}: UseSuspendableQueryArgs<
  Value,
  Output,
  Variables
>): SuspendableResult<Output> {
  const [result, executeQuery] = useQuery({
    query: document,
    variables,
    context: useMemo(
      () => ({
        suspense,
        ...(requestPolicy && { requestPolicy }),
      }),
      [suspense, requestPolicy],
    ),
  });

  useEffect(() => {
    if (!pollInterval || pollInterval <= 0) return undefined;

    if (!result.fetching) {
      const timerId = setTimeout(() => {
        executeQuery({
          requestPolicy: requestPolicy || 'cache-and-network',
        });
      }, pollInterval);

      return () => clearTimeout(timerId);
    }

    return undefined;
  }, [result.fetching, executeQuery, pollInterval, requestPolicy]);

  const { data, fetching, error } = result;

  if (fetching) {
    return ReadResult.Initial();
  }

  if (error) {
    const unexpected = UnexpectedError.from(error);
    if (suspense) {
      throw unexpected;
    }

    return ReadResult.Failure(unexpected);
  }

  invariant(data, 'No data returned');

  return ReadResult.Success(selector(data.value));
}
