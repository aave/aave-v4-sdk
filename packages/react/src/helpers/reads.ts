import { type StandardData, UnexpectedError } from '@aave/client';
import {
  type AnyVariables,
  invariant,
  type NullishDeep,
  ok,
  type Prettify,
  type Result,
} from '@aave/types';
import { useEffect, useMemo, useState } from 'react';
import { createRequest, type TypedDocumentNode, useQuery } from 'urql';
import {
  type PausableReadResult,
  type PausableSuspenseResult,
  type QueryMetadata,
  ReadResult,
  type SuspendableResult,
  type SuspenseResult,
} from './results';

export type Selector<ResponseValue, SelectorData, SelectorError> = (
  data: ResponseValue,
) => Result<SelectorData, SelectorError>;

export type Pausable<T, WhenPaused = NullishDeep<T>> = Prettify<
  WhenPaused & {
    /**
     * Prevents the hook from automatically executing GraphQL query operations.
     *
     * @experimental This is an experimental feature and may change in the future.
     *
     * @remarks
     * `pause` may be set to `true` to stop the query operation from executing
     * automatically. The hook will stop receiving updates and won't execute the query
     * operation until it's set to `false`.
     */
    pause: boolean;
  }
>;

export type Suspendable = { suspense: true };

/**
 * @internal
 */
export type UseSuspendableQueryArgs<
  ResponseValue,
  SelectorData,
  SelectorError,
  Variables extends AnyVariables,
  Suspense extends boolean,
  Pause extends boolean = never,
> = {
  document: TypedDocumentNode<StandardData<ResponseValue>, Variables>;
  variables?: Pause extends boolean ? NullishDeep<Variables> : Variables;
  suspense: Suspense;
  selector?: Selector<ResponseValue, SelectorData, SelectorError>;
  pollInterval?: number;
  batch?: boolean;
  pause?: Pause;
};

/**
 * @internal
 */
export function useSuspendableQuery<
  ResponseValue,
  SelectorData,
  SelectorError,
  Variables extends AnyVariables,
  Pausable extends boolean = never,
>({
  document,
  variables,
  suspense,
  pause,
}: UseSuspendableQueryArgs<
  ResponseValue,
  SelectorData,
  SelectorError,
  Variables,
  false,
  Pausable
>):
  | ReadResult<SelectorData, SelectorError | UnexpectedError>
  | PausableReadResult<SelectorData, SelectorError | UnexpectedError>;
/**
 * @internal
 */
export function useSuspendableQuery<
  ResponseValue,
  SelectorData,
  SelectorError,
  Variables extends AnyVariables,
  Pausable extends boolean = never,
>({
  document,
  variables,
  suspense,
  pause,
}: UseSuspendableQueryArgs<
  ResponseValue,
  SelectorData,
  SelectorError,
  Variables,
  true,
  Pausable
>): SuspenseResult<SelectorData> | PausableSuspenseResult<SelectorData>;
/**
 * @internal
 */
export function useSuspendableQuery<
  ResponseValue,
  SelectorData,
  SelectorError,
  Variables extends AnyVariables,
  Pausable extends boolean = never,
>({
  document,
  variables,
  suspense,
  pause,
}: UseSuspendableQueryArgs<
  ResponseValue,
  SelectorData,
  SelectorError,
  Variables,
  boolean,
  Pausable
>): SuspendableResult<SelectorData, SelectorError | UnexpectedError>;
/**
 * Implementation.
 */
export function useSuspendableQuery<
  ResponseValue,
  SelectorData,
  SelectorError,
  Variables extends AnyVariables,
>({
  document,
  variables,
  suspense,
  pause,
  selector = ok as Selector<ResponseValue, SelectorData, SelectorError>,
  pollInterval = 0,
  batch = true,
}: UseSuspendableQueryArgs<
  ResponseValue,
  SelectorData,
  SelectorError,
  Variables,
  boolean,
  boolean
>): SuspendableResult<SelectorData, SelectorError | UnexpectedError> {
  const [metadata, setMetadata] = useState<QueryMetadata>({
    operationKey: 0,
    resultOperationKey: undefined,
  });
  const [loading, setLoading] = useState(true);
  const operationId = useMemo(
    () => createRequest(document, variables as Variables).key,
    [document, variables],
  );
  const [{ fetching, data, error, stale }, executeQuery] = useQuery({
    query: document,
    variables: variables as Variables,
    pause,
    context: useMemo(
      () => ({
        batch,
        suspense,
      }),
      [batch, suspense],
    ),
  });

  useEffect(() => {
    setMetadata((current) => ({
      ...current,
      operationKey: operationId,
    }));
  }, [operationId]);

  useEffect(() => {
    if (pause) return;

    if (!fetching) {
      setLoading(false);
    }
  }, [fetching, pause]);

  useEffect(() => {
    if (pause || fetching) {
      return;
    }

    setMetadata((current) => ({
      ...current,
      resultOperationKey:
        data && !stale ? current.operationKey : current.resultOperationKey,
    }));
  }, [pause, fetching, data, stale]);

  useEffect(() => {
    if (pollInterval <= 0 || fetching || pause) return undefined;

    const timerId = setTimeout(() => {
      executeQuery({
        requestPolicy: 'network-only',
        batch: false, // never batch, run now!
      });
    }, pollInterval);

    return () => clearTimeout(timerId);
  }, [fetching, executeQuery, pollInterval, pause]);

  if (pause) {
    const unexpectedError = error ? UnexpectedError.from(error) : undefined;

    if (!data) {
      return ReadResult.Paused<SelectorData, SelectorError | UnexpectedError>(
        undefined,
        unexpectedError,
        metadata,
      );
    }

    const selected = selector(data.value);

    if (selected.isErr()) {
      return ReadResult.Paused<SelectorData, SelectorError>(
        undefined,
        selected.error,
        metadata,
      );
    }

    return ReadResult.Paused<SelectorData, UnexpectedError>(
      selected.value,
      unexpectedError,
      metadata,
    );
  }

  if (!suspense && loading) {
    return ReadResult.Loading(metadata);
  }

  // stale indicates that the useQuery is fetching new data because the variables changed
  // !loading && fetching indicates that a re-fetch is happening as consequence of calling executeQuery (e.g., polling)
  const reloading = stale || (!loading && fetching);

  if (error) {
    const unexpected = UnexpectedError.from(error);
    if (suspense) {
      throw unexpected;
    }

    return ReadResult.Failure(unexpected, metadata, reloading);
  }

  invariant(data, 'No data returned');

  const selected = selector(data.value);

  if (selected.isErr()) {
    if (suspense) {
      throw selected.error;
    }
    return ReadResult.Failure(selected.error, metadata, reloading);
  }

  return ReadResult.Success(selected.value, metadata, reloading);
}
