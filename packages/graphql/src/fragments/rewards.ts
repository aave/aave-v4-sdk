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

export const PointsGenericCriteriaFragment = graphql(
  `fragment PointsGenericCriteria on PointsGenericCriteria {
    __typename
    id
    text
    userPassed
  }`,
);
export type PointsGenericCriteria = FragmentOf<
  typeof PointsGenericCriteriaFragment
>;

export type PointsCriteria = PointsGenericCriteria;

export const PointsCriteriaFragment: FragmentDocumentFor<
  PointsCriteria,
  'PointsCriteria'
> = graphql(
  `fragment PointsCriteria on PointsCriteria {
    __typename
    ... on PointsGenericCriteria {
      ...PointsGenericCriteria
    }
  }`,
  [PointsGenericCriteriaFragment],
);

export const PointsProgramFragment = graphql(
  `fragment PointsProgram on PointsProgram {
    __typename
    id
    name
    externalUrl
    iconUrl
  }`,
);
export type PointsProgram = FragmentOf<typeof PointsProgramFragment>;

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

export const SupplyPointsFragment = graphql(
  `fragment SupplyPoints on SupplyPoints {
    __typename
    id
    program {
      ...PointsProgram
    }
    name
    startDate
    endDate
    multiplier
    criteria {
      ...PointsCriteria
    }
    userEligible
  }`,
  [PointsProgramFragment, PointsCriteriaFragment],
);
export type SupplyPoints = FragmentOf<typeof SupplyPointsFragment>;

export const BorrowPointsFragment = graphql(
  `fragment BorrowPoints on BorrowPoints {
    __typename
    id
    program {
      ...PointsProgram
    }
    name
    startDate
    endDate
    multiplier
    criteria {
      ...PointsCriteria
    }
    userEligible
  }`,
  [PointsProgramFragment, PointsCriteriaFragment],
);
export type BorrowPoints = FragmentOf<typeof BorrowPointsFragment>;

export type Reward = ExtendWithOpaqueType<
  MerklSupplyReward | MerklBorrowReward | SupplyPoints | BorrowPoints
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
    ... on SupplyPoints {
      ...SupplyPoints
    }
    ... on BorrowPoints {
      ...BorrowPoints
    }
  }`,
  [
    MerklSupplyRewardFragment,
    MerklBorrowRewardFragment,
    SupplyPointsFragment,
    BorrowPointsFragment,
  ],
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
