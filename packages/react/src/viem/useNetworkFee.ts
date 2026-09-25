import {
  type AaveClient,
  nativeTokenInfo,
  UnexpectedError,
} from '@aave/client';
import { chain as fetchChain } from '@aave/client/actions';
import { toViemChain } from '@aave/client/viem';
import {
  type ActivityItem,
  type Chain,
  Currency,
  type DecimalNumber,
  decodeReserveId,
  decodeUserPositionId,
  type ExchangeAmount,
  type NativeAmount,
  type PreviewAction,
} from '@aave/graphql';
import {
  bigDecimal,
  type ChainId,
  err,
  invariant,
  never,
  nonNullable,
  ok,
  okAsync,
  ResultAsync,
  RoundingMode,
} from '@aave/types';
import { useEffect, useRef } from 'react';
import { createPublicClient, fallback, http } from 'viem';
import { mainnet } from 'viem/chains';
import { useAaveClient } from '../context';
import {
  ReadResult,
  type SuspendableResult,
  type UseAsyncTask,
  useAsyncTask,
} from '../helpers';
import {
  type UseNetworkFee,
  type UseNetworkFeeRequestQuery,
  useExchangeRate,
} from '../misc';

const publicRpcFallbacks: Partial<Record<number, string[]>> = {
  [mainnet.id]: [
    'https://mainnet.gateway.tenderly.co',
    'https://rpc.flashbots.net',
    'https://eth.llamarpc.com',
  ],
};

const estimatedApprovalGas = 55_558n;

const gasEstimates: Record<keyof PreviewAction, bigint> = {
  supply: 132_136n + estimatedApprovalGas,
  borrow: 250_551n,
  withdraw: 195_049n,
  repay: 217_889n + estimatedApprovalGas,
  setUserSuppliesAsCollateral: 240_284n,
  updateUserPositionConditions: 280_000n,
};

function inferGasEstimate(action: PreviewAction): bigint {
  const keys = Object.keys(action);
  invariant(keys.length === 1, 'Expected exactly one preview action');
  const key = keys[0] as keyof PreviewAction;
  return gasEstimates[key] ?? never(`Expected gas estimate for action ${key}`);
}

function extractChainId(action: PreviewAction): ChainId {
  if ('supply' in action) {
    return decodeReserveId(action.supply.reserve).chainId;
  }

  if ('borrow' in action) {
    return decodeReserveId(action.borrow.reserve).chainId;
  }

  if ('withdraw' in action) {
    return decodeReserveId(action.withdraw.reserve).chainId;
  }

  if ('repay' in action) {
    return decodeReserveId(action.repay.reserve).chainId;
  }

  if ('setUserSuppliesAsCollateral' in action) {
    return action.setUserSuppliesAsCollateral.changes
      .map(({ reserve }) => decodeReserveId(reserve))
      .reduce((prev, current) => {
        invariant(
          prev.chainId === current.chainId && prev.spoke === current.spoke,
          'All reserves MUST on the same spoke',
        );
        return prev;
      }).chainId;
  }

  if ('updateUserPositionConditions' in action) {
    return decodeUserPositionId(
      action.updateUserPositionConditions.userPositionId,
    ).chainId;
  }

  never('Expected reserve id');
}

type ExecutionRequest =
  | { activity: ActivityItem }
  | { chainId: ChainId; gasUnits: bigint };

function prepareExecution(query?: UseNetworkFeeRequestQuery) {
  try {
    if (query && 'activity' in query && query.activity) {
      return ok<ExecutionRequest>({ activity: query.activity });
    }
    if (query && 'estimate' in query && query.estimate) {
      return ok<ExecutionRequest>({
        chainId: extractChainId(query.estimate),
        gasUnits: inferGasEstimate(query.estimate),
      });
    }
    if (query && 'estimatePlan' in query && query.estimatePlan) {
      const { actions } = query.estimatePlan;
      const first = actions[0];
      invariant(first, 'A fee estimate requires a non-empty plan');
      const chainId = extractChainId(first);
      let gasUnits = 0n;
      for (const action of actions) {
        invariant(
          extractChainId(action) === chainId,
          'All plan actions must be on the same chain',
        );
        gasUnits += inferGasEstimate(action);
      }
      // Budget separate transactions, retaining the approval allowances.
      return ok<ExecutionRequest>({
        chainId,
        gasUnits,
      });
    }
    return err(UnexpectedError.from('Expected a network fee query'));
  } catch (error) {
    return err(UnexpectedError.from(error));
  }
}

function resolveChain(
  client: AaveClient,
  request: ExecutionRequest,
): ResultAsync<Chain, UnexpectedError> {
  if ('activity' in request) {
    return okAsync(request.activity.chain);
  }
  return fetchChain(client, { chainId: request.chainId }).map(nonNullable);
}

type ExecutionDetails = {
  requestKey: string;
  chain: Chain;
  gasPrice: bigint;
  gasUnits: bigint;
};

