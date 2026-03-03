import type { UnexpectedError } from '@aave/client';

/**
 * @internal
 */
export type QueryMetadata = {
  operationKey: number;
  resultOperationKey: number | undefined;
};

/**
 * A read hook result.
 *
 * It's a discriminated union of the possible results of a read operation:
 * - Rely on the `loading` value to determine if the `data` or `error` can be evaluated.
 * - If `error` is `undefined`, then `data` value will be available.
 */
export type ReadResult<T, E = UnexpectedError> =
  | {
      data: undefined;
      error: undefined;
      loading: true;
      reloading: false;
      /**
       * @internal
       */
      metadata: QueryMetadata;
    }
  | {
      data: T;
      error: undefined;
      loading: false;
      reloading: boolean;
      /**
       * @internal
       */
      metadata: QueryMetadata;
    }
  | {
      data: undefined;
      error: E;
      loading: false;
      reloading: boolean;
      /**
       * @internal
       */
      metadata: QueryMetadata;
    };

/**
 * A read hook result that supports pausing.
 */
export type PausableReadResult<T, E = UnexpectedError> =
  | {
      data: T | undefined;
      error: E | undefined;
      loading: false;
      paused: true;
      reloading: false;
      /**
       * @internal
       */
      metadata: QueryMetadata;
    }
  | {
      data: undefined;
      error: undefined;
      loading: true;
      paused: false;
      reloading: false;
      /**
       * @internal
       */
      metadata: QueryMetadata;
    }
  | {
      data: T;
      error: undefined;
      loading: false;
      paused: false;
      reloading: boolean;
      /**
       * @internal
       */
      metadata: QueryMetadata;
    }
  | {
      data: undefined;
      error: E;
      loading: false;
      paused: false;
      reloading: boolean;
      /**
       * @internal
       */
      metadata: QueryMetadata;
    };

/**
 * @internal
 */
export const ReadResult = {
  Loading: <T, E = UnexpectedError>(
    metadata: QueryMetadata,
  ): PausableReadResult<T, E> => ({
    data: undefined,
    error: undefined,
    loading: true,
    paused: false,
    reloading: false,
    metadata,
  }),
  Success: <T, E = UnexpectedError>(
    data: T,
    metadata: QueryMetadata,
    reloading = false,
  ): PausableReadResult<T, E> => ({
    data,
    error: undefined,
    loading: false,
    paused: false,
    reloading,
    metadata,
  }),
  Failure: <T, E = UnexpectedError>(
    error: E,
    metadata: QueryMetadata,
    reloading = false,
  ): PausableReadResult<T, E> => ({
    data: undefined,
    error,
    loading: false,
    paused: false,
    reloading,
    metadata,
  }),
  Paused: <T, E = UnexpectedError>(
    data: T | undefined,
    error: E | undefined,
    metadata: QueryMetadata,
  ): PausableReadResult<T, E> => ({
    data,
    error,
    loading: false,
    paused: true,
    reloading: false,
    metadata,
  }),
};

/**
 * A read hook result that supports React Suspense.
 */
export type SuspenseResult<T> = {
  data: T;
  /**
   * @internal
   */
  metadata: QueryMetadata;
};

/**
 * A read hook result that supports React Suspense and can be paused.
 */
export type PausableSuspenseResult<T> =
  | {
      paused: true;
      data: undefined;
      /**
       * @internal
       */
      metadata: QueryMetadata;
    }
  | {
      paused: false;
      data: T;
      /**
       * @internal
       */
      metadata: QueryMetadata;
    };

export type SuspendableResult<T, E = UnexpectedError> =
  | ReadResult<T, E>
  | SuspenseResult<T>
  | PausableReadResult<T, E>
  | PausableSuspenseResult<T>;
