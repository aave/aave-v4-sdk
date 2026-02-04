import type { AaveClient } from '@aave/client';
import {
  decodeHubId,
  decodeUserPositionId,
  HubQuery,
  HubsQuery,
  isChainIdsVariant,
  isHubInputVariant,
  isSpokeInputVariant,
  isTokensVariant,
  type ReserveId,
  ReserveQuery,
  ReservesQuery,
  type SpokeInput,
  SpokeQuery,
  SpokesQuery,
  UserBalancesQuery,
  UserBorrowsQuery,
  type UserBorrowsRequestQuery,
  UserPositionQuery,
  UserPositionsQuery,
  UserSummaryQuery,
  UserSuppliesQuery,
  type UserSuppliesRequestQuery,
} from '@aave/graphql';
import type { ChainId, EvmAddress } from '@aave/types';

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
  return Promise.all([
    client.refreshQueryWhere(UserPositionsQuery, (_, data) =>
      data.some(
        (position) =>
          position.spoke.chain.chainId === spoke.chainId &&
          position.spoke.address === spoke.address &&
          position.user === user,
      ),
    ),
    client.refreshQueryWhere(
      UserPositionQuery,
      (_, data) =>
        data?.spoke.chain.chainId === spoke.chainId &&
        data?.spoke.address === spoke.address &&
        data.user === user,
    ),
  ]);
}

/**
 * @internal
 */
export function refreshReserves(client: AaveClient, ids: ReserveId[]) {
  return Promise.all([
    client.refreshQueryWhere(
      ReserveQuery,
      (_, data) => data !== null && ids.includes(data.id),
    ),
    client.refreshQueryWhere(ReservesQuery, (_, data) =>
      data.some((reserve) => ids.includes(reserve.id)),
    ),
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
  return client.refreshQueryWhere(UserSummaryQuery, (variables) =>
    variables.request.user === user &&
    isSpokeInputVariant(variables.request.filter)
      ? variables.request.filter.spoke.chainId === spoke.chainId &&
        variables.request.filter.spoke.address === spoke.address
      : isChainIdsVariant(variables.request.filter)
        ? variables.request.filter.chainIds.some((id) => id === spoke.chainId)
        : false,
  );
}

/**
 * @internal
 */
export function refreshSpokes(client: AaveClient, spoke: SpokeInput) {
  return Promise.all([
    client.refreshQueryWhere(
      SpokeQuery,
      (_, data) =>
        data?.chain.chainId === spoke.chainId &&
        data?.address === spoke.address,
    ),
    client.refreshQueryWhere(SpokesQuery, (_, data) =>
      data.some(
        (item) =>
          item.chain.chainId === spoke.chainId &&
          item.address === spoke.address,
      ),
    ),
  ]);
}

/**
 * @internal
 */
export function refreshHubs(client: AaveClient, chainId: ChainId) {
  return Promise.all([
    client.refreshQueryWhere(HubQuery, (variables) =>
      isHubInputVariant(variables.request.query)
        ? variables.request.query.hubInput.chainId === chainId
        : decodeHubId(variables.request.query.hubId).chainId === chainId,
    ),
    client.refreshQueryWhere(
      HubsQuery,
      (variables) =>
        isChainIdsVariant(variables.request)
          ? variables.request.chainIds.some((id) => id === chainId)
          : isTokensVariant(variables.request.query)
            ? variables.request.query.tokens.some(
                (token) => token.chainId === chainId,
              )
            : true, // assetIds variant - refresh all
    ),
  ]);
}
