import { chainId, type Hub, type Reserve, type Spoke } from '@aave/react-next';
import { useState } from 'react';
import { HubSelector } from './HubSelector';
import { ReserveSelector } from './ReserveSelector';
import { StrategySelector } from './StrategySelector';
import { SupplyForm } from './SupplyForm';
import { address, walletClient } from './wallet';

const ethereum = chainId(1);

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
          This example demonstrates how to supply assets to an Aave reserve
          using the Aave React SDK.
        </p>
      </header>
      <div
        style={{
          backgroundColor: '#e8f5e8',
          border: '1px solid #4CAF50',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px',
        }}
      >
        <strong>✅ Wallet Connected:</strong> {address}
      </div>

      <HubSelector chainId={ethereum} onChange={handleHubSelect} />

      {hub && <StrategySelector hub={hub} onChange={setSpoke} />}

      {spoke && <ReserveSelector spoke={spoke} onChange={setReserve} />}

      {reserve && <SupplyForm reserve={reserve} walletClient={walletClient} />}
    </div>
  );
}
