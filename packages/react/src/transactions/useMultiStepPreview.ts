import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type UnexpectedError,
} from '@aave/client';
import { multiStepPreview } from '@aave/client/actions';
import {
  type MultiStepPreview,
  MultiStepPreviewQuery,
  type MultiStepPreviewRequest,
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
 * Preview a plan of one or more actions, folded through the protocol state.
 *
 * Each step is evaluated against what the steps before it produced, and
 * `steps[i].preview` is the same shape a single-action preview returns. A step that
 * cannot execute comes back `BLOCKED` with the reason and is not applied.
 *
 * ```tsx
 * const [getPreview, previewing] = useMultiStepPreviewAction();
 *
 * const result = await getPreview({
 *   actions: [
 *     {
 *       setUserSuppliesAsCollateral: {
 *         changes: [{ reserve: reserveId('SGVsbG8h'), enableCollateral: true }],
 *         sender: evmAddress('0x9abc…'),
 *       },
 *     },
 *     {
 *       borrow: {
 *         reserve: reserveId('SGVsbG8h'),
 *         amount: { erc20: { value: '1000' } },
 *         sender: evmAddress('0x9abc…'),
 *       },
 *     },
 *   ],
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Plan preview:', result.value);
 * ```
 */
export function useMultiStepPreviewAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<MultiStepPreviewRequest, MultiStepPreview, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: MultiStepPreviewRequest) =>
      multiStepPreview(client, request, {
        currency: options.currency,
        requestPolicy: 'network-only',
      }),
    [client, options.currency],
  );
}

export type UseMultiStepPreviewArgs = Prettify<
  MultiStepPreviewRequest & CurrencyQueryOptions
>;

/**
 * Fetch a preview of a plan of one or more actions.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useMultiStepPreview({
 *   actions: [
 *     {
 *       withdraw: {
 *         reserve: reserveId('SGVsbG8h'),
 *         amount: { erc20: { value: '1000' } },
 *         sender: evmAddress('0x9abc…'),
 *       },
 *     },
 *   ],
 *   suspense: true,
 * });
 * ```
 */
export function useMultiStepPreview(
  args: UseMultiStepPreviewArgs & Suspendable,
): SuspenseResult<MultiStepPreview>;
/**
 * Fetch a preview of a plan of one or more actions.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useMultiStepPreview({
 *   actions: [],
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useMultiStepPreview(
  args: Pausable<UseMultiStepPreviewArgs> & Suspendable,
): PausableSuspenseResult<MultiStepPreview>;
/**
 * Fetch a preview of a plan of one or more actions.
 *
 * ```tsx
 * const { data, error, loading } = useMultiStepPreview({
 *   actions: [
 *     {
 *       withdraw: {
 *         reserve: reserveId('SGVsbG8h'),
 *         amount: { erc20: { value: '1000' } },
 *         sender: evmAddress('0x9abc…'),
 *       },
 *     },
 *   ],
 * });
 * ```
 */
export function useMultiStepPreview(
  args: UseMultiStepPreviewArgs,
): ReadResult<MultiStepPreview>;
/**
 * Fetch a preview of a plan of one or more actions.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useMultiStepPreview({
 *   actions: [],
 *   pause: true,
 * });
 * ```
 */
export function useMultiStepPreview(
  args: Pausable<UseMultiStepPreviewArgs>,
): PausableReadResult<MultiStepPreview>;

export function useMultiStepPreview({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseMultiStepPreviewArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<MultiStepPreview, UnexpectedError> {
  return useSuspendableQuery({
    document: MultiStepPreviewQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}
