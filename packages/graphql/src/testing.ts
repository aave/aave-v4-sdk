import {
  type BlockchainData,
  bigDecimal,
  type ChainId,
  type EvmAddress,
  evmAddress,
  type TxHash,
  chainId as toChainId,
} from '@aave/types';
import {
  type OperationType,
  QuoteAccuracy,
  SwapOrderClass,
  TokenSwapKind,
} from './enums';
import type {
  Chain,
  DecimalNumber,
  DomainData,
  Erc20Amount,
  Erc20Approval,
  Erc20Token,
  ExchangeAmount,
  ExchangeAmountWithChange,
  HealthFactorWithChange,
  PaginatedUserSwapsResult,
  PercentNumber,
  PercentNumberWithChange,
  PermitTypedData,
  PositionSwapAdapterContractApproval,
  PositionSwapPositionManagerApproval,
  PrepareSwapOrder,
  Spoke,
  SwapByIntent,
  SwapByIntentWithApprovalRequired,
  SwapByTransaction,
  SwapCancelled,
  SwapCancelledResult,
  SwapFulfilled,
  SwapOpen,
  SwapQuote,
  SwapReceipt,
  SwapTransactionRequest,
  SwapTypedData,
  TokenInfo,
  TokenSwap,
  TransactionRequest,
  UserPosition,
  UserPositionRiskPremium,
} from './fragments';
import {
  encodeSpokeId,
  type ReserveId,
  reserveId,
  type SwapId,
  type SwapQuoteId,
  tokenInfoId,
  type UserBorrowItemId,
  type UserSupplyItemId,
  userBorrowItemId,
  userPositionId,
  userSupplyItemId,
} from './id';

function randomBase64String(): string {
  return btoa(crypto.randomUUID());
}

function makeSerializableBigInt(value: bigint): bigint {
  return Object.create(BigInt.prototype, {
    toJSON: {
      value() {
        return value.toString();
      },
    },
    valueOf: {
      value() {
        return value;
      },
    },
  });
}

/**
 * @internal
 */
export function makeUserBorrowItemId(): UserBorrowItemId {
  return userBorrowItemId(randomBase64String());
}

/**
 * @internal
 */
export function makeUserSupplyItemId(): UserSupplyItemId {
  return userSupplyItemId(randomBase64String());
}

/**
 * @internal
 */
export function makeReserveId(): ReserveId {
  return reserveId(randomBase64String());
}

/**
 * @internal
 */
export function percentNumber(value: number, decimals = 6): PercentNumber {
  const normalized = bigDecimal(value);

  return {
    __typename: 'PercentNumber',
    value: normalized.div(2),
    normalized,
    onChainValue: makeSerializableBigInt(
      BigInt(normalized.rescale(decimals).toApproximateNumber()),
    ),
    decimals,
  };
}

/**
 * @internal
 */
export function decimalNumber(value: number, decimals = 18): DecimalNumber {
  return {
    __typename: 'DecimalNumber',
    value: bigDecimal(value),
    onChainValue: makeSerializableBigInt(
      BigInt(bigDecimal(value).rescale(decimals).toApproximateNumber()),
    ),
    decimals,
  };
}

