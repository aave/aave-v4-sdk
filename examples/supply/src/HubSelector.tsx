import { type ChainId, type Hub, useHubs } from '@aave/react-next';

interface HubSelectorProps {
  chainId: ChainId;
  onChange: (hub: Hub | null) => void;
}

export function HubSelector({
  chainId,
  onChange: onMarketSelect,
}: HubSelectorProps) {
  const { data: hubs, loading } = useHubs({
    query: {
      chainIds: [chainId],
    },
  });

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMarket = hubs?.find(
      (hub) => hub.address === event.target.value,
    );

    onMarketSelect(selectedMarket ?? null);
  };

  if (hubs?.length === 0) {
    return <p style={{ marginBottom: '5px' }}>No hubs found</p>;
  }

  return (
    <label style={{ marginBottom: '5px' }}>
      <strong style={{ display: 'block' }}>Hub:</strong>
      <select
        onChange={handleChange}
        disabled={loading || hubs?.length === 1}
        style={{ padding: '8px', width: '100%' }}
      >
        <option value=''>Select an hub</option>
        {hubs?.map((hub) => (
          <option key={hub.address} value={hub.address}>
            {hub.name} -{' '}
            {`${hub.summary.totalSupplied.symbol}${hub.summary.totalSupplied.value}`}
          </option>
        ))}
      </select>
      <small style={{ color: '#666' }}>
        {hubs?.length === 1
          ? 'Only one hub found'
          : 'Select the hub you want to supply to'}
      </small>
    </label>
  );
}
