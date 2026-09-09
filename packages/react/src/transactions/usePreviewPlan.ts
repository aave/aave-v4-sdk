import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type UnexpectedError,
} from '@aave/client';
import { previewPlan } from '@aave/client/actions';
import {
  type PreviewPlan,
  PreviewPlanQuery,
  type PreviewPlanRequest,
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
 * Preview the impact of a multi-transaction plan on a user's positions.
 *
 * `positions` previews each action against current state, while `positionOutcomes`
 * carries the combined values per position once every action in the plan has run.
 *
 * ```tsx
 * const [getPreview, previewing] = usePreviewPlanAction();
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
export function usePreviewPlanAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<PreviewPlanRequest, PreviewPlan, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: PreviewPlanRequest) =>
      previewPlan(client, request, {
        currency: options.currency,
        requestPolicy: 'network-only',
      }),
    [client, options.currency],
  );
}

export type UsePreviewPlanArgs = Prettify<
  PreviewPlanRequest & CurrencyQueryOptions
>;

/**
 * Fetch a preview of a multi-transaction plan.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = usePreviewPlan({
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
export function usePreviewPlan(
  args: UsePreviewPlanArgs & Suspendable,
): SuspenseResult<PreviewPlan>;
/**
 * Fetch a preview of a multi-transaction plan.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = usePreviewPlan({
 *   actions: [],
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function usePreviewPlan(
  args: Pausable<UsePreviewPlanArgs> & Suspendable,
): PausableSuspenseResult<PreviewPlan>;
/**
 * Fetch a preview of a multi-transaction plan.
 *
 * ```tsx
 * const { data, error, loading } = usePreviewPlan({
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
export function usePreviewPlan(
  args: UsePreviewPlanArgs,
): ReadResult<PreviewPlan>;
/**
 * Fetch a preview of a multi-transaction plan.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = usePreviewPlan({
 *   actions: [],
 *   pause: true,
 * });
 * ```
 */
export function usePreviewPlan(
  args: Pausable<UsePreviewPlanArgs>,
): PausableReadResult<PreviewPlan>;

export function usePreviewPlan({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UsePreviewPlanArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<PreviewPlan, UnexpectedError> {
  return useSuspendableQuery({
    document: PreviewPlanQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}
