import { GraphQLErrorCode, UnexpectedError } from '@aave/client';
import type { StandardData } from '@aave/core';
import { createGraphQLErrorObject } from '@aave/core/testing';
import { act } from '@testing-library/react';
import { graphql, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { gql, type TypedDocumentNode } from 'urql';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { renderHookWithinContext } from '../test-utils';
import type { Pausable, Suspendable } from './reads';
import { useSuspendableQuery } from './reads';
import type {
  PausableReadResult,
  PausableSuspenseResult,
  ReadResult,
  SuspendableResult,
  SuspenseResult,
} from './results';

const TestQuery: TypedDocumentNode<StandardData<number>, { id: number }> = gql`
  query TestQuery($id: Int) {
    value: health # Using 'health' as a placeholder field
  }
`;

const server = setupServer(
  graphql.query(TestQuery, ({ variables }) => {
    return HttpResponse.json({
      data: {
        value: variables.id,
      },
    });
  }),
);

type UseTestHookArgs = {
  id: number;
  pollInterval?: number;
};

function useTestHook(
  args: UseTestHookArgs & Suspendable,
): SuspenseResult<number>;
function useTestHook(
  args: Pausable<UseTestHookArgs> & Suspendable,
): PausableSuspenseResult<number>;
function useTestHook(args: UseTestHookArgs): ReadResult<number>;
function useTestHook(
  args: Pausable<UseTestHookArgs>,
): PausableReadResult<number>;
function useTestHook({
  id,
  suspense = false,
  pause = false,
  pollInterval,
}: {
  id?: number | null;
  pollInterval?: number | null;
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<number> {
  return useSuspendableQuery({
    document: TestQuery,
    variables: { id },
    suspense,
    pause,
    pollInterval: pollInterval ?? undefined,
  });
}

describe(`Given a declarative read hook based on '${useSuspendableQuery.name}' hook`, () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('And suspense is disabled (i.e., loading state mode)', () => {
    describe('When rendering for the first time', () => {
      it('Then it should return `data` after a `loading` state transition', async () => {
        const { result } = renderHookWithinContext(() =>
          useTestHook({ id: 1 }),
        );

        await vi.waitUntil(() => !result.current.loading);

        expect(result.current).toMatchObject({
          data: 1,
          error: undefined,
          loading: false,
        });
      });
    });

    describe('When re-rendering with new variables', () => {
      // Track reloading states observed during the test
      const reloadingStates: boolean[] = [];

      it('Then it should keep `loading` false and set `reloading` true while fetching new data', async () => {
        const { result, rerender } = renderHookWithinContext(
          ({ id }) => {
            const r = useTestHook({ id });
            // Capture reloading state on each render
            if (!r.loading && r.data !== undefined) {
              reloadingStates.push(r.reloading);
            }
            return r;
          },
          {
            initialProps: { id: 1 },
          },
        );
        expect(result.current).toMatchObject({
          loading: true,
          reloading: false,
        });

        await vi.waitUntil(() => !result.current.loading);
        expect(result.current).toMatchObject({
          data: 1,
          loading: false,
          reloading: false,
        });

        rerender({ id: 2 });

        await vi.waitUntil(() => result.current.data === 2);
        // we should have observed reloading=true at some point
        expect(reloadingStates).toContain(true);
      });
    });

    describe('When an error occurs during the query execution', () => {
      it('Then it should return the `error` as component state', async () => {
        server.use(
          graphql.query(TestQuery, () => {
            return HttpResponse.json({
              errors: [createGraphQLErrorObject(GraphQLErrorCode.BAD_REQUEST)],
            });
          }),
        );

        const { result } = renderHookWithinContext(() =>
          useTestHook({ id: 1 }),
        );

        await vi.waitUntil(() => !result.current.loading);

        expect(result.current).toMatchObject({
          loading: false,
          data: undefined,
          error: expect.any(UnexpectedError),
        });
      });
    });

    describe('When rendering with `pause` is true', () => {
      it('Then it should return the bespoke `paused` state', async () => {
        const { result } = renderHookWithinContext(useTestHook, {
          initialProps: { id: 1, pause: true },
        });

        expect(result.current).toMatchObject({
          loading: false,
          paused: true,
          data: undefined,
          error: undefined,
        });
      });
    });
  });

  describe('And suspense is enabled', () => {
    describe('When rendering for the first time', () => {
      it('Then it should suspend and render once the query is resolved', async () => {
        const { result } = renderHookWithinContext(() =>
          useTestHook({ id: 1, suspense: true }),
        );

        await vi.waitUntil(() => result.current?.data);

        expect(result.current.data).toEqual(expect.any(Number));
      });
    });

    describe('When an error occurs during the query execution', () => {
      it('Then it should throw the error so that can be captured via an Error Boundary', async () => {
        server.use(
          graphql.query(TestQuery, () => {
            return HttpResponse.json({
              errors: [
                { message: 'Test error', extensions: { code: 'TEST_ERROR' } },
              ],
            });
          }),
        );

        const onError = vi.fn();
        renderHookWithinContext(() => useTestHook({ id: 1, suspense: true }), {
          // biome-ignore lint/suspicious/noExplicitAny: not worth the effort
          onCaughtError: onError as any,
        });

        // Wait for the error boundary to catch the error
        await vi.waitUntil(() => onError.mock.calls.length);

        expect(onError).toHaveBeenCalledWith(
          expect.any(UnexpectedError),
          expect.any(Object),
        );
      });
    });

    describe('When rendering with `pause` true', () => {
      it('Then it should return the bespoke paused state', async () => {
        const { result } = renderHookWithinContext(() =>
          useTestHook({ id: 1, suspense: true, pause: true }),
        );

        expect(result.current.data).toBeUndefined();
      });
    });
  });

  describe('When rendering with a non-zero `pollInterval`', () => {
    let pollCounter = 0;

    beforeAll(() => {
      vi.useFakeTimers();
    });

    beforeEach(() => {
      pollCounter = 0;
      server.use(
        graphql.query(TestQuery, () => {
          return HttpResponse.json({
            data: {
              value: pollCounter++,
            },
          });
        }),
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('Then it should execute the query again after the `pollInterval`', async () => {
      const { result } = renderHookWithinContext(() =>
        useTestHook({ id: 1, pollInterval: 1 }),
      );

      expect(result.current.loading).toBe(true);
      await vi.waitUntil(() => !result.current.loading);
      const firstResult = result.current.data as number;

      await act(() => vi.advanceTimersToNextTimerAsync());
      expect(result.current.data).toEqual(firstResult + 1);

      await act(() => vi.advanceTimersToNextTimerAsync());
      expect(result.current.data).toEqual(firstResult + 2);

      await act(() => vi.advanceTimersToNextTimerAsync());
      expect(result.current.data).toEqual(firstResult + 3);
    });

    it('Then it should set reloading to true while refetching', async () => {
      // Track reloading states observed during the test
      const reloadingStates: boolean[] = [];

      const { result } = renderHookWithinContext(() => {
        const r = useTestHook({ id: 1, pollInterval: 100 });
        // Capture reloading state on each render
        if (!r.loading && r.data !== undefined) {
          reloadingStates.push(r.reloading);
        }
        return r;
      });

      await vi.waitUntil(() => !result.current.loading);

      expect(result.current).toMatchObject({
        data: expect.any(Number),
        loading: false,
        reloading: false,
      });

      await act(() => vi.advanceTimersByTimeAsync(100));

      // After poll completes, we should have observed reloading=true at some point
      expect(reloadingStates).toContain(true);
      // And it should end with reloading=false
      expect(result.current.reloading).toBe(false);
    });
  });
});
