import {
  type Reserve,
  ReservesRequestFilter,
  type SpokeId,
  useReserves,
} from '@aave/react';
import { FormControl } from 'baseui/form-control';
import { type OnChangeParams, SingleSelect } from 'baseui/select';
import { useEffect } from 'react';

interface ReserveSelectorProps {
  spokeId: SpokeId | undefined;
  onChange: (reserve: Reserve | null) => void;
  selected: Reserve | null;
}

export function ReserveSelector({
  onChange,
  spokeId,
  selected,
}: ReserveSelectorProps) {
  const {
    data: reserves,
    loading,
    paused,
  } = useReserves({
    query: { spokeId },
    filter: ReservesRequestFilter.Supply,
    pause: !spokeId,
  });

  useEffect(() => {
    if (reserves?.length === 1) {
      onChange(reserves[0]);
    }
  }, [reserves, onChange]);

  const handleChange = (params: OnChangeParams) => {
    switch (params.type) {
      case 'clear':
        onChange(null);
        break;

      case 'select':
        onChange(params.option as Reserve);
        break;
    }
  };

  console.log(selected);

  return (
    <FormControl
      label='Reserve'
      caption={
        reserves?.length === 1
          ? 'Only one reserve found'
          : 'Select the reserve you want to supply to'
      }
      disabled={
        paused || loading || reserves?.length === 1 || reserves?.length === 0
      }
      error={reserves?.length === 0 ? 'No reserves found' : undefined}
    >
      <SingleSelect
        placeholder='Select a reserve'
        valueKey='id'
        getValueLabel={({ option }) => {
          console.log(option);
          return option.asset.underlying.info.name;
        }}
        getOptionLabel={({ option }) =>
          `${option.asset.underlying.info.name} - APY: ${option.summary.supplyApy.normalized.toFixed(2)}%`
        }
        onChange={handleChange}
        options={reserves}
        value={selected ? [selected] : undefined}
      />
    </FormControl>
  );
}
