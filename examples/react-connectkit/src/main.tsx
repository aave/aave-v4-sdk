import { AaveProvider } from '@aave/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { createRoot } from 'react-dom/client';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { App } from './App';
import { client } from './client';

const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: 'Aave React SDK + ConnectKit',
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
    chains: [sepolia],
    transports: {
      [sepolia.id]: http(),
    },
  }),
);

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <ConnectKitProvider>
        <AaveProvider client={client}>
          <App />
        </AaveProvider>
      </ConnectKitProvider>
    </QueryClientProvider>
  </WagmiProvider>,
);


