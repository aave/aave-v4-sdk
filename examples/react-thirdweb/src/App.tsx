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
      <h1>Aave React SDK + thirdweb SDK</h1>
      <p>
        This example lets you supply GHO on the Core Hub in Aave v4 using a
        thirdweb-connected wallet.
      </p>
      <SupplyForm wallet={evmAddress(account.address)} />
    </Suspense>
  );
}
