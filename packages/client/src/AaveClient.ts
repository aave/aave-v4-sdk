import {
  delay,
  extractOperationName,
  GqlClient,
  TimeoutError,
  UnexpectedError,
} from '@aave/core';
import type { HasProcessedKnownTransactionRequest } from '@aave/graphql';
import {
  type RewardId,
  UserClaimableRewardsQuery,
  type VariablesOf,
} from '@aave/graphql';
import {
  type ChainId,
  type EvmAddress,
  invariant,
  ResultAsync,
} from '@aave/types';
import type { Exchange, Operation, OperationResult } from '@urql/core';
import { map, pipe } from 'wonka';
import { hasProcessedKnownTransaction } from './actions';
import { type ClientConfig, configureContext } from './config';
import {
  isHasProcessedKnownTransactionRequest,
  type TransactionReceipt,
  type TransactionResult,
  transactionReceipt,
} from './types';

type UserClaimableRewardsVars = VariablesOf<typeof UserClaimableRewardsQuery>;

function resolveNativeAssetsDeep(
  value: unknown,
  visited = new Set<object>(),
): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (visited.has(value as object)) return value;
  visited.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => resolveNativeAssetsDeep(item, visited));
  }

  const obj = value as Record<string, unknown>;

  if (
    obj.__typename === 'Erc20Token' &&
    obj.isWrappedNativeToken === true &&
    obj.chain !== null &&
    typeof obj.chain === 'object'
  ) {
    const chain = obj.chain as Record<string, unknown>;
    return { __typename: 'NativeToken', info: chain.nativeInfo, chain };
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[key] = resolveNativeAssetsDeep(obj[key], visited);
  }
  return result;
}

// Swap operations use WETH/wrapped tokens directly as tradeable assets and must not
// be resolved. All swap operations contain "Swap" in their name, except RepayWithSupplyQuote.
const isSwapOperation = (name: string | null): boolean =>
  name !== null && (name.includes('Swap') || name === 'RepayWithSupplyQuote');

const nativeAssetResolutionExchange: Exchange =
  ({ forward }) =>
  (ops$) =>
    pipe(
      forward(ops$),
      map((result: OperationResult) => {
        if (result.operation.kind !== 'query' || !result.data) return result;
        if (isSwapOperation(extractOperationName(result.operation)))
          return result;
        return {
          ...result,
          data: resolveNativeAssetsDeep(result.data) as typeof result.data,
        };
      }),
    );

export class AaveClient extends GqlClient {
  private readonly pendingRewardRemovals = new Map<
    string,
    { ids: Set<RewardId>; expiresAt: number }
  >();

  /**
   * Create a new instance of the {@link AaveClient}.
   *
   * ```ts
   * const client = AaveClient.create({
   *   environment: production,
   * });
   * ```
   *
   * @param options - The options to configure the client.
   * @returns The new instance of the client.
   */
  static create(options?: ClientConfig): AaveClient {
    return new AaveClient(configureContext(options ?? {}));
  }

  /**
   * Given the transaction hash of an Aave protocol transaction, wait for the transaction to be
   * processed by the Aave v4 API.
   *
   * Returns a {@link TimeoutError} if the transaction is not processed within the expected timeout period.
   *
   * @param result - The transaction execution result to wait for.
   * @returns The {@link TransactionReceipt} or a error
   */
  readonly waitForTransaction = (
    result: TransactionResult,
  ): ResultAsync<TransactionReceipt, TimeoutError | UnexpectedError> => {
    invariant(
      isHasProcessedKnownTransactionRequest(result),
      'AaveClient.waitForTransaction called with an non-tracked operation. See the documentation for correct tracking setup.',
    );

    return ResultAsync.fromPromise(
      this.pollTransactionStatus(result),
      (err) => {
        if (err instanceof TimeoutError || err instanceof UnexpectedError) {
          return err;
        }
        return UnexpectedError.from(err);
      },
    );
  };

