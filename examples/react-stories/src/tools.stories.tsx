import { ReservesRequestFilter, useUserBalances } from '@aave/react';
import type { Story } from '@ladle/react';
import { Block } from 'baseui/block';
import { ListItem, ListItemLabel } from 'baseui/list';
import { Notification } from 'baseui/notification';
import { HeadingLarge, ParagraphSmall } from 'baseui/typography';
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
