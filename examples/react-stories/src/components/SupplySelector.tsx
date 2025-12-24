import {
  type EvmAddress,
  type SpokeId,
  type UserSupplyItem,
  useUserSupplies,
} from '@aave/react';
import { FormControl } from 'baseui/form-control';
import { type OnChangeParams, SingleSelect } from 'baseui/select';
import { useEffect } from 'react';

interface SupplySelectorProps {
  spokeId: SpokeId | undefined;
  user: EvmAddress;
  onChange: (supply: UserSupplyItem | null) => void;
  selected: UserSupplyItem | null;
}

export function SupplySelector({
  spokeId,
  user,
  onChange,
  selected,
}: SupplySelectorProps) {
  const {
    data: supplies,
    loading,
    paused,
  } = useUserSupplies({
    query: spokeId
      ? {
          userSpoke: {
            spoke: spokeId,
            user,
          },
        }
      : undefined,
    pause: !spokeId,
  });

  useEffect(() => {
    if (supplies?.length === 1) {
      onChange(supplies[0]);
    }
  }, [supplies, onChange]);

  const handleChange = (params: OnChangeParams) => {
    switch (params.type) {
      case 'clear':
        onChange(null);
        break;

      case 'select':
        onChange(params.option as UserSupplyItem);
        break;
    }
  };

  return (
    <FormControl
      label='Supply Position'
      caption={
        supplies?.length === 1
          ? 'Only one supply position found'
          : 'Select the supply position you want to withdraw from'
      }
      disabled={
        paused || loading || supplies?.length === 1 || supplies?.length === 0
      }
      error={supplies?.length === 0 ? 'No supply positions found' : undefined}
    >
      <SingleSelect
        placeholder='Select a supply position'
        valueKey='id'
        getValueLabel={({ option }) => {
          return option.reserve.asset.underlying.info.symbol;
        }}
        getOptionLabel={({ option }) =>
          `${option.reserve.asset.underlying.info.symbol} — ${option.withdrawable.amount.value.toDisplayString(2)} ${option.withdrawable.token.info.symbol}`
        }
        onChange={handleChange}
        options={supplies}
        value={selected ? [selected] : undefined}
      />
    </FormControl>
  );
}
