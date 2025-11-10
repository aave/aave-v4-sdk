import {
  ETHEREUM_FORK_ID,
  ETHEREUM_WETH_ADDRESS,
} from '@aave/client-next/test-utils';
import type { SupplyActivity } from '@aave/graphql-next';
import {
  Currency,
  type Erc20Amount,
  encodeReserveId,
  type ID,
  type OnChainReserveId,
  type PreviewAction,
  type ReserveInfo,
  type Spoke,
} from '@aave/graphql-next';
import { bigDecimal, evmAddress, txHash } from '@aave/types-next';
import { describe, expect, it, vi } from 'vitest';
import { renderHookWithinContext } from '../test-utils';
import { useNetworkFee } from './useNetworkFee';

describe(`Given the ${useNetworkFee.name} hook for Viem/Wagmi integrations`, () => {
  describe('When the hook is used with an ActivityItem', () => {
    const activity: SupplyActivity = {
      __typename: 'SupplyActivity',
      id: '0x123-supply-1' as ID,
      timestamp: new Date('2025-10-20T12:00:00Z'),
      txHash: txHash(
        // the first ERC-20 token creation tx
        '0x9e7b5966b33b4393f250bfcf45eed7751d44981b6d8dec9422a0bd2a2c698306',
      ),
      user: evmAddress('0x1234567890123456789012345678901234567890'),
      chain: {
        __typename: 'Chain',
        chainId: ETHEREUM_FORK_ID,
        name: 'Ethereum',
        icon: 'https://example.com/eth-icon.png',
        explorerUrl: 'https://etherscan.io',
        isTestnet: false,
        nativeWrappedToken: ETHEREUM_WETH_ADDRESS,
        nativeGateway: evmAddress('0x0000000000000000000000000000000000000001'),
        signatureGateway: evmAddress(
          '0x0000000000000000000000000000000000000002',
        ),
        nativeInfo: {
          __typename: 'TokenInfo',
          name: 'Ethereum',
          symbol: 'ETH',
          icon: 'https://example.com/eth-icon.png',
          decimals: 18,
        },
      },
      spoke: {} as Spoke,
      reserve: {} as ReserveInfo,
      supplied: {} as Erc20Amount,
    };

    it('Then it should return the expected network fee', async () => {
      const { result } = renderHookWithinContext(() =>
        useNetworkFee({
          query: { activity },
          currency: Currency.Usd,
        }),
      );

      await vi.waitUntil(() => result.current.loading === false);

      expect(result.current.error).toBeUndefined();
      expect(result.current.data).toBeDefined();

      const fee = result.current.data!;

      // Assert on-chain tx costs
      expect(fee.amount.onChainValue).toMatchInlineSnapshot(
        '11360880000000000n',
      );

      // Assert correct conversion
      expect(fee.fiatAmount.value).toEqual(
        fee.amount.value.mul(fee.fiatRate.value),
      );
    });
  });

  describe('When the hook is used to estimate network fees for preview actions', () => {
    it.each<{
      requestType: string;
      estimate: PreviewAction;
      expectedGasCost: bigint;
    }>([
      {
        requestType: 'SupplyRequest',
        estimate: {
          supply: {
            amount: {
              erc20: {
                value: bigDecimal('1000'),
              },
            },
            reserve: encodeReserveId({
              chainId: ETHEREUM_FORK_ID,
              spoke: evmAddress('0x385af1b8F0D5311Bf9dd736909CB5D211d8bb95F'),
              onChainId: '1' as OnChainReserveId,
            }),
            sender: evmAddress('0x7b610B279E5f818c01888743742748d2281aF6BD'),
          },
        },
        expectedGasCost: 375388n,
      },
      {
        requestType: 'BorrowRequest',
        estimate: {
          borrow: {
            amount: {
              erc20: {
                value: bigDecimal('1000'),
              },
            },
            reserve: encodeReserveId({
              chainId: ETHEREUM_FORK_ID,
              spoke: evmAddress('0x385af1b8F0D5311Bf9dd736909CB5D211d8bb95F'),
              onChainId: '1' as OnChainReserveId,
            }),
            sender: evmAddress('0x7b610B279E5f818c01888743742748d2281aF6BD'),
          },
        },
        expectedGasCost: 501102n,
      },
      {
        requestType: 'SetUserSupplyAsCollateralRequest',
        estimate: {
          setUserSupplyAsCollateral: {
            enableCollateral: true,
            sender: evmAddress('0x7b610B279E5f818c01888743742748d2281aF6BD'),
            reserve: encodeReserveId({
              chainId: ETHEREUM_FORK_ID,
              spoke: evmAddress('0x385af1b8F0D5311Bf9dd736909CB5D211d8bb95F'),
              onChainId: '1' as OnChainReserveId,
            }),
          },
        },
        expectedGasCost: 480568n,
      },
      {
        requestType: 'WithdrawRequest',
        estimate: {
          withdraw: {
            amount: {
              erc20: {
                exact: bigDecimal('1000'),
              },
            },
            reserve: encodeReserveId({
              chainId: ETHEREUM_FORK_ID,
              spoke: evmAddress('0x385af1b8F0D5311Bf9dd736909CB5D211d8bb95F'),
              onChainId: '1' as OnChainReserveId,
            }),
            sender: evmAddress('0x7b610B279E5f818c01888743742748d2281aF6BD'),
          },
        },
        expectedGasCost: 390098n,
      },
      {
        requestType: 'RepayRequest',
        estimate: {
          repay: {
            amount: {
              erc20: {
                value: {
                  exact: bigDecimal('1000'),
                },
              },
            },
            reserve: encodeReserveId({
              chainId: ETHEREUM_FORK_ID,
              spoke: evmAddress('0x385af1b8F0D5311Bf9dd736909CB5D211d8bb95F'),
              onChainId: '1' as OnChainReserveId,
            }),
            sender: evmAddress('0x7b610B279E5f818c01888743742748d2281aF6BD'),
          },
        },
        expectedGasCost: 546894n,
      },
    ])(
      'Then it should return an estimated network fee for a $requestType',
      async ({ estimate, expectedGasCost: expectedGas }) => {
        const { result } = renderHookWithinContext(() =>
          useNetworkFee({
            query: { estimate },
            currency: Currency.Usd,
          }),
        );

        await vi.waitUntil(() => result.current.loading === false, 5000);

        expect(result.current.error).toBeUndefined();
        expect(result.current.data).toBeDefined();

        const fee = result.current.data!;

        // Assert on-chain tx costs
        expect(fee.amount.onChainValue).toEqual(expectedGas);
      },
    );
  });
});
