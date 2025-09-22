import { type StandardData, UnexpectedError } from '@aave/client-next';
import { type AnyVariables, identity, invariant } from '@aave/types-next';
import { useMemo } from 'react';
import { type TypedDocumentNode, useQuery } from 'urql';
import {
  ReadResult,
  type SuspendableResult,
  type SuspenseResult,
} from './results';

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
}: UseSuspendableQueryArgs<
  Value,
  Output,
  Variables,
  false
>): ReadResult<Output>;
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
}: UseSuspendableQueryArgs<
  Value,
  Output,
  Variables,
  true
>): SuspenseResult<Output>;
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
}: UseSuspendableQueryArgs<
  Value,
  Output,
  Variables
>): SuspendableResult<Output>;
export function useSuspendableQuery<
  Value,
  Output,
  Variables extends AnyVariables,
>({
  document,
  variables,
  suspense,
  selector = identity as Selector<Value, Output>,
}: UseSuspendableQueryArgs<
  Value,
  Output,
  Variables
>): SuspendableResult<Output> {
  const [{ data, fetching, error }] = useQuery({
    query: document,
    variables,
    context: useMemo(() => ({ suspense }), [suspense]),
  });

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
