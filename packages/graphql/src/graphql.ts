import type {
  AnySelectionSet,
  AnyVariables,
  BigDecimal,
  BlockchainData,
  ChainId,
  Cursor,
  EvmAddress,
  JsonObject,
  Signature,
  TxHash,
  TypedSelectionSet,
  Void,
} from '@aave/types';
import {
  type DocumentDecoration,
  initGraphQLTada,
  type TadaDocumentNode,
} from 'gql.tada';
import type {
  ActivityType,
  ApyMetric,
  BorrowSwapKind,
  ChainsFilter,
  CollateralMetric,
  Currency,
  HubAssetStatusType,
  OperationType,
  OrderDirection,
  PageSize,
  QuoteAccuracy,
  RepayWithSupplyKind,
  ReservesRequestFilter,
  SupplySwapKind,
  SwapKind,
  SwapStatusFilter,
  TimeWindow,
  TokenCategory,
  UserPositionConditionsUpdate,
  WithdrawSwapKind,
} from './enums';
import type { introspection } from './graphql-env';
import type {
  AssetId,
  HubAssetId,
  HubId,
  ID,
  OnChainHubAssetId,
  OnChainReserveId,
  ReserveId,
  SpokeId,
  SwapId,
  SwapQuoteId,
  TokenInfoId,
  UserBalanceId,
  UserBorrowItemId,
  UserPositionId,
  UserSupplyItemId,
} from './id';

export type { FragmentOf, ResultOf, VariablesOf } from 'gql.tada';

export const graphql = initGraphQLTada<{
  disableMasking: true;
  introspection: introspection;
  scalars: {
    ActivityType: ActivityType;
    AlwaysTrue: true;
    ApyMetric: ApyMetric;
    AssetId: AssetId;
    BigDecimal: BigDecimal;
    BigInt: bigint;
    BlockchainData: BlockchainData;
    Boolean: boolean;
    BorrowSwapKind: BorrowSwapKind;
    ChainId: ChainId;
    ChainsFilter: ChainsFilter;
    CollateralMetric: CollateralMetric;
    Currency: Currency;
    RepayWithSupplyKind: RepayWithSupplyKind;
    Cursor: Cursor;
    DateTime: Date;
    EvmAddress: EvmAddress;
    Float: number;
    HubAssetId: HubAssetId;
    HubAssetStatusType: HubAssetStatusType;
    HubId: HubId;
    ID: ID;
    Int: number;
    JSON: JsonObject;
    OnChainHubAssetId: OnChainHubAssetId;
    OnChainReserveId: OnChainReserveId;
    OperationType: OperationType;
    OrderDirection: OrderDirection;
    PageSize: PageSize;
    QuoteAccuracy: QuoteAccuracy;
    ReserveId: ReserveId;
    ReservesRequestFilter: ReservesRequestFilter;
    Signature: Signature;
    SpokeId: SpokeId;
    String: string;
    SupplySwapKind: SupplySwapKind;
    SwapId: SwapId;
    SwapKind: SwapKind;
    SwapQuoteId: SwapQuoteId;
    SwapStatusFilter: SwapStatusFilter;
    TimeWindow: TimeWindow;
    TokenCategory: TokenCategory;
    TokenInfoId: TokenInfoId;
    TxHash: TxHash;
    UserBalanceId: UserBalanceId;
    UserBorrowItemId: UserBorrowItemId;
    UserPositionConditionsUpdate: UserPositionConditionsUpdate;
    UserPositionId: UserPositionId;
    UserSupplyItemId: UserSupplyItemId;
    Void: Void;
    WithdrawSwapKind: WithdrawSwapKind;
  };
}>();

/**
 * @internal
 */
export type RequestOf<Document> = Document extends DocumentDecoration<
  unknown,
  infer Variables
>
  ? Variables extends { request: infer Request }
    ? Request
    : never
  : never;

/**
 * @internal
 */
export type FragmentDocumentFor<
  TGqlNode extends AnySelectionSet,
  TTypename extends string = TGqlNode extends TypedSelectionSet<infer TTypename>
    ? TTypename
    : never,
  TFragmentName extends string = TTypename,
> = TadaDocumentNode<
  TGqlNode,
  AnyVariables,
  {
    fragment: TFragmentName;
    on: TTypename;
    masked: false;
  }
>;