function randomHexString(size: number): `0x${string}` {
  return [...Array<string>(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('') as `0x${string}`;
}

/**
 * @internal
 */
export function randomEvmAddress(): EvmAddress {
  return evmAddress(`0x${randomHexString(20 * 2)}`);
}

export const TestTokens = {
  WETH: {
    name: 'Wrapped Ether',
    decimals: 18,
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    isWrappedNativeToken: true,
  },
  USDC: {
    name: 'USD Coin',
    decimals: 6,
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    isWrappedNativeToken: false,
  },
  GHO: {
    name: 'Gho Token',
    decimals: 18,
    address: '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f',
    isWrappedNativeToken: false,
  },
  AAVE: {
    name: 'Aave Token',
    decimals: 18,
    address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    isWrappedNativeToken: false,
  },
} as const;

export function makeTokenInfo(symbol: keyof typeof TestTokens): TokenInfo {
  const { name, decimals } = TestTokens[symbol];

  return {
    __typename: 'TokenInfo',
    id: tokenInfoId(randomBase64String()),
    name,
    symbol,
    decimals,
    icon: 'https://example.com/icon.png',
    categories: [],
  };
}

export function makeChain(): Chain {
  return {
    __typename: 'Chain',
    name: 'Ethereum',
    icon: 'https://example.com/icon.png',
    chainId: toChainId(1),
    rpcUrl: 'https://example.com/rpc.json',
    explorerUrl: 'https://example.com/explorer.json',
    isTestnet: false,
    isFork: false,
    nativeWrappedToken: randomEvmAddress(),
    nativeGateway: randomEvmAddress(),
    signatureGateway: randomEvmAddress(),
    nativeInfo: makeTokenInfo('WETH'),
  };
}

export function makeErc20Token(symbol: keyof typeof TestTokens): Erc20Token {
  const { isWrappedNativeToken } = TestTokens[symbol];

  return {
    __typename: 'Erc20Token',
    address: randomEvmAddress(),
    chain: makeChain(),
    info: makeTokenInfo(symbol),
    isWrappedNativeToken,
  };
}

export function makeExchangeAmount(value: number): ExchangeAmount {
  return {
    __typename: 'ExchangeAmount',
    value: bigDecimal(value),
    name: 'USD',
    symbol: '$',
    icon: 'https://example.com/icon.png',
    decimals: 2,
  };
}

/**
 * @internal
 */
export function makeErc20Amount(
  value: number,
  symbol: keyof typeof TestTokens,
): Erc20Amount {
  return {
    __typename: 'Erc20Amount',
    amount: decimalNumber(value, TestTokens[symbol].decimals),
    token: makeErc20Token(symbol),
    exchange: makeExchangeAmount(value),
    exchangeRate: decimalNumber(value),
  };
}

/**
 * @internal
 */
export function makeTransactionRequest({
  chainId = toChainId(1),
  from = randomEvmAddress(),
  operations = [],
}: {
  chainId?: ChainId;
  from?: EvmAddress;
  operations?: OperationType[];
} = {}): TransactionRequest {
  return {
    __typename: 'TransactionRequest',
    to: from,
    from,
    data: '0x' as BlockchainData,
    value: makeSerializableBigInt(0n),
    chainId,
    operations,
  };
}

function makePercentNumber(value = 0): PercentNumber {
  return {
    __typename: 'PercentNumber',
    value: bigDecimal(value),
    normalized: bigDecimal(value),
    onChainValue: makeSerializableBigInt(0n),
    decimals: 6,
  };
}

function makePercentNumberWithChange(value = 0): PercentNumberWithChange {
  return {
    __typename: 'PercentNumberWithChange',
    current: makePercentNumber(value),
    change: makePercentNumber(0),
  };
}

function makeExchangeAmountWithChange(value = 0): ExchangeAmountWithChange {
  return {
    __typename: 'ExchangeAmountWithChange',
    current: makeExchangeAmount(value),
    change: makePercentNumber(0),
  };
}

function makeHealthFactorWithChange(): HealthFactorWithChange {
  return {
    __typename: 'HealthFactorWithChange',
    current: null,
    change: makePercentNumber(0),
  };
}

function makeUserPositionRiskPremium(): UserPositionRiskPremium {
  return {
    __typename: 'UserPositionRiskPremium',
    current: makePercentNumber(0),
    latest: makePercentNumber(0),
  };
}

function makeSpoke({
  address,
  chainId,
}: {
  address: EvmAddress;
  chainId: ChainId;
}): Spoke {
  return {
    __typename: 'Spoke',
    id: encodeSpokeId({ chainId, address }),
    name: 'Test Spoke',
    address,
    chain: {
      __typename: 'Chain',
      name: 'Test Chain',
      icon: 'https://example.com/icon.png',
      chainId,
      rpcUrl: 'https://example.com/rpc',
      explorerUrl: 'https://example.com/explorer',
      isTestnet: true,
      isFork: true,
      nativeWrappedToken: randomEvmAddress(),
      nativeGateway: randomEvmAddress(),
      signatureGateway: randomEvmAddress(),
      nativeInfo: makeTokenInfo('WETH'),
    },
    liquidationConfig: null,
  };
}

/**
 * @internal
 */
export function makeUserPosition({
  address,
  chainId,
  user,
}: {
  address: EvmAddress;
  chainId: ChainId;
  user: EvmAddress;
}): UserPosition {
  return {
    __typename: 'UserPosition',
    id: userPositionId(randomBase64String()),
    spoke: makeSpoke({ address, chainId }),
    user,
    createdAt: new Date(),
    netApy: makePercentNumber(0),
    netCollateral: makeExchangeAmountWithChange(0),
    netBalance: makeExchangeAmountWithChange(0),
    netAccruedInterest: makeExchangeAmount(0),
    totalCollateral: makeExchangeAmountWithChange(0),
    totalSupplied: makeExchangeAmountWithChange(0),
    totalDebt: makeExchangeAmountWithChange(0),
    netSupplyApy: makePercentNumberWithChange(0),
    netBorrowApy: makePercentNumberWithChange(0),
    healthFactor: makeHealthFactorWithChange(),
    riskPremium: makeUserPositionRiskPremium(),
    liquidationPrice: makeExchangeAmount(0),
    maxBorrowingPower: makeExchangeAmount(0),
    remainingBorrowingPower: makeExchangeAmount(0),
    canUpdateDynamicConfig: false,
    netBalancePercentChange: makePercentNumber(0),
    averageCollateralFactor: makePercentNumber(0),
  };
}

/**
 * @internal
 */
export function makeSwapTypedData(): SwapTypedData {
  // __typenames that you see and are normally not part of the fragment fieldset selection
  // are used here to allow the URQL cache to be able to normalize the data. Hence the need to
  // assert the type (as DomainData)
  return {
    __typename: 'SwapTypedData',
    primaryType: 'Swap',
    types: {
      Swap: [
        { name: 'amount', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    domain: {
      __typename: 'DomainData',
      name: 'Swap',
      version: '1',
      chainId: toChainId(1),
      verifyingContract: randomEvmAddress(),
    } as DomainData,
    message: {
      amount: '1000000000000000000',
      deadline: 1234567890,
    },
  };
}

function makeQuoteId(): SwapQuoteId {
  return randomBase64String() as SwapQuoteId;
}

/**
 * @internal
 */
export function makeSwapQuote({
  accuracy = QuoteAccuracy.Accurate,
  buyAmount = 1000,
}: {
  accuracy?: QuoteAccuracy;
  buyAmount?: number;
} = {}): SwapQuote {
  return {
    __typename: 'SwapQuote',
    accuracy,
    quoteId: makeQuoteId(),
    suggestedSlippage: percentNumber(0.01),
    selectedSlippage: null,
    buy: makeErc20Amount(buyAmount, 'USDC'),
    sell: makeErc20Amount(1000, 'WETH'),
    costs: {
      __typename: 'SwapQuoteCosts',
      networkCosts: makeErc20Amount(1000, 'WETH'),
      partnerFee: makeErc20Amount(1000, 'USDC'),
      flashloanFee: makeErc20Amount(1000, 'WETH'),
      providerFee: makeErc20Amount(1000, 'USDC'),
    },
    finalBuy: makeErc20Amount(buyAmount, 'USDC'),
    finalSell: makeErc20Amount(1000, 'WETH'),
  };
}

/**
 * @internal
 */
export function makeSwapReceipt(): SwapReceipt {
  return {
    __typename: 'SwapReceipt',
    id: randomBase64String() as SwapId,
    createdAt: new Date(),
  };
}

/**
 * @internal
 */
export function makeTokenSwap(): TokenSwap {
  return {
    __typename: 'TokenSwap',
    sell: makeErc20Amount(1000, 'WETH'),
    buy: makeErc20Amount(1000, 'USDC'),
    kind: TokenSwapKind.Sell,
    orderClass: SwapOrderClass.Market,
  };
}

/**
 * @internal
 */
export function makeSwapOpen(): SwapOpen {
  return {
    __typename: 'SwapOpen',
    swapId: randomBase64String() as SwapId,
    createdAt: new Date(),
    deadline: new Date(Date.now() + 3600_000), // 1 hour from now
    explorerUrl: 'https://example.com/explorer.json',
    operation: makeTokenSwap(),
  };
}

/**
 * @internal
 */
export function makeSwapCancelled(): SwapCancelled {
  return {
    __typename: 'SwapCancelled',
    swapId: randomBase64String() as SwapId,
    createdAt: new Date(),
    cancelledAt: new Date(),
    explorerUrl: 'https://example.com/explorer.json',
    operation: makeTokenSwap(),
  };
}

/**
 * @internal
 */
export function makeSwapFulfilled(): SwapFulfilled {
  return {
    __typename: 'SwapFulfilled',
    swapId: randomBase64String() as SwapId,
    txHash: '0xabc123' as TxHash,
    createdAt: new Date(),
    fulfilledAt: new Date(),
    explorerUrl: 'https://example.com/explorer.json',
    refundTxHash: null,
    operation: makeTokenSwap(),
  };
}

/**
 * @internal
 */
export function makePaginatedUserSwapsResult(
  items: Array<SwapOpen | SwapFulfilled | SwapCancelled>,
): PaginatedUserSwapsResult {
  return {
    __typename: 'PaginatedUserSwapsResult',
    items,
    pageInfo: {
      __typename: 'PaginatedResultInfo',
      prev: null,
      next: null,
    },
  };
}

/**
 * @internal
 */
export function makeSwapCancelledResult(): SwapCancelledResult {
  return {
    __typename: 'SwapCancelledResult',
    swapId: randomBase64String() as SwapId,
    createdAt: new Date(),
    cancelledAt: new Date(),
    explorerUrl: 'https://example.com/explorer.json',
  };
}

/**
 * @internal
 */
export function makePositionSwapAdapterContractApproval({
  bySignature = makeSwapTypedData(),
}: {
  bySignature?: SwapTypedData;
  byTransaction?: TransactionRequest;
} = {}): PositionSwapAdapterContractApproval {
  return {
    __typename: 'PositionSwapAdapterContractApproval',
    bySignature,
  };
}

/**
 * @internal
 */
export function makePositionSwapPositionManagerApproval({
  bySignature = makeSwapTypedData(),
  byTransaction = makeTransactionRequest(),
}: {
  bySignature?: SwapTypedData;
  byTransaction?: TransactionRequest;
} = {}): PositionSwapPositionManagerApproval {
  return {
    __typename: 'PositionSwapPositionManagerApproval',
    bySignature,
    byTransaction,
  };
}

/**
 * @internal
 */
export function makeSwapTransactionRequest({
  transaction = makeTransactionRequest(),
}: {
  transaction?: TransactionRequest;
} = {}): SwapTransactionRequest {
  return {
    __typename: 'SwapTransactionRequest',
    transaction,
    orderReceipt: makeSwapReceipt(),
  };
}

/**
 * @internal
 */
export function makeSwapByTransaction(): SwapByTransaction {
  return {
    __typename: 'SwapByTransaction',
    quote: makeSwapQuote(),
  };
}

/**
 * @internal
 */
export function makeSwapByIntent({
  quote = makeSwapQuote(),
}: {
  quote?: SwapQuote;
} = {}): SwapByIntent {
  return {
    __typename: 'SwapByIntent',
    quote,
  };
}

/**
 * @internal
 */
export function makePrepareSwapOrder(): PrepareSwapOrder {
  return {
    __typename: 'PrepareSwapOrder',
    newQuoteId: makeQuoteId(),
    data: makeSwapTypedData(),
  };
}

/**
 * @internal
 */
export function makePermitTypedData(): PermitTypedData {
  // __typenames that you see and are normally not part of the fragment fieldset selection
  // are used here to allow the URQL cache to be able to normalize the data. Hence the need to
  // assert the type as DomainData
  return {
    __typename: 'PermitTypedData',
    types: {
      EIP712Domain: [{ name: 'name', type: 'string' }],
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'Permit',
    domain: {
      __typename: 'DomainData',
      name: 'Permit',
      version: '1',
      chainId: toChainId(1),
      verifyingContract: randomEvmAddress(),
    } as DomainData,
    message: {
      owner: randomEvmAddress(),
      spender: randomEvmAddress(),
      value: '1000000000000000000',
      nonce: '0',
      deadline: 1234567890,
    },
    signedAmount: bigDecimal(1),
  };
}

/**
 * @internal
 */
export function makeErc20Approval({
  byTransaction = makeTransactionRequest(),
}: {
  byTransaction?: TransactionRequest;
} = {}): Erc20Approval {
  return {
    __typename: 'Erc20Approval',
    byTransaction,
    bySignature: makePermitTypedData(),
  };
}

/**
 * @internal
 */
export function makeSwapByIntentWithApprovalRequired({
  approval = makeErc20Approval(),
}: {
  approval?: Erc20Approval;
} = {}): SwapByIntentWithApprovalRequired {
  return {
    __typename: 'SwapByIntentWithApprovalRequired',
    quote: makeSwapQuote(),
    approvals: [approval],
  };
}
