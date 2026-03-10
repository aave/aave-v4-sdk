import {
  type ChainId,
  type EvmAddress,
  OrderDirection,
  type UserBorrowItem,
  useUserBorrows,
} from '@aave/react';
import { FormControl } from 'baseui/form-control';
import { type OnChangeParams, SingleSelect } from 'baseui/select';
import { useEffect } from 'react';

interface BorrowSelectorProps {
  chainId: ChainId;
  user: EvmAddress;
  onChange: (borrow: UserBorrowItem | null) => void;
  selected: UserBorrowItem | null;
}

export function BorrowSelector({
  chainId,
  user,
  onChange,
  selected,
}: BorrowSelectorProps) {
  const { data: borrows, loading } = useUserBorrows({
    query: {
      userChains: {
        chainIds: [chainId],
        user,
      },
    },
    orderBy: {
      amount: OrderDirection.Desc,
    },
  });

  useEffect(() => {
    if (borrows?.length === 1) {
      onChange(borrows[0]);
    }
  }, [borrows, onChange]);

  const handleChange = (params: OnChangeParams) => {
    switch (params.type) {
      case 'clear':
        onChange(null);
        break;

      case 'select':
        onChange(params.option as UserBorrowItem);
        break;
    }
  };

  return (
    <FormControl
      label='Borrow Position'
      caption={
        borrows?.length === 1
          ? 'Only one borrow position found'
          : 'Select the borrow position you want to repay'
      }
      disabled={loading || borrows?.length === 1 || borrows?.length === 0}
      error={borrows?.length === 0 ? 'No borrow positions found' : undefined}
    >
      <SingleSelect
        placeholder='Select a borrow position'
        valueKey='id'
        getValueLabel={({ option }) => {
          return option.reserve.asset.underlying.info.symbol;
        }}
        getOptionLabel={({ option }) =>
          `${option.reserve.asset.underlying.info.symbol} - ${option.debt.amount.value.toDisplayString(2)} ${option.debt.token.info.symbol}`
        }
        onChange={handleChange}
        options={borrows}
        value={selected ? [selected] : undefined}
      />
    </FormControl>
  );
}
