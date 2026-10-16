import {
  CancelError,
  SigningError,
  SubmissionUnresolvedError,
  TransactionError,
  UnexpectedError,
  ValidationError,
} from '@aave/core';
import type {
  Chain,
  ERC20PermitSignature,
  ExecutionPlan,
  TransactionRequest,
} from '@aave/graphql';
import {
  type ChainId,
  chainId,
  errAsync,
  invariant,
  isObject,
  okAsync,
  ResultAsync,
  type Signature,
  type SubmissionId,
  signatureFrom,
  submissionId,
  type TxHash,
  txHash,
} from '@aave/types';
import {
  type Account,
  BaseError,
  createClient,
  custom,
  defineChain,
  isAddressEqual,
  numberToHex,
  type ProviderRpcError,
  type ReplacementReason,
  type RpcError,
  SwitchChainError,
  type TransactionReceipt,
  type Transport,
  UserRejectedRequestError,
  type Chain as ViemChain,
  WaitForTransactionReceiptTimeoutError,
  type WalletClient,
} from 'viem';
import {
  estimateGas as estimateGasWithViem,
  sendCalls as sendCallsWithViem,
  sendTransaction as sendTransactionWithViem,
  waitForTransactionReceipt,
} from 'viem/actions';
import { mainnet, sepolia } from 'viem/chains';
import { supportsPermit } from './adapters';
import { type TransactionBatch, toBatch } from './batch';
import { type CallsStatusOutcome, trackCallsStatus } from './callsStatus';
import { nativeTokenInfo } from './nativeAsset';
import type {
  ExecutionPlanHandler,
  SendWithOptions,
  SignTypedDataError,
  TransactionResult,
  TypedData,
  TypedDataHandler,
} from './types';

function isRpcError(err: unknown): err is RpcError {
  return isObject(err) && 'code' in err && 'message' in err;
}

function isProviderRpcError(
  err: unknown,
): err is ProviderRpcError<{ originalError?: { code: number } }> {
  return isObject(err) &&
    'name' in err &&
    'message' in err &&
    'originalError' in err
    ? isRpcError(err.originalError) && 'code' in err.originalError
    : true;
}

function signTypedData(
  walletClient: WalletClient,
  data: TypedData,
): ResultAsync<Signature, SignTypedDataError> {
  invariant(
    walletClient.account,
    'Wallet account is required to sign typed data',
  );

  return ResultAsync.fromPromise(
    walletClient.signTypedData({
      account: walletClient.account,
      domain: data.domain,
      types: data.types,
      primaryType: data.primaryType,
      message: data.message,
    }),
    (err) => {
      if (err instanceof UserRejectedRequestError) {
        return CancelError.from(err);
      }
      return SigningError.from(err);
    },
  ).map(signatureFrom);
}

/**
 * @internal
 */
export function toViemChain(chain: Chain): ViemChain {
  // A chain with no native token cannot describe a `nativeCurrency`; none is
  // supported today, so this asserts rather than inventing a placeholder.
  const nativeToken = nativeTokenInfo(chain);
  invariant(nativeToken, `Chain ${chain.chainId} has no native token`);

  // known chains
  switch (chain.chainId) {
    case chainId(mainnet.id):
      return mainnet;

    case chainId(sepolia.id):
      return sepolia;
  }

  // most likely a tenderly fork
  return defineChain({
    id: chain.chainId,
    name: chain.name,
    nativeCurrency: {
      name: nativeToken.name,
      symbol: nativeToken.symbol,
      decimals: nativeToken.decimals,
    },
    rpcUrls: { default: { http: [chain.rpcUrl] } },
    blockExplorers: {
      default: {
        name: `${chain.name} Explorer`,
        url: chain.explorerUrl,
      },
    },
  });
}

/**
 * @internal
 */
export function viemChainsFrom(chains: Chain[]): ViemChain[] {
  return chains.map(toViemChain);
}

/**
 * @internal
 */
