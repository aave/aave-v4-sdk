import { AaveProvider } from '@aave/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider } from 'connectkit';
import { createRoot } from 'react-dom/client';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { App } from './App';
import { client } from './client';

const chainId = 123456789;
const rpcUrl =
  'https://virtual.mainnet-aave.us-east.rpc.tenderly.co/dbaa58ab-597b-4bcd-ae6a-b8e50f716146';

const wagmiConfig = createConfig({
  chains: [
    {
      id: chainId,
      name: 'Local Devnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [rpcUrl] },
      },
    },
  ],
  connectors: [injected()],
  transports: {
    [chainId]: http(rpcUrl),
  },
});

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
