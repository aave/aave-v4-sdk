import {
  type ActivitiesQuery,
  type BorrowActivity,
  type Chain,
  type Erc20Token,
  encodeHubId,
  type Hub,
  type HubAsset,
  type HubQuery,
  isHubInputVariant,
  isTxHashInputVariant,
  type LiquidatedActivity,
  type NativeToken,
  type RepayActivity,
  type Reserve,
  type ReserveInfo,
  type Spoke,
  type SupplyActivity,
  type SwapByIntent,
  type SwapByIntentWithApprovalRequired,
  type SwapByTransaction,
  type TokenInfo,
  type UpdatedDynamicConfigActivity,
  type UpdatedRiskPremiumActivity,
  type UserPosition,
  type UsingAsCollateralActivity,
  type VariablesOf,
  type WithdrawActivity,
} from '@aave/graphql';
import introspectedSchema from '@aave/graphql/schema';
import { BigDecimal, type TxHash } from '@aave/types';
import {
  cacheExchange,
  type Resolver,
  type Scalar,
} from '@urql/exchange-graphcache';

const transformToBigInt: Resolver = (parent, _args, _cache, info) => {
  return BigInt(parent[info.fieldName] as string) as unknown as Scalar;
};

const transformToBigDecimal: Resolver = (parent, _args, _cache, info) => {
  return BigDecimal.new(parent[info.fieldName] as string);
};

const transformToNullableBigDecimal: Resolver = (
  parent,
  _args,
  _cache,
  info,
) => {
  const value = parent[info.fieldName];
  if (value === null || value === undefined) {
    return null;
  }
  return transformToBigDecimal(parent, _args, _cache, info);
};

const transformToDate: Resolver = (parent, _args, _cache, info) => {
  return new Date(parent[info.fieldName] as string);
};

const transformToNullableDate: Resolver = (parent, _args, _cache, info) => {
  const value = parent[info.fieldName];
  if (value === null || value === undefined) {
    return null;
  }
  return transformToDate(parent, _args, _cache, info);
};

