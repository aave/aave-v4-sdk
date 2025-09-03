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
} from '@aave/types';
import {
  type DocumentDecoration,
  initGraphQLTada,
  type TadaDocumentNode,
} from 'gql.tada';
import type {
  BestBorrowReserveFilter,
  BestSupplyReserveFilter,
  ChainsFilter,
  HubAssetStatusType,
  HubAssetsRequestOrderBy,
  OperationType,
  OrderDirection,
  PageSize,
  TimeWindow,
  VaultUserActivityTimeWindow,
  VaultUserHistoryAction,
} from './enums';
import type { introspection } from './graphql-env';

export type { FragmentOf } from 'gql.tada';

export const graphql = initGraphQLTada<{
  disableMasking: true;
  introspection: introspection;
  scalars: {
    AlwaysTrue: true;
    AssetId: ID;
    BestBorrowReserveFilter: BestBorrowReserveFilter;
    BestSupplyReserveFilter: BestSupplyReserveFilter;
    BigDecimal: BigDecimal;
    BigInt: BigIntString;
    BlockchainData: BlockchainData;
    Boolean: boolean;
    ChainsFilter: ChainsFilter;
    ChainId: ChainId;
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
    Signature: Signature;
    String: string;
    SwapId: ID;
    SwapRequestId: ID;
    TxHash: TxHash;
    UserPositionId: UserPositionId;
    Void: Void;
    TimeWindow: TimeWindow;
    VaultUserHistoryAction: VaultUserHistoryAction;
    VaultUserActivityTimeWindow: VaultUserActivityTimeWindow;
  };
}>();

/**
 * @internal
 */
export type RequestOf<Document> = Document extends DocumentDecoration<
  unknown,
  { request: infer Request }
>
  ? Request
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
