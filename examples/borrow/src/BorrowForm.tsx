import { bigDecimal, evmAddress, type Reserve, useBorrow } from '@aave/react';
import { useSendTransaction } from '@aave/react/viem';
import { useState } from 'react';
import type { WalletClient } from 'viem';

interface BorrowFormProps {
  reserve: Reserve;
  walletClient: WalletClient;
}

export function BorrowForm({ reserve, walletClient }: BorrowFormProps) {
  const [status, setStatus] = useState<string>('');

  const [sendTransaction] = useSendTransaction(walletClient);
  const [borrow, { loading, error }] = useBorrow((plan) => {
    switch (plan.__typename) {
      case 'TransactionRequest':
        setStatus('Sign the Borrow Transaction in your wallet');
        return sendTransaction(plan).andTee(() =>
          setStatus('Sending Borrow Transaction…'),
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

    try {
      const result = await borrow({
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
            setStatus('Insufficient borrow capacity for this reserve');
            return;
          case 'CancelError':
            setStatus('Transaction cancelled');
            return;
          default:
            console.error(result.error);
            setStatus(result.error.message ?? 'Borrow failed!');
            return;
        }
      }

      setStatus('Borrow successful!');
    } catch (err) {
      console.error(err);
      setStatus(
        err instanceof Error
          ? err.message
          : 'Borrow failed due to an unexpected error',
      );
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
          placeholder='Amount to borrow (in token units)'
        />
        <small style={{ color: '#666' }}>
          Human-friendly amount (e.g. 1.23, 4.56, 7.89)
        </small>
      </label>

      <button type='submit' disabled={loading}>
        Borrow
      </button>

      {status && <p style={{ marginBottom: '10px' }}>{status}</p>}

      {error && <p style={{ color: '#f44336' }}>Error: {error.toString()}</p>}
    </form>
  );
}
