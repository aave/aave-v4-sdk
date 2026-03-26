import {
  type ActivitiesQuery,
  type Asset,
  type BoostedRateId,
  type BorrowActivity,
  type BorrowPoints,
  type BorrowSwapActivity,
  type Chain,
  decodeSpokeId,
  type Erc20Token,
  encodeHubId,
  encodeReserveId,
  encodeUserPositionId,
  type Hub,
  type HubAsset,
  type HubQuery,
  isHubInputVariant,
  isReserveInputVariant,
  isTxHashInputVariant,
  type LiquidatedActivity,
  type MerklBorrowReward,
  type MerklGenericCriteria,
  type MerklSupplyReward,
  type NativeToken,
  type PointsGenericCriteria,
  type PointsProgram,
  type RepayActivity,
  type RepayWithSupplyActivity,
  type Reserve,
  type ReserveInfo,
  type ReserveQuery,
  type Spoke,
  type StableVault,
  type StableVaultUserPosition,
  type SupplyActivity,
  type SupplyPoints,
  type SupplySwapActivity,
  type TokenInfo,
  type TokenMovementRecord,
  type TokenSwapActivity,
  type UpdatedDynamicConfigActivity,
  type UpdatedRiskPremiumActivity,
  type UserMerklClaimableReward,
  type UserPosition,
  type UserPositionQuery,
  type UsingAsCollateralActivity,
  type VariablesOf,
  type WithdrawActivity,
  type WithdrawSwapActivity,
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
    PermitTypedData: {
      signedAmount: transformToBigDecimal,
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
    BorrowPointsReward: {
      startDate: transformToDate,
      endDate: transformToNullableDate,
    },
    PreviewBorrowPointsReward: {
      startDate: transformToDate,
      endDate: transformToNullableDate,
    },
    PreviewMerklBorrowReward: {
      startDate: transformToDate,
      endDate: transformToDate,
    },
    PreviewMerklSupplyReward: {
      startDate: transformToDate,
      endDate: transformToDate,
    },
    PreviewSupplyPointsReward: {
      startDate: transformToDate,
      endDate: transformToNullableDate,
    },
    SupplyPointsReward: {
      startDate: transformToDate,
      endDate: transformToNullableDate,
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
    MerklBorrowReward: {
      startDate: transformToDate,
      endDate: transformToDate,
    },
    MerklSupplyReward: {
      startDate: transformToDate,
      endDate: transformToDate,
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
    TokenSwapActivity: {
      timestamp: transformToDate,
    },
    SupplySwapActivity: {
      timestamp: transformToDate,
    },
    BorrowSwapActivity: {
      timestamp: transformToDate,
    },
    RepayWithSupplyActivity: {
      timestamp: transformToDate,
    },
    WithdrawSwapActivity: {
      timestamp: transformToDate,
    },
    UserMerklClaimableReward: {
      startDate: transformToDate,
      endDate: transformToDate,
      claimUntil: transformToDate,
    },
    UserPosition: {
      createdAt: transformToDate,
    },
    UserBorrowItem: {
      createdAt: transformToNullableDate,
    },
    UserSupplyItem: {
      createdAt: transformToNullableDate,
    },
    SpokeUserPositionManager: {
      approvedOn: transformToDate,
    },
    SwapCancelled: {
      createdAt: transformToDate,
      cancelledAt: transformToNullableDate,
    },
    SwapCancelledResult: {
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
    StableVaultSummary: {
      shares: transformToBigInt,
      totalDeposits: transformToBigDecimal,
      userCount: transformToBigInt,
    },
    StableVaultWithdrawClaim: {
      executableAfter: transformToDate,
    },
    TokenMovementRecord: {
      timestamp: transformToDate,
    },
    StableVaultPendingAvailability: {
      executableAfter: transformToDate,
    },
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

      reserve: (_, { request }: VariablesOf<typeof ReserveQuery>) => {
        if (isReserveInputVariant(request.query)) {
          return {
            __typename: 'Reserve',
            id: encodeReserveId(request.query.reserveInput),
          };
        }
        return {
          __typename: 'Reserve',
          id: request.query.reserveId,
        };
      },

      userPosition: (_, { request }: VariablesOf<typeof UserPositionQuery>) => {
        if ('userSpoke' in request && request.userSpoke) {
          const { chainId, address } = decodeSpokeId(request.userSpoke.spoke);
          return {
            __typename: 'UserPosition',
            id: encodeUserPositionId({
              chainId,
              spoke: address,
              user: request.userSpoke.user,
            }),
          };
        }
        if ('id' in request && request.id) {
          return {
            __typename: 'UserPosition',
            id: request.id,
          };
        }
        return undefined;
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
    // Entities with id field as key
    Asset: (data: Asset) => data.id,
    BorrowActivity: (data: BorrowActivity) => data.id,
    BorrowPointsReward: (data: BorrowPoints) => data.id,
    BorrowSwapActivity: (data: BorrowSwapActivity) => data.id,
    // URQL SystemFields & DataFields doesn't play ball with the bigint scalar (BoostedRate.userCounts field),
    // hence the type assertion to BoostedRateId which is a string alias of the id
    BoostedRate: (data) => data.id as BoostedRateId,
    Hub: (data: Hub) => data.id,
    HubAsset: (data: HubAsset) => data.id,
    LiquidatedActivity: (data: LiquidatedActivity) => data.id,
    MerklBorrowReward: (data: MerklBorrowReward) => data.id,
    MerklGenericCriteria: (data: MerklGenericCriteria) => data.id,
    MerklSupplyReward: (data: MerklSupplyReward) => data.id,
    PointsGenericCriteria: (data: PointsGenericCriteria) => data.id,
    PointsProgram: (data: PointsProgram) => data.id,
    RepayActivity: (data: RepayActivity) => data.id,
    RepayWithSupplyActivity: (data: RepayWithSupplyActivity) => data.id,
    Reserve: (data: Reserve) => data.id,
    ReserveInfo: (data: ReserveInfo) => data.id,
    Spoke: (data: Spoke) => data.id,
    StableVault: (data: StableVault) => data.id,
    StableVaultUserPosition: (data: StableVaultUserPosition) => data.id,
    SupplyActivity: (data: SupplyActivity) => data.id,
    SupplyPointsReward: (data: SupplyPoints) => data.id,
    SupplySwapActivity: (data: SupplySwapActivity) => data.id,
    TokenInfo: (data: TokenInfo) => data.id,
    TokenMovementRecord: (data: TokenMovementRecord) => data.id,
    TokenSwapActivity: (data: TokenSwapActivity) => data.id,
    UpdatedDynamicConfigActivity: (data: UpdatedDynamicConfigActivity) =>
      data.id,
    UpdatedRiskPremiumActivity: (data: UpdatedRiskPremiumActivity) => data.id,
    UserMerklClaimableReward: (data: UserMerklClaimableReward) => data.id,
    UserPosition: (data: UserPosition) => data.id,
    UsingAsCollateralActivity: (data: UsingAsCollateralActivity) => data.id,
    WithdrawActivity: (data: WithdrawActivity) => data.id,
    WithdrawSwapActivity: (data: WithdrawSwapActivity) => data.id,

    // Entities with address field as key
    Erc20Token: (data: Erc20Token) => data.address,

    // Entities with other fields as key
    Chain: (data: Chain) => data.chainId.toString(),
    NativeToken: (data: NativeToken) => data.chain.chainId.toString(),

    // Value objects and result types
    ApySample: () => null,
    AssetAmountWithChange: () => null,
    AssetBorrowSample: () => null,
    AssetPriceSample: () => null,
    AssetSampleBreakdown: () => null,
    AssetSummary: () => null,
    AssetSupplySample: () => null,
    BorrowSwap: () => null,
    BorrowSwapQuoteResult: () => null,
    CollateralFactorVariation: () => null,
    DecimalNumber: () => null,
    DecimalNumberWithChange: () => null,
    DomainData: () => null,
    Erc20Amount: () => null,
    Erc20Approval: () => null,
    Erc20ApprovalRequired: () => null,
    ExchangeAmount: () => null,
    ExchangeAmountVariation: () => null,
    ExchangeAmountWithChange: () => null,
    ForkTopUpResponse: () => null,
    HealthFactorError: () => null,
    HealthFactorVariation: () => null,
    HealthFactorWithChange: () => null,
    HubAssetInterestRateModelPoint: () => null,
    HubAssetInterestRateModelResult: () => null,
    HubAssetSettings: () => null,
    HubAssetSummary: () => null,
    HubAssetUserState: () => null,
    HubSummary: () => null,
    HubSummarySample: () => null,
    InsufficientBalanceError: () => null,
    InsufficientLiquidityError: () => null,
    LiquidationFeeVariation: () => null,
    MaxLiquidationBonusVariation: () => null,
    NativeAmount: () => null,
    PaginatedActivitiesResult: () => null,
    PaginatedResultInfo: () => null,
    PaginatedSpokePositionManagerResult: () => null,
    PaginatedSpokeUserPositionManagerResult: () => null,
    PaginatedStableVaultMovementsResult: () => null,
    PaginatedStableVaultRateUsersResult: () => null,
    PaginatedUserSwapsResult: () => null,
    PercentNumber: () => null,
    PercentNumberChangeSnapshot: () => null,
    PercentNumberVariation: () => null,
    PercentNumberWithChange: () => null,
    PermitTypedData: () => null,
    PositionAmount: () => null,
    PositionSwapAdapterContractApproval: () => null,
    PositionSwapByIntentApprovalsRequired: () => null,
    PositionSwapPositionManagerApproval: () => null,
    PreContractActionRequired: () => null,
    PrepareSwapCancelResult: () => null,
    PrepareSwapOrder: () => null,
    PreviewBorrowPointsReward: () => null,
    PreviewMerklBorrowReward: () => null,
    PreviewMerklSupplyReward: () => null,
    PreviewReserveRates: () => null,
    PreviewRewardOutcome: () => null,
    PreviewSupplyPointsReward: () => null,
    PreviewUserPosition: () => null,
    ProtocolHistorySample: () => null,
    RepayWithSupply: () => null,
    RepayWithSupplyQuoteResult: () => null,
    ReserveSettings: () => null,
    ReserveStatus: () => null,
    ReserveSummary: () => null,
    ReserveUserState: () => null,
    SpokePositionManager: () => null,
    SpokeUserPositionManager: () => null,
    StableVaultPendingAvailability: () => null,
    StableVaultRates: () => null,
    StableVaultSummary: () => null,
    StableVaultWithdrawClaim: () => null,
    SupplySwap: () => null,
    SupplySwapQuoteResult: () => null,
    SwapByIntent: () => null,
    SwapByIntentWithApprovalRequired: () => null,
    SwapByTransaction: () => null,
    SwapCancelled: () => null,
    SwapCancelledResult: () => null,
    SwapExpired: () => null,
    SwapFulfilled: () => null,
    SwapOpen: () => null,
    SwapPendingSignature: () => null,
    SwapQuote: () => null,
    SwapQuoteCosts: () => null,
    SwapReceipt: () => null,
    SwapTransactionRequest: () => null,
    SwapTypedData: () => null,
    TokenMovementAllocate: () => null,
    TokenMovementBridgeIn: () => null,
    TokenMovementBridgeOut: () => null,
    TokenMovementDeallocate: () => null,
    TokenMovementRebalance: () => null,
    TokenMovementSwap: () => null,
    TokenSwap: () => null,
    TokenSwapQuoteResult: () => null,
    TransactionRequest: () => null,
    UserBalance: () => null,
    UserBorrowItem: () => null,
    UserPositionRiskPremium: () => null,
    UserRiskPremiumBreakdownItem: () => null,
    UserSummary: () => null,
    UserSummaryHistoryItem: () => null,
    UserSupplyItem: () => null,
    WithdrawSwap: () => null,
    WithdrawSwapQuoteResult: () => null,
  },
});