function useExecutionDetails(): UseAsyncTask<
  ExecutionRequest & { requestKey: string },
  ExecutionDetails,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (query) =>
      resolveChain(client, query).andThen((chain) => {
        const viemChain = toViemChain(chain);
        const urls = [
          ...(publicRpcFallbacks[viemChain.id] ?? []),
          ...viemChain.rpcUrls.default.http,
        ];
        const publicClient = createPublicClient({
          chain: viemChain,
          transport: fallback(urls.map((url) => http(url))),
        });

        if ('activity' in query && query.activity.txHash) {
          return ResultAsync.fromPromise(
            publicClient.getTransactionReceipt({ hash: query.activity.txHash }),
            (error) => UnexpectedError.from(error),
          ).map((receipt) => {
            return {
              requestKey: query.requestKey,
              chain: query.activity.chain,
              gasPrice: receipt.effectiveGasPrice,
              gasUnits: receipt.gasUsed,
            };
          });
        }

        if ('gasUnits' in query) {
          return ResultAsync.fromPromise(
            publicClient.estimateFeesPerGas(),
            (error) => UnexpectedError.from(error),
          ).map(({ maxFeePerGas }) => {
            return {
              requestKey: query.requestKey,
              chain,
              gasPrice: maxFeePerGas,
              gasUnits: query.gasUnits,
            };
          });
        }

        return okAsync({
          requestKey: query.requestKey,
          chain: never('Expected chain'),
          gasPrice: 0n,
          gasUnits: 0n,
        });
      }),
    [client],
  );
}

function createNetworkFeeAmount(
  details: ExecutionDetails,
  rate: ExchangeAmount,
): NativeAmount {
  // Gas is denominated in the chain's native token, at its own precision — on a
  // shared-balance chain that is the 18-decimal native view, not the ERC20's.
  const nativeToken = nativeTokenInfo(details.chain);
  invariant(
    nativeToken,
    `Chain ${details.chain.chainId} has no native token to price gas in`,
  );

  const gasCostInWei = details.gasPrice * details.gasUnits;
  const gasCost = bigDecimal(gasCostInWei).rescale(-nativeToken.decimals);

  const amount: DecimalNumber = {
    __typename: 'DecimalNumber',
    decimals: nativeToken.decimals,
    onChainValue: gasCostInWei,
    value: gasCost,
  };

  return {
    __typename: 'NativeAmount',
    token: {
      __typename: 'NativeToken',
      info: nativeToken,
      chain: details.chain,
    },
    amount,
    exchange: {
      __typename: 'ExchangeAmount',
      value: gasCost.mul(rate.value),
      name: rate.name,
      symbol: rate.symbol,
      icon: rate.icon,
      decimals: rate.decimals,
    },
    exchangeRate: {
      __typename: 'DecimalNumber',
      decimals: 2,
      onChainValue: BigInt(rate.value.rescale(2).toFixed(0, RoundingMode.Down)),
      value: rate.value,
    },
  };
}

/**
 * Fetch an activity's network fee or estimate a single action or same-chain plan.
 * Plan estimates sum fixed action budgets (including supply/repay approvals).
 * Any additional affordability margin is applied by the consumer.
 * These are rough budgets for separate transactions, not simulations or wallet-batch quotes.
 * Native token transfers and chain-specific data fees are not included.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 */
export const useNetworkFee: UseNetworkFee = (({
  query,
  currency = Currency.Usd,
  pause = false,
  suspense = false,
}: {
  query: UseNetworkFeeRequestQuery;
  currency?: Currency;
  pause?: boolean;
  suspense?: boolean;
}): SuspendableResult<NativeAmount, UnexpectedError> => {
  const [fetchDetails, details] = useExecutionDetails();
  const preparation = prepareExecution(query);
  const request = preparation.isOk() ? preparation.value : undefined;
  const preparationError = preparation.isErr() ? preparation.error : undefined;
  const chainId = request
    ? 'activity' in request
      ? request.activity.chain.chainId
      : request.chainId
    : undefined;
  const timestamp =
    request && 'activity' in request ? request.activity.timestamp : undefined;
  const requestKey = request
    ? 'activity' in request
      ? `${chainId}:${request.activity.txHash}`
      : `${chainId}:${request.gasUnits}`
    : undefined;
  const lastRequestedKey = useRef<string | undefined>(undefined);
  const hasCurrentRequest = lastRequestedKey.current === requestKey;
  const hasCurrentDetails = details.data?.requestKey === requestKey;

  const rate = useExchangeRate({
    from: {
      native: chainId,
    },
    to: currency,
    at: timestamp,
    pause: pause || !request,
    ...(suspense ? { suspense } : {}),
  });
  const metadata = rate.metadata;

  // biome-ignore lint/correctness/useExhaustiveDependencies: requestKey captures the inputs that affect this fixed estimate
  useEffect(() => {
    if (pause || !request || !requestKey || details.loading) return;
    if (details.called && lastRequestedKey.current === requestKey) return;
    lastRequestedKey.current = requestKey;
    void fetchDetails({ ...request, requestKey });
  }, [fetchDetails, pause, details.called, details.loading, requestKey]);

  if (preparationError && !pause) {
    return ReadResult.Failure(preparationError, metadata);
  }

  if (rate.paused) {
    return ReadResult.Paused(
      hasCurrentDetails && details.data && rate.data
        ? createNetworkFeeAmount(details.data, rate.data)
        : undefined,
      rate.error ? rate.error : undefined,
      metadata,
    );
  }

  if (
    !hasCurrentRequest ||
    !details.called ||
    details.loading ||
    rate.loading
  ) {
    return ReadResult.Loading(metadata);
  }

  if (details.error || rate.error) {
    return ReadResult.Failure(
      details.error ?? rate.error ?? never('Unknown error'),
      metadata,
    );
  }

  invariant(
    hasCurrentDetails && details.data && rate.data,
    'Expected receipt, chain, and rate data',
  );

  return ReadResult.Success(
    createNetworkFeeAmount(details.data, rate.data),
    metadata,
  );
}) as UseNetworkFee;
