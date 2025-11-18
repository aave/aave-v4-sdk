import {
  chainId,
  evmAddress,
  type Hub,
  type Reserve,
  type Spoke,
} from '@aave/react';
import { supportedChains } from '@aave/react/viem';
import { useState } from 'react';
import { HubSelector } from './HubSelector';
import { AllUserPositions, SingleUserPosition } from './positions';
import { ReserveSelector } from './ReserveSelector';
import { StrategySelector } from './StrategySelector';
import { SupplyForm } from './SupplyForm';
import { address, walletClient } from './wallet';

const ethereum = chainId(supportedChains[0].id);

export function App() {
  const [hub, setHub] = useState<Hub | null>(null);
  const [spoke, setSpoke] = useState<Spoke | null>(null);
  const [reserve, setReserve] = useState<Reserve | null>(null);

  const handleHubSelect = (hub: Hub | null) => {
    setHub(hub);
  };

  return (
    <div>
      <header style={{ textAlign: 'center', padding: '20px' }}>
        <h1>Aave Supply Example</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          <small>
            This example demonstrates how to supply assets to an Aave reserve
            using the Aave React SDK.
          </small>
        </p>
      </header>

      <AllUserPositions address={evmAddress(address)} chainId={ethereum} />

      <HubSelector chainId={ethereum} onChange={handleHubSelect} />

      {hub && <StrategySelector hub={hub} onChange={setSpoke} />}

      {spoke && (
        <SingleUserPosition
          spoke={spoke.address}
          user={evmAddress(address)}
          chainId={ethereum}
        />
      )}

      {spoke && <ReserveSelector spoke={spoke} onChange={setReserve} />}

      {reserve && <SupplyForm reserve={reserve} walletClient={walletClient} />}
    </div>
  );
}
