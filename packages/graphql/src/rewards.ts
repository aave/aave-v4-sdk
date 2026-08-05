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
  `query UserClaimableRewards($request: UserClaimableRewardsRequest!, $currency: Currency! = USD) {
    value: userClaimableRewards(request: $request) {
      ...UserClaimableReward
    }
  }`,
  [UserClaimableRewardFragment],
);
type UserClaimableRewardsRequestInput = RequestOf<
  typeof UserClaimableRewardsQuery
>;
type UserClaimableRewardsRequestBase = Omit<
  UserClaimableRewardsRequestInput,
  'chainId' | 'chainIds'
>;

export type UserClaimableRewardsRequest =
  | (UserClaimableRewardsRequestBase & {
      chainId: NonNullable<UserClaimableRewardsRequestInput['chainId']>;
      chainIds?: never;
    })
  | (UserClaimableRewardsRequestBase & {
      chainId?: never;
      chainIds: NonNullable<UserClaimableRewardsRequestInput['chainIds']>;
    });
