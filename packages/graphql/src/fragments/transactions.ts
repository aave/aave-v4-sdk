import type { FragmentOf } from 'gql.tada';
import { type FragmentDocumentFor, graphql } from '../graphql';
import { DecimalValueFragment } from './common';

export const TransactionRequestFragment = graphql(
  `fragment TransactionRequest on TransactionRequest {
    __typename
    to
    from
    data
    value
    chainId
    operations
  }`,
);
export type TransactionRequest = FragmentOf<typeof TransactionRequestFragment>;

export const Erc20ApprovalRequiredFragment = graphql(
  `fragment Erc20ApprovalRequired on Erc20ApprovalRequired {
    __typename
    transaction {
      ...TransactionRequest
    }
    reason
    requiredAmount {
      ...DecimalValue
    }
    currentAllowance {
      ...DecimalValue
    }
    originalTransaction {
      ...TransactionRequest
    }
  }`,
  [TransactionRequestFragment, DecimalValueFragment],
);
export type Erc20ApprovalRequired = FragmentOf<
  typeof Erc20ApprovalRequiredFragment
>;

export const PreContractActionRequiredFragment = graphql(
  `fragment PreContractActionRequired on PreContractActionRequired {
    __typename
    transaction {
      ...TransactionRequest
    }
    reason
    originalTransaction {
      ...TransactionRequest
    }
  }`,
  [TransactionRequestFragment],
);
export type PreContractActionRequired = FragmentOf<
  typeof PreContractActionRequiredFragment
>;

export const InsufficientBalanceErrorFragment = graphql(
  `fragment InsufficientBalanceError on InsufficientBalanceError {
    __typename
    required {
      ...DecimalValue
    }
    available {
      ...DecimalValue
    }
  }`,
  [DecimalValueFragment],
);
export type InsufficientBalanceError = FragmentOf<
  typeof InsufficientBalanceErrorFragment
>;

export type ExecutionPlan =
  | TransactionRequest
  | Erc20ApprovalRequired
  | PreContractActionRequired
  | InsufficientBalanceError;

export const ExecutionPlanFragment: FragmentDocumentFor<
  ExecutionPlan,
  'ExecutionPlan'
> = graphql(
  `fragment ExecutionPlan on ExecutionPlan {
    __typename
    ... on TransactionRequest {
      ...TransactionRequest
    }
    ... on Erc20ApprovalRequired {
      ...Erc20ApprovalRequired
    }
    ... on PreContractActionRequired {
      ...PreContractActionRequired
    }
    ... on InsufficientBalanceError {
      ...InsufficientBalanceError
    }
  }`,
  [
    TransactionRequestFragment,
    Erc20ApprovalRequiredFragment,
    PreContractActionRequiredFragment,
    InsufficientBalanceErrorFragment,
  ],
);
