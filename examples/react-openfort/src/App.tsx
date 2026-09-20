import { OpenfortButton } from '@openfort/react';
import { Suspense } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { SupplyForm } from './SupplyForm';

export function App() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  if (!isConnected || !address || !walletClient) {
    return <OpenfortButton />;
  }

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <header style={{ textAlign: 'center', padding: '20px' }}>
        <h1>Aave React SDK + Openfort Wallet</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          <small>
            This example demonstrates how to supply GHO on the Core Hub in Aave
            v4 using an Openfort embedded wallet.
          </small>
        </p>
      </header>
      <SupplyForm walletClient={walletClient} />
    </Suspense>
  );
}
