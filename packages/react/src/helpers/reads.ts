import { type StandardData, UnexpectedError } from '@aave/client-next';
import { type AnyVariables, identity, invariant } from '@aave/types-next';
import { useEffect, useMemo } from 'react';
import { type TypedDocumentNode, useQuery } from 'urql';
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
  pollInterval = 0,
}: UseSuspendableQueryArgs<
  Value,
  Output,
  Variables
>): SuspendableResult<Output> {
  const [{ fetching, data, error }, executeQuery] = useQuery({
    query: document,
    variables,
    context: useMemo(
      () => ({
        suspense,
      }),
      [suspense],
    ),
  });

  useEffect(() => {
    if (pollInterval <= 0 || fetching) return undefined;

    const timerId = setTimeout(() => {
      executeQuery({
        requestPolicy: 'network-only',
      });
    }, pollInterval);

    return () => clearTimeout(timerId);
  }, [fetching, executeQuery, pollInterval]);

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
