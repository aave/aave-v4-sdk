import {
  type Erc20ApprovalRequired,
  type InsufficientBalanceError,
  OperationType,
  type PreContractActionRequired,
  type TransactionRequest,
} from '@aave/graphql';
import { type BlockchainData, chainId, evmAddress } from '@aave/types';
import { describe, expect, it } from 'vitest';
import { toBatch } from './batch';

const account = evmAddress('0x1111111111111111111111111111111111111111');
const token = evmAddress('0x2222222222222222222222222222222222222222');
const spoke = evmAddress('0x3333333333333333333333333333333333333333');

function makeRequest(
  to: TransactionRequest['to'],
  overrides: Partial<TransactionRequest> = {},
): TransactionRequest {
  return {
    __typename: 'TransactionRequest',
    to,
    from: account,
    data: '0x' as BlockchainData,
    value: 0n,
    chainId: chainId(1),
    operations: null,
    ...overrides,
  };
}

const action = makeRequest(spoke, { operations: [OperationType.SpokeSupply] });
const reset = makeRequest(token, { data: '0x01' as BlockchainData });
const approve = makeRequest(token, { data: '0x02' as BlockchainData });

function approvalPlan(approvals: TransactionRequest[]): Erc20ApprovalRequired {
  return {
    __typename: 'Erc20ApprovalRequired',
    approvals: approvals.map((byTransaction) => ({
      __typename: 'Erc20Approval',
      byTransaction,
      bySignature: null,
    })),
    originalTransaction: action,
  } as unknown as Erc20ApprovalRequired;
}

describe(`Given the ${toBatch.name} function`, () => {
  describe('When the plan requires ERC-20 approvals', () => {
    it('Then it batches every approval, in order, before the action', () => {
      expect(toBatch(approvalPlan([reset, approve]))).toEqual({
        __typename: 'TransactionBatch',
        chainId: action.chainId,
        from: action.from,
        transactions: [reset, approve, action],
        operations: action.operations,
      });
    });
  });

  describe('When the plan requires a pre-contract action', () => {
    it('Then it batches that transaction before the action', () => {
      const plan = {
        __typename: 'PreContractActionRequired',
        transaction: approve,
        originalTransaction: action,
      } as unknown as PreContractActionRequired;

      expect(toBatch(plan)?.transactions).toEqual([approve, action]);
    });
  });

  describe('When the plan has a single transaction', () => {
    it('Then there is nothing to batch', () => {
      expect(toBatch(action)).toBeNull();
    });
  });

  describe('When an approval plan carries no approvals', () => {
    it('Then there is nothing to batch', () => {
      expect(toBatch(approvalPlan([]))).toBeNull();
    });
  });

  describe('When the plan is an insufficient balance error', () => {
    it('Then there is nothing to batch', () => {
      const plan = {
        __typename: 'InsufficientBalanceError',
      } as unknown as InsufficientBalanceError;

      expect(toBatch(plan)).toBeNull();
    });
  });
});
