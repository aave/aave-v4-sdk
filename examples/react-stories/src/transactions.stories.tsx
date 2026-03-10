import 'viem/window';

import type {
  Hub,
  Reserve,
  Spoke,
  UserBorrowItem,
  UserPosition,
  UserSupplyItem,
} from '@aave/react';
import type { Story } from '@ladle/react';
import { HeadingLarge } from 'baseui/typography';
import { useState } from 'react';
import { BorrowForm } from './components/BorrowForm';
import { BorrowSelector } from './components/BorrowSelector';
import { HubSelector } from './components/HubSelector';
import { PositionSelector } from './components/PositionSelector';
import { SingleUserPosition } from './components/positions';
import { RepayForm } from './components/RepayForm';
import { ReserveSelector } from './components/ReserveSelector';
import { SpokeSelector } from './components/SpokeSelector';
import { SupplyForm } from './components/SupplyForm';
import { SupplySelector } from './components/SupplySelector';
import { WithdrawForm } from './components/WithdrawForm';
import * as config from './config';
import { user, walletClient } from './wallet';

export const Supply: Story = () => {
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
      <HeadingLarge>Supply</HeadingLarge>

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

      {reserve && <SupplyForm reserve={reserve} walletClient={walletClient} />}
    </>
  );
};

export const Borrow: Story = () => {
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [reserve, setReserve] = useState<Reserve | null>(null);

  const handlePositionSelect = (position: UserPosition | null) => {
    setPosition(position);
    setReserve(null);
  };

  return (
    <>
      <HeadingLarge>Borrow</HeadingLarge>

      <PositionSelector
        chainId={config.chainId}
        user={user}
        onChange={handlePositionSelect}
        selected={position}
      />

      <ReserveSelector
        spokeId={position?.spoke.id}
        onChange={setReserve}
        selected={reserve}
      />

      {reserve && <BorrowForm reserve={reserve} walletClient={walletClient} />}
    </>
  );
};

export const Withdraw: Story = () => {
  const [supply, setSupply] = useState<UserSupplyItem | null>(null);

  return (
    <>
      <HeadingLarge>Withdraw</HeadingLarge>

      <SupplySelector
        chainId={config.chainId}
        user={user}
        onChange={setSupply}
        selected={supply}
      />

      {supply && <WithdrawForm supply={supply} walletClient={walletClient} />}
    </>
  );
};

export const Repay: Story = () => {
  const [borrow, setBorrow] = useState<UserBorrowItem | null>(null);

  return (
    <>
      <HeadingLarge>Repay</HeadingLarge>

      <BorrowSelector
        chainId={config.chainId}
        user={user}
        onChange={setBorrow}
        selected={borrow}
      />

      {borrow && <RepayForm borrow={borrow} walletClient={walletClient} />}
    </>
  );
};