  /**
   * Records claimed reward IDs for a user on a chain, immediately removes them from
   * all active `useUserClaimableRewards` subscriptions (optimistic cache update), and
   * schedules a real network refresh after 30s.
   *
   * Reward claiming is done by ID, but the claim tx could include tokens earned from
   * multiple reward campaigns if they share the same reward token. This would be a rare
   * case, and currently it is not handled. The result is that the cache could still return
   * rewards that were just claimed, and trying to claim them would be a no-op.
   * @internal
   */
  markRewardsClaimed(
    user: EvmAddress,
    chainId: ChainId,
    ids: RewardId[],
  ): void {
    const key = `${user}:${chainId}`;
    const existing = this.pendingRewardRemovals.get(key);
    this.pendingRewardRemovals.set(key, {
      ids: existing ? new Set([...existing.ids, ...ids]) : new Set(ids),
      expiresAt: Date.now() + 60_000,
    });

    // Immediate cache-only reexecution for all registered UserClaimableRewards queries.
    // Without graphcache there is no normalized store to read from, so skip — the
    // claimResponseTransformExchange already filters every network response.
    if (this.context.cache) {
      for (const [, entry] of this.queryRegistry) {
        if (extractOperationName(entry.operation) !== 'UserClaimableRewards') {
          continue;
        }
        const vars = entry.operation.variables as UserClaimableRewardsVars;
        if (vars.request.user !== user || vars.request.chainId !== chainId) {
          continue;
        }
        this.reexecuteWithRefetching(entry.operation, {}, 'cache-only');
      }
    }

    // 30s fire-and-forget real refresh — by this time the api should have the updated data
    setTimeout(() => {
      this.refreshQueryWhere(
        UserClaimableRewardsQuery,
        (vars: UserClaimableRewardsVars) =>
          vars.request.user === user && vars.request.chainId === chainId,
      );
    }, 30_000);
  }

  protected override additionalExchanges(): Exchange[] {
    const exchanges: Exchange[] = [];
    if (this.context.resolveNativeAssets) {
      exchanges.push(nativeAssetResolutionExchange);
    }
    exchanges.push(this.claimResponseTransformExchange());
    return exchanges;
  }

  private claimResponseTransformExchange(): Exchange {
    const OPERATION_NAME = 'UserClaimableRewards';

    // Returns the pending entry for a UserClaimableRewards op if it exists and is valid.
    // Cleans up expired entries on access.
    const pendingForOp = (op: Operation) => {
      if (op.kind !== 'query' || extractOperationName(op) !== OPERATION_NAME) {
        return undefined;
      }
      const vars = op.variables as UserClaimableRewardsVars;
      const key = `${vars.request.user}:${vars.request.chainId}`;
      const pending = this.pendingRewardRemovals.get(key);
      if (!pending || Date.now() > pending.expiresAt) {
        if (pending) this.pendingRewardRemovals.delete(key);
        return undefined;
      }
      return pending;
    };

    // This exchange is placed BEFORE graphcache in the pipeline so it intercepts ALL
    // responses — including cache-only reads that graphcache resolves from its normalized
    // store. The filter runs on every UserClaimableRewards result and strips claimed IDs
    // before graphcache writes back (or re-renders from) its normalized store.
    return ({ forward }) =>
      (ops$) =>
        pipe(
          forward(ops$),
          map((result: OperationResult) => {
            const pending = pendingForOp(result.operation);
            if (!pending || !result.data?.value) return result;
            const filtered = (
              result.data.value as Array<{ id: RewardId }>
            ).filter((r) => !pending.ids.has(r.id));
            return { ...result, data: { value: filtered } };
          }),
        );
  }

  protected async pollTransactionStatus(
    request: HasProcessedKnownTransactionRequest,
  ): Promise<TransactionReceipt> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < this.context.environment.indexingTimeout) {
      const processed = await hasProcessedKnownTransaction(this, request).match(
        (ok) => ok,
        (err) => {
          throw err;
        },
      );

      if (processed) {
        return transactionReceipt(request.txHash);
      }

      await delay(this.context.environment.pollingInterval);
    }
    throw TimeoutError.from(
      `Timeout waiting for transaction ${request.txHash} to be processed.`,
    );
  }
}
