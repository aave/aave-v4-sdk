import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type TimeWindowQueryOptions,
  type UnexpectedError,
} from '@aave/client-next';
import {
  type Asset,
  AssetPriceHistoryQuery,
  type AssetPriceHistoryRequest,
  type AssetPriceSample,
  AssetQuery,
  type AssetRequest,
} from '@aave/graphql-next';
import type { NullishDeep, Prettify } from '@aave/types-next';
import {
  type Pausable,
  type PausableReadResult,
  type PausableSuspenseResult,
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  useSuspendableQuery,
} from './helpers';

export type UseAssetArgs = Prettify<
  AssetRequest & CurrencyQueryOptions & TimeWindowQueryOptions
>;

/**
 * Fetch information about a specific asset (ERC20 token) in the protocol.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useAsset({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 *   suspense: true,
 * });
 * // data will be Asset | null
 * ```
 */
export function useAsset(
  args: UseAssetArgs & Suspendable,
): SuspenseResult<Asset | null>;
/**
 * Fetch information about a specific asset (ERC20 token) in the protocol.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useAsset({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useAsset(
  args: Pausable<UseAssetArgs> & Suspendable,
): PausableSuspenseResult<Asset | null>;
/**
 * Fetch information about a specific asset (ERC20 token) in the protocol.
 *
 * ```tsx
 * const { data, error, loading } = useAsset({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 * });
 * // data will be Asset | null
 * ```
 */
export function useAsset(args: UseAssetArgs): ReadResult<Asset | null>;
/**
 * Fetch information about a specific asset (ERC20 token) in the protocol.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useAsset({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 *   pause: true,
 * });
 * ```
 */
export function useAsset(
  args: Pausable<UseAssetArgs>,
): PausableReadResult<Asset | null>;

export function useAsset({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: NullishDeep<UseAssetArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<Asset | null, UnexpectedError> {
  return useSuspendableQuery({
    document: AssetQuery,
    variables: {
      request,
      currency,
      timeWindow,
    },
    suspense,
    pause,
  });
}

export type UseAssetPriceHistoryArgs = AssetPriceHistoryRequest;

/**
 * Fetch historical price data for a specific asset.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useAssetPriceHistory({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 *   currency: Currency.Usd,
 *   window: TimeWindow.LastWeek,
 *   suspense: true,
 * });
 * ```
 */
export function useAssetPriceHistory(
  args: UseAssetPriceHistoryArgs & Suspendable,
): SuspenseResult<AssetPriceSample[]>;
/**
 * Fetch historical price data for a specific asset.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useAssetPriceHistory({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useAssetPriceHistory(
  args: Pausable<UseAssetPriceHistoryArgs> & Suspendable,
): PausableSuspenseResult<AssetPriceSample[]>;
/**
 * Fetch historical price data for a specific asset.
 *
 * ```tsx
 * const { data, error, loading } = useAssetPriceHistory({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 *   currency: Currency.Usd,
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 */
export function useAssetPriceHistory(
  args: UseAssetPriceHistoryArgs,
): ReadResult<AssetPriceSample[]>;
/**
 * Fetch historical price data for a specific asset.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useAssetPriceHistory({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 *   pause: true,
 * });
 * ```
 */
export function useAssetPriceHistory(
  args: Pausable<UseAssetPriceHistoryArgs>,
): PausableReadResult<AssetPriceSample[]>;

export function useAssetPriceHistory({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseAssetPriceHistoryArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<AssetPriceSample[], UnexpectedError> {
  return useSuspendableQuery({
    document: AssetPriceHistoryQuery,
    variables: {
      request,
    },
    suspense,
    pause,
  });
}
