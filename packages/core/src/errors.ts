import {
  type BlockchainData,
  type ChainId,
  type EvmAddress,
  ResultAwareError,
  type SubmissionId,
  type TxHash,
  type TypedSelectionSet,
} from '@aave/types';
import type { CombinedError } from '@urql/core';

/**
 * @internal
 */
export enum GraphQLErrorCode {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_USER_INPUT = 'BAD_USER_INPUT',
  BAD_REQUEST = 'BAD_REQUEST',
}
/**
 * @internal
 */
export function hasExtensionCode(
  error: CombinedError,
  code: GraphQLErrorCode,
): boolean {
  return error.graphQLErrors.some((gqlError) => {
    return gqlError.extensions?.code === code;
  });
}

/**
 * Error indicating an unexpected condition occurred.
 */
export class UnexpectedError extends ResultAwareError {
  name = 'UnexpectedError' as const;

  /**
   * @internal
   */
  static upgradeRequired(message: string): UnexpectedError {
    return new UnexpectedError(`${message}. Check for SDK updates.`);
  }
}

/**
 * Error indicating an error occurred while signing.
 */
export class SigningError extends ResultAwareError {
  name = 'SigningError' as const;
}

export type UnsignedTransactionRequest = {
  to: EvmAddress;
  from: EvmAddress;
  data: BlockchainData;
  value: bigint;
  chainId: ChainId;
};

export type TransactionErrorArgs = {
  txHash: TxHash;
  request: UnsignedTransactionRequest;
  link?: string;
};

/**
 * Error indicating a transaction failed.
 */
export class TransactionError extends ResultAwareError {
  name = 'TransactionError' as const;

  /**
   * The transaction hash of the failed transaction.
   */
  readonly txHash: TxHash;

  protected constructor(
    message: string,
    txHash: TxHash,
    cause: UnsignedTransactionRequest,
  ) {
    super(message, { cause });
    this.txHash = txHash;
  }

  static new(args: TransactionErrorArgs) {
    const { txHash, request, link } = args;
    const message = link
      ? `Transaction failed: ${txHash}\n→ View on explorer: ${link}`
      : `Transaction failed: ${txHash}`;
    return new TransactionError(message, txHash, request);
  }
}

/**
 * Error indicating a timeout occurred.
 */
export class TimeoutError extends ResultAwareError {
  name = 'TimeoutError' as const;
}

/**
 * Error indicating the wallet accepted a transaction, but it was not confirmed
 * on-chain within the waiting window — e.g. a Smart Account transaction still
 * awaiting co-signer signatures. It may still execute later, so do not resend
 * the same transaction blindly.
 *
 * Its `name` is `'TimeoutError'`; use {@link SubmissionUnresolvedError.is} to
 * tell it apart from a {@link TimeoutError} that implies execution.
 */
export class SubmissionUnresolvedError extends TimeoutError {
  /**
   * The identifier the wallet returned for the transaction. Not necessarily an
   * on-chain hash (e.g. a Safe `safeTxHash`).
   */
  readonly submissionId: SubmissionId;

  /**
   * The chain the transaction was submitted to.
   */
  readonly chainId: ChainId;

  /**
   * @internal discriminant that survives duplicate package copies
   */
  readonly isSubmissionUnresolved = true as const;

  protected constructor(
    message: string,
    submissionId: SubmissionId,
    chainId: ChainId,
  ) {
    super(message);
    this.submissionId = submissionId;
    this.chainId = chainId;
  }

  static new(args: {
    submissionId: SubmissionId;
    chainId: ChainId;
  }): SubmissionUnresolvedError {
    return new SubmissionUnresolvedError(
      `Transaction ${args.submissionId} was submitted but not confirmed on-chain yet.`,
      args.submissionId,
      args.chainId,
    );
  }

  /**
   * Checks by property rather than `instanceof`, so it also works across
   * duplicate copies of this package.
   */
  static override is(error: unknown): error is SubmissionUnresolvedError;
  static override is<T extends typeof ResultAwareError>(
    this: T,
    error: unknown,
  ): error is InstanceType<T>;
  static override is(error: unknown): boolean {
    return (
      error instanceof Error &&
      (error as { isSubmissionUnresolved?: unknown }).isSubmissionUnresolved ===
        true
    );
  }
}

/**
 * Error indicating an operation was not executed due to a validation error.
 * See the `cause` property for more information.
 */
export class ValidationError<
  TGqlNode extends TypedSelectionSet,
> extends ResultAwareError {
  name = 'ValidationError' as const;

  constructor(public readonly cause: TGqlNode) {
    super(cause.__typename);
  }

  static fromGqlNode<TGqlNode extends TypedSelectionSet>(
    error: TGqlNode,
  ): ValidationError<TGqlNode> {
    return new ValidationError(error);
  }
}

/**
 * Error indicating the desire to cancel an operation.
 */
export class CancelError extends ResultAwareError {
  name = 'CancelError' as const;
}