export function ensureChain(
  walletClient: WalletClient,
  chain: ViemChain,
): ResultAsync<void, CancelError | SigningError> {
  return ResultAsync.fromPromise(walletClient.getChainId(), (err) =>
    SigningError.from(err),
  ).andThen((currentChainId) => {
    if (currentChainId === chain.id) {
      return okAsync();
    }

    return ResultAsync.fromPromise(
      walletClient.switchChain({ id: chain.id }),
      (err) => SigningError.from(err),
    ).orElse((err) => {
      const code = isRpcError(err.cause)
        ? err.cause.code
        : // Unwrapping for MetaMask Mobile
          // https://github.com/MetaMask/metamask-mobile/issues/2944#issuecomment-976988719
          isProviderRpcError(err.cause)
          ? err.cause.data?.originalError?.code
          : undefined;

      if (code === SwitchChainError.code) {
        return ResultAsync.fromPromise(
          walletClient.addChain({ chain }),
          (err) => {
            if (isRpcError(err) && err.code === UserRejectedRequestError.code) {
              return CancelError.from(err);
            }
            return SigningError.from(err);
          },
        );
      }

      return err.asResultAsync();
    });
  });
}

/**
 * Chain key under which EIP-5792 wallets report capabilities that apply to every chain.
 */
const ALL_CHAINS = 0;

function atomicStatusOf(capabilities: unknown): unknown {
  return isObject(capabilities) &&
    isObject(capabilities.atomic) &&
    'status' in capabilities.atomic
    ? capabilities.atomic.status
    : undefined;
}

/**
 * Checks whether the wallet can send an atomic batch on the given chain
 * without further user action.
 *
 * Only `atomic.status === 'supported'` counts. `'ready'` means the wallet could
 * upgrade the account (e.g. an EIP-7702 delegation) but would prompt the user
 * for it, so it resolves to `false` like an unsupported or failing wallet.
 *
 * ```ts
 * const result = await canBatch(walletClient, { chainId: chainId(1) });
 * // result.value: boolean
 * ```
 *
 * @param walletClient - The wallet client to check.
 * @param options - The chain to check.
 * @returns Never fails.
 */
export function canBatch(
  walletClient: WalletClient,
  { chainId: id }: { chainId: ChainId },
): ResultAsync<boolean, never> {
  if (!walletClient.account) {
    return okAsync(false);
  }

  return ResultAsync.fromPromise(
    walletClient.request({
      method: 'wallet_getCapabilities',
      params: [walletClient.account.address, [numberToHex(id)]],
    }),
    (err) => err,
  )
    .map((capabilities) => {
      const byChain = new Map(
        Object.entries(capabilities).map(
          ([key, value]) => [Number(key), value] as const,
        ),
      );
      const status =
        atomicStatusOf(byChain.get(id)) ??
        atomicStatusOf(byChain.get(ALL_CHAINS));

      return status === 'supported';
    })
    .orElse(() => okAsync(false));
}

function estimateGas(
  walletClient: WalletClient,
  request: TransactionRequest,
): ResultAsync<bigint, SigningError> {
  return ResultAsync.fromPromise(
    estimateGasWithViem(walletClient, {
      account: walletClient.account,
      data: request.data,
      to: request.to,
      value: BigInt(request.value),
      prepare: false,
    }),
    (err) => SigningError.from(err),
  ).map((gas) => (gas * 115n) / 100n); // 15% buffer
}

function sendEip1559Transaction(
  walletClient: WalletClient<Transport, ViemChain, Account>,
  request: TransactionRequest,
): ResultAsync<TxHash, CancelError | SigningError> {
  return estimateGas(walletClient, request)
    .andThen((gas) =>
      ResultAsync.fromPromise(
        sendTransactionWithViem(walletClient, {
          account: walletClient.account,
          data: request.data,
          to: request.to,
          value: BigInt(request.value),
          chain: walletClient.chain,
          gas,
        }),
        toSendError,
      ),
    )
    .map(txHash);
}

function toSendError(err: unknown): CancelError | SigningError {
  if (err instanceof BaseError) {
    const rejected = err.walk((err) => err instanceof UserRejectedRequestError);

    if (rejected) {
      return CancelError.from(rejected);
    }
  }
  return SigningError.from(err);
}

function isWalletClientWithAccount(
  walletClient: WalletClient,
): walletClient is WalletClient<Transport, ViemChain, Account> {
  return walletClient.account !== undefined;
}

/**
 * Asserts the wallet client can send on `chainId`: it needs an account and
 * must be on that chain, since the request is sent on `walletClient.chain`.
 */
function assertCanSendOn(
  walletClient: WalletClient,
  chainId: ChainId,
): asserts walletClient is WalletClient<Transport, ViemChain, Account> {
  invariant(
    isWalletClientWithAccount(walletClient),
    'Wallet client with account is required',
  );
  invariant(
    walletClient.chain?.id === chainId,
    `Wallet client must be on chain ${chainId}, but is on ${walletClient.chain?.id ?? 'no chain'}`,
  );
}

