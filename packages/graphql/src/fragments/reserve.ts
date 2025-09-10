import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import {
  ChainFragment,
  Erc20AmountFragment,
  PercentValueFragment,
} from './common';
import { HubAssetInfoFragment } from './hubs';
import { SpokeFragment } from './spoke';

export const ReserveSettingsFragment = graphql(
  `fragment ReserveSettings on ReserveSettings {
    __typename
    collateralFactor {
      ...PercentValue
    }
    liquidationBonus {
      ...PercentValue
    }
    collateralRisk {
      ...PercentValue
    }
    borrowable
    collateral
  }`,
  [PercentValueFragment],
);
export type ReserveSettings = FragmentOf<typeof ReserveSettingsFragment>;

export const ReserveStatusFragment = graphql(
  `fragment ReserveStatus on ReserveStatus {
    __typename
    frozen
    paused
  }`,
);
export type ReserveStatus = FragmentOf<typeof ReserveStatusFragment>;

export const ReserveSummaryFragment = graphql(
  `fragment ReserveSummary on ReserveSummary {
    __typename
    supplied {
      ...Erc20Amount
    }
    borrowed {
      ...Erc20Amount
    }
    supplyApy {
      ...PercentValue
    }
    borrowApy {
      ...PercentValue
    }
  }`,
  [Erc20AmountFragment, PercentValueFragment],
);
export type ReserveSummary = FragmentOf<typeof ReserveSummaryFragment>;

export const ReserveUserStateFragment = graphql(
  `fragment ReserveUserState on ReserveUserState {
    __typename
    balance {
      ...Erc20Amount
    }
    suppliable {
      ...Erc20Amount
    }
    borrowable {
      ...Erc20Amount
    }
    borrowApy {
      ...PercentValue
    }
  }`,
  [Erc20AmountFragment, PercentValueFragment],
);
export type ReserveUserState = FragmentOf<typeof ReserveUserStateFragment>;

export const ReserveFragment = graphql(
  `fragment Reserve on Reserve {
    __typename
    id
    spoke {
      ...Spoke
    }
    borrowCap
    supplyCap
    chain {
      ...Chain
    }
    summary {
      ...ReserveSummary
    }
    settings {
      ...ReserveSettings
    }
    status {
      ...ReserveStatus
    }
    canBorrow
    canSupply
    canUseAsCollateral
    userState {
      ...ReserveUserState
    }
    asset {
      ...HubAssetInfo
    }
  }`,
  [
    SpokeFragment,
    ChainFragment,
    ReserveSummaryFragment,
    ReserveSettingsFragment,
    ReserveStatusFragment,
    ReserveUserStateFragment,
    HubAssetInfoFragment,
  ],
);
export type Reserve = FragmentOf<typeof ReserveFragment>;

export const ReserveInfoFragment = graphql(
  `fragment ReserveInfo on ReserveInfo {
    __typename
    id
    spoke {
      ...Spoke
    }
    asset {
      ...HubAssetInfo
    }
    chain {
      ...Chain
    }
  }`,
  [SpokeFragment, HubAssetInfoFragment, ChainFragment],
);
export type ReserveInfo = FragmentOf<typeof ReserveInfoFragment>;
