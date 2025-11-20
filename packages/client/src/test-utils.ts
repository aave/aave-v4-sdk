/// <reference path="../../../vite-env.d.ts" />

import { GraphQLErrorCode, UnexpectedError } from '@aave/core';
import { encodeHubId, encodeSpokeId } from '@aave/graphql';
import {
  type BigDecimal,
  bigDecimal,
  chainId,
  type EvmAddress,
  evmAddress,
  ResultAsync,
} from '@aave/types';
import {
  type Account,
  type Chain,
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  parseUnits,
  type Transport,
  type WalletClient,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { AaveClient } from './AaveClient';
import { local, production, staging } from './environments';
import { devnetChain } from './viem';

export const environment =
  import.meta.env.ENVIRONMENT === 'local'
    ? local
    : import.meta.env.ENVIRONMENT === 'production'
      ? production
      : staging;

export const ETHEREUM_FORK_ID = chainId(
  Number.parseInt(import.meta.env.ETHEREUM_TENDERLY_FORK_ID, 10),
);

// Token addresses
export const ETHEREUM_GHO_ADDRESS = evmAddress(
  '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f',
);
export const ETHEREUM_WETH_ADDRESS = evmAddress(
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
);
export const ETHEREUM_USDC_ADDRESS = evmAddress(
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
);
export const ETHEREUM_USDS_ADDRESS = evmAddress(
  '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
);
export const ETHEREUM_WSTETH_ADDRESS = evmAddress(
  '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
);
export const ETHEREUM_1INCH_ADDRESS = evmAddress(
  '0x111111111117dC0aa78b770fA6A738034120C302',
);

// Spoke addresses and ids
export const ETHEREUM_SPOKE_CORE_ADDRESS = evmAddress(
  '0xBa97c5E52cd5BC3D7950Ae70779F8FfE92d40CdC',
);
export const ETHEREUM_SPOKE_CORE_ID = encodeSpokeId({
  chainId: ETHEREUM_FORK_ID,
  address: ETHEREUM_SPOKE_CORE_ADDRESS,
});

export const ETHEREUM_SPOKE_ETHENA_ADDRESS = evmAddress(
  '0x2559E4E04F2cA7180e5f20C2872d22EC89601b56',
);

export const ETHEREUM_SPOKE_FRONTIER_ADDRESS = evmAddress(
  '0x5738d9cB82d6a1617973C257D05A387bF5568F47',
);

export const ETHEREUM_SPOKE_LST_ADDRESS = evmAddress(
  '0x4D4a7b3Ce709b4362D7095a4A0105bDFDb5dA2a7',
);
export const ETHEREUM_SPOKE_ISO_STABLE_ID = encodeSpokeId({
  chainId: ETHEREUM_FORK_ID,
  address: ETHEREUM_SPOKE_LST_ADDRESS,
});

// Hub addresses
export const ETHEREUM_HUB_CORE_ADDRESS = evmAddress(
  '0xaD905aD5EA5B98cD50AE40Cfe368344686a21366',
);
export const ETHEREUM_HUB_CORE_ID = encodeHubId({
  chainId: ETHEREUM_FORK_ID,
  address: ETHEREUM_HUB_CORE_ADDRESS,
});

export const ETHEREUM_FORK_RPC_URL = import.meta.env
  .ETHEREUM_TENDERLY_PUBLIC_RPC;

export const ETHEREUM_FORK_RPC_URL_ADMIN = import.meta.env
  .ETHEREUM_TENDERLY_ADMIN_RPC;

export const client = AaveClient.create({
  environment,
});

export async function createNewWallet(
  privateKey?: `0x${string}`,
): Promise<WalletClient<Transport, Chain, Account>> {
  if (!privateKey) {
    const privateKey = generatePrivateKey();
    const wallet = createWalletClient({
      account: privateKeyToAccount(privateKey),
      chain: devnetChain,
      transport: http(),
    });

    await fundNativeAddress(evmAddress(wallet.account.address));

    return wallet;
  }
  return createWalletClient({
    account: privateKeyToAccount(privateKey),
    chain: devnetChain,
    transport: http(),
  });
}

// Tenderly RPC type for setBalance
type TSetBalanceRpc = {
  Method: 'tenderly_setBalance';
  Parameters: [addresses: string[], amount: string];
  ReturnType: string;
};

// Tenderly RPC type for set ERC20 balance
type TSetErc20BalanceRpc = {
  Method: 'tenderly_setErc20Balance';
  Parameters: [tokenAddress: string, address: string, amount: string];
  ReturnType: string;
};

export function fundNativeAddress(
  address: EvmAddress,
  amount: BigDecimal = bigDecimal('1.0'), // 1 ETH
): ResultAsync<string, UnexpectedError> {
  // Create client with fork chain - you'll need to replace this with your actual fork chain config
  const publicClient = createPublicClient({
    chain: {
      id: ETHEREUM_FORK_ID,
      name: 'Tenderly Fork',
      network: 'tenderly-fork',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [ETHEREUM_FORK_RPC_URL_ADMIN] },
      },
    },
    transport: http(ETHEREUM_FORK_RPC_URL_ADMIN),
  });

  const amountInWei = parseEther(amount.toString());
  const amountHex = `0x${amountInWei.toString(16)}`;

  return ResultAsync.fromPromise(
    publicClient
      .request<TSetBalanceRpc>({
        method: 'tenderly_setBalance',
        params: [[address], amountHex],
      })
      .then(async (res) => {
        await wait(500); // Temporal fix to avoid tenderly issues with the balance not being set
        return res;
      }),
    (err) => UnexpectedError.from(err),
  );
}

