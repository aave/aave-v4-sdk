import {
  Currency,
  ReservesRequestFilter,
  useExchangeRate,
  useUserBalances,
} from '@aave/react';
import type { Story } from '@ladle/react';
import { Block } from 'baseui/block';
import { ListItem, ListItemLabel } from 'baseui/list';
import { Notification } from 'baseui/notification';
import { HeadingLarge, LabelMedium, ParagraphSmall } from 'baseui/typography';
import * as config from './config';
import { user } from './wallet';

export const Balances: Story = () => {
  const { data, loading, error } = useUserBalances({
    user,
    filter: {
      chains: {
        chainIds: [config.chainId],
        byReservesType: ReservesRequestFilter.All,
      },
    },
  });

  if (loading) {
    return <Notification>Loading balances…</Notification>;
  }

  if (error) {
    return <Notification kind='negative'>{String(error.message)}</Notification>;
  }

  return (
    <>
      <HeadingLarge>User Balances</HeadingLarge>
      <ParagraphSmall color='contentSecondary'>
        Wallet token balances for all Aave v4 reserves on the selected chain.
      </ParagraphSmall>

      <Block as='ol' $style={{ paddingLeft: 0, listStyle: 'none' }}>
        {data?.map((balance) => (
          <ListItem
            key={balance.info.name}
            endEnhancer={() => (
              <ParagraphSmall>
                {balance.exchange.symbol}
                {balance.exchange.value.toDisplayString(2, {
                  minFractionDigits: 2,
                })}
              </ParagraphSmall>
            )}
          >
            <ListItemLabel
              description={`${balance.totalAmount.value.toDisplayString(2)} ${balance.info.symbol}`}
            >
              {balance.info.name}
            </ListItemLabel>
          </ListItem>
        ))}
      </Block>
    </>
  );
};

function ExchangeRateCard({ currency }: { currency: Currency }) {
  const { data, loading, error } = useExchangeRate({
    from: { native: config.chainId },
    to: currency,
  });

  return (
    <Block
      padding='scale600'
      $style={{
        flex: 1,
        borderRadius: '8px',
        border: '1px solid',
        borderColor: error ? '#E11900' : '#E2E2E2',
        textAlign: 'center',
      }}
    >
      <LabelMedium color='contentSecondary'>{currency}</LabelMedium>
      <HeadingLarge marginTop='scale200' marginBottom='0'>
        {error
          ? 'Error'
          : loading
            ? '…'
            : `${data.symbol}${data.value.toDisplayString(2)}`}
      </HeadingLarge>
      <ParagraphSmall color='contentSecondary' marginTop='scale200'>
        1 ETH
      </ParagraphSmall>
    </Block>
  );
}

export const ExchangeRates: Story = () => {
  return (
    <>
      <HeadingLarge>Exchange Rates</HeadingLarge>
      <ParagraphSmall color='contentSecondary'>
        How much is 1 ETH worth right now?
      </ParagraphSmall>

      <Block display='flex' gridGap='scale600' marginTop='scale600'>
        <ExchangeRateCard currency={Currency.Usd} />
        <ExchangeRateCard currency={Currency.Eur} />
        <ExchangeRateCard currency={Currency.Gbp} />
      </Block>
    </>
  );
};
