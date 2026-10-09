import { chain as fetchChain } from '@aave/client/actions';
import {
  encodeReserveId,
  type OnChainReserveId,
  type PreviewAction,
} from '@aave/graphql';
import {
  makeChain,
  makeExchangeAmount,
  makeTokenInfo,
} from '@aave/graphql/testing';
import { bigDecimal, chainId, evmAddress, okAsync } from '@aave/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReadResult } from '../helpers';
import { type UseNetworkFeeRequestQuery, useExchangeRate } from '../misc';
import { useNetworkFee } from './useNetworkFee';

const { estimateFeesPerGas, client } = vi.hoisted(() => ({
  estimateFeesPerGas: vi.fn(),
  client: {},
}));

vi.mock('viem', async (original) => ({
  ...(await original<typeof import('viem')>()),
  createPublicClient: () => ({ estimateFeesPerGas }),
}));
vi.mock('@aave/client/actions', async (original) => ({
  ...(await original<typeof import('@aave/client/actions')>()),
  chain: vi.fn(),
}));
vi.mock('../context', async (original) => ({
  ...(await original<typeof import('../context')>()),
  useAaveClient: () => client,
}));
vi.mock('../misc', async (original) => ({
  ...(await original<typeof import('../misc')>()),
  useExchangeRate: vi.fn(),
}));

const sender = evmAddress('0x7b610B279E5f818c01888743742748d2281aF6BD');
const spoke = evmAddress('0x385af1b8F0D5311Bf9dd736909CB5D211d8bb95F');
const reserve = encodeReserveId({
  chainId: chainId(1),
  spoke,
  onChainId: '1' as OnChainReserveId,
});
const supply: PreviewAction = {
  supply: { sender, reserve, amount: { erc20: { value: bigDecimal(100) } } },
};
const withdraw: PreviewAction = {
  withdraw: {
    sender,
    reserve: encodeReserveId({
      chainId: chainId(1),
      spoke: evmAddress('0x1111111111111111111111111111111111111111'),
      onChainId: '1' as OnChainReserveId,
    }),
    amount: { erc20: { exact: bigDecimal(100) } },
  },
};
const borrow: PreviewAction = {
  borrow: { sender, reserve, amount: { erc20: { value: bigDecimal(100) } } },
};

function renderEstimate(query: UseNetworkFeeRequestQuery) {
  return renderHook(({ query }) => useNetworkFee({ query }), {
    initialProps: { query },
  });
}

