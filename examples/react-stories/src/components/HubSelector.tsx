import { type ChainId, type Hub, useHubs } from '@aave/react';
import { FormControl } from 'baseui/form-control';
import { type OnChangeParams, SingleSelect } from 'baseui/select';
import { useEffect } from 'react';

interface HubSelectorProps {
  chainId: ChainId;
  onChange: (hub: Hub | null) => void;
  selected: Hub | null;
}

export function HubSelector({ chainId, onChange, selected }: HubSelectorProps) {
  const { data: hubs, loading } = useHubs({
    query: {
      chainIds: [chainId],
    },
  });

  useEffect(() => {
    if (hubs?.length === 1) {
      onChange(hubs[0]);
    }
  }, [hubs, onChange]);

  const handleChange = (params: OnChangeParams) => {
    switch (params.type) {
      case 'clear':
        onChange(null);
        break;
      case 'select':
        onChange(params.option as Hub);
        break;
    }
  };

  return (
    <FormControl
      label='Hub'
      caption={
        hubs?.length === 1
          ? 'Only one hub found'
          : 'Select the hub you want to supply to'
      }
      disabled={loading || hubs?.length === 1 || hubs?.length === 0}
      error={hubs?.length === 0 ? 'No hubs found' : undefined}
    >
      <SingleSelect
        placeholder='Select a hub'
        valueKey='id'
        labelKey='name'
        getOptionLabel={({ option }) =>
          `${option.name} - ${option.summary.totalSupplied.current.symbol}${option.summary.totalSupplied.current.value.toDisplayString(2)}`
        }
        onChange={handleChange}
        options={hubs}
        value={selected ? [selected] : undefined}
      />
    </FormControl>
  );
}