/**
 * @internal
 */
export function sendTransaction(
  walletClient: WalletClient,
  request: TransactionRequest,
): ResultAsync<TxHash, CancelError | SigningError> {
  assertCanSendOn(walletClient, request.chainId);

  return sendEip1559Transaction(walletClient, request);
}

/**
 * Sends the batch as one atomic `wallet_sendCalls` request. The wallet
 * estimates gas for the whole batch: estimating a call on its own would revert
 * when it depends on an earlier one (e.g. an approval).
 *
 * A wallet that can't honour atomicity fails like any other wallet error.
 *
 * @internal
 */
export function sendBatch(
  walletClient: WalletClient,
  batch: TransactionBatch,
): ResultAsync<SubmissionId, CancelError | SigningError> {
  assertCanSendOn(walletClient, batch.chainId);

  return ResultAsync.fromPromise(
    sendCallsWithViem(walletClient, {
      account: walletClient.account,
      chain: walletClient.chain,
      calls: batch.transactions.map((request) => ({
        to: request.to,
        data: request.data,
        value: BigInt(request.value),
      })),
      forceAtomic: true,
    }),
    toSendError,
  ).map(({ id }) => submissionId(id));
}

/**
 * @internal
 */
export function transactionError(
  chain: ViemChain | undefined,
  txHash: TxHash,
  request: TransactionRequest,
): TransactionError {
  const baseUrl = chain?.blockExplorers?.default?.url;
  const link = baseUrl && new URL(`/tx/${txHash}`, baseUrl).toString();

  return TransactionError.new({ txHash, request, link });
}

/**
 * Max wait for a submitted transaction to execute on-chain, e.g. while a
 * Smart Account collects co-signer signatures.
 *
 * @internal
 */
export const SUBMISSION_TIMEOUT = 30 * 60_000;

/**
 * Max time a receipt is held while waiting for the first
 * `wallet_getCallsStatus` answer.
 *
 * @internal
 */
export const FIRST_PROBE_TIMEOUT = 5_000;

/**
 * Max time a receipt sent from an address other than the account is held
 * while the first `wallet_getCallsStatus` request is still unanswered.
 *
 * @internal
 */
export const INDIRECT_RECEIPT_TIMEOUT = 30_000;

/**
 * Max times the receipt poller is started. Once used up, a failed receipt
 * request ends tracking.
 *
 * @internal
 */
export const RECEIPT_ATTEMPTS = 4;
/**
 * Wait between receipt poller starts.
 *
 * @internal
 */
export const RECEIPT_RETRY_DELAY = 4_000;

type SubmissionOutcome =
  | Exclude<CallsStatusOutcome, { status: 'aborted' }>
  | {
      status: 'receipt';
      receipt: TransactionReceipt;
      replaced?: ReplacementReason;
    }
  | { status: 'receipt-error'; error: unknown };

/**
 * Wraps `walletClient` so every request fails once `signal` aborts. viem's
 * `waitForTransactionReceipt` can't be cancelled, so this stops it from
 * polling the wallet after tracking has settled.
 */
function clientUntil(walletClient: WalletClient, signal: AbortSignal) {
  return createClient({
    account: walletClient.account,
    chain: walletClient.chain,
    pollingInterval: walletClient.pollingInterval,
    transport: custom(
      {
        request: (args) =>
          signal.aborted
            ? Promise.reject(new Error('Submission settled'))
            : walletClient.request(args),
      },
      { retryCount: 0 }, // walletClient's transport already retries
    ),
  });
}

/**
 * Waits for a submitted transaction to settle, running two pollers over the
 * wallet transport:
 *
 * - (a) `eth_getTransactionReceipt`: for EOAs and wallets that return an
 *   on-chain hash.
 * - (b) `wallet_getCallsStatus`: for wallets that return their own id (e.g. a
 *   Safe `safeTxHash`), which may still need signatures before it executes.
 *
 * If the wallet recognises the id, (b)'s answer wins. Otherwise (a)'s does,
 * with one catch: the Safe iframe provider returns a receipt whose
 * `transactionHash` is the `safeTxHash` itself. So every receipt is held until
 * (b)'s first probe completes. A receipt sent from an address other than the
 * account (an execution by a Safe owner or a bundler) is held for the full
 * `FIRST_PROBE_TIMEOUT`, even if the first probe fails, so one flaky probe
 * can't let it through, and for as long as the first probe is unanswered, up
 * to `INDIRECT_RECEIPT_TIMEOUT`, so a slow one can't either.
 */
