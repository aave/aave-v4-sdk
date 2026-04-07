import {
  type ChainId,
  type EvmAddress,
  OrderDirection,
  type UserPosition,
  useUserPositions,
} from '@aave/react';
import { FormControl } from 'baseui/form-control';
import { type OnChangeParams, SingleSelect } from 'baseui/select';
import { useEffect } from 'react';

interface PositionSelectorProps {
  chainId: ChainId;
  user: EvmAddress;
  onChange: (position: UserPosition | null) => void;
  selected: UserPosition | null;
}

export function PositionSelector({
  chainId,
  user,
  onChange,
  selected,
}: PositionSelectorProps) {
  const { data: positions, loading } = useUserPositions({
    user,
    filter: {
      chainIds: [chainId],
    },
    orderBy: {
      balance: OrderDirection.Desc,
    },
  });

  useEffect(() => {
    if (positions?.length === 1) {
      onChange(positions[0]);
    }
  }, [positions, onChange]);

  const handleChange = (params: OnChangeParams) => {
    switch (params.type) {
      case 'clear':
        onChange(null);
        break;

      case 'select':
        onChange(params.option as UserPosition);
        break;
    }
  };

  return (
    <FormControl
      label='Position'
      caption={
        positions?.length === 1
          ? 'Only one position found'
          : 'Select the position you want to borrow from'
      }
      disabled={loading || positions?.length === 1 || positions?.length === 0}
      error={positions?.length === 0 ? 'No positions found' : undefined}
    >
      <SingleSelect
        placeholder='Select a position'
        valueKey='id'
        getValueLabel={({ option }) =>
          `${option.spoke.name} on ${option.spoke.chain.name}`
        }
        getOptionLabel={({ option }) =>
          formatPositionLabel(option as UserPosition)
        }
        onChange={handleChange}
        options={positions}
        value={selected ? [selected] : undefined}
      />
    </FormControl>
  );
}

function formatPositionLabel(position: UserPosition): string {
  return `${position.spoke.name} on ${position.spoke.chain.name} — ${[
    `${position.totalSupplied.current.symbol}${position.totalSupplied.current.value.toDisplayString(2)} supplied`,
    `${position.totalCollateral.current.symbol}${position.totalCollateral.current.value.toDisplayString(2)} collateral`,
    `${position.totalDebt.current.symbol}${position.totalDebt.current.value.toDisplayString(2)} borrowed`,
  ].join(', ')}`;
}
