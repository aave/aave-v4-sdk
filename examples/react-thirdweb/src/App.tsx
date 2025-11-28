import { evmAddress } from '@aave/react';
import { Suspense } from 'react';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { SupplyForm } from './SupplyForm';
import { client } from './thirdwebClient';

export function App() {
  const account = useActiveAccount();

  if (!account) {
    return <ConnectButton client={client} />;
  }

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <header style={{ textAlign: 'center', padding: '20px' }}>
        <h1>Aave React SDK + thirdweb SDK</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          <small>
            This example demonstrates how to supply GHO on the Core Hub in Aave
            v4 using a thirdweb-connected wallet.
          </small>
        </p>
      </header>
      <SupplyForm wallet={evmAddress(account.address)} />
    </Suspense>
  );
}
