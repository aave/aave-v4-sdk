import {
  type Reserve,
  type ReserveId,
  ReservesFilterRequest,
  type Spoke,
  useReserves,
} from '@aave/react-next';
import { useEffect } from 'react';

interface ReserveSelectorProps {
  children?: React.ReactNode;
  spoke: Spoke;
  onChange: (reserve: Reserve) => void;
}

export function ReserveSelector({
  children,
  onChange,
  spoke,
}: ReserveSelectorProps) {
  const { data: reserves, loading } = useReserves({
    query: {
      spoke: {
        chainId: spoke.chain.chainId,
        address: spoke.address,
      },
    },
    filter: ReservesFilterRequest.Supply,
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
            {reserve.asset.underlying.info.name} - APY:{' '}
            {reserve.summary.supplyApy.formatted}%
          </option>
        ))}
      </select>
      {children}
    </label>
  );
}
