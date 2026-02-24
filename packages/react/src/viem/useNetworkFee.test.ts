import {
  ETHEREUM_FORK_ID,
  ETHEREUM_FORK_RPC_URL,
  ETHEREUM_WETH_ADDRESS,
} from '@aave/client/testing';
import type { SupplyActivity } from '@aave/graphql';
import {
  Currency,
  type Erc20Amount,
  encodeReserveId,
  encodeUserPositionId,
  type ID,
  type OnChainReserveId,
  type PreviewAction,
  type ReserveInfo,
  type Spoke,
  tokenInfoId,
  UserPositionConditionsUpdate,
} from '@aave/graphql';
import { bigDecimal, evmAddress, txHash } from '@aave/types';
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
        rpcUrl: ETHEREUM_FORK_RPC_URL,
        explorerUrl: 'https://etherscan.io',
        isTestnet: false,
        isFork: true,
        nativeWrappedToken: ETHEREUM_WETH_ADDRESS,
        nativeGateway: evmAddress('0x0000000000000000000000000000000000000001'),
        signatureGateway: evmAddress(
          '0x0000000000000000000000000000000000000002',
        ),
        nativeInfo: {
          __typename: 'TokenInfo',
          id: tokenInfoId('1'),
          name: 'Ethereum',
          symbol: 'ETH',
          icon: 'https://example.com/eth-icon.png',
          decimals: 18,
          categories: [],
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
      expect(fee.exchange.value).toEqual(
        fee.amount.value.mul(fee.exchangeRate.value),
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
        requestType: 'SetUserSuppliesAsCollateralRequest',
        estimate: {
          setUserSuppliesAsCollateral: {
            changes: [
              {
                reserve: encodeReserveId({
                  chainId: ETHEREUM_FORK_ID,
                  spoke: evmAddress(
                    '0x385af1b8F0D5311Bf9dd736909CB5D211d8bb95F',
                  ),
                  onChainId: '1' as OnChainReserveId,
                }),
                enableCollateral: true,
              },
            ],
            sender: evmAddress('0x7b610B279E5f818c01888743742748d2281aF6BD'),
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
      {
        requestType: 'UpdateUserPositionConditionsRequest',
        estimate: {
          updateUserPositionConditions: {
            userPositionId: encodeUserPositionId({
              chainId: ETHEREUM_FORK_ID,
              spoke: evmAddress('0x385af1b8F0D5311Bf9dd736909CB5D211d8bb95F'),
              user: evmAddress('0x7b610B279E5f818c01888743742748d2281aF6BD'),
            }),
            update: UserPositionConditionsUpdate.AllDynamicConfig,
          },
        },
        expectedGasCost: 560000n,
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
