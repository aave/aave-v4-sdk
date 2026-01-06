import 'viem/window';

import type { Hub, Reserve, Spoke } from '@aave/react';
import type { Story } from '@ladle/react';
import { HeadingLarge } from 'baseui/typography';
import { useState } from 'react';
import { BorrowForm } from './components/BorrowForm';
import { HubSelector } from './components/HubSelector';
import { SingleUserPosition } from './components/positions';
import { ReserveSelector } from './components/ReserveSelector';
import { SpokeSelector } from './components/SpokeSelector';
import * as config from './config';
import { user, walletClient } from './wallet';

export const BorrowERC20: Story = () => {
  const [hub, setHub] = useState<Hub | null>(null);
  const [spoke, setSpoke] = useState<Spoke | null>(null);
  const [reserve, setReserve] = useState<Reserve | null>(null);

  const handleHubSelect = (hub: Hub | null) => {
    setHub(hub);
    setSpoke(null);
    setReserve(null);
  };

  const handleSpokeSelect = (spoke: Spoke | null) => {
    setSpoke(spoke);
    setReserve(null);
  };

  return (
    <>
      <HeadingLarge>Borrow ERC-20 Tokens</HeadingLarge>

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

      <ReserveSelector
        spokeId={spoke?.id}
        onChange={setReserve}
        selected={reserve}
      />

      {reserve && <BorrowForm reserve={reserve} walletClient={walletClient} />}
    </>
  );
};

BorrowERC20.storyName = 'ERC-20 Tokens';
