import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type UnexpectedError,
} from '@aave/client';
import { preview } from '@aave/client/actions';
import {
  PreviewQuery,
  type PreviewRequest,
  type PreviewUserPosition,
} from '@aave/graphql';
import type { NullishDeep, Prettify } from '@aave/types';

import { useAaveClient } from '../context';
import {
  type Pausable,
  type PausableReadResult,
  type PausableSuspenseResult,
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  type UseAsyncTask,
  useAsyncTask,
  useSuspendableQuery,
} from '../helpers';

/**
 * Preview the impact of a potential action on a user's position.
 *
 * ```tsx
 * const [getPreview, previewing] = usePreviewAction();
 *
 * const loading = previewing.loading;
 * const error = previewing.error;
 *
 * // …
 *
 * const result = await getPreview({
 *   action: {
 *     supply: {
 *       reserve: reserveId('SGVsbG8h'),
 *       amount: {
 *         erc20: {
 *           value: '1000',
 *         },
 *       },
 *       sender: evmAddress('0x9abc…'),
 *     },
 *   },
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Preview result:', result.value);
 * ```
 */
export function usePreviewAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<PreviewRequest, PreviewUserPosition, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: PreviewRequest) =>
      preview(client, request, {
        currency: options.currency,
        requestPolicy: 'network-only',
      }),
    [client, options.currency],
  );
}

export type UsePreviewArgs = Prettify<PreviewRequest & CurrencyQueryOptions>;

/**
 * Fetch a preview of the impact of a potential action on a user's position.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = usePreview({
 *   action: {
 *     supply: {
 *       reserve: reserveId('SGVsbG8h'),
 *       amount: {
 *         erc20: {
 *           currency: evmAddress('0x5678…'),
 *           value: '1000',
 *         },
 *       },
 *       supplier: evmAddress('0x9abc…'),
 *     },
 *   },
 *   suspense: true,
 * });
 * ```
 */
export function usePreview(
  args: UsePreviewArgs & Suspendable,
): SuspenseResult<PreviewUserPosition>;
/**
 * Fetch a preview of the impact of a potential action on a user's position.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = usePreview({
 *   action: {
 *     supply: {
 *       reserve: reserveId('SGVsbG8h'),
 *       amount: {
 *         erc20: {
 *           currency: evmAddress('0x5678…'),
 *           value: '1000',
 *         },
 *       },
 *       supplier: evmAddress('0x9abc…'),
 *     },
 *   },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function usePreview(
  args: Pausable<UsePreviewArgs> & Suspendable,
): PausableSuspenseResult<PreviewUserPosition>;
/**
 * Fetch a preview of the impact of a potential action on a user's position.
 *
 * ```tsx
 * const { data, error, loading } = usePreview({
 *   action: {
 *     supply: {
 *       reserve: reserveId('SGVsbG8h'),
 *       amount: {
 *         erc20: {
 *           currency: evmAddress('0x5678…'),
 *           value: '1000',
 *         },
 *       },
 *       supplier: evmAddress('0x9abc…'),
 *     },
 *   },
 * });
 * ```
 */
export function usePreview(
  args: UsePreviewArgs,
): ReadResult<PreviewUserPosition>;
/**
 * Fetch a preview of the impact of a potential action on a user's position.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = usePreview({
 *   action: {
 *     supply: {
 *       reserve: reserveId('SGVsbG8h'),
 *       amount: {
 *         erc20: {
 *           currency: evmAddress('0x5678…'),
 *           value: '1000',
 *         },
 *       },
 *       supplier: evmAddress('0x9abc…'),
 *     },
 *   },
 *   pause: true,
 * });
 * ```
 */
export function usePreview(
  args: Pausable<UsePreviewArgs>,
): PausableReadResult<PreviewUserPosition>;

export function usePreview({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UsePreviewArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<PreviewUserPosition, UnexpectedError> {
  return useSuspendableQuery({
    document: PreviewQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}
