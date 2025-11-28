import { bigDecimal, evmAddress, reserveId, useSupply } from '@aave/react';
import { useSendTransaction } from '@aave/react/viem';
import { useState } from 'react';
import type { WalletClient } from 'viem';

// Hardcoded ReserveId for the target reserve in Aave v4.
const RESERVE_ID = reserveId(
  'MTIzNDU2Nzg5OjoweEJhOTdjNUU1MmNkNUJDM0Q3OTUwQWU3MDc3OUY4RmZFOTJkNDBDZEM6OjY=',
);

interface SupplyFormProps {
  walletClient: WalletClient;
}

export function SupplyForm({ walletClient }: SupplyFormProps) {
  const [status, setStatus] = useState<string>('');

  const [sendTransaction] = useSendTransaction(walletClient);
  const [supply, { loading, error }] = useSupply((plan) => {
    switch (plan.__typename) {
      case 'TransactionRequest':
        setStatus('Sending transaction…');
        return sendTransaction(plan);

      case 'Erc20ApprovalRequired':
      case 'PreContractActionRequired':
        setStatus('Approval required. Sending approval transaction…');
        return sendTransaction(plan.transaction);
    }
  });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;

    const amount = form.amount.value as string;
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
      sender: evmAddress(walletClient.account!.address),
    });

    if (result.isErr()) {
      if (result.error.name === 'ValidationError') {
        setStatus('Insufficient balance for this reserve');
        return;
      }

      if (result.error.name === 'CancelError') {
        setStatus('Transaction cancelled');
        return;
      }

      setStatus('Supply failed!');
      return;
    }

    setStatus('Supply successful!');
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
