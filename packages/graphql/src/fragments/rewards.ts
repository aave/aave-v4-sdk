import type { ExtendWithOpaqueType } from '@aave/types';
import type { FragmentOf } from 'gql.tada';
import { type FragmentDocumentFor, graphql } from '../graphql';
import {
  Erc20AmountFragment,
  Erc20TokenFragment,
  PercentNumberFragment,
} from './common';

export const MerklGenericCriteriaFragment = graphql(
  `fragment MerklGenericCriteria on MerklGenericCriteria {
    __typename
    id
    text
    userPassed
  }`,
);
export type MerklGenericCriteria = FragmentOf<
  typeof MerklGenericCriteriaFragment
>;

export type MerklCriteria = MerklGenericCriteria;

export const MerklCriteriaFragment: FragmentDocumentFor<
  MerklCriteria,
  'MerklCriteria'
> = graphql(
  `fragment MerklCriteria on MerklCriteria {
    __typename
    ... on MerklGenericCriteria {
      ...MerklGenericCriteria
    }
  }`,
  [MerklGenericCriteriaFragment],
);

export const MerklSupplyRewardFragment = graphql(
  `fragment MerklSupplyReward on MerklSupplyReward {
    __typename
    id
    startDate
    endDate
    extraApy {
      ...PercentNumber
    }
    payoutToken {
      ...Erc20Token
    }
    criteria {
      ...MerklCriteria
    }
    userEligible
  }`,
  [PercentNumberFragment, Erc20TokenFragment, MerklCriteriaFragment],
);
export type MerklSupplyReward = FragmentOf<typeof MerklSupplyRewardFragment>;

export const MerklBorrowRewardFragment = graphql(
  `fragment MerklBorrowReward on MerklBorrowReward {
    __typename
    id
    startDate
    endDate
    discountApy {
      ...PercentNumber
    }
    payoutToken {
      ...Erc20Token
    }
    criteria {
      ...MerklCriteria
    }
    userEligible
  }`,
  [PercentNumberFragment, Erc20TokenFragment, MerklCriteriaFragment],
);
export type MerklBorrowReward = FragmentOf<typeof MerklBorrowRewardFragment>;

export type Reward = ExtendWithOpaqueType<
  MerklSupplyReward | MerklBorrowReward
>;

export const RewardFragment: FragmentDocumentFor<Reward, 'Reward'> = graphql(
  `fragment Reward on Reward {
    __typename
    ... on MerklSupplyReward {
      ...MerklSupplyReward
    }
    ... on MerklBorrowReward {
      ...MerklBorrowReward
    }
  }`,
  [MerklSupplyRewardFragment, MerklBorrowRewardFragment],
);

export const UserMerklClaimableRewardFragment = graphql(
  `fragment UserMerklClaimableReward on UserMerklClaimableReward {
    __typename
    id
    claimable {
      ...Erc20Amount
    }
    startDate
    endDate
    claimUntil
  }`,
  [Erc20AmountFragment],
);
export type UserMerklClaimableReward = FragmentOf<
  typeof UserMerklClaimableRewardFragment
>;

export type UserClaimableReward =
  ExtendWithOpaqueType<UserMerklClaimableReward>;

export const UserClaimableRewardFragment: FragmentDocumentFor<
  UserClaimableReward,
  'UserClaimableReward'
> = graphql(
  `fragment UserClaimableReward on UserClaimableReward {
    __typename
    ... on UserMerklClaimableReward {
      ...UserMerklClaimableReward
    }
  }`,
  [UserMerklClaimableRewardFragment],
);
