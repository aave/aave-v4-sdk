import {
  TransactionRequestFragment,
  UserClaimableRewardFragment,
} from './fragments';
import { graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const ClaimRewardsQuery = graphql(
  `query ClaimRewards($request: ClaimRewardsRequest!) {
    value: claimRewards(request: $request) {
      ...TransactionRequest
    }
  }`,
  [TransactionRequestFragment],
);
export type ClaimRewardsRequest = RequestOf<typeof ClaimRewardsQuery>;

/**
 * @internal
 */
export const UserClaimableRewardsQuery = graphql(
  `query UserClaimableRewards($request: UserClaimableRewardsRequest!) {
    value: userClaimableRewards(request: $request) {
      ...UserClaimableReward
    }
  }`,
  [UserClaimableRewardFragment],
);
export type UserClaimableRewardsRequest = RequestOf<
  typeof UserClaimableRewardsQuery
>;
