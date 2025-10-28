/// <reference path="../../../vite-env.d.ts" />

import { GraphQLErrorCode, UnexpectedError } from '@aave/core-next';
import {
  type BigDecimal,
  bigDecimal,
  chainId,
  type EvmAddress,
  evmAddress,
  ResultAsync,
} from '@aave/types-next';
import {
  type Account,
  type Chain,
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseEther,
  parseUnits,
  type Transport,
  type WalletClient,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { AaveClient } from './AaveClient';
import { local, staging } from './environments';

export const environment =
  import.meta.env.ENVIRONMENT === 'local' ? local : staging;

export const ETHEREUM_FORK_ID = chainId(
  Number.parseInt(import.meta.env.ETHEREUM_TENDERLY_FORK_ID, 10),
);

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

export const ETHEREUM_HUB_CORE_ADDRESS = evmAddress(
  '0x7E7c3EDCa4D39D0aFBD468Dec89cdEaF0AC770d3',
);

export const ETHEREUM_SPOKE_CORE_ADDRESS = evmAddress(
  '0x89914a22E30CDf88A06e801E407ca82520210a79',
);

export const ETHEREUM_SPOKE_EMODE_ADDRESS = evmAddress(
  '0xBf0c5c03e3D9059ef51F18B9DE48C741dc339672',
);

export const ETHEREUM_SPOKE_ISO_STABLE_ADDRESS = evmAddress(
  '0xCc51b78aFF1d1c483Ff303bd687EFF42B993ee95',
);

export const ETHEREUM_SPOKE_ISO_GOV_ADDRESS = evmAddress(
  '0xc2C1Da9815f7aFa00Fe49d5B8b5fBeE454FF1caA',
);

export const ETHEREUM_MARKET_ETH_CORRELATED_EMODE_CATEGORY = 1;

export const ETHEREUM_FORK_RPC_URL = import.meta.env
  .ETHEREUM_TENDERLY_PUBLIC_RPC;

export const ETHEREUM_FORK_RPC_URL_ADMIN = import.meta.env
  .ETHEREUM_TENDERLY_ADMIN_RPC;

export const ethereumForkChain: Chain = defineChain({
  id: ETHEREUM_FORK_ID,
  name: 'Ethereum Fork',
  network: 'ethereum-fork',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [ETHEREUM_FORK_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Ethereum Fork Explorer',
      url: import.meta.env.ETHEREUM_TENDERLY_BLOCKEXPLORER,
    },
  },
});

export const client = AaveClient.create({
  environment,
  headers: {
    'x-e2e-tests': import.meta.env.API_X_E2E_TESTS_HEADER,
  },
});

export async function createNewWallet(
  privateKey?: `0x${string}`,
): Promise<WalletClient<Transport, Chain, Account>> {
  if (!privateKey) {
    const privateKey = generatePrivateKey();
    console.log('privateKey', privateKey);
    const wallet = createWalletClient({
      account: privateKeyToAccount(privateKey),
      chain: ethereumForkChain,
      transport: http(),
    });

    await fundNativeAddress(evmAddress(wallet.account.address));

    return wallet;
  }
  return createWalletClient({
    account: privateKeyToAccount(privateKey),
    chain: ethereumForkChain,
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
): ResultAsync<string, UnexpectedError> {
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
): Promise<number> {
  const publicClient = createPublicClient({
    chain: ethereumForkChain,
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

  return Number.parseFloat(
    (Number(balance) / 10 ** Number(decimals)).toFixed(decimals),
  );
}

// Function to get native token (ETH) balance
export async function getNativeBalance(address: EvmAddress): Promise<number> {
  const publicClient = createPublicClient({
    chain: ethereumForkChain,
    transport: http(ETHEREUM_FORK_RPC_URL),
  });

  const balance = await publicClient.getBalance({
    address: address,
  });

  // Convert from wei to ETH (18 decimals)
  const decimals = 18;
  return Number.parseFloat(
    (Number(balance) / 10 ** decimals).toFixed(decimals),
  );
}