function trackSubmission(
  walletClient: WalletClient,
  hash: TxHash,
): Promise<SubmissionOutcome> {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const account = walletClient.account?.address;
    let settled = false;
    let firstProbeDone = false;
    let capReached = false;
    let indirectCapReached = false;
    let recognized = false;
    let held: SubmissionOutcome | undefined;
    let receiptAttempts = 0;
    let receiptRetry: ReturnType<typeof setTimeout> | undefined;

    const settle = (outcome: SubmissionOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(firstProbeCap);
      clearTimeout(indirectReceiptCap);
      clearTimeout(receiptRetry);
      controller.abort();
      resolve(outcome);
    };

    // a receipt not sent by the account: Smart Account execution or bundle
    const isIndirect = (outcome: SubmissionOutcome) =>
      outcome.status === 'receipt' &&
      account !== undefined &&
      !isAddressEqual(outcome.receipt.from, account);

    const canRelease = (outcome: SubmissionOutcome) => {
      if (recognized) return false;
      if (!isIndirect(outcome)) return firstProbeDone || capReached;
      return (firstProbeDone && capReached) || indirectCapReached;
    };

    const releaseHeld = () => {
      if (held && canRelease(held)) settle(held);
    };

    const firstProbeCap = setTimeout(() => {
      capReached = true;
      releaseHeld();
    }, FIRST_PROBE_TIMEOUT);

    const indirectReceiptCap = setTimeout(() => {
      indirectCapReached = true;
      releaseHeld();
    }, INDIRECT_RECEIPT_TIMEOUT);

    const onReceiptOutcome = (outcome: SubmissionOutcome) => {
      if (recognized) return;
      if (canRelease(outcome)) {
        settle(outcome);
      } else {
        held = outcome;
      }
    };

    // (a)
    const waitForReceipt = () => {
      receiptAttempts += 1;
      let replaced: ReplacementReason | undefined;
      waitForTransactionReceipt(clientUntil(walletClient, controller.signal), {
        hash,
        timeout: SUBMISSION_TIMEOUT,
        onReplaced: ({ reason }) => {
          replaced = reason;
        },
      }).then(
        (receipt) => onReceiptOutcome({ status: 'receipt', receipt, replaced }),
        (error) => {
          // the shared timeout is owned by (b)
          if (error instanceof WaitForTransactionReceiptTimeoutError) return;
          if (controller.signal.aborted) return;
          // A failed receipt request says nothing about the transaction, which
          // may still land or be recognised by (b): settling here invites a resend
          if (receiptAttempts < RECEIPT_ATTEMPTS) {
            receiptRetry = setTimeout(waitForReceipt, RECEIPT_RETRY_DELAY);
            return;
          }
          onReceiptOutcome({ status: 'receipt-error', error });
        },
      );
    };
    waitForReceipt();

    // (b)
    trackCallsStatus(walletClient, submissionId(hash), {
      timeout: SUBMISSION_TIMEOUT,
      signal: controller.signal,
      onProbe: (isRecognized) => {
        recognized ||= isRecognized;
        firstProbeDone = true;
        releaseHeld();
      },
    }).then((outcome) => {
      if (outcome.status !== 'aborted') settle(outcome);
    });
  });
}

/**
 * Waits for a `wallet_sendCalls` batch to settle. The id is the wallet's own,
 * never an on-chain hash, so there is no receipt to poll.
 */
function trackCalls(
  walletClient: WalletClient,
  id: SubmissionId,
): Promise<SubmissionOutcome> {
  return trackCallsStatus(walletClient, id, {
    timeout: SUBMISSION_TIMEOUT,
  }).then((outcome) => {
    invariant(outcome.status !== 'aborted', 'Batch tracking is never aborted');
    return outcome;
  });
}

type WaitForTransactionResultError =
  | CancelError
  | SubmissionUnresolvedError
  | TransactionError
  | UnexpectedError;

/**
 * Settles once the transactions of an execution plan have executed.
 *
 * A single transaction is tracked by hash, through its receipt and
 * `wallet_getCallsStatus` (see `trackSubmission`). A batch is tracked by its
 * `wallet_sendCalls` id, through `wallet_getCallsStatus` only. Both share
 * `SUBMISSION_TIMEOUT` and the errors below.
 *
 * @internal
 */