describe('useNetworkFee plan estimates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    estimateFeesPerGas.mockResolvedValue({ maxFeePerGas: 2n });
    const chain = makeChain();
    vi.mocked(fetchChain).mockReturnValue(
      okAsync({
        ...chain,
        nativeAsset:
          chain.nativeAsset?.__typename === 'WrappedNativeAsset'
            ? {
                ...chain.nativeAsset,
                wrappedNativeToken: makeTokenInfo('WETH'),
              }
            : chain.nativeAsset,
      }),
    );
    vi.mocked(useExchangeRate).mockReturnValue(
      ReadResult.Success(makeExchangeAmount(2000), {
        operationKey: 1,
        resultOperationKey: 1,
      }),
    );
  });

  it('budgets every step and a supply approval, without an additional margin and with one gas-price lookup', async () => {
    const { result } = renderEstimate({
      estimatePlan: { actions: [withdraw, supply, borrow] },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeUndefined();
    expect(result.current.data?.amount.onChainValue).toBe(1_266_588n);
    expect(result.current.data?.amount.value).toEqual(
      bigDecimal('0.000000000001266588'),
    );
    expect(result.current.data?.exchange.value).toEqual(
      bigDecimal('0.000000002533176'),
    );
    expect(estimateFeesPerGas).toHaveBeenCalledTimes(1);
    expect(fetchChain).toHaveBeenCalledTimes(1);
  });

  it('keeps the single-action estimate unchanged', async () => {
    const { result } = renderEstimate({ estimate: supply });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.amount.onChainValue).toBe(375_388n);
  });

  it('includes repay approval gas without an additional margin', async () => {
    const repay: PreviewAction = {
      repay: {
        sender,
        reserve,
        amount: { erc20: { value: { exact: bigDecimal(100) } } },
      },
    };
    const { result } = renderEstimate({ estimatePlan: { actions: [repay] } });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.amount.onChainValue).toBe(546_894n);
  });

  it('uses the single-action collateral budget and does not deduplicate repeated steps', async () => {
    const collateral: PreviewAction = {
      setUserSuppliesAsCollateral: {
        sender,
        changes: [
          { reserve, enableCollateral: true },
          {
            reserve: encodeReserveId({
              chainId: chainId(1),
              spoke,
              onChainId: '2' as OnChainReserveId,
            }),
            enableCollateral: true,
          },
        ],
      },
    };
    const { result } = renderEstimate({
      estimatePlan: { actions: [collateral, supply, supply] },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.amount.onChainValue).toBe(1_231_344n);
    const single = renderEstimate({ estimate: collateral });
    const plan = renderEstimate({ estimatePlan: { actions: [collateral] } });
    await waitFor(() =>
      expect(single.result.current.loading || plan.result.current.loading).toBe(
        false,
      ),
    );
    expect(plan.result.current.data?.amount.onChainValue).toBe(
      single.result.current.data?.amount.onChainValue,
    );
  });

  it.each([
    { name: 'empty', actions: [] },
    {
      name: 'mixed-chain',
      actions: [
        supply,
        {
          borrow: {
            ...borrow.borrow,
            reserve: encodeReserveId({
              chainId: chainId(10),
              spoke,
              onChainId: '1' as OnChainReserveId,
            }),
          },
        },
      ],
    },
    {
      name: 'unsupported',
      actions: [supply, { swap: {} } as unknown as PreviewAction],
    },
    {
      name: 'empty collateral changes',
      actions: [{ setUserSuppliesAsCollateral: { sender, changes: [] } }],
    },
  ] satisfies Array<{ name: string; actions: PreviewAction[] }>)(
    'returns an error instead of a partial total for an $name plan',
    ({ actions }) => {
      const { result } = renderEstimate({ estimatePlan: { actions } });
      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
      expect(estimateFeesPerGas).not.toHaveBeenCalled();
      expect(fetchChain).not.toHaveBeenCalled();
    },
  );

  it('recalculates when the plan changes on the mounted hook', async () => {
    const { result, rerender } = renderEstimate({
      estimatePlan: { actions: [supply] },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.amount.onChainValue).toBe(375_388n);
    rerender({
      query: { estimatePlan: { actions: [withdraw, supply, borrow] } },
    });
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.amount.onChainValue).toBe(1_266_588n);
    expect(estimateFeesPerGas).toHaveBeenCalledTimes(2);
    rerender({
      query: { estimatePlan: { actions: [withdraw, supply, borrow] } },
    });
    expect(estimateFeesPerGas).toHaveBeenCalledTimes(2);
  });

  it('returns an error when the gas-price lookup fails', async () => {
    estimateFeesPerGas.mockRejectedValue(new Error('RPC unavailable'));
    const { result } = renderEstimate({ estimatePlan: { actions: [supply] } });
    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.data).toBeUndefined();
  });
  it('waits for an in-flight estimate before requesting the changed plan', async () => {
    let resolvePrice: ((value: { maxFeePerGas: bigint }) => void) | undefined;
    estimateFeesPerGas.mockReturnValueOnce(
      new Promise<{ maxFeePerGas: bigint }>((resolve) => {
        resolvePrice = resolve;
      }),
    );
    const { result, rerender } = renderEstimate({
      estimatePlan: { actions: [supply] },
    });
    await waitFor(() => expect(estimateFeesPerGas).toHaveBeenCalledTimes(1));
    rerender({
      query: { estimatePlan: { actions: [withdraw, supply, borrow] } },
    });
    expect(result.current.data).toBeUndefined();
    expect(estimateFeesPerGas).toHaveBeenCalledTimes(1);
    await act(async () => resolvePrice?.({ maxFeePerGas: 2n }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.amount.onChainValue).toBe(1_266_588n);
    expect(estimateFeesPerGas).toHaveBeenCalledTimes(2);
  });

  it('does not fetch a paused plan and estimates it when resumed', async () => {
    const { result, rerender } = renderHook(
      ({ pause }) =>
        useNetworkFee({
          query: { estimatePlan: { actions: [supply] } },
          pause,
        }),
      { initialProps: { pause: true } },
    );
    expect(fetchChain).not.toHaveBeenCalled();
    expect(estimateFeesPerGas).not.toHaveBeenCalled();
    rerender({ pause: false });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.amount.onChainValue).toBe(375_388n);
  });
  it('does not return the previous plan fee when paused during a replacement estimate', async () => {
    const metadata = { operationKey: 1, resultOperationKey: 1 };
    vi.mocked(useExchangeRate).mockImplementation(({ pause }) =>
      pause
        ? ReadResult.Paused<ReturnType<typeof makeExchangeAmount>>(
            makeExchangeAmount(2000),
            undefined,
            metadata,
          )
        : ReadResult.Success(makeExchangeAmount(2000), metadata),
    );
    const initialProps: { actions: PreviewAction[]; pause: boolean } = {
      actions: [supply],
      pause: false,
    };
    const { result, rerender } = renderHook(
      ({ actions, pause }: { actions: PreviewAction[]; pause: boolean }) =>
        useNetworkFee({ query: { estimatePlan: { actions } }, pause }),
      { initialProps },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.amount.onChainValue).toBe(375_388n);
    rerender({ actions: [supply], pause: true });
    expect(result.current.paused).toBe(true);
    expect(result.current.data?.amount.onChainValue).toBe(375_388n);

    let finish: ((value: { maxFeePerGas: bigint }) => void) | undefined;
    estimateFeesPerGas.mockReturnValueOnce(
      new Promise<{ maxFeePerGas: bigint }>((resolve) => {
        finish = resolve;
      }),
    );
    rerender({ actions: [withdraw, supply, borrow], pause: false });
    await waitFor(() => expect(estimateFeesPerGas).toHaveBeenCalledTimes(2));
    rerender({ actions: [withdraw, supply, borrow], pause: true });
    expect(result.current.paused).toBe(true);
    expect(result.current.data).toBeUndefined();

    await act(async () => finish?.({ maxFeePerGas: 2n }));
    await waitFor(() =>
      expect(result.current.data?.amount.onChainValue).toBe(1_266_588n),
    );
    expect(result.current.paused).toBe(true);
    rerender({ actions: [withdraw, supply, borrow], pause: false });
    expect(result.current.data?.amount.onChainValue).toBe(1_266_588n);
    expect(estimateFeesPerGas).toHaveBeenCalledTimes(2);
  });
});
