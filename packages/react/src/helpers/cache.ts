import type { AaveClient } from '@aave/client';
import {
  decodeUserPositionId,
  type Hub,
  HubQuery,
  HubsQuery,
  isChainIdsVariant,
  isSpokeInputVariant,
  type Reserve,
  type ReserveId,
  ReserveQuery,
  ReservesQuery,
  type Spoke,
  type SpokeId,
  type SpokeInput,
  SpokePositionManagersQuery,
  SpokeQuery,
  SpokesQuery,
  UserBalancesQuery,
  UserBorrowsQuery,
  type UserBorrowsRequestQuery,
  type UserPosition,
  type UserPositionId,
  UserPositionQuery,
  UserPositionsQuery,
  UserSummaryQuery,
  UserSuppliesQuery,
  type UserSuppliesRequestQuery,
} from '@aave/graphql';
import { type ChainId, type EvmAddress, ResultAsync } from '@aave/types';

function extractUserSuppliesRequestUser(
  query: UserSuppliesRequestQuery,
): EvmAddress {
  if ('userSpoke' in query) return query.userSpoke.user;
  if ('userToken' in query) return query.userToken.user;
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
    client.refreshQueryWhere(UserPositionsQuery, (_, data) =>
      data.some(isMatch),
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
export function refreshUserSummary(
  client: AaveClient,
  user: EvmAddress,
  spoke: SpokeInput,
) {
  return client.refreshQueryWhere(
    UserSummaryQuery,
    (variables) =>
      variables.request.user === user &&
      (isSpokeInputVariant(variables.request.filter)
        ? variables.request.filter.spoke.chainId === spoke.chainId &&
          variables.request.filter.spoke.address === spoke.address
        : isChainIdsVariant(variables.request.filter)
          ? variables.request.filter.chainIds.some((id) => id === spoke.chainId)
          : false),
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
