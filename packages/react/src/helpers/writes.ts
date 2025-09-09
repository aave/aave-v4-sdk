import type {
  SigningError,
  TimeoutError,
  TransactionError,
  UnexpectedError,
} from '@aave/core-next';
import type { TransactionRequest } from '@aave/graphql-next';
import type { TxHash } from '@aave/types-next';
import type { UseAsyncTask } from './tasks';

export type SendTransactionError =
  | SigningError
  | TimeoutError
  | TransactionError
  | UnexpectedError;

export type UseSendTransactionResult = UseAsyncTask<
  TransactionRequest,
  TxHash,
  SendTransactionError
>;
