import 'viem/window';

import type { Story } from '@ladle/react';
import { HeadingLarge } from 'baseui/typography';
import { AllUserPositions } from './components/positions';
import { chainId } from './config';
import { user } from './wallet';

export const UserPositions: Story = () => (
  <>
    <HeadingLarge>User Positions</HeadingLarge>
    <AllUserPositions user={user} chainId={chainId} />
  </>
);