export function waitForTransactionResult(
  walletClient: WalletClient,
  request: TransactionRequest,
  initialTxHash: TxHash,
): ResultAsync<TransactionResult, WaitForTransactionResultError>;
export function waitForTransactionResult(
  walletClient: WalletClient,
  batch: TransactionBatch,
  id: SubmissionId,
): ResultAsync<TransactionResult, WaitForTransactionResultError>;
export function waitForTransactionResult(
  walletClient: WalletClient,
  submitted: TransactionRequest | TransactionBatch,
  id: TxHash | SubmissionId,
): ResultAsync<TransactionResult, WaitForTransactionResultError> {
  const isBatch = submitted.__typename === 'TransactionBatch';
  // the action, for a batch: what a failure is reported against
  const request = isBatch
    ? (submitted.transactions.at(-1) as TransactionRequest)
    : submitted;

  return ResultAsync.fromSafePromise(
    isBatch
      ? trackCalls(walletClient, submissionId(id))
      : trackSubmission(walletClient, txHash(id)),
  ).andThen((outcome) => {
    switch (outcome.status) {
      case 'receipt': {
        const hash = txHash(outcome.receipt.transactionHash);

        // A cancel mines as a successful 0-value self-transfer, so its receipt status can't tell
        if (
          outcome.replaced === 'cancelled' ||
          outcome.replaced === 'replaced'
        ) {
          return errAsync(
            CancelError.from(`Transaction ${outcome.replaced} by ${hash}`),
          );
        }
        if (
          outcome.replaced === 'repriced' &&
          outcome.receipt.status === 'reverted'
        ) {
          return errAsync(transactionError(walletClient.chain, hash, request));
        }
        if (outcome.receipt.status === 'success') {
          return okAsync({ txHash: hash, operations: submitted.operations });
        }
        // A hash other than the submitted one without `replaced` is the
        // Execution the wallet mapped the Submission to, not a replacement
        return errAsync(transactionError(walletClient.chain, hash, request));
      }

      case 'success':
        return okAsync({
          txHash: outcome.txHash,
          operations: submitted.operations,
        });

      case 'reverted':
        return errAsync(
          transactionError(walletClient.chain, outcome.txHash, request),
        );

      case 'cancelled':
        return errAsync(
          CancelError.from(
            'Transaction was not executed: rejected or dropped by the wallet',
          ),
        );

      case 'timeout':
        return errAsync(
          SubmissionUnresolvedError.new({
            submissionId: submissionId(id),
            chainId: submitted.chainId,
          }),
        );

      case 'receipt-error':
      case 'error':
        return errAsync(UnexpectedError.from(outcome.error));
    }
  });
}

function sendTransactionAndWait(
  walletClient: WalletClient,
  request: TransactionRequest,
): ResultAsync<
  TransactionResult,
  | CancelError
  | SigningError
  | SubmissionUnresolvedError
  | TransactionError
  | UnexpectedError
> {
  return sendTransaction(walletClient, request).andThen((hash) =>
    waitForTransactionResult(walletClient, request, hash),
  );
}

function sendBatchAndWait(walletClient: WalletClient, batch: TransactionBatch) {
  return sendBatch(walletClient, batch).andThen((id) =>
    waitForTransactionResult(walletClient, batch, id),
  );
}

function executePlan(
  walletClient: WalletClient,
  result: ExecutionPlan,
  options: SendWithOptions = {},
): ReturnType<ExecutionPlanHandler> {
  const batch = options.batch ? toBatch(result) : null;

  if (batch) {
    return canBatch(walletClient, { chainId: batch.chainId }).andThen((ok) =>
      ok
        ? sendBatchAndWait(walletClient, batch)
        : executePlan(walletClient, result),
    );
  }

  switch (result.__typename) {
    case 'TransactionRequest':
      return sendTransactionAndWait(walletClient, result);

    case 'Erc20ApprovalRequired':
      return result.approvals
        .reduce<ReturnType<typeof sendTransactionAndWait>>(
          (chain, approval) =>
            chain.andThen(() =>
              sendTransactionAndWait(walletClient, approval.byTransaction),
            ),
          okAsync(undefined as never),
        )
        .andThen(() =>
          sendTransactionAndWait(walletClient, result.originalTransaction),
        );

    case 'PreContractActionRequired':
      return sendTransactionAndWait(walletClient, result.transaction).andThen(
        () => sendTransactionAndWait(walletClient, result.originalTransaction),
      );

    case 'InsufficientBalanceError':
      return errAsync(ValidationError.fromGqlNode(result));
  }
}

