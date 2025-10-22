import type { UnexpectedError } from '@aave/client-next';

/**
 * A read hook result.
 *
 * It's a discriminated union of the possible results of a read operation:
 * - Rely on the `loading` value to determine if the `data` or `error` can be evaluated.
 * - If `error` is `undefined`, then `data` value will be available.
 */
export type ReadResult<T, E extends UnexpectedError = UnexpectedError> =
  | {
      data: undefined;
      error: undefined;
      loading: true;
    }
  | {
      data: T;
      error: undefined;
      loading: false;
    }
  | {
      data: undefined;
      error: E;
      loading: false;
    };

/**
 * A read hook result that supports pausing.
 */
export type PausableReadResult<T, E extends UnexpectedError = UnexpectedError> =
  | {
      data: T | undefined;
      error: E | undefined;
      loading: false;
      paused: true;
    }
  | {
      data: undefined;
      error: undefined;
      loading: true;
      paused: false;
    }
  | {
      data: T;
      error: undefined;
      loading: false;
      paused: false;
    }
  | {
      data: undefined;
      error: E;
      loading: false;
      paused: false;
    };

/**
 * @internal
 */
export const ReadResult = {
  Loading: <
    T,
    E extends UnexpectedError = UnexpectedError,
  >(): PausableReadResult<T, E> => ({
    data: undefined,
    error: undefined,
    loading: true,
    paused: false,
  }),
  Success: <T, E extends UnexpectedError = UnexpectedError>(
    data: T,
  ): PausableReadResult<T, E> => ({
    data,
    error: undefined,
    loading: false,
    paused: false,
  }),
  Failure: <T, E extends UnexpectedError = UnexpectedError>(
    error: E,
  ): PausableReadResult<T, E> => ({
    data: undefined,
    error,
    loading: false,
    paused: false,
  }),
  Paused: <T, E extends UnexpectedError = UnexpectedError>(
    data: T | undefined,
    error: E | undefined,
  ): PausableReadResult<T, E> => ({
    data,
    error,
    loading: false,
    paused: true,
  }),
};

/**
 * A read hook result that supports React Suspense.
 */
export type SuspenseResult<T> = {
  data: T;
};

/**
 * A read hook result that supports React Suspense and can be paused.
 */
export type PausableSuspenseResult<T> =
  | {
      paused: true;
      data: undefined;
    }
  | {
      paused: false;
      data: T;
    };

export type SuspendableResult<T, E extends UnexpectedError = UnexpectedError> =
  | ReadResult<T, E>
  | SuspenseResult<T>
  | PausableReadResult<T, E>
  | PausableSuspenseResult<T>;
