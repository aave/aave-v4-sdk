import {
  ETHEREUM_FORK_RPC_URL,
  ETHEREUM_TOKENS,
} from '@aave/client-next/test-utils';
import type { SupplyActivity } from '@aave/graphql-next';
import {
  Currency,
  type Erc20Amount,
  type ReserveInfo,
  type Spoke,
} from '@aave/graphql-next';
import { chainId, evmAddress, type ID, txHash } from '@aave/types-next';
import { defineChain } from 'viem';
import { mainnet } from 'viem/chains';
import { describe, expect, it, vi } from 'vitest';
import { renderHookWithinContext } from './test-utils';
import { useNetworkFee } from './viem';

// TODO replace this temp hack with correct fork ID once the new tenderly fork is available
vi.mock('@aave/client-next/viem', () => ({
  supportedChains: {
    [chainId(1)]: defineChain({
      ...mainnet,
      rpcUrls: {
        default: {
          http: [ETHEREUM_FORK_RPC_URL],
        },
      },
    }),
  },
}));

describe('Given the viem adapters are used', () => {
  describe('When the useNetworkFee hook is used with an ActivityItem', () => {
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
        chainId: chainId(1),
        name: 'Ethereum',
        icon: 'https://example.com/eth-icon.png',
        explorerUrl: 'https://etherscan.io',
        isTestnet: false,
        nativeWrappedToken: ETHEREUM_TOKENS.WETH,
        nativeInfo: {
          __typename: 'TokenInfo',
          name: 'Ethereum',
          symbol: 'ETH',
          icon: 'https://example.com/eth-icon.png',
          decimals: 18,
        },
        nativeGateway: evmAddress('0x0000000000000000000000000000000000000000'),
        signatureGateway: evmAddress(
          '0x0000000000000000000000000000000000000000',
        ),
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
      expect(fee.amount.onChainValue).toMatchInlineSnapshot('568044n');

      // Assert correct conversion
      expect(fee.fiatAmount.value).toEqual(
        fee.amount.value.mul(fee.fiatRate.value),
      );
    });
  });
});
