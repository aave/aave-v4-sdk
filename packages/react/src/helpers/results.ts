import type { UnexpectedError } from '@aave/client-next';

/**
 * A read hook result.
 *
 * It's a discriminated union of the possible results of a read operation:
 * - Rely on the `loading` value to determine if the `data` or `error` can be evaluated.
 * - If `error` is `undefined`, then `data` value will be available.
 */
export type ReadResult<
  T,
  E extends UnexpectedError = UnexpectedError,
  Pausable extends boolean = false,
> =
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
    }
  | (Pausable extends true
      ? {
          data: undefined;
          error: undefined;
          loading: undefined;
        }
      : never);

/**
 * @internal
 */
export const ReadResult = {
  Initial: <T, E extends UnexpectedError = UnexpectedError>(): ReadResult<
    T,
    E
  > => ({
    data: undefined,
    error: undefined,
    loading: true,
  }),
  Success: <T, E extends UnexpectedError = UnexpectedError>(
    data: T,
  ): ReadResult<T, E> => ({
    data,
    error: undefined,
    loading: false,
  }),
  Failure: <T, E extends UnexpectedError = UnexpectedError>(
    error: E,
  ): ReadResult<T, E> => ({
    data: undefined,
    error,
    loading: false,
  }),
  Paused: <T, E extends UnexpectedError = UnexpectedError>(): ReadResult<
    T,
    E,
    boolean
  > => ({
    data: undefined,
    error: undefined,
    loading: undefined,
  }),
};

/**
 * A read hook result that supports React Suspense
 */
export type SuspenseResult<T, Pausable extends boolean = false> = {
  data: Pausable extends true ? T | undefined : T;
};

export type SuspendableResult<
  T,
  E extends UnexpectedError = UnexpectedError,
  Pausable extends boolean = false,
> = ReadResult<T, E, Pausable> | SuspenseResult<T, Pausable>;
