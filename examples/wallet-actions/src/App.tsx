import { Suspense } from 'react';
import { SupplyForm } from './SupplyForm';
import { walletClient } from './wallet';

export function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <h1>Aave React SDK + Privy Wallet</h1>
      <p>
        This example lets you supply GHO on the Core Hub in Aave v4 using a
        Privy-embedded or connected wallet.
      </p>
      <SupplyForm walletClient={walletClient} />
    </Suspense>
  );
}
