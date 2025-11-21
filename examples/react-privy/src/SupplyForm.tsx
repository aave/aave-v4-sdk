import { bigDecimal, evmAddress, reserveId, useSupply } from '@aave/react';
import { useSendTransaction } from '@aave/react/privy';
import type { Wallet } from '@privy-io/react-auth';
import { useState } from 'react';

const RESERVE_ID = reserveId(
  'MTIzNDU2Nzg5OjoweEJhOTdjNUU1MmNkNUJDM0Q3OTUwQWU3MDc3OUY4RmZFOTJkNDBDZEM6OjY=',
);

interface SupplyFormProps {
  wallet: Wallet;
}

export function SupplyForm({ wallet }: SupplyFormProps) {
  const [status, setStatus] = useState<string>('');

  const [sendTransaction] = useSendTransaction();
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
      reserve: RESERVE_ID,
      amount: {
        erc20: {
          value: bigDecimal(amount),
        },
      },
      sender: evmAddress(wallet.address),
    });

    if (result.isOk()) {
      setStatus('Supply successful!');
    } else {
      setStatus('Supply failed!');
    }
  };

  return (
    <form onSubmit={submit}>
      <label
        style={{
          marginBottom: '5px',
        }}
      >
        <strong style={{ display: 'block' }}>Amount:</strong>
        <input
          name='amount'
          type='number'
          step='0.000000000000000001'
          disabled={loading}
          style={{ width: '100%', padding: '8px' }}
          placeholder='Amount to supply (in token units)'
        />
        <small style={{ color: '#666' }}>
          Human-friendly amount (e.g. 1.23, 4.56, 7.89)
        </small>
      </label>

      <button type='submit' disabled={loading}>
        Supply
      </button>

      {status && <p style={{ marginBottom: '10px' }}>{status}</p>}

      {error && <p style={{ color: '#f44336' }}>Error: {error.toString()}</p>}
    </form>
  );
}
