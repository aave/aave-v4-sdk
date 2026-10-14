import { Suspense } from 'react';
import type { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { SupplyForm } from './SupplyForm';
import { useSafeWallet } from './safeWallet';

export function App() {
  const { error, loading, safe, walletClient } = useSafeWallet();

  if (loading) {
    return <main>Loading Safe context...</main>;
  }

  if (error || !safe || !walletClient) {
    return (
      <main>
        <h1>Aave React SDK + Safe App</h1>
        <p>Open this app from the Safe Apps iframe to connect a Safe.</p>
        {error && <p role='alert'>{error}</p>}
      </main>
    );
  }

  if (safe.chainId !== mainnet.id) {
    return (
      <main>
        <h1>Aave React SDK + Safe App</h1>
        <p>Switch your Safe to Ethereum mainnet before supplying GHO.</p>
        <dl>
          <dt>Safe</dt>
          <dd>{safe.safeAddress}</dd>
          <dt>Connected chain</dt>
          <dd>{safe.chainId}</dd>
        </dl>
      </main>
    );
  }

  return (
    <Suspense fallback={<main>Loading Aave data...</main>}>
      <main>
        <header>
          <h1>Aave React SDK + Safe App</h1>
          <dl>
            <dt>Safe</dt>
            <dd>{safe.safeAddress}</dd>
            <dt>Chain</dt>
            <dd>Ethereum mainnet</dd>
          </dl>
        </header>

        <SupplyForm
          safeAddress={safe.safeAddress as Address}
          walletClient={walletClient}
        />
      </main>
    </Suspense>
  );
}
