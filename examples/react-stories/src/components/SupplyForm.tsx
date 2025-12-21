import { bigDecimal, evmAddress, type Reserve, useSupply } from '@aave/react';
import { useSendTransaction } from '@aave/react/viem';
import { Button } from 'baseui/button';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { ParagraphSmall } from 'baseui/typography';
import { useState } from 'react';
import type { WalletClient } from 'viem';

interface SupplyFormProps {
  reserve: Reserve;
  walletClient: WalletClient;
}

export function SupplyForm({ reserve, walletClient }: SupplyFormProps) {
  const [status, setStatus] = useState<string>('');

  const [sendTransaction] = useSendTransaction(walletClient);
  const [supply, { loading, error }] = useSupply((plan) => {
    switch (plan.__typename) {
      case 'TransactionRequest':
        setStatus('Sign the Supply Transaction in your wallet');
        return sendTransaction(plan).andTee(() =>
          setStatus('Sending Supply Transaction…'),
        );

      case 'Erc20ApprovalRequired':
      case 'PreContractActionRequired':
        setStatus('Sign the Approval Transaction in your wallet');
        return sendTransaction(plan.transaction).andTee(() =>
          setStatus('Sending Approval Transaction…'),
        );
    }
  });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const amount = e.currentTarget.amount.value as string;
    if (!amount) {
      setStatus('Please enter an amount');
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

    if (result.isOk()) {
      setStatus('Supply successful!');
    } else {
      setStatus('Supply failed!');
    }
  };

  return (
    <form onSubmit={submit}>
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

      <Button type='submit' disabled={loading}>
        Supply
      </Button>

      {status && <ParagraphSmall>{status}</ParagraphSmall>}

      {error && (
        <ParagraphSmall color='negative'>{error.toString()}</ParagraphSmall>
      )}
    </form>
  );
}
