import { UnexpectedError } from '@aave/client';
import { act } from '@testing-library/react';
import { graphql, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { gql } from 'urql';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { renderHookWithinContext } from '../test-utils';
import { useSuspendableQuery } from './reads';

export const AnyQuery = gql`
  query AnyQuery {
    value: health
  }
`;

let counter = 0;

const server = setupServer(
  graphql.query(AnyQuery, () => {
    return HttpResponse.json({
      data: {
        value: counter++,
      },
    });
  }),
);

describe(`Given the '${useSuspendableQuery.name}' hook`, () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('When rendering with suspense disabled', () => {
    it('Then it should return data after a loading state', async () => {
      const { result } = renderHookWithinContext(() =>
        useSuspendableQuery({
          document: AnyQuery,
          suspense: false,
        }),
      );

      await vi.waitUntil(() => !result.current.loading);

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(expect.any(Number));
      expect(result.current.error).toBeUndefined();
    });

    it('Then it should return any error as component state', async () => {
      server.use(
        graphql.query(AnyQuery, () => {
          return HttpResponse.json({
            errors: [
              { message: 'Test error', extensions: { code: 'TEST_ERROR' } },
            ],
          });
        }),
      );

      const { result } = renderHookWithinContext(() =>
        useSuspendableQuery({
          document: AnyQuery,
          suspense: false,
        }),
      );

      await vi.waitUntil(() => !result.current.loading);

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeDefined();
    });
  });

  describe('When rendering with suspense disabled and pause is true', () => {
    it('Then it should return the bespoke paused state', async () => {
      const { result } = renderHookWithinContext(() =>
        useSuspendableQuery({
          document: AnyQuery,
          suspense: false,
          pause: true,
        }),
      );

      expect(result.current.loading).toBeUndefined;
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('When rendering with suspense enabled', () => {
    it.skip('Then it should suspend and render once the query is resolved', async () => {
      const { result } = renderHookWithinContext(() =>
        useSuspendableQuery({
          document: AnyQuery,
          suspense: true,
        }),
      );

      await vi.waitUntil(() => result.current);

      expect(result.current.data).toEqual(expect.any(Number));
    });

    it('Then it should throw any error so that can be captured via an Error Boundary', async () => {
      server.use(
        graphql.query(AnyQuery, () => {
          return HttpResponse.json({
            errors: [
              { message: 'Test error', extensions: { code: 'TEST_ERROR' } },
            ],
          });
        }),
      );

      const onError = vi.fn();
      renderHookWithinContext(
        () =>
          useSuspendableQuery({
            document: AnyQuery,
            suspense: true,
          }),
        // biome-ignore lint/suspicious/noExplicitAny: not worth the effort
        { onCaughtError: onError as any },
      );

      // Wait for the error boundary to catch the error
      await vi.waitFor(() => expect(onError).toHaveBeenCalled());

      expect(onError).toHaveBeenCalledWith(
        expect.any(UnexpectedError),
        expect.any(Object),
      );
    });
  });

  describe('When rendering with suspense enabled and pause is true', () => {
    it('Then it should return the bespoke paused state', async () => {
      const { result } = renderHookWithinContext(() =>
        useSuspendableQuery({
          document: AnyQuery,
          suspense: true,
          pause: true,
        }),
      );

      expect(result.current.data).toBeUndefined();
    });
  });

  describe('When rendering with a non-zero pollInterval', () => {
    beforeAll(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('Then it should execute the query again after the pollInterval', async () => {
      const { result } = renderHookWithinContext(() =>
        useSuspendableQuery({
          document: AnyQuery,
          suspense: false,
          pollInterval: 1,
        }),
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
  });
});
