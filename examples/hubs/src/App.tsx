import { chainId, useHubs } from '@aave/react-next';

export function App() {
  const { data, loading } = useHubs({
    chainIds: [chainId(1)],
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <header>
        <h1>List all Hubs</h1>
      </header>
      <div>
        {data?.map((hub) => (
          <div key={hub.address.toString()}>{hub.name}</div>
        ))}
      </div>
    </div>
  );
}
