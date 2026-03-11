import { useHubs } from '@aave/react';
import type { Story } from '@ladle/react';
import { Block } from 'baseui/block';
import { ListItem, ListItemLabel } from 'baseui/list';
import { Notification } from 'baseui/notification';
import { HeadingLarge, ParagraphSmall } from 'baseui/typography';
import * as config from './config';

export const Hubs: Story = () => {
  const { data, loading, error } = useHubs({
    query: {
      chainIds: [config.chainId],
    },
  });

  if (loading) {
    return <Notification>Loading hubs…</Notification>;
  }

  if (error) {
    return <Notification kind='negative'>{String(error.message)}</Notification>;
  }

  return (
    <>
      <HeadingLarge>Hubs</HeadingLarge>
      <ParagraphSmall color='contentSecondary'>
        All hubs on the selected chain.
      </ParagraphSmall>

      <Block as='ol' $style={{ paddingLeft: 0, listStyle: 'none' }}>
        {data.map((hub) => (
          <ListItem
            key={hub.address.toString()}
            endEnhancer={() => (
              <ParagraphSmall>
                {hub.summary.totalSupplied.current.symbol}
                {hub.summary.totalSupplied.current.value.toDisplayString(2, {
                  minFractionDigits: 2,
                })}
              </ParagraphSmall>
            )}
          >
            <ListItemLabel description='Total supplied'>
              {hub.name}
            </ListItemLabel>
          </ListItem>
        ))}
      </Block>
    </>
  );
};
