import type {
  AnySelectionSet,
  AnyVariables,
  BigDecimal,
  BigIntString,
  BlockchainData,
  ChainId,
  Cursor,
  DateTime,
  EvmAddress,
  ID,
  ReserveId,
  Signature,
  TxHash,
  TypedSelectionSet,
  UserPositionId,
  Void,
} from '@aave/types-next';
import {
  type DocumentDecoration,
  initGraphQLTada,
  type TadaDocumentNode,
} from 'gql.tada';
import type {
  ActivityType,
  ApyMetric,
  BestBorrowReserveFilter,
  BestSupplyReserveFilter,
  ChainsFilter,
  Currency,
  HubAssetStatusType,
  HubAssetsRequestOrderBy,
  OperationType,
  OrderDirection,
  PageSize,
  ReservesFilterRequest,
  SwapKind,
  TimeWindow,
} from './enums';
import type { introspection } from './graphql-env';

export type { FragmentOf } from 'gql.tada';

export const graphql = initGraphQLTada<{
  disableMasking: true;
  introspection: introspection;
  scalars: {
    ActivityType: ActivityType;
    AlwaysTrue: true;
    ApyMetric: ApyMetric;
    AssetId: ID;
    BestBorrowReserveFilter: BestBorrowReserveFilter;
    BestSupplyReserveFilter: BestSupplyReserveFilter;
    BigDecimal: BigDecimal;
    BigInt: BigIntString;
    BlockchainData: BlockchainData;
    Boolean: boolean;
    ChainsFilter: ChainsFilter;
    ChainId: ChainId;
    Currency: Currency;
    Cursor: Cursor;
    DateTime: DateTime;
    EvmAddress: EvmAddress;
    Float: number;
    HubAssetStatusType: HubAssetStatusType;
    HubAssetsRequestOrderBy: HubAssetsRequestOrderBy;
    ID: ID;
    Int: number;
    OperationType: OperationType;
    OrderDirection: OrderDirection;
    PageSize: PageSize;
    ReserveId: ReserveId;
    ReservesFilterRequest: ReservesFilterRequest;
    Signature: Signature;
    String: string;
    SwapId: ID;
    SwapKind: SwapKind;
    SwapRequestId: ID;
    TimeWindow: TimeWindow;
    TxHash: TxHash;
    UserPositionId: UserPositionId;
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
