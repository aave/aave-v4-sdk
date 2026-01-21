import {
  bigDecimal,
  evmAddress,
  type UserBorrowItem,
  useRepay,
} from '@aave/react';
import { useSendTransaction } from '@aave/react/viem';
import { useState } from 'react';
import type { WalletClient } from 'viem';

interface RepayFormProps {
  borrow: UserBorrowItem;
  walletClient: WalletClient;
}

export function RepayForm({ borrow, walletClient }: RepayFormProps) {
  const [status, setStatus] = useState('');

  const [sendTransaction] = useSendTransaction(walletClient);
  const [repay, { loading, error }] = useRepay((plan) => {
    switch (plan.__typename) {
      case 'TransactionRequest':
        setStatus('Sending repay transaction…');
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
    const useMax = form.max.checked;

    if (!useMax && !amount) {
      setStatus('Please enter an amount or enable Max');
      return;
    }

    try {
      const result = await repay({
        reserve: borrow.reserve.id,
        amount: {
          erc20: {
            value: useMax
              ? { max: true }
              : {
                  exact: bigDecimal(amount),
                },
          },
        },
        sender: evmAddress(walletClient.account!.address),
      });

      if (result.isErr()) {
        switch (result.error.name) {
          case 'ValidationError':
            setStatus('Insufficient balance to repay this amount');
            return;
          case 'CancelError':
            setStatus('Transaction cancelled');
            return;
          default:
            console.error(result.error);
            setStatus(result.error.message ?? 'Repay failed!');
            return;
        }
      }

      setStatus('Repay successful!');
    } catch (err) {
      console.error(err);
      setStatus(
        err instanceof Error
          ? err.message
          : 'Repay failed due to an unexpected error',
      );
    }
  };

  const currentDebt = borrow.debt.amount.value.toDisplayString(2);
  const symbol = borrow.debt.token.info.symbol;

  return (
    <form onSubmit={submit}>
      <p>
        <small>
          Current debt for this reserve:{' '}
          <strong>
            {currentDebt} {symbol}
          </strong>
        </small>
      </p>

      <label
        style={{
          marginBottom: '5px',
        }}
      >
        <strong style={{ display: 'block' }}>Amount to repay:</strong>
        <input
          name='amount'
          type='number'
          step='0.000000000000000001'
          disabled={loading}
          style={{ width: '100%', padding: '8px' }}
          placeholder={currentDebt}
        />
        <small style={{ color: '#666' }}>
          Leave blank and check &quot;Max&quot; to repay the full outstanding
          debt.
        </small>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input name='max' type='checkbox' disabled={loading} />
        <span>Repay maximum available</span>
      </label>

      <button type='submit' disabled={loading}>
        Repay
      </button>

      {status && <p style={{ marginBottom: '10px' }}>{status}</p>}

      {error && <p style={{ color: '#f44336' }}>Error: {error.toString()}</p>}
    </form>
  );
}
