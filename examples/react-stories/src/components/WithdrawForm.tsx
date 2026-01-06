import {
  bigDecimal,
  evmAddress,
  type UserSupplyItem,
  useWithdraw,
} from '@aave/react';
import { useSendTransaction } from '@aave/react/viem';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { Checkbox } from 'baseui/checkbox';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { KIND, Notification } from 'baseui/notification';
import { useState } from 'react';
import type { WalletClient } from 'viem';

interface WithdrawFormProps {
  supply: UserSupplyItem;
  walletClient: WalletClient;
}

export function WithdrawForm({ supply, walletClient }: WithdrawFormProps) {
  const [status, setStatus] = useState<{
    kind: keyof typeof KIND;
    message: string;
  } | null>(null);
  const [useMax, setUseMax] = useState(false);

  const [sendTransaction] = useSendTransaction(walletClient);
  const [withdraw, { loading }] = useWithdraw((plan) => {
    switch (plan.__typename) {
      case 'TransactionRequest':
        setStatus({
          kind: KIND.info,
          message: 'Sign the Withdraw Transaction in your wallet',
        });
        return sendTransaction(plan).andTee(() =>
          setStatus({
            kind: KIND.info,
            message: 'Sending Withdraw Transaction…',
          }),
        );

      case 'Erc20ApprovalRequired':
      case 'PreContractActionRequired':
        setStatus({
          kind: KIND.info,
          message: 'Sign the Approval Transaction in your wallet',
        });
        return sendTransaction(plan.transaction).andTee(() =>
          setStatus({
            kind: KIND.info,
            message: 'Sending Approval Transaction…',
          }),
        );
    }
  });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const amount = form.amount.value as string;

    if (!useMax && !amount) {
      setStatus({
        kind: KIND.info,
        message: 'Please enter an amount or enable Max',
      });
      return;
    }

    const result = await withdraw({
      reserve: supply.reserve.id,
      amount: {
        erc20: useMax
          ? { max: true }
          : {
              exact: bigDecimal(amount),
            },
      },
      sender: evmAddress(walletClient.account!.address),
    });

    if (result.isErr()) {
      switch (result.error.name) {
        case 'ValidationError':
          setStatus({
            kind: KIND.warning,
            message: 'Insufficient supplied balance in this reserve',
          });
          return;
        case 'CancelError':
          setStatus({ kind: KIND.info, message: 'Transaction cancelled' });
          return;
        default:
          setStatus({ kind: KIND.negative, message: result.error.message });
          return;
      }
    }

    setStatus({ kind: KIND.info, message: 'Withdraw successful!' });
  };

  const currentWithdrawable =
    supply.withdrawable.amount.value.toDisplayString(2);

  return (
    <Block as='form' onSubmit={submit} marginTop='scale600'>
      <FormControl
        label='Amount'
        caption={
          useMax
            ? 'Withdrawing maximum available balance'
            : 'Human-friendly amount (e.g. 1.23, 4.56, 7.89)'
        }
      >
        <Input
          name='amount'
          type='number'
          step={0.000000000000000001}
          disabled={loading || useMax}
          placeholder={currentWithdrawable}
        />
      </FormControl>

      <FormControl>
        <Checkbox
          checked={useMax}
          onChange={(e) => setUseMax(e.target.checked)}
          disabled={loading}
        >
          Withdraw maximum available
        </Checkbox>
      </FormControl>

      <Button type='submit' disabled={loading} isLoading={loading}>
        Withdraw
      </Button>

      {status && (
        <Notification
          kind={status.kind}
          overrides={{ Body: { style: { width: 'auto' } } }}
        >
          {status.message}
        </Notification>
      )}
    </Block>
  );
}
