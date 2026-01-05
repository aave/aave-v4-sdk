import { bigDecimal, evmAddress, type Reserve, useSupply } from '@aave/react';
import { useSendTransaction } from '@aave/react/viem';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { KIND, Notification } from 'baseui/notification';
import { useState } from 'react';
import type { WalletClient } from 'viem';

interface SupplyFormProps {
  reserve: Reserve;
  walletClient: WalletClient;
}

export function SupplyForm({ reserve, walletClient }: SupplyFormProps) {
  const [status, setStatus] = useState<{
    kind: keyof typeof KIND;
    message: string;
  } | null>(null);

  const [sendTransaction] = useSendTransaction(walletClient);
  const [supply, { loading }] = useSupply((plan) => {
    switch (plan.__typename) {
      case 'TransactionRequest':
        setStatus({
          kind: KIND.info,
          message: 'Sign the Supply Transaction in your wallet',
        });
        return sendTransaction(plan).andTee(() =>
          setStatus({
            kind: KIND.info,
            message: 'Sending Supply Transaction…',
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

    const amount = e.currentTarget.amount.value as string;
    if (!amount) {
      setStatus({ kind: KIND.info, message: 'Please enter an amount' });
      return;
    }

    const result = await supply({
      reserve: reserve.id,
      amount: {
        erc20: {
          value: bigDecimal(amount),
        },
      },
      sender: evmAddress(walletClient.account!.address),
    });

    if (result.isErr()) {
      switch (result.error.name) {
        case 'ValidationError':
          setStatus({
            kind: KIND.warning,
            message: 'Insufficient funds in your wallet',
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

    setStatus({ kind: KIND.info, message: 'Supply successful!' });
  };

  return (
    <Block as='form' onSubmit={submit} marginTop='scale600'>
      <FormControl
        label='Amount'
        caption='Human-friendly amount (e.g. 1.23, 4.56, 7.89)'
      >
        <Input
          name='amount'
          type='number'
          step={0.000000000000000001}
          disabled={loading}
          placeholder='Amount to supply (in token units)'
        />
      </FormControl>

      <Button type='submit' disabled={loading} isLoading={loading}>
        Supply
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
