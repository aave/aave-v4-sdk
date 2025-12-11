import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type TimeWindowQueryOptions,
  type UnexpectedError,
} from '@aave/client';
import {
  type Asset,
  AssetBorrowHistoryQuery,
  type AssetBorrowHistoryRequest,
  type AssetBorrowSample,
  AssetCategoryBorrowHistoryQuery,
  type AssetCategoryBorrowHistoryRequest,
  type AssetCategoryBorrowSample,
  AssetCategorySupplyHistoryQuery,
  type AssetCategorySupplyHistoryRequest,
  type AssetCategorySupplySample,
  AssetPriceHistoryQuery,
  type AssetPriceHistoryRequest,
  type AssetPriceSample,
  AssetQuery,
  type AssetRequest,
  AssetSupplyHistoryQuery,
  type AssetSupplyHistoryRequest,
  type AssetSupplySample,
  ProtocolHistoryQuery,
  type ProtocolHistoryRequest,
  type ProtocolHistorySample,
} from '@aave/graphql';
import type { NullishDeep, Prettify } from '@aave/types';
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
 * Fetch information about a specific asset (ERC20 token) in the protocol by ID or by token.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useAsset({
 *   query: { assetId: assetId('SGVsbG8h') },
 *   suspense: true,
 * });
 * // data will be Asset | null
 * ```
 */
export function useAsset(
  args: UseAssetArgs & Suspendable,
): SuspenseResult<Asset | null>;
/**
 * Fetch information about a specific asset (ERC20 token) in the protocol by ID or by token.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useAsset({
 *   query: { assetId: assetId('SGVsbG8h') },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useAsset(
  args: Pausable<UseAssetArgs> & Suspendable,
): PausableSuspenseResult<Asset | null>;
/**
 * Fetch information about a specific asset (ERC20 token) in the protocol by ID or by token.
 *
 * ```tsx
 * const { data, error, loading } = useAsset({
 *   query: { assetId: assetId('SGVsbG8h') },
 * });
 * // data will be Asset | null
 * ```
 */
export function useAsset(args: UseAssetArgs): ReadResult<Asset | null>;
/**
 * Fetch information about a specific asset (ERC20 token) in the protocol by ID or by token.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useAsset({
 *   query: { assetId: assetId('SGVsbG8h') },
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
    batch: false, // Do not batch this since it's a slower than average query
  });
}

export type UseAssetSupplyHistoryArgs = AssetSupplyHistoryRequest;

/**
 * Fetch historical supply data for a specific asset.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useAssetSupplyHistory({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 *   window: TimeWindow.LastWeek,
 *   suspense: true,
 * });
 * ```
 */
export function useAssetSupplyHistory(
  args: UseAssetSupplyHistoryArgs & Suspendable,
): SuspenseResult<AssetSupplySample[]>;
/**
 * Fetch historical supply data for a specific asset.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useAssetSupplyHistory({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useAssetSupplyHistory(
  args: Pausable<UseAssetSupplyHistoryArgs> & Suspendable,
): PausableSuspenseResult<AssetSupplySample[]>;
/**
 * Fetch historical supply data for a specific asset.
 *
 * ```tsx
 * const { data, error, loading } = useAssetSupplyHistory({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 */
export function useAssetSupplyHistory(
  args: UseAssetSupplyHistoryArgs,
): ReadResult<AssetSupplySample[]>;
/**
 * Fetch historical supply data for a specific asset.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useAssetSupplyHistory({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 *   pause: true,
 * });
 * ```
 */
export function useAssetSupplyHistory(
  args: Pausable<UseAssetSupplyHistoryArgs>,
): PausableReadResult<AssetSupplySample[]>;

