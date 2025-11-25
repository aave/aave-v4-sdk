import { AaveClient } from '@aave/client';
import { environment } from '@aave/client/test-utils';
import { type RenderHookOptions, renderHook } from '@testing-library/react';
// biome-ignore lint/correctness/noUnusedImports: React is needed for JSX
import React, {
  Component,
  type JSXElementConstructor,
  type PropsWithChildren,
  type ReactNode,
  Suspense,
} from 'react';
import { AaveContextProvider } from './context';

class TestErrorBoundary extends Component<PropsWithChildren> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.error) {
      return (
        <div data-testid='error-boundary'>
          Error: {this.state.error?.message}
        </div>
      );
    }

    return this.props.children;
  }
}

function createTestWrapper(
  additionalWrapper: JSXElementConstructor<{
    children: ReactNode;
  }> = ({ children }: PropsWithChildren) => <>{children}</>,
) {
  const client = AaveClient.create({
    environment,
  });

  return function TestWrapper({ children }: PropsWithChildren) {
    const AdditionalWrapper = additionalWrapper;

    return (
      <AdditionalWrapper>
        <AaveContextProvider client={client}>
          <TestErrorBoundary>
            <Suspense fallback={<div data-testid='loading'>Loading...</div>}>
              {children}
            </Suspense>
          </TestErrorBoundary>
        </AaveContextProvider>
      </AdditionalWrapper>
    );
  };
}

export type RenderHookWithContextOptions<TProps> = RenderHookOptions<TProps> & {
  onError?: (error: Error) => void;
};

/**
 * Unified wrapper around `renderHook` from `@testing-library/react`.
 *
 * All hooks are wrapped with:
 * - AaveContextProvider (required for Aave hooks)
 * - Suspense boundary (with loading fallback)
 * - ErrorBoundary (requires custom error handler)
 * - Optional additional wrapper (if provided)
 *
 * ```ts
 * const { result } = renderHookWithinContext(() => useMyHook(), {
 *   client: mockClient,
 * });
 * ```
 *
 * ```ts
 * const { result } = renderHookWithinContext(() => useMyHook(), {
 *   wrapper: ({ children }) => <MyProvider>{children}</MyProvider>,
 * });
 * ```
 */
export function renderHookWithinContext<TProps, TResult>(
  callback: (props: TProps) => TResult,
  { wrapper, ...restOptions }: RenderHookWithContextOptions<TProps> = {},
) {
  return renderHook(callback, {
    wrapper: createTestWrapper(wrapper),
    ...restOptions,
  });
}
