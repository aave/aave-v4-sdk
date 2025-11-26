import {
  type Reserve,
  type ReserveId,
  ReservesRequestFilter,
  type Spoke,
  useReserves,
} from '@aave/react';
import { useEffect } from 'react';

interface ReserveSelectorProps {
  spoke: Spoke;
  onChange: (reserve: Reserve) => void;
}

export function ReserveSelector({ onChange, spoke }: ReserveSelectorProps) {
  const { data: reserves, loading } = useReserves({
    query: {
      spokeId: spoke.id,
    },
    filter: ReservesRequestFilter.Borrow,
  });

  useEffect(() => {
    if (reserves?.length === 1) {
      onChange(reserves[0]);
    }
  }, [reserves, onChange]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedReserve = reserves?.find(
      (reserve) => reserve.id === (event.target.value as unknown as ReserveId),
    );
    if (selectedReserve) {
      onChange(selectedReserve);
    }
  };

  return (
    <label style={{ marginBottom: '5px' }}>
      <strong style={{ display: 'block' }}>Reserve:</strong>
      <select
        onChange={handleChange}
        disabled={loading || reserves?.length === 1}
        style={{ padding: '8px', width: '100%' }}
      >
        <option value=''>Select a reserve</option>
        {reserves?.map((reserve) => (
          <option key={reserve.id} value={reserve.id}>
            {reserve.asset.underlying.info.name} - Borrow APY:{' '}
            {reserve.summary.borrowApy.normalized.toDisplayString(2)}%
          </option>
        ))}
      </select>
      <small style={{ color: '#666' }}>
        {reserves?.length === 1
          ? 'Only one reserve found'
          : 'Select the reserve you want to borrow from'}
      </small>
    </label>
  );
}
