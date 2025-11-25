import { chainId, useHubs } from '@aave/react';
import { supportedChains } from '@aave/react/viem';

const defaultChain = chainId(supportedChains[0].id);

export function App() {
  const { data, loading } = useHubs({
    query: {
      chainIds: [defaultChain],
    },
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <header style={{ textAlign: 'center', padding: '20px' }}>
        <h1>List all Hubs</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          <small>
            This example demonstrates how to list all hubs on the selected
            chain.
          </small>
        </p>
      </header>
      <div>
        {data?.map((hub) => (
          <div key={hub.address.toString()}>{hub.name}</div>
        ))}
      </div>
    </div>
  );
}
