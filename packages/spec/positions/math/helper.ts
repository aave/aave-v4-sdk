import { type BigDecimal, bigDecimal } from '@aave/client';
import { devnetChain, ETHEREUM_FORK_RPC_URL } from '@aave/client/testing';
import { type Address, createPublicClient, http } from 'viem';

// Constants
const WAD = 10n ** 18n; // 1e18 = 1.0 in WAD format
const MAX_UINT256 = 2n ** 256n - 1n;
const userAccountDataABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserAccountData',
    outputs: [
      {
        components: [
          { name: 'riskPremium', type: 'uint256' },
          { name: 'avgCollateralFactor', type: 'uint256' },
          { name: 'healthFactor', type: 'uint256' },
          { name: 'totalCollateralValue', type: 'uint256' },
          { name: 'totalDebtValue', type: 'uint256' },
          { name: 'activeCollateralCount', type: 'uint256' },
          { name: 'borrowedCount', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface UserAccountData {
  riskPremium: BigDecimal;
  avgCollateralFactor: BigDecimal;
  healthFactor: BigDecimal;
  totalCollateralValue: BigDecimal;
  totalDebtValue: BigDecimal;
  activeCollateralCount: number;
  borrowedCount: number;
}

function formatHealthFactor(healthFactor: bigint): BigDecimal {
  if (healthFactor === MAX_UINT256) {
    return bigDecimal(0);
  }
  const hf = bigDecimal(healthFactor).div(WAD);
  return hf;
}

function formatUSD(value: bigint): BigDecimal {
  return bigDecimal(value).div(bigDecimal('1e26'));
}

function formatPercentage(value: bigint): BigDecimal {
  return bigDecimal(value).div(WAD).mul(bigDecimal('100'));
}

function formatBPS(value: bigint): BigDecimal {
  return bigDecimal(value).div(bigDecimal('100'));
}

/**
 * Get user account data from the Spoke contract
 * @param address - The user address to query
 * @param spoke - The Spoke contract address
 * @returns User account data
 */
export async function getAccountData(
  address: Address,
  spoke: Address,
): Promise<UserAccountData> {
  const publicClient = createPublicClient({
    chain: devnetChain,
    transport: http(ETHEREUM_FORK_RPC_URL),
  });

  const result = await publicClient.readContract({
    address: spoke,
    abi: userAccountDataABI,
    functionName: 'getUserAccountData',
    args: [address],
  });

  return {
    riskPremium: formatBPS(result.riskPremium),
    avgCollateralFactor: formatPercentage(result.avgCollateralFactor),
    healthFactor: formatHealthFactor(result.healthFactor),
    totalCollateralValue: formatUSD(result.totalCollateralValue),
    totalDebtValue: formatUSD(result.totalDebtValue),
    activeCollateralCount: Number(result.activeCollateralCount),
    borrowedCount: Number(result.borrowedCount),
  };
}
