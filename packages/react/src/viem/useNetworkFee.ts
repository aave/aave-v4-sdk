import { type AaveClient, UnexpectedError } from '@aave/client';
import { chain as fetchChain } from '@aave/client/actions';
import { toViemChain } from '@aave/client/viem';
import {
  type Chain,
  Currency,
  type DecimalNumber,
  decodeReserveId,
  type FiatAmount,
  type NativeAmount,
  type PreviewAction,
  type ReserveId,
} from '@aave/graphql';
import {
  bigDecimal,
  type ChainId,
  invariant,
  never,
  nonNullable,
  okAsync,
  ResultAsync,
  RoundingMode,
} from '@aave/types';
import { useEffect } from 'react';
import { createPublicClient, http } from 'viem';
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

const estimatedApprovalGas = 55_558n;

const gasEstimates: Record<keyof PreviewAction, bigint> = {
  supply: 132_136n + estimatedApprovalGas,
  borrow: 250_551n,
  withdraw: 195_049n,
  repay: 217_889n + estimatedApprovalGas,
  setUserSupplyAsCollateral: 240_284n,
};

function inferGasEstimate(action: PreviewAction): bigint {
  const key = Object.keys(action)[0] as keyof PreviewAction;
  return gasEstimates[key] ?? never(`Expected gas estimate for action ${key}`);
}

function extractReserveId(action: PreviewAction): ReserveId {
  if ('supply' in action) {
    return action.supply.reserve;
  }

  if ('borrow' in action) {
    return action.borrow.reserve;
  }

  if ('withdraw' in action) {
    return action.withdraw.reserve;
  }

  if ('repay' in action) {
    return action.repay.reserve;
  }

  if ('setUserSupplyAsCollateral' in action) {
    return action.setUserSupplyAsCollateral.reserve;
  }

  return never('Expected reserve id');
}

function extractChainId(action: PreviewAction): ChainId {
  const reserveId = extractReserveId(action);
  return decodeReserveId(reserveId).chainId;
}

function inferChainId(query: UseNetworkFeeRequestQuery): ChainId | undefined {
  if ('activity' in query && query.activity) {
    return query.activity.chain.chainId;
  }

  if ('estimate' in query && query.estimate) {
    return extractChainId(query.estimate);
  }

  return undefined;
}

function inferTimestampForExchangeRateLookup(
  query: UseNetworkFeeRequestQuery,
): Date | undefined {
  if ('activity' in query && query.activity) {
    return query.activity.timestamp;
  }
  return undefined; // i.e., now
}

function resolveChain(
  client: AaveClient,
  query: UseNetworkFeeRequestQuery,
): ResultAsync<Chain, UnexpectedError> {
  if ('activity' in query && query.activity) {
    return okAsync(query.activity.chain);
  }

  if ('estimate' in query && query.estimate) {
    return fetchChain(client, {
      chainId: extractChainId(query.estimate),
    }).map(nonNullable);
  }

  return never('Expected chain');
}

type ExecutionDetails = {
  chain: Chain;
  gasPrice: bigint;
  gasUnits: bigint;
};

function useExecutionDetails(): UseAsyncTask<
  UseNetworkFeeRequestQuery,
  ExecutionDetails,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (query) =>
      resolveChain(client, query).andThen((chain) => {
        const publicClient = createPublicClient({
          chain: toViemChain(chain),
          transport: http(),
        });

        if ('activity' in query) {
          return ResultAsync.fromPromise(
            publicClient.getTransactionReceipt({ hash: query.activity.txHash }),
            (error) => UnexpectedError.from(error),
          ).map((receipt) => {
            return {
              chain: query.activity.chain,
              gasPrice: receipt.effectiveGasPrice,
              gasUnits: receipt.gasUsed,
            };
          });
        }

        if ('estimate' in query && query.estimate) {
          return ResultAsync.fromPromise(
            publicClient.estimateFeesPerGas(),
            (error) => UnexpectedError.from(error),
          ).map(({ maxFeePerGas }) => {
            return {
              chain,
              gasPrice: maxFeePerGas,
              gasUnits: inferGasEstimate(query.estimate),
            };
          });
        }

        return okAsync({
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
  rate: FiatAmount,
): NativeAmount {
  const gasCostInWei = details.gasPrice * details.gasUnits;
  const gasCost = bigDecimal(gasCostInWei).rescale(
    -details.chain.nativeInfo.decimals,
  );

  const amount: DecimalNumber = {
    __typename: 'DecimalNumber',
    decimals: details.chain.nativeInfo.decimals,
    onChainValue: gasCostInWei,
    value: gasCost,
  };

  return {
    __typename: 'NativeAmount',
    token: {
      __typename: 'NativeToken',
      info: details.chain.nativeInfo,
      chain: details.chain,
    },
    amount,
    fiatAmount: {
      __typename: 'FiatAmount',
      value: gasCost.mul(rate.value),
      name: rate.name,
      symbol: rate.symbol,
    },
    fiatRate: {
      __typename: 'DecimalNumber',
      decimals: 2,
      onChainValue: BigInt(rate.value.rescale(2).toFixed(0, RoundingMode.Down)),
      value: rate.value,
    },
  };
}

/**
 * Fetch the network fee for an ActivityItem or estimates networkf feed for a preview action.
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

  const rate = useExchangeRate({
    from: {
      native: inferChainId(query),
    },
    to: currency,
    at: inferTimestampForExchangeRateLookup(query),
    pause,
    ...(suspense ? { suspense } : {}),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: query omitted since it's usually a literal object that changes at every render
  useEffect(() => {
    if (pause || details.called || !query) return;

    fetchDetails(query);
  }, [fetchDetails, pause, details.called]);

  if (rate.paused) {
    return ReadResult.Paused(
      details.data && rate.data
        ? createNetworkFeeAmount(details.data, rate.data)
        : undefined,
      rate.error ? rate.error : undefined,
    );
  }

  if (!details.called || details.loading || rate.loading) {
    return ReadResult.Loading();
  }

  if (details.error || rate.error) {
    return ReadResult.Failure(
      details.error ?? rate.error ?? never('Unknown error'),
    );
  }

  invariant(
    details.data && rate.data,
    'Expected receipt, chain, and rate data',
  );

  return ReadResult.Success(createNetworkFeeAmount(details.data, rate.data));
}) as UseNetworkFee;
