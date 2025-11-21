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
      <h1>Aave React SDK + Privy Wallet</h1>
      <p>
        This example lets you supply GHO on the Core Hub in Aave v4 using a
        Privy-embedded or connected wallet.
      </p>
      <SupplyForm wallet={user!.wallet!} />
    </Suspense>
  );
}
