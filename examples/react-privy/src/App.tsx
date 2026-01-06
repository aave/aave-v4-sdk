import { useLogin, usePrivy } from '@privy-io/react-auth';
import { Suspense } from 'react';
import { SupplyForm } from './SupplyForm';

export function App() {
  const { ready, authenticated, user } = usePrivy();
  const { login } = useLogin();

  if (!ready) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return (
      <button
        type='button'
        onClick={() =>
          login({
            loginMethods: ['wallet'],
            walletChainType: 'ethereum-only',
            disableSignup: false,
          })
        }
      >
        Log in
      </button>
    );
  }

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <header style={{ textAlign: 'center', padding: '20px' }}>
        <h1>Aave React SDK + Privy Wallet</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          <small>
            This example demonstrates how to supply GHO on the Core Hub in Aave
            v4 using a Privy-embedded or connected wallet.
          </small>
        </p>
      </header>
      <SupplyForm wallet={user!.wallet!} />
    </Suspense>
  );
}
