import type { AaveClient } from '@aave/client';
import {
  ActivitiesQuery,
  type BorrowRequest,
  decodeReserveId,
  decodeSpokeId,
  decodeUserPositionId,
  type Hub,
  HubQuery,
  HubsQuery,
  isChainIdsVariant,
  isSpokeInputVariant,
  isTokensVariant,
  isTxHashInputVariant,
  PendingOrdersQuery,
  type RepayRequest,
  type Reserve,
  ReserveHoldersQuery,
  type ReserveId,
  ReserveQuery,
  ReservesQuery,
  type Spoke,
  type SpokeId,
  type SpokeInput,
  SpokePositionManagersQuery,
  SpokeQuery,
  SpokesQuery,
  type SupplyRequest,
  type SwapOperation,
  UserBalancesQuery,
  UserBorrowsQuery,
  type UserBorrowsRequestQuery,
  UserClaimableRewardsQuery,
  type UserPosition,
  type UserPositionId,
  UserPositionQuery,
  UserPositionsQuery,
  UserRiskPremiumBreakdownQuery,
  type UserSummaryFilter,
  UserSummaryHistoryQuery,
  UserSummaryQuery,
  UserSuppliesQuery,
  type UserSuppliesRequestQuery,
  type WithdrawRequest,
} from '@aave/graphql';
import { type ChainId, type EvmAddress, ResultAsync } from '@aave/types';

function extractUserSuppliesRequestUser(
  query: UserSuppliesRequestQuery,
): EvmAddress {
  if ('userSpoke' in query) return query.userSpoke.user;
  if ('userToken' in query) return query.userToken.user;
  if ('userTokenInfo' in query) return query.userTokenInfo.user;
  if ('userSymbol' in query) return query.userSymbol.user;
  if ('userChains' in query) return query.userChains.user;
  if ('userHub' in query) return query.userHub.user;

  const { user } = decodeUserPositionId(query.userPositionId);
  return user;
}

function extractUserBorrowsRequestUser(
  query: UserBorrowsRequestQuery,
): EvmAddress {
  if ('userSpoke' in query) return query.userSpoke.user;
  if ('userToken' in query) return query.userToken.user;
  if ('userTokenInfo' in query) return query.userTokenInfo.user;
  if ('userSymbol' in query) return query.userSymbol.user;
  if ('userChains' in query) return query.userChains.user;
  if ('userHub' in query) return query.userHub.user;

  const { user } = decodeUserPositionId(query.userPositionId);
  return user;
}

/**
 * @internal
 */
export function refreshUserBalances(client: AaveClient, user: EvmAddress) {
  return client.refreshQueryWhere(
    UserBalancesQuery,
    (variables) => variables.request.user === user,
  );
}

/**
 * @internal
 */
export function refreshUserSupplies(client: AaveClient, user: EvmAddress) {
  return client.refreshQueryWhere(
    UserSuppliesQuery,
    (variables) =>
      extractUserSuppliesRequestUser(variables.request.query) === user,
  );
}

/**
 * @internal
 */
export function refreshUserActivities(client: AaveClient, user: EvmAddress) {
  // A tx hash names one immutable row
  return client.refreshQueryWhere(
    ActivitiesQuery,
    (variables) =>
      variables.request.user === user &&
      !isTxHashInputVariant(variables.request.query),
  );
}

/**
 * @internal
 */
export function refreshUserBorrows(client: AaveClient, user: EvmAddress) {
  return client.refreshQueryWhere(
    UserBorrowsQuery,
    (variables) =>
      extractUserBorrowsRequestUser(variables.request.query) === user,
  );
}

/**
 * @internal
 */
export function refreshUserClaimableRewards(
  client: AaveClient,
  user: EvmAddress,
  chainId?: ChainId,
) {
  return client.refreshQueryWhere(
    UserClaimableRewardsQuery,
    (variables) =>
      variables.request.user === user &&
      (chainId === undefined ||
        variables.request.chainId === chainId ||
        variables.request.chainIds?.includes(chainId) === true),
  );
}

/**
 * @internal
 */