export function useAssetSupplyHistory({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseAssetSupplyHistoryArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<AssetSupplySample[], UnexpectedError> {
  return useSuspendableQuery({
    document: AssetSupplyHistoryQuery,
    variables: {
      request,
    },
    suspense,
    pause,
    batch: false, // Do not batch this since it's a slower than average query
  });
}

export type UseAssetBorrowHistoryArgs = AssetBorrowHistoryRequest;

/**
 * Fetch historical borrow data for a specific asset.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useAssetBorrowHistory({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 *   window: TimeWindow.LastWeek,
 *   suspense: true,
 * });
 * ```
 */
export function useAssetBorrowHistory(
  args: UseAssetBorrowHistoryArgs & Suspendable,
): SuspenseResult<AssetBorrowSample[]>;
/**
 * Fetch historical borrow data for a specific asset.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useAssetBorrowHistory({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useAssetBorrowHistory(
  args: Pausable<UseAssetBorrowHistoryArgs> & Suspendable,
): PausableSuspenseResult<AssetBorrowSample[]>;
/**
 * Fetch historical borrow data for a specific asset.
 *
 * ```tsx
 * const { data, error, loading } = useAssetBorrowHistory({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 */
export function useAssetBorrowHistory(
  args: UseAssetBorrowHistoryArgs,
): ReadResult<AssetBorrowSample[]>;
/**
 * Fetch historical borrow data for a specific asset.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useAssetBorrowHistory({
 *   token: { chainId: chainId(1), address: evmAddress('0x123...') },
 *   pause: true,
 * });
 * ```
 */
export function useAssetBorrowHistory(
  args: Pausable<UseAssetBorrowHistoryArgs>,
): PausableReadResult<AssetBorrowSample[]>;

export function useAssetBorrowHistory({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseAssetBorrowHistoryArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<AssetBorrowSample[], UnexpectedError> {
  return useSuspendableQuery({
    document: AssetBorrowHistoryQuery,
    variables: {
      request,
    },
    suspense,
    pause,
    batch: false, // Do not batch this since it's a slower than average query
  });
}

export type UseAssetCategoryBorrowHistoryArgs = Prettify<
  AssetCategoryBorrowHistoryRequest & CurrencyQueryOptions
>;

/**
 * Fetch historical borrow data for a specific token category.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useAssetCategoryBorrowHistory({
 *   category: TokenCategory.Stablecoin,
 *   window: TimeWindow.LastWeek,
 *   suspense: true,
 * });
 * ```
 */
export function useAssetCategoryBorrowHistory(
  args: UseAssetCategoryBorrowHistoryArgs & Suspendable,
): SuspenseResult<AssetCategoryBorrowSample[]>;
/**
 * Fetch historical borrow data for a specific token category.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useAssetCategoryBorrowHistory({
 *   category: TokenCategory.Stablecoin,
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useAssetCategoryBorrowHistory(
  args: Pausable<UseAssetCategoryBorrowHistoryArgs> & Suspendable,
): PausableSuspenseResult<AssetCategoryBorrowSample[]>;
/**
 * Fetch historical borrow data for a specific token category.
 *
 * ```tsx
 * const { data, error, loading } = useAssetCategoryBorrowHistory({
 *   category: TokenCategory.Stablecoin,
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 */
export function useAssetCategoryBorrowHistory(
  args: UseAssetCategoryBorrowHistoryArgs,
): ReadResult<AssetCategoryBorrowSample[]>;
/**
 * Fetch historical borrow data for a specific token category.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useAssetCategoryBorrowHistory({
 *   category: TokenCategory.Stablecoin,
 *   pause: true,
 * });
 * ```
 */
export function useAssetCategoryBorrowHistory(
  args: Pausable<UseAssetCategoryBorrowHistoryArgs>,
): PausableReadResult<AssetCategoryBorrowSample[]>;

export function useAssetCategoryBorrowHistory({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseAssetCategoryBorrowHistoryArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<AssetCategoryBorrowSample[], UnexpectedError> {
  return useSuspendableQuery({
    document: AssetCategoryBorrowHistoryQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
    batch: false, // Do not batch this since it's a slower than average query
  });
}

export type UseAssetCategorySupplyHistoryArgs = Prettify<
  AssetCategorySupplyHistoryRequest & CurrencyQueryOptions
>;

/**
 * Fetch historical supply data for a specific token category.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useAssetCategorySupplyHistory({
 *   category: TokenCategory.Stablecoin,
 *   window: TimeWindow.LastWeek,
 *   suspense: true,
 * });
 * ```
 */
export function useAssetCategorySupplyHistory(
  args: UseAssetCategorySupplyHistoryArgs & Suspendable,
): SuspenseResult<AssetCategorySupplySample[]>;
/**
 * Fetch historical supply data for a specific token category.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useAssetCategorySupplyHistory({
 *   category: TokenCategory.Stablecoin,
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useAssetCategorySupplyHistory(
  args: Pausable<UseAssetCategorySupplyHistoryArgs> & Suspendable,
): PausableSuspenseResult<AssetCategorySupplySample[]>;
/**
 * Fetch historical supply data for a specific token category.
 *
 * ```tsx
 * const { data, error, loading } = useAssetCategorySupplyHistory({
 *   category: TokenCategory.Stablecoin,
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 */
export function useAssetCategorySupplyHistory(
  args: UseAssetCategorySupplyHistoryArgs,
): ReadResult<AssetCategorySupplySample[]>;
/**
 * Fetch historical supply data for a specific token category.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useAssetCategorySupplyHistory({
 *   category: TokenCategory.Stablecoin,
 *   pause: true,
 * });
 * ```
 */
export function useAssetCategorySupplyHistory(
  args: Pausable<UseAssetCategorySupplyHistoryArgs>,
): PausableReadResult<AssetCategorySupplySample[]>;

export function useAssetCategorySupplyHistory({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseAssetCategorySupplyHistoryArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<AssetCategorySupplySample[], UnexpectedError> {
  return useSuspendableQuery({
    document: AssetCategorySupplyHistoryQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
    batch: false, // Do not batch this since it's a slower than average query
  });
}

export type UseProtocolHistoryArgs = ProtocolHistoryRequest;

/**
 * Fetch historical protocol-wide data (deposits, borrows, earnings).
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useProtocolHistory({
 *   currency: Currency.Usd,
 *   window: TimeWindow.LastWeek,
 *   suspense: true,
 * });
 * ```
 */
export function useProtocolHistory(
  args: UseProtocolHistoryArgs & Suspendable,
): SuspenseResult<ProtocolHistorySample[]>;
/**
 * Fetch historical protocol-wide data (deposits, borrows, earnings).
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useProtocolHistory({
 *   currency: Currency.Usd,
 *   window: TimeWindow.LastWeek,
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useProtocolHistory(
  args: Pausable<UseProtocolHistoryArgs> & Suspendable,
): PausableSuspenseResult<ProtocolHistorySample[]>;
/**
 * Fetch historical protocol-wide data (deposits, borrows, earnings).
 *
 * ```tsx
 * const { data, error, loading } = useProtocolHistory({
 *   currency: Currency.Usd,
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 */
export function useProtocolHistory(
  args: UseProtocolHistoryArgs,
): ReadResult<ProtocolHistorySample[]>;
/**
 * Fetch historical protocol-wide data (deposits, borrows, earnings).
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useProtocolHistory({
 *   currency: Currency.Usd,
 *   window: TimeWindow.LastWeek,
 *   pause: true,
 * });
 * ```
 */
export function useProtocolHistory(
  args: Pausable<UseProtocolHistoryArgs>,
): PausableReadResult<ProtocolHistorySample[]>;

export function useProtocolHistory({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseProtocolHistoryArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<ProtocolHistorySample[], UnexpectedError> {
  return useSuspendableQuery({
    document: ProtocolHistoryQuery,
    variables: {
      request,
    },
    suspense,
    pause,
    batch: false, // Do not batch this since it's a slower than average query
  });
}
