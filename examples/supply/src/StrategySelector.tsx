import { type Hub, type Spoke, useSpokes } from '@aave/react';
import { useEffect } from 'react';

interface StrategySelectorProps {
  hub: Hub;
  onChange: (market: Spoke | null) => void;
}

export function StrategySelector({
  hub,
  onChange: onMarketSelect,
}: StrategySelectorProps) {
  const { data: spokes, loading } = useSpokes({
    query: {
      hub: {
        chainId: hub.chain.chainId,
        address: hub.address,
      },
    },
  });

  useEffect(() => {
    if (spokes?.length === 1) {
      onMarketSelect(spokes[0]);
    }
  }, [spokes, onMarketSelect]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMarket = spokes?.find(
      (spoke) => spoke.address === event.target.value,
    );

    onMarketSelect(selectedMarket ?? null);
  };

  if (spokes?.length === 0) {
    return <p style={{ marginBottom: '5px' }}>No spokes found</p>;
  }

  return (
    <label style={{ marginBottom: '5px' }}>
      <strong style={{ display: 'block' }}>Strategy:</strong>
      <select
        onChange={handleChange}
        disabled={loading || spokes?.length === 1}
        style={{ padding: '8px', width: '100%' }}
      >
        {spokes && spokes?.length > 1 ? (
          <>
            <option value=''>Select a strategy</option>
            {spokes?.map((spoke) => (
              <option key={spoke.address} value={spoke.address}>
                {spoke.name}
              </option>
            ))}
          </>
        ) : (
          <option value={spokes?.[0].address}>{spokes?.[0].name}</option>
        )}
      </select>
      <small style={{ color: '#666' }}>
        {spokes?.length === 1
          ? 'Only one strategy found'
          : 'Select the strategy you want to supply to'}
      </small>
    </label>
  );
}