export function refreshUserPositions(
  client: AaveClient,
  user: EvmAddress,
  spoke: SpokeInput,
) {
  const isMatch = (position: UserPosition) =>
    position.spoke.chain.chainId === spoke.chainId &&
    position.spoke.address === spoke.address &&
    position.user === user;

  return ResultAsync.combine([
    // Matched on the request: a first action on a spoke opens a position the cached list does not hold yet
    client.refreshQueryWhere(
      UserPositionsQuery,
      (variables) =>
        variables.request.user === user &&
        (isChainIdsVariant(variables.request.filter)
          ? variables.request.filter.chainIds.includes(spoke.chainId)
          : isTokensVariant(variables.request.filter) &&
            variables.request.filter.tokens.some(
              (token) => token.chainId === spoke.chainId,
            )),
    ),
    client.refreshQueryWhere(
      UserPositionQuery,
      (_, data) => data !== null && isMatch(data),
    ),
  ]);
}

/**
 * @internal
 */
export function refreshPendingOrders(client: AaveClient) {
  return client.refreshQueryWhere(PendingOrdersQuery, () => true);
}

/**
 * @internal
 */
export function refreshReserves(client: AaveClient, ids: ReserveId[]) {
  const isMatch = (reserve: Reserve) => ids.includes(reserve.id);

  return ResultAsync.combine([
    client.refreshQueryWhere(
      ReserveQuery,
      (_, data) => data !== null && isMatch(data),
    ),
    client.refreshQueryWhere(ReservesQuery, (_, data) => data.some(isMatch)),
  ]);
}

/**
 * @internal
 */
export function refreshReserveHolders(client: AaveClient, ids: ReserveId[]) {
  const decodedIds = ids.map(decodeReserveId);

  return client.refreshQueryWhere(ReserveHoldersQuery, (variables) => {
    const { reserve } = variables.request;

    if ('reserveId' in reserve) {
      return ids.includes(reserve.reserveId);
    }

    return decodedIds.some(
      (decoded) =>
        reserve.reserveInput.chainId === decoded.chainId &&
        reserve.reserveInput.spoke === decoded.spoke &&
        reserve.reserveInput.onChainId === decoded.onChainId,
    );
  });
}

function isSameSpoke(a: SpokeInput, b: SpokeInput): boolean {
  return a.chainId === b.chainId && a.address === b.address;
}

function positionCovers(
  id: UserPositionId,
  user: EvmAddress,
  spoke: SpokeInput,
): boolean {
  const position = decodeUserPositionId(id);
  return (
    position.user === user &&
    isSameSpoke({ chainId: position.chainId, address: position.spoke }, spoke)
  );
}

// No filter is the whole account, which any spoke moves
function summaryFilterCovers(
  filter: UserSummaryFilter | null | undefined,
  user: EvmAddress,
  spoke: SpokeInput,
): boolean {
  if (!filter) return true;
  if (isSpokeInputVariant(filter)) return isSameSpoke(filter.spoke, spoke);
  if (isChainIdsVariant(filter)) return filter.chainIds.includes(spoke.chainId);
  if ('spokeId' in filter && filter.spokeId) {
    return isSameSpoke(decodeSpokeId(filter.spokeId), spoke);
  }
  if ('userPositionId' in filter && filter.userPositionId) {
    return positionCovers(filter.userPositionId, user, spoke);
  }
  return false;
}

/**
 * @internal
 */
export function refreshUserSummary(
  client: AaveClient,
  user: EvmAddress,
  spoke: SpokeInput,
) {
  return client.refreshQueryWhere(
    UserSummaryQuery,
    (variables) =>
      variables.request.user === user &&
      summaryFilterCovers(variables.request.filter, user, spoke),
  );
}

/**
 * @internal
 */
export function refreshUserSummaryHistory(
  client: AaveClient,
  user: EvmAddress,
  spoke: SpokeInput,
) {
  return client.refreshQueryWhere(
    UserSummaryHistoryQuery,
    (variables) =>
      variables.request.user === user &&
      summaryFilterCovers(variables.request.filter, user, spoke),
  );
}

/**
 * @internal
 */
export function refreshUserRiskPremium(
  client: AaveClient,
  user: EvmAddress,
  spoke: SpokeInput,
) {
  return client.refreshQueryWhere(
    UserRiskPremiumBreakdownQuery,
    (variables) => {
      const { query } = variables.request;
      if (variables.request.user !== user) return false;
      if ('userSpoke' in query && query.userSpoke) {
        return isSameSpoke(decodeSpokeId(query.userSpoke.spoke), spoke);
      }
      if ('userPositionId' in query && query.userPositionId) {
        return positionCovers(query.userPositionId, user, spoke);
      }
      return false;
    },
  );
}

