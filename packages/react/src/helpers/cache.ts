import type { AaveClient } from '@aave/client';
import {
  type BorrowRequest,
  decodeReserveId,
  decodeUserPositionId,
  type Hub,
  HubQuery,
  HubsQuery,
  isChainIdsVariant,
  isSpokeInputVariant,
  type RepayRequest,
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
  type SupplyRequest,
  UserBalancesQuery,
  UserBorrowsQuery,
  type UserBorrowsRequestQuery,
  UserClaimableRewardsQuery,
  type UserPosition,
  type UserPositionId,
  UserPositionQuery,
  UserPositionsQuery,
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
export function refreshUserClaimableRewards(
  client: AaveClient,
  user: EvmAddress,
  chainId?: ChainId,
) {
  return client.refreshQueryWhere(
    UserClaimableRewardsQuery,
    (variables) =>
      variables.request.user === user &&
      (chainId === undefined || variables.request.chainId === chainId),
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

/**
 * @internal
 */
export function refreshQueriesForReserveChange(
  client: AaveClient,
  request: SupplyRequest | BorrowRequest | RepayRequest | WithdrawRequest,
) {
  const { chainId, spoke: address } = decodeReserveId(request.reserve);
  const spoke: SpokeInput = { chainId, address };
  return ResultAsync.combine([
    refreshUserPositions(client, request.sender, spoke),
    refreshUserSummary(client, request.sender, spoke),
    refreshReserves(client, [request.reserve]),
    refreshSpokes(client, spoke),
    refreshUserBalances(client, request.sender),
    refreshUserSupplies(client, request.sender),
    refreshUserBorrows(client, request.sender),
    refreshHubs(client, chainId),
  ]);
}

/**
 * @internal
 */
export function refreshAfterTokenSwap(client: AaveClient, user: EvmAddress) {
  return refreshUserBalances(client, user);
}

/**
 * @internal
 */
export function refreshAfterSupplySwap(client: AaveClient, user: EvmAddress) {
  return ResultAsync.combine([
    refreshUserSupplies(client, user),
    refreshUserBalances(client, user),
  ]);
}

/**
 * @internal
 */
export function refreshAfterBorrowSwap(client: AaveClient, user: EvmAddress) {
  return ResultAsync.combine([
    refreshUserBorrows(client, user),
    refreshUserBalances(client, user),
  ]);
}

/**
 * @internal
 */
export function refreshAfterRepayWithSupply(
  client: AaveClient,
  user: EvmAddress,
) {
  return ResultAsync.combine([
    refreshUserSupplies(client, user),
    refreshUserBorrows(client, user),
    refreshUserBalances(client, user),
  ]);
}

/**
 * @internal
 */
export function refreshAfterWithdrawSwap(client: AaveClient, user: EvmAddress) {
  return ResultAsync.combine([
    refreshUserSupplies(client, user),
    refreshUserBalances(client, user),
  ]);
}
