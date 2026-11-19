import { AaveProvider } from '@aave/react';
import { OpenfortProvider } from '@openfort/react';
import { getDefaultConfig, OpenfortWagmiBridge } from '@openfort/react/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { defineChain } from 'viem';
import { createConfig, WagmiProvider } from 'wagmi';
import { App } from './App';
import { client } from './client';

const localDevnet = defineChain({
  id: 123456789,
  name: 'Local Devnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://virtual.mainnet-aave.us-east.rpc.tenderly.co/dbaa58ab-597b-4bcd-ae6a-b8e50f716146',
      ],
    },
  },
});

const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: 'Aave React SDK + Openfort Wallet',
    chains: [localDevnet],
    walletConnectProjectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  }),
);

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={wagmiConfig}>
      <OpenfortWagmiBridge>
        <OpenfortProvider
          publishableKey={import.meta.env.VITE_OPENFORT_PUBLISHABLE_KEY}
          walletConfig={{
            shieldPublishableKey: import.meta.env.VITE_SHIELD_PUBLISHABLE_KEY,
          }}
        >
          <AaveProvider client={client}>
            <App />
          </AaveProvider>
        </OpenfortProvider>
      </OpenfortWagmiBridge>
    </WagmiProvider>
  </QueryClientProvider>,
);