/**
 * @internal
 */
export function refreshSpokes(client: AaveClient, spoke: SpokeInput) {
  const isMatch = (item: Spoke) =>
    item.chain.chainId === spoke.chainId && item.address === spoke.address;

  return ResultAsync.combine([
    client.refreshQueryWhere(
      SpokeQuery,
      (_, data) => data !== null && isMatch(data),
    ),
    client.refreshQueryWhere(SpokesQuery, (_, data) => data.some(isMatch)),
  ]);
}

/**
 * @internal
 */
export function refreshHubs(client: AaveClient, chainId: ChainId) {
  const isMatch = (hub: Hub) => hub.chain.chainId === chainId;

  return ResultAsync.combine([
    client.refreshQueryWhere(
      HubQuery,
      (_, data) => data !== null && isMatch(data),
    ),
    client.refreshQueryWhere(HubsQuery, (_, data) => data.some(isMatch)),
  ]);
}

/**
 * @internal
 */
export function refreshSpokePositionManagers(
  client: AaveClient,
  spoke: SpokeId,
) {
  return client.refreshQueryWhere(
    SpokePositionManagersQuery,
    (variables) => variables.request.spoke === spoke,
  );
}

/**
 * @internal
 */
export function refreshUserPositionById(
  client: AaveClient,
  userPositionId: UserPositionId,
) {
  return ResultAsync.combine([
    client.refreshQueryWhere(UserPositionsQuery, (_, data) =>
      data.some((position) => position.id === userPositionId),
    ),
    client.refreshQueryWhere(
      UserPositionQuery,
      (_, data) => data?.id === userPositionId,
    ),
  ]);
}

/**
 * @internal
 */
export function refreshAfterPositionChange(
  client: AaveClient,
  user: EvmAddress,
  reserves: ReserveId[],
) {
  const spokes = new Map<string, SpokeInput>();
  for (const reserve of reserves) {
    const { chainId, spoke: address } = decodeReserveId(reserve);
    spokes.set(`${chainId}:${address}`, { chainId, address });
  }
  const chainIds = new Set([...spokes.values()].map((spoke) => spoke.chainId));

  return ResultAsync.combine([
    ...[...spokes.values()].flatMap((spoke) => [
      refreshUserPositions(client, user, spoke),
      refreshUserSummary(client, user, spoke),
      refreshUserSummaryHistory(client, user, spoke),
      refreshUserRiskPremium(client, user, spoke),
      refreshSpokes(client, spoke),
    ]),
    refreshReserves(client, reserves),
    refreshReserveHolders(client, reserves),
    refreshUserBalances(client, user),
    refreshUserSupplies(client, user),
    refreshUserBorrows(client, user),
    refreshUserActivities(client, user),
    ...[...chainIds].map((chainId) => refreshHubs(client, chainId)),
  ]);
}

/**
 * @internal
 */
export function refreshQueriesForReserveChange(
  client: AaveClient,
  request: SupplyRequest | BorrowRequest | RepayRequest | WithdrawRequest,
) {
  return refreshAfterPositionChange(client, request.sender, [request.reserve]);
}

/**
 * @internal
 */
export function refreshAfterTokenSwap(client: AaveClient, user: EvmAddress) {
  return ResultAsync.combine([
    refreshUserBalances(client, user),
    refreshUserActivities(client, user),
  ]);
}

function reservesMovedBy(operation: SwapOperation): ReserveId[] {
  switch (operation.__typename) {
    case 'SupplySwap':
    case 'BorrowSwap':
      return [operation.sell.reserve.id, operation.buy.reserve.id];
    case 'RepayWithSupply':
      return [operation.repay.reserve.id, operation.supply.reserve.id];
    case 'WithdrawSwap':
      return [operation.withdraw.reserve.id];
    case 'Leverage':
      return [operation.collateral.reserve.id, operation.debt.reserve.id];
    case 'TokenSwap':
      return [];
  }
}

/**
 * @internal
 */
export function refreshAfterOrderSettled(
  client: AaveClient,
  user: EvmAddress,
  order: { operation: SwapOperation },
) {
  if (order.operation.__typename === 'TokenSwap') {
    return refreshAfterTokenSwap(client, user);
  }
  return refreshAfterPositionChange(
    client,
    user,
    reservesMovedBy(order.operation),
  );
}
