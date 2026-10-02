import type { BatchUnavailable } from '@aave/client';
import type {
  Erc20Approval,
  PreContractActionRequired,
  TransactionRequest,
} from '@aave/graphql';
import type { ResultAsync, Signature } from '@aave/types';
import { describe, expectTypeOf, it } from 'vitest';
import type {
  BatchRequest,
  BatchSender,
  ExecutionPlanHandler,
  PendingTransaction,
  SendTransactionError,
} from '../helpers';
import { useBorrow } from './useBorrow';
import { useSupply } from './useSupply';

declare const batch: BatchSender;
declare function sendTransaction(
  request: TransactionRequest,
): ResultAsync<PendingTransaction, SendTransactionError>;

type SupplyStep =
  | TransactionRequest
  | Erc20Approval
  | PreContractActionRequired;

describe('Given a hook that supports opt-in batching', () => {
  describe('When it is called without { batch }', () => {
    it('Then the handler never receives a BatchRequest', () => {
      useSupply((plan) => {
        expectTypeOf(plan).toEqualTypeOf<SupplyStep>();
        return sendTransaction(plan as TransactionRequest);
      });
    });
  });

  describe('When it is called with { batch }', () => {
    it('Then the handler also receives a BatchRequest, sent with batch.send', () => {
      useSupply(
        (plan) => {
          expectTypeOf(plan).toEqualTypeOf<SupplyStep | BatchRequest>();
          if (plan.__typename === 'BatchRequest') {
            return batch.send(plan);
          }
          return sendTransaction(plan as TransactionRequest);
        },
        { batch },
      );
    });

    it('Then a handler without the BatchRequest case is rejected', () => {
      const handler: ExecutionPlanHandler<
        SupplyStep,
        Signature | PendingTransaction
      > = (plan) => sendTransaction(plan as TransactionRequest);

      // @ts-expect-error — opting in requires handling BatchRequest
      useSupply(handler, { batch });
    });

    it('Then batch may be undefined, e.g. for users who prefer permit', () => {
      useSupply(
        (plan) =>
          plan.__typename === 'BatchRequest'
            ? batch.send(plan)
            : sendTransaction(plan as TransactionRequest),
        { batch: undefined },
      );
    });

    it('Then a hook whose steps resolve to PendingTransaction accepts BatchUnavailable from batch.send', () => {
      const handler: ExecutionPlanHandler<
        TransactionRequest | PreContractActionRequired | BatchRequest,
        PendingTransaction | BatchUnavailable
      > = (plan) => {
        switch (plan.__typename) {
          case 'BatchRequest':
            return batch.send(plan);
          case 'PreContractActionRequired':
            return sendTransaction(plan.transaction);
          case 'TransactionRequest':
            return sendTransaction(plan);
        }
      };

      useBorrow(handler, { batch });
    });
  });
});