/**
 * Creates an execution plan handler that sends transactions using the provided wallet client.
 *
 * Each transaction is awaited until it is on-chain. With a Smart Account (e.g. a
 * Safe multisig) this can take a while, since other owners may need to sign.
 * If a transaction is not on-chain after 30 minutes, it fails with a
 * {@link SubmissionUnresolvedError}. It may still go through, so check
 * `SubmissionUnresolvedError.is(error)` and do not resend it automatically.
 */
export function sendWith(walletClient: WalletClient): ExecutionPlanHandler;
/**
 * Sends execution plan transactions using the provided wallet client.
 *
 * With `{ batch: true }`, a plan with two or more transactions (e.g. an
 * approval and the action) goes out as one atomic `wallet_sendCalls` prompt
 * when the wallet already supports it (see {@link canBatch}). Otherwise the
 * transactions are sent one by one.
 *
 * ```ts
 * const result = await supply(client, request).andThen((plan) =>
 *   sendWith(walletClient, plan, { batch: true }),
 * );
 * ```
 */
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  walletClient: WalletClient,
  result: T,
  options?: SendWithOptions,
): ReturnType<ExecutionPlanHandler<T>>;
export function sendWith<T extends ExecutionPlan = ExecutionPlan>(
  walletClient: WalletClient,
  result?: T,
  options?: SendWithOptions,
): ExecutionPlanHandler<T> | ReturnType<ExecutionPlanHandler<T>> {
  return result
    ? executePlan(walletClient, result, options)
    : (plan: T) => executePlan(walletClient, plan);
}

/**
 * Creates a function that signs EIP-712 typed data (ERC-20 permits, swap intents, etc.) using the provided wallet client.
 *
 * @param walletClient - The wallet client to use for signing.
 * @returns A function that takes typed data and returns a ResultAsync containing the raw signature.
 *
 * ```ts
 * const result = await prepareSwapCancel(client, request)
 *   .andThen(signTypedDataWith(wallet));
 * ```
 */
export function signTypedDataWith(walletClient: WalletClient): TypedDataHandler;

/**
 * Signs EIP-712 typed data (ERC-20 permits, swap intents, etc.) using the provided wallet client.
 *
 * @param walletClient - The wallet client to use for signing.
 * @param data - The typed data to sign.
 * @returns A ResultAsync containing the raw signature.
 *
 * ```ts
 * const result = await signTypedDataWith(wallet, typedData);
 * ```
 */
export function signTypedDataWith(
  walletClient: WalletClient,
  data: TypedData,
): ReturnType<TypedDataHandler>;

export function signTypedDataWith(
  walletClient: WalletClient,
  data?: TypedData,
): TypedDataHandler | ReturnType<TypedDataHandler> {
  if (data === undefined) {
    return signTypedData.bind(null, walletClient);
  }
  return signTypedData(walletClient, data);
}

/**
 * Handles ERC20 permit signing for actions that require token approval.
 *
 * Calls the action to get an initial execution plan. If the plan requires ERC20 approval
 * and the token supports permit signatures, signs the permit and re-calls the action
 * with the signature to get a new plan that can be sent directly.
 *
 * ```ts
 * const result = await permitWith(walletClient, (permitSig) =>
 *   supply(client, {
 *     reserve: reserve.id,
 *     amount: { erc20: { value: amount, permitSig } },
 *     sender: evmAddress(walletClient.account.address),
 *   })
 * )
 *   .andThen(sendWith(walletClient))
 *   .andThen(client.waitForTransaction);
 * ```
 *
 * @param walletClient - The wallet client to use for signing permits.
 * @param action - A function that returns an execution plan, accepting an optional permit signature.
 * @returns A ResultAsync containing the resolved ExecutionPlan ready to be sent with `sendWith`.
 */
export function permitWith<E>(
  walletClient: WalletClient,
  action: (permitSig?: ERC20PermitSignature) => ResultAsync<ExecutionPlan, E>,
): ResultAsync<ExecutionPlan, E | SignTypedDataError> {
  return action().andThen((result) => {
    if (supportsPermit(result)) {
      const permitTypedData = result.approvals[0].bySignature;
      // Sign and wrap with deadline
      return signTypedDataWith(walletClient, permitTypedData)
        .map((signature) => ({
          deadline: permitTypedData.message.deadline as number,
          value: signature,
        }))
        .andThen((permitSig) => action(permitSig));
    }
    return okAsync(result);
  });
}
