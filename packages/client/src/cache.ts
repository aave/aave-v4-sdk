import type {
  BorrowActivity,
  Chain,
  Erc20Token,
  Hub,
  HubAsset,
  LiquidatedActivity,
  NativeToken,
  RepayActivity,
  Reserve,
  ReserveInfo,
  Spoke,
  SupplyActivity,
  SwapActivity,
  SwapByIntent,
  SwapByIntentWithApprovalRequired,
  SwapByTransaction,
  UserPosition,
  WithdrawActivity,
} from '@aave/graphql-next';
import introspectedSchema from '@aave/graphql-next/schema';
import {
  cacheExchange,
  type Resolver,
  type Scalar,
} from '@urql/exchange-graphcache';

const transformToBigInt: Resolver = (parent, _args, _cache, info) => {
  return BigInt(parent[info.fieldName] as string) as unknown as Scalar;
};

export const exchange = cacheExchange({
  schema: introspectedSchema,
  resolvers: {
    PercentValue: {
      raw: transformToBigInt,
    },
    DecimalValue: {
      raw: transformToBigInt,
    },
    TransactionRequest: {
      value: transformToBigInt,
    },
    // Intentionally omitted to keep it as BigIntString
    // PermitMessageData: {
    //   value: transformToBigInt,
    //   nonce: transformToBigInt,
    // },
  },
  keys: {
    // Entitied with composite key
    Hub: (data: Hub) => `Hub:${data.address}/chain:${data.chain.chainId}`,
    HubAsset: (data: HubAsset) =>
      `HubAsset:${data.assetId}/hub:${data.hub.address}/chain:${data.hub.chain.chainId}`,
    Reserve: (data: Reserve) =>
      `Reserve:${data.id}/spoke:${data.spoke.address}/chain:${data.chain.chainId}`,
    ReserveInfo: (data: ReserveInfo) =>
      `ReserveInfo:${data.id}/spoke:${data.spoke.address}/chain:${data.chain.chainId}`,
    Spoke: (data: Spoke) => `Spoke:${data.address}/chain:${data.chain.chainId}`,

    // Entities with id field as key
    BorrowActivity: (data: BorrowActivity) => data.id,
    LiquidatedActivity: (data: LiquidatedActivity) => data.id,
    SupplyActivity: (data: SupplyActivity) => data.id,
    SwapActivity: (data: SwapActivity) => data.id,
    SwapByIntent: (data: SwapByIntent) => data.id,
    SwapByIntentWithApprovalRequired: (
      data: SwapByIntentWithApprovalRequired,
    ) => data.id,
    SwapByTransaction: (data: SwapByTransaction) => data.id,
    UserPosition: (data: UserPosition) => data.id,
    WithdrawActivity: (data: WithdrawActivity) => data.id,
    RepayActivity: (data: RepayActivity) => data.id,

    // Entities with address field as key
    Erc20Token: (data: Erc20Token) => data.address,

    // Entities with other fields as key
    Chain: (data: Chain) => data.chainId.toString(),
    NativeToken: (data: NativeToken) => data.chain.chainId.toString(),

    // Entities without keys will be embedded directly on the parent entity
    PaginatedResultInfo: () => null,
    PaginatedSpokePositionManagerResult: () => null,
    PaginatedSpokeUserPositionManagerResult: () => null,
    PaginatedUserHistoryResult: () => null,
    SpokeConfig: () => null,
    SpokePositionManger: () => null,
    SpokeUserPositionManger: () => null,
    SwapReceipt: () => null,
    SwapTransactionRequest: () => null,

    // Value objects and result types
    ApprovalRequired: () => null,
    APYSample: () => null,
    BigDecimalVariation: () => null,
    BigDecimalWithChange: () => null,
    CancelSwapTypedData: () => null,
    CancelSwapTypeDefinition: () => null,
    DecimalValue: () => null,
    DomainData: () => null,
    Erc20Amount: () => null,
    FiatAmount: () => null,
    FiatAmountValueVariation: () => null,
    FiatAmountWithChange: () => null,
    ForkTopUpResponse: () => null,
    HubAssetSettings: () => null,
    HubAssetSummary: () => null,
    HubAssetUserState: () => null,
    HubSummary: () => null,
    InsufficientBalanceError: () => null,
    NativeAmount: () => null,
    PercentValue: () => null,
    PercentValueVariation: () => null,
    PercentValueWithChange: () => null,
    PermitMessageData: () => null,
    PermitTypedDataResponse: () => null,
    PrepareSwapCancelResult: () => null,
    PreviewUserPositionResult: () => null,
    ReserveSettings: () => null,
    ReserveStatus: () => null,
    ReserveSummary: () => null,
    ReserveUserState: () => null,
    SwapApprovalRequired: () => null,
    SwapByIntentTypedData: () => null,
    SwapByIntentTypeDefinition: () => null,
    SwapCancelled: () => null,
    SwapExpired: () => null,
    SwapFulfilled: () => null,
    SwapOpen: () => null,
    SwapPendingSignature: () => null,
    SwapQuote: () => null,
    SwapQuoteCosts: () => null,
    TokenInfo: () => null,
    TransactionRequest: () => null,
    TypeDefinition: () => null,
    TypeField: () => null,
    UserBalance: () => null,
    UserBorrowItem: () => null,
    UserSummary: () => null,
    UserSummaryHistoryItem: () => null,
    UserSupplyItem: () => null,
  },
});
