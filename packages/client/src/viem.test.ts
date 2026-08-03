import type { Chain } from '@aave/graphql';
import { tokenInfoId } from '@aave/graphql';
import { chainId, evmAddress } from '@aave/types';
import { mainnet } from 'viem/chains';
import { describe, expect, it } from 'vitest';
import { toViemChain } from './viem';

const tokenInfo = {
  __typename: 'TokenInfo',
  id: tokenInfoId('native-token'),
  name: 'Ether',
  symbol: 'ETH',
  canonicalSymbol: 'ETH',
  icon: 'https://example.com/eth.svg',
  decimals: 18,
  categories: [],
} satisfies Chain['nativeInfo'];

describe(`Given the ${toViemChain.name} helper`, () => {
  it('Then it should reuse the known viem mainnet chain definition', () => {
    const result = toViemChain({
      chainId: chainId(mainnet.id),
    } as Chain);

    expect(result).toBe(mainnet);
  });

  it('Then it should define a viem chain from custom Aave chain metadata', () => {
    const result = toViemChain({
      __typename: 'Chain',
      name: 'Aave Fork',
      icon: 'https://example.com/fork.svg',
      chainId: chainId(30303),
      explorerUrl: 'https://explorer.example.com',
      isTestnet: true,
      isFork: true,
      nativeWrappedToken: evmAddress(
        '0x0000000000000000000000000000000000000001',
      ),
      nativeGateway: evmAddress('0x0000000000000000000000000000000000000002'),
      signatureGateway: evmAddress(
        '0x0000000000000000000000000000000000000003',
      ),
      nativeWrappedInfo: tokenInfo,
      nativeInfo: tokenInfo,
      rpcUrl: 'https://rpc.example.com',
    });

    expect(result).toMatchObject({
      id: 30303,
      name: 'Aave Fork',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ['https://rpc.example.com'],
        },
      },
      blockExplorers: {
        default: {
          name: 'Aave Fork Explorer',
          url: 'https://explorer.example.com',
        },
      },
    });
  });
});
