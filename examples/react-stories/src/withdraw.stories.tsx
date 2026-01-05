import 'viem/window';

import type { Hub, Spoke, UserSupplyItem } from '@aave/react';
import type { Story } from '@ladle/react';
import { HeadingLarge } from 'baseui/typography';
import { useState } from 'react';
import { HubSelector } from './components/HubSelector';
import { SingleUserPosition } from './components/positions';
import { SpokeSelector } from './components/SpokeSelector';
import { SupplySelector } from './components/SupplySelector';
import { WithdrawForm } from './components/WithdrawForm';
import * as config from './config';
import { user, walletClient } from './wallet';

export const WithdrawERC20: Story = () => {
  const [hub, setHub] = useState<Hub | null>(null);
  const [spoke, setSpoke] = useState<Spoke | null>(null);
  const [supply, setSupply] = useState<UserSupplyItem | null>(null);

  const handleHubSelect = (hub: Hub | null) => {
    setHub(hub);
    setSpoke(null);
    setSupply(null);
  };

  const handleSpokeSelect = (spoke: Spoke | null) => {
    setSpoke(spoke);
    setSupply(null);
  };

  return (
    <>
      <HeadingLarge>Withdraw ERC-20 Tokens</HeadingLarge>

      <HubSelector
        chainId={config.chainId}
        onChange={handleHubSelect}
        selected={hub}
      />

      <SpokeSelector
        hubId={hub?.id}
        onChange={handleSpokeSelect}
        selected={spoke}
      />

      {spoke && <SingleUserPosition spokeId={spoke.id} user={user} />}

      <SupplySelector
        spokeId={spoke?.id}
        user={user}
        onChange={setSupply}
        selected={supply}
      />

      {supply && <WithdrawForm supply={supply} walletClient={walletClient} />}
    </>
  );
};

WithdrawERC20.storyName = 'ERC-20 Tokens';
