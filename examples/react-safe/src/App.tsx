import { mainnet } from 'viem/chains';
import { SupplyForm } from './SupplyForm';
import { useSafeApp } from './useSafeApp';
import { useSafeWalletClient } from './useSafeWalletClient';

function formatAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function App() {
  const safeApp = useSafeApp();
  const { connected, loading, safe, sdk } = safeApp;
  const walletClient = useSafeWalletClient({ connected, safe, sdk });

  if (loading) {
    return <p>Connecting to Safe…</p>;
  }

  if (!connected || !safe) {
    return (
      <>
        <header style={{ textAlign: 'center', padding: '20px' }}>
          <h1>Aave React SDK + Safe App</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            <small>
              Open this app from Safe Wallet to try the native ETH supply flow.
            </small>
          </p>
        </header>
        <article>
          <p>
            This example is meant to run inside a Safe App iframe, not as a
            normal browser wallet demo.
          </p>
        </article>
      </>
    );
  }

  if (safe.chainId !== mainnet.id || !walletClient) {
    return (
      <>
        <header style={{ textAlign: 'center', padding: '20px' }}>
          <h1>Aave React SDK + Safe App</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            <small>
              Use this app from a Safe on Ethereum mainnet to try the Aave
              transaction flow.
            </small>
          </p>
        </header>
        <article>
          <p>
            <strong>Connected Safe:</strong> {formatAddress(safe.safeAddress)}
          </p>
          <p>
            <strong>Current Chain ID:</strong> {safe.chainId}
          </p>
          <p>This example is intentionally mainnet-only.</p>
        </article>
      </>
    );
  }

  return (
    <>
      <header style={{ textAlign: 'center', padding: '20px' }}>
        <h1>Aave React SDK + Safe App</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          <small>
            This example demonstrates supplying native ETH from a Safe on Aave
            v4 and waiting for the final on-chain hash before the flow resolves.
          </small>
        </p>
      </header>

      <article>
        <p>
          <strong>Safe:</strong> {formatAddress(safe.safeAddress)}
        </p>
        <p>
          <strong>Chain:</strong> Ethereum mainnet
        </p>
        <p>
          <strong>Mode:</strong> {safe.isReadOnly ? 'Read-only' : 'Writable'}
        </p>
      </article>

      <SupplyForm
        walletClient={walletClient}
        safeAddress={safe.safeAddress}
        readOnly={safe.isReadOnly}
      />
    </>
  );
}