export function fundErc20Address(
  address: EvmAddress,
  token: {
    address: EvmAddress;
    amount: BigDecimal;
    decimals?: number;
  },
): ResultAsync<string, Error> {
  const publicClient = createPublicClient({
    chain: {
      id: ETHEREUM_FORK_ID,
      name: 'Tenderly Fork',
      network: 'tenderly-fork',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [ETHEREUM_FORK_RPC_URL_ADMIN] },
      },
    },
    transport: http(ETHEREUM_FORK_RPC_URL_ADMIN),
  });

  // Convert amount to the smallest unit (e.g., wei for 18 decimals)
  const amountInSmallestUnit = parseUnits(
    token.amount.toString(),
    token.decimals ?? 18,
  );
  const amountHex = `0x${amountInSmallestUnit.toString(16)}`;

  return ResultAsync.fromPromise(
    publicClient
      .request<TSetErc20BalanceRpc>({
        method: 'tenderly_setErc20Balance',
        params: [token.address, address, amountHex],
      })
      .then(async (res) => {
        await wait(500); // Temporal fix to avoid tenderly issues with the balance not being set
        return res;
      }),
    (err) => UnexpectedError.from(err),
  );
}

const messages: Record<GraphQLErrorCode, string> = {
  [GraphQLErrorCode.UNAUTHENTICATED]:
    "Unauthenticated - Authentication is required to access '<operation>'",
  [GraphQLErrorCode.FORBIDDEN]:
    "Forbidden - You are not authorized to access '<operation>'",
  [GraphQLErrorCode.INTERNAL_SERVER_ERROR]:
    'Internal server error - Please try again later',
  [GraphQLErrorCode.BAD_USER_INPUT]:
    'Bad user input - Please check the input and try again',
  [GraphQLErrorCode.BAD_REQUEST]:
    'Bad request - Please check the request and try again',
};

export function createGraphQLErrorObject(code: GraphQLErrorCode) {
  return {
    message: messages[code],
    locations: [],
    path: [],
    extensions: {
      code: code,
    },
  };
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to get balance ERC20 token
export async function getBalance(
  address: EvmAddress,
  tokenAddress: EvmAddress,
): Promise<BigDecimal> {
  const publicClient = createPublicClient({
    chain: devnetChain,
    transport: http(ETHEREUM_FORK_RPC_URL),
  });

  const [balance, decimals] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi: [
        {
          inputs: [
            { internalType: 'address', name: 'account', type: 'address' },
          ],
          name: 'balanceOf',
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ] as const,
      functionName: 'balanceOf',
      args: [address],
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: [
        {
          inputs: [],
          name: 'decimals',
          outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
          stateMutability: 'pure',
          type: 'function',
        },
      ] as const,
      functionName: 'decimals',
    }),
  ]);

  return bigDecimal(balance).rescale(-decimals);
}

// Function to get native token (ETH) balance
export async function getNativeBalance(
  address: EvmAddress,
): Promise<BigDecimal> {
  const publicClient = createPublicClient({
    chain: devnetChain,
    transport: http(ETHEREUM_FORK_RPC_URL),
  });

  const balance = await publicClient.getBalance({
    address: address,
  });

  // Convert from wei to ETH (18 decimals)
  return bigDecimal(balance).rescale(-18);
}
