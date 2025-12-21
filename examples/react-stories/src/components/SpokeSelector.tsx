import { type HubId, type Spoke, useSpokes } from '@aave/react';
import { FormControl } from 'baseui/form-control';
import { type OnChangeParams, SingleSelect } from 'baseui/select';
import { useEffect } from 'react';

interface SpokeSelectorProps {
  hubId: HubId | undefined;
  onChange: (market: Spoke | null) => void;
  selected: Spoke | null;
}

export function SpokeSelector({
  hubId,
  onChange,
  selected,
}: SpokeSelectorProps) {
  const {
    data: spokes,
    loading,
    paused,
  } = useSpokes({
    query: { hubId },
    pause: !hubId,
  });

  useEffect(() => {
    if (spokes?.length === 1) {
      onChange(spokes[0]);
    }
  }, [spokes, onChange]);

  const handleChange = (params: OnChangeParams) => {
    switch (params.type) {
      case 'clear':
        onChange(null);
        break;

      case 'select':
        onChange(params.option as Spoke);
        break;
    }
  };

  return (
    <FormControl
      label='Spoke'
      caption={
        spokes?.length === 1
          ? 'Only one spoke found'
          : 'Select the spoke you want to supply to'
      }
      disabled={
        paused || loading || spokes?.length === 1 || spokes?.length === 0
      }
      error={spokes?.length === 0 ? 'No spokes found' : undefined}
    >
      <SingleSelect
        placeholder='Select a spoke'
        valueKey='id'
        labelKey='name'
        getOptionLabel={({ option }) => option.name}
        onChange={handleChange}
        options={spokes}
        value={selected ? [selected] : undefined}
      />
    </FormControl>
  );
}
