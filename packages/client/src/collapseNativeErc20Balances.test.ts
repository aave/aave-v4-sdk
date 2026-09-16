import type {
  Chain,
  Erc20Amount,
  NativeAmount,
  TokenAmount,
  UserBalance,
} from '@aave/graphql';
import {
  decimalNumber,
  makeChain,
  makeExchangeAmount,
  makeSharedBalanceNativeAsset,
  makeTokenInfo,
  makeWrappedNativeAsset,
  percentNumber,
  randomEvmAddress,
} from '@aave/graphql/testing';
import { evmAddress } from '@aave/types';
import { describe, expect, it } from 'vitest';
import {
  collapseNativeErc20Balances,
  isNativeErc20View,
  withoutNativeErc20Views,
} from './nativeAsset';

/** The representative ERC20 of Arc's native USDC. */
const ARC_ERC20 = evmAddress('0x3600000000000000000000000000000000000000');

function arcChain(): Chain {
  const asset = makeSharedBalanceNativeAsset();
  return {
    ...makeChain(),
    chainId: 5042 as Chain['chainId'],
    nativeAsset:
      asset.__typename === 'SharedBalanceNativeAsset'
        ? { ...asset, erc20Address: ARC_ERC20 }
        : asset,
  };
}

function ethereumChain(): Chain {
  return { ...makeChain(), nativeAsset: makeWrappedNativeAsset() };
}

function erc20Amount(
  value: number,
  chain: Chain,
  address = randomEvmAddress(),
): Erc20Amount {
  return {
    __typename: 'Erc20Amount',
    amount: decimalNumber(value, 6),
    exchange: makeExchangeAmount(value),
    exchangeRate: decimalNumber(1),
    token: {
      __typename: 'Erc20Token',
      address,
      chain,
      info: makeTokenInfo('USDC'),
      isWrappedNativeToken: false,
    },
  };
}

function nativeAmount(value: number, chain: Chain): NativeAmount {
  return {
    __typename: 'NativeAmount',
    amount: decimalNumber(value, 6),
    exchange: makeExchangeAmount(value),
    exchangeRate: decimalNumber(1),
    token: { __typename: 'NativeToken', chain, info: makeTokenInfo('USDC') },
  };
}

function userBalance(balances: TokenAmount[]): UserBalance {
  const total = balances.reduce((sum, b) => sum + b.amount.onChainValue, 0n);
  const totalValue = balances.reduce(
    (sum, b) => sum + b.amount.value.toApproximateNumber(),
    0,
  );
  const exchange = balances.reduce(
    (sum, b) => sum + b.exchange.value.toApproximateNumber(),
    0,
  );

  return {
    __typename: 'UserBalance',
    id: 'user-balance-id' as UserBalance['id'],
    info: makeTokenInfo('USDC'),
    balances,
    totalAmount: { ...decimalNumber(totalValue, 6), onChainValue: total },
    exchange: makeExchangeAmount(exchange),
    highestSupplyApy: percentNumber(0),
    highestBorrowApy: percentNumber(0),
    lowestSupplyApy: percentNumber(0),
    lowestBorrowApy: percentNumber(0),
    highestCollateralFactor: percentNumber(0),
    lowestCollateralFactor: percentNumber(0),
  };
}

describe('Given a balance on a chain whose native token is itself an ERC20', () => {
  it('Then the ERC20 view of the native balance is identified as redundant', () => {
    expect(isNativeErc20View(erc20Amount(100, arcChain(), ARC_ERC20))).toBe(
      true,
    );
  });

  it('Then the native row itself is kept', () => {
    expect(isNativeErc20View(nativeAmount(100, arcChain()))).toBe(false);
  });

  it('Then an unrelated ERC20 on the same chain is kept', () => {
    expect(isNativeErc20View(erc20Amount(100, arcChain()))).toBe(false);
  });

  it('Then the match ignores address casing', () => {
    const upper = evmAddress(ARC_ERC20.toUpperCase().replace('0X', '0x'));
    expect(isNativeErc20View(erc20Amount(100, arcChain(), upper))).toBe(true);
  });
});

describe('Given ETH and WETH, which are two distinct balances', () => {
  it('Then the wrapped native ERC20 is never treated as redundant', () => {
    // Summing ETH and WETH is correct — only the shared-balance case must not sum.
    const chain = ethereumChain();
    const wrapper =
      chain.nativeAsset?.__typename === 'WrappedNativeAsset'
        ? chain.nativeAsset.wrappedNativeTokenAddress
        : randomEvmAddress();

    expect(isNativeErc20View(erc20Amount(1, chain, wrapper))).toBe(false);
  });
});

describe('Given a list of balances', () => {
  it('Then the redundant view is dropped and the native row survives', () => {
    const chain = arcChain();
    const kept = withoutNativeErc20Views([
      nativeAmount(100, chain),
      erc20Amount(100, chain, ARC_ERC20),
    ]);

    expect(kept).toHaveLength(1);
    expect(kept[0]?.__typename).toBe('NativeAmount');
  });

  it('Then a list with nothing to drop is returned by reference', () => {
    const balances = [nativeAmount(100, arcChain())];
    expect(withoutNativeErc20Views(balances)).toBe(balances);
  });
});

describe('Given a userBalances result spanning a shared-balance chain', () => {
  it('Then an entry holding only the redundant view is dropped entirely', () => {
    const chain = arcChain();
    const entries = [
      userBalance([nativeAmount(100, chain)]),
      userBalance([erc20Amount(100, chain, ARC_ERC20)]),
    ];

    const collapsed = collapseNativeErc20Balances(entries);

    expect(collapsed).toHaveLength(1);
    expect(collapsed[0]?.balances[0]?.__typename).toBe('NativeAmount');
  });

  it('Then the surviving total is the holding, not double it', () => {
    // 100 USDC held on Arc must read as 100, never 200.
    const chain = arcChain();
    const collapsed = collapseNativeErc20Balances([
      userBalance([nativeAmount(100, chain)]),
      userBalance([erc20Amount(100, chain, ARC_ERC20)]),
    ]);

    const total = collapsed.reduce(
      (sum, entry) => sum + entry.totalAmount.value.toApproximateNumber(),
      0,
    );
    expect(total).toBe(100);
  });

  it('Then an entry that keeps some rows has its totals recomputed', () => {
    const chain = arcChain();
    const entry = userBalance([
      erc20Amount(40, chain),
      erc20Amount(60, chain, ARC_ERC20),
    ]);
    expect(entry.totalAmount.onChainValue).toBe(100000000n);

    const [collapsed] = collapseNativeErc20Balances([entry]);

    expect(collapsed?.balances).toHaveLength(1);
    expect(collapsed?.totalAmount.value.toApproximateNumber()).toBe(40);
    expect(collapsed?.totalAmount.onChainValue).toBe(40000000n);
    expect(collapsed?.exchange.value.toApproximateNumber()).toBe(40);
  });

  it('Then entries that lose nothing are passed through by reference', () => {
    const entries = [userBalance([erc20Amount(1, ethereumChain())])];
    const collapsed = collapseNativeErc20Balances(entries);

    expect(collapsed[0]).toBe(entries[0]);
  });
});
