import type {
  AnySelectionSet,
  AnyVariables,
  BigDecimal,
  BlockchainData,
  ChainId,
  Cursor,
  EvmAddress,
  JSONString,
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
  ActivityFeedType,
  ApyMetric,
  ChainsFilter,
  Currency,
  HubAssetStatusType,
  HubAssetsRequestOrderBy,
  OperationType,
  OrderDirection,
  PageSize,
  ReservesRequestFilter,
  SwapKind,
  SwapStatusFilter,
  TimeWindow,
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
    ActivityFeedType: ActivityFeedType;
    AlwaysTrue: true;
    ApyMetric: ApyMetric;
    AssetId: AssetId;
    BigDecimal: BigDecimal;
    BigInt: bigint;
    BlockchainData: BlockchainData;
    Boolean: boolean;
    ChainsFilter: ChainsFilter;
    ChainId: ChainId;
    Currency: Currency;
    Cursor: Cursor;
    DateTime: Date;
    EvmAddress: EvmAddress;
    Float: number;
    HubAssetId: HubAssetId;
    HubAssetStatusType: HubAssetStatusType;
    HubAssetsRequestOrderBy: HubAssetsRequestOrderBy;
    HubId: HubId;
    ID: ID;
    Int: number;
    OnChainHubAssetId: OnChainHubAssetId;
    OnChainReserveId: OnChainReserveId;
    OperationType: OperationType;
    OrderDirection: OrderDirection;
    PageSize: PageSize;
    ReserveId: ReserveId;
    ReservesRequestFilter: ReservesRequestFilter;
    Signature: Signature;
    SpokeId: SpokeId;
    String: string;
    SwapId: SwapId;
    SwapKind: SwapKind;
    SwapQuoteId: SwapQuoteId;
    SwapStatusFilter: SwapStatusFilter;
    TimeWindow: TimeWindow;
    JSON: JSONString;
    TxHash: TxHash;
    UserBalanceId: UserBalanceId;
    UserBorrowItemId: UserBorrowItemId;
    UserPositionId: UserPositionId;
    UserSupplyItemId: UserSupplyItemId;
    Void: Void;
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
