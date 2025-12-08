import { assertOk, BigDecimal, Currency } from '@aave/client';
import { exchangeRate } from '@aave/client/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
} from '@aave/client/testing';
import { describe, expect, it } from 'vitest';

describe('Querying Exchange Rates on Aave V4', () => {
  describe('Given a user who wants to get exchange rates', () => {
    describe('When fetching exchange rate from ERC20 token to fiat currency', () => {
      it('Then it should return the exchange rate in the requested currency', async () => {
        const result = await exchangeRate(client, {
          from: {
            erc20: {
              chainId: ETHEREUM_FORK_ID,
              address: ETHEREUM_USDC_ADDRESS,
            },
          },
          to: Currency.Usd,
        });

        assertOk(result);
        expect(result.value).toMatchSnapshot({
          value: expect.any(BigDecimal),
        });
      });
    });

    describe('When fetching exchange rate from native token to fiat currency', () => {
      it('Then it should return the exchange rate for native token', async () => {
        const result = await exchangeRate(client, {
          from: {
            native: ETHEREUM_FORK_ID,
          },
          to: Currency.Usd,
        });

        assertOk(result);
        expect(result.value).toMatchSnapshot({
          value: expect.any(BigDecimal),
        });
      });
    });

    describe('When fetching exchange rate to different fiat currencies', () => {
      const currencies = Object.values(Currency);

      it.each(currencies)(
        'Then it should return the exchange rate in %s',
        async (currency) => {
          const result = await exchangeRate(client, {
            from: {
              erc20: {
                chainId: ETHEREUM_FORK_ID,
                address: ETHEREUM_WETH_ADDRESS,
              },
            },
            to: currency,
          });

          assertOk(result);
          expect(result.value).toMatchSnapshot({
            value: expect.any(BigDecimal),
          });
        },
      );
    });

    describe('When fetching exchange rate from fiat to fiat', () => {
      it('Then it should return the cross-currency exchange rate', async () => {
        const result = await exchangeRate(client, {
          from: {
            fiat: Currency.Usd,
          },
          to: Currency.Eur,
        });

        assertOk(result);
        expect(result.value).toMatchSnapshot({
          value: expect.any(BigDecimal),
        });
      });
    });
  });
});
