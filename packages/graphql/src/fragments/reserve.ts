import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import { HubAssetFragment } from './assets';
import {
  ChainFragment,
  Erc20AmountFragment,
  PercentNumberFragment,
} from './common';
import { SpokeFragment } from './spoke';

export const ReserveSettingsFragment = graphql(
  `fragment ReserveSettings on ReserveSettings {
    __typename
    collateralFactor {
      ...PercentNumber
    }
    maxLiquidationBonus {
      ...PercentNumber
    }
    liquidationFee {
      ...PercentNumber
    }
    collateralRisk {
      ...PercentNumber
    }
    borrowable
    collateral
    suppliable
    latestDynamicConfigKey
  }`,
  [PercentNumberFragment],
);
export type ReserveSettings = FragmentOf<typeof ReserveSettingsFragment>;

export const ReserveStatusFragment = graphql(
  `fragment ReserveStatus on ReserveStatus {
    __typename
    frozen
    paused
    active
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
      ...PercentNumber
    }
    borrowApy {
      ...PercentNumber
    }
  }`,
  [Erc20AmountFragment, PercentNumberFragment],
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
    borrowingPower {
      ...Erc20Amount
    }
    borrowApy {
      ...PercentNumber
    }
    collateralFactor {
      ...PercentNumber
    }
    maxLiquidationBonus {
      ...PercentNumber
    }
    liquidationFee {
      ...PercentNumber
    }
    dynamicConfigKey
    isUsingLatestDynamicConfigKey
  }`,
  [Erc20AmountFragment, PercentNumberFragment],
);
export type ReserveUserState = FragmentOf<typeof ReserveUserStateFragment>;

export const ReserveFragment = graphql(
  `fragment Reserve on Reserve {
    __typename
    id
    onChainId
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
      ...HubAsset
    }
  }`,
  [
    SpokeFragment,
    ChainFragment,
    ReserveSummaryFragment,
    ReserveSettingsFragment,
    ReserveStatusFragment,
    ReserveUserStateFragment,
    HubAssetFragment,
  ],
);
export type Reserve = FragmentOf<typeof ReserveFragment>;

export const ReserveInfoFragment = graphql(
  `fragment ReserveInfo on ReserveInfo {
    __typename
    id
    asset {
      ...HubAsset
    }
  }`,
  [HubAssetFragment],
);
export type ReserveInfo = FragmentOf<typeof ReserveInfoFragment>;
