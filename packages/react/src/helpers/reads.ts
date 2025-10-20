import { type StandardData, UnexpectedError } from '@aave/client-next';
import {
  type AnyVariables,
  identity,
  invariant,
  type NullishDeep,
  type Prettify,
} from '@aave/types-next';
import { useEffect, useMemo } from 'react';
import { type TypedDocumentNode, useQuery } from 'urql';
import {
  type PausableReadResult,
  type PausableSuspenseResult,
  ReadResult,
  type SuspendableResult,
  type SuspenseResult,
} from './results';

export type Selector<T, V> = (data: T) => V;

export type Pausable<T> = Prettify<
  NullishDeep<T> & {
    /**
     * Prevents the hook from automatically executing GraphQL query operations.
     *
     * @experimental This is an experimental feature and may change in the future.
     *
     * @remarks
     * `pause` may be set to `true` to stop the query operation from executing
     * automatically. The hook will stop receiving updates and won’t execute the query
     * operation until it’s set to `false`.
     */
    pause: boolean;
  }
>;

export type Suspendable = { suspense: true };

/**
 * @internal
 */
export type UseSuspendableQueryArgs<
  Value,
  Output,
  Variables extends AnyVariables,
  Suspense extends boolean,
  Pause extends boolean = never,
> = {
  document: TypedDocumentNode<StandardData<Value>, Variables>;
  variables?: Pause extends boolean ? NullishDeep<Variables> : Variables;
  suspense: Suspense;
  selector?: Selector<Value, Output>;
  pollInterval?: number;
  pause?: Pause;
};

/**
 * @internal
 */
export function useSuspendableQuery<
  Value,
  Output,
  Variables extends AnyVariables,
  Pausable extends boolean = never,
>({
  document,
  variables,
  suspense,
  pause,
}: UseSuspendableQueryArgs<Value, Output, Variables, false, Pausable>):
  | ReadResult<Output>
  | PausableReadResult<Output>;
/**
 * @internal
 */
export function useSuspendableQuery<
  Value,
  Output,
  Variables extends AnyVariables,
  Pausable extends boolean = never,
>({
  document,
  variables,
  suspense,
  pause,
}: UseSuspendableQueryArgs<Value, Output, Variables, true, Pausable>):
  | SuspenseResult<Output>
  | PausableSuspenseResult<Output>;
/**
 * @internal
 */
export function useSuspendableQuery<
  Value,
  Output,
  Variables extends AnyVariables,
  Pausable extends boolean = never,
>({
  document,
  variables,
  suspense,
  pause,
}: UseSuspendableQueryArgs<
  Value,
  Output,
  Variables,
  boolean,
  Pausable
>): SuspendableResult<Output, UnexpectedError>;
/**
 * Implementation.
 */
export function useSuspendableQuery<
  Value,
  Output,
  Variables extends AnyVariables,
>({
  document,
  variables,
  suspense,
  pause,
  selector = identity as Selector<Value, Output>,
  pollInterval = 0,
}: UseSuspendableQueryArgs<
  Value,
  Output,
  Variables,
  boolean,
  boolean
>): SuspendableResult<Output, UnexpectedError> {
  const [{ fetching, data, error }, executeQuery] = useQuery({
    query: document,
    variables: variables as Variables,
    pause,
    context: useMemo(
      () => ({
        suspense,
      }),
      [suspense],
    ),
  });

  useEffect(() => {
    if (pollInterval <= 0 || fetching || pause) return undefined;

    const timerId = setTimeout(() => {
      executeQuery({
        requestPolicy: 'network-only',
      });
    }, pollInterval);

    return () => clearTimeout(timerId);
  }, [fetching, executeQuery, pollInterval, pause]);

  if (pause) {
    return ReadResult.Paused(
      data ? selector(data.value) : undefined,
      error ? UnexpectedError.from(error) : undefined,
    );
  }

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