export const exchange = cacheExchange({
  schema: introspectedSchema,
  resolvers: {
    PercentNumber: {
      onChainValue: transformToBigInt,
      value: transformToBigDecimal,
      normalized: transformToBigDecimal,
    },
    DecimalNumber: {
      onChainValue: transformToBigInt,
      value: transformToBigDecimal,
    },
    ExchangeAmount: {
      value: transformToBigDecimal,
    },
    AssetPriceSample: {
      price: transformToBigDecimal,
      date: transformToDate,
    },
    Reserve: {
      borrowCap: transformToBigDecimal,
      supplyCap: transformToBigDecimal,
    },
    HealthFactorError: {
      current: transformToNullableBigDecimal,
      after: transformToNullableBigDecimal,
    },
    HealthFactorVariation: {
      current: transformToNullableBigDecimal,
      after: transformToNullableBigDecimal,
    },
    HealthFactorWithChange: {
      current: transformToNullableBigDecimal,
    },
    UserSummary: {
      lowestHealthFactor: transformToNullableBigDecimal,
    },
    UserSummaryHistoryItem: {
      healthFactor: transformToNullableBigDecimal,
      date: transformToDate,
    },
    TransactionRequest: {
      value: transformToBigInt,
    },
    ApySample: {
      date: transformToDate,
    },
    AssetBorrowSample: {
      date: transformToDate,
    },
    AssetSupplySample: {
      date: transformToDate,
    },
    HubSummarySample: {
      date: transformToDate,
    },
    ProtocolHistorySample: {
      date: transformToDate,
    },
    BorrowActivity: {
      timestamp: transformToDate,
    },
    LiquidatedActivity: {
      timestamp: transformToDate,
    },
    RepayActivity: {
      timestamp: transformToDate,
    },
    SupplyActivity: {
      timestamp: transformToDate,
    },
    WithdrawActivity: {
      timestamp: transformToDate,
    },
    UsingAsCollateralActivity: {
      timestamp: transformToDate,
    },
    UpdatedDynamicConfigActivity: {
      timestamp: transformToDate,
    },
    UpdatedRiskPremiumActivity: {
      timestamp: transformToDate,
    },
    SpokeUserPositionManager: {
      approvedOn: transformToDate,
    },
    SwapCancelled: {
      createdAt: transformToDate,
      cancelledAt: transformToNullableDate,
    },
    SwapExpired: {
      createdAt: transformToDate,
      expiredAt: transformToDate,
    },
    SwapFulfilled: {
      createdAt: transformToDate,
      fulfilledAt: transformToDate,
    },
    SwapOpen: {
      createdAt: transformToDate,
      deadline: transformToDate,
    },
    SwapPendingSignature: {
      createdAt: transformToDate,
      deadline: transformToDate,
    },
    SwapReceipt: {
      createdAt: transformToDate,
    },
    // Intentionally omitted to keep it as BigIntString
    // PermitMessageData: {
    //   value: transformToBigInt,
    //   nonce: transformToBigInt,
    // },

    Query: {
      hub: (_, { request }: VariablesOf<typeof HubQuery>) => {
        if (isHubInputVariant(request.query)) {
          return {
            __typename: 'Hub',
            id: encodeHubId(request.query.hubInput),
          };
        }
        return {
          __typename: 'Hub',
          id: request.query.hubId,
        };
      },

      activities: (
        _parent,
        args: VariablesOf<typeof ActivitiesQuery>,
        cache,
      ) => {
        // Bail out if not a txHash filter lookup
        if (!isTxHashInputVariant(args.request.query)) {
          return cache.resolve('Query', 'activities', args);
        }

        const { txHash, chainId } = args.request.query.txHash;

        // Collect all cached activities matching txHash
        const matches = cache
          .inspectFields('Query')
          .filter((f) => f.fieldName === 'activities')
          .reduce((set, f) => {
            const pageRef = cache.resolve('Query', f.fieldKey) as string | null;
            if (!pageRef) return set;

            const itemRefs = cache.resolve(pageRef, 'items') as string[] | null;
            if (!itemRefs) return set;

            for (const ref of itemRefs) {
              set.add(ref);
            }
            return set;
          }, new Set<string>())
          .values()
          .toArray()
          .filter((ref) => {
            const itemTxHash = cache.resolve(ref, 'txHash') as TxHash;
            if (itemTxHash !== txHash) return false;

            // Verify chainId via spoke.chain.chainId if present
            const spokeRef = cache.resolve(ref, 'spoke') as string | null;
            if (spokeRef) {
              const chainRef = cache.resolve(spokeRef, 'chain') as
                | string
                | null;
              const itemChainId = chainRef
                ? (cache.resolve(chainRef, 'chainId') as number | undefined)
                : undefined;
              if (typeof itemChainId === 'number') {
                return itemChainId === chainId;
              }
            }
            return true;
          });

        if (matches.length === 0) return undefined;

        return {
          __typename: 'PaginatedActivitiesResult',
          items: matches,
          pageInfo: {
            __typename: 'PaginatedResultInfo',
            prev: null,
            next: null,
          },
        };
      },
    },
  },
  keys: {
    // Entitied with composite key
    Hub: (data: Hub) => data.id,
    HubAsset: (data: HubAsset) => data.id,
    Reserve: (data: Reserve) => data.id,
    ReserveInfo: (data: ReserveInfo) => data.id,
    Spoke: (data: Spoke) => data.id,

    // Entities with id field as key
    BorrowActivity: (data: BorrowActivity) => data.id,
    LiquidatedActivity: (data: LiquidatedActivity) => data.id,
    SupplyActivity: (data: SupplyActivity) => data.id,
    SwapByIntent: (data: SwapByIntent) => data.quote.quoteId,
    SwapByIntentWithApprovalRequired: (
      data: SwapByIntentWithApprovalRequired,
    ) => data.quote.quoteId,
    SwapByTransaction: (data: SwapByTransaction) => data.quote.quoteId,
    UserPosition: (data: UserPosition) => data.id,
    UpdatedDynamicConfigActivity: (data: UpdatedDynamicConfigActivity) =>
      data.id,
    UpdatedRiskPremiumActivity: (data: UpdatedRiskPremiumActivity) => data.id,
    UsingAsCollateralActivity: (data: UsingAsCollateralActivity) => data.id,
    WithdrawActivity: (data: WithdrawActivity) => data.id,
    RepayActivity: (data: RepayActivity) => data.id,
    TokenInfo: (data: TokenInfo) => data.id,

    // Entities with address field as key
    Erc20Token: (data: Erc20Token) => data.address,

    // Entities with other fields as key
    Chain: (data: Chain) => data.chainId.toString(),
    NativeToken: (data: NativeToken) => data.chain.chainId.toString(),

    // Entities without keys will be embedded directly on the parent entity
    PaginatedActivitiesResult: () => null,
    PaginatedResultInfo: () => null,
    PaginatedSpokePositionManagerResult: () => null,
    PaginatedSpokeUserPositionManagerResult: () => null,
    PaginatedUserSwapsResult: () => null,
    SpokePositionManger: () => null,
    SpokeUserPositionManager: () => null,
    SwapReceipt: () => null,
    SwapTransactionRequest: () => null,

    // Value objects and result types
    ApySample: () => null,
    Asset: () => null,
    AssetAmountWithChange: () => null,
    AssetBorrowSample: () => null,
    AssetPriceSample: () => null,
    AssetSummary: () => null,
    AssetSupplySample: () => null,
    DecimalNumber: () => null,
    DecimalNumberWithChange: () => null,
    DomainData: () => null,
    Erc20Amount: () => null,
    Erc20ApprovalRequired: () => null,
    ExchangeAmount: () => null,
    ExchangeAmountVariation: () => null,
    ExchangeAmountWithChange: () => null,
    ForkTopUpResponse: () => null,
    HealthFactorError: () => null,
    HealthFactorVariation: () => null,
    HealthFactorWithChange: () => null,
    HubAssetSettings: () => null,
    HubAssetSummary: () => null,
    HubAssetUserState: () => null,
    HubSummary: () => null,
    HubSummarySample: () => null,
    InsufficientBalanceError: () => null,
    NativeAmount: () => null,
    PercentNumber: () => null,
    PercentNumberVariation: () => null,
    PercentNumberWithChange: () => null,
    PermitMessageData: () => null,
    PermitTypedDataResponse: () => null,
    PreContractActionRequired: () => null,
    PrepareSwapCancelResult: () => null,
    PreviewUserPosition: () => null,
    ProtocolHistorySample: () => null,
    ReserveSettings: () => null,
    ReserveStatus: () => null,
    ReserveSummary: () => null,
    ReserveUserState: () => null,
    SwapApprovalRequired: () => null,
    SwapCancelled: () => null,
    SwapExpired: () => null,
    SwapFulfilled: () => null,
    SwapOpen: () => null,
    SwapPendingSignature: () => null,
    SwapQuote: () => null,
    SwapQuoteCosts: () => null,
    SwapTypedData: () => null,
    TransactionRequest: () => null,
    TypeDefinition: () => null,
    TypeField: () => null,
    UserBalance: () => null,
    UserBorrowItem: () => null,
    UserPositionRiskPremium: () => null,
    UserRiskPremiumBreakdownItem: () => null,
    UserSummary: () => null,
    UserSummaryHistoryItem: () => null,
    UserSupplyItem: () => null,
  },
});
