import {
  bigDecimal,
  evmAddress,
  type UserSupplyItem,
  useWithdraw,
} from '@aave/react';
import { useSendTransaction } from '@aave/react/viem';
import { useState } from 'react';
import type { WalletClient } from 'viem';

interface WithdrawFormProps {
  supply: UserSupplyItem;
  walletClient: WalletClient;
}

export function WithdrawForm({ supply, walletClient }: WithdrawFormProps) {
  const [status, setStatus] = useState<string>('');

  const [sendTransaction] = useSendTransaction(walletClient);
  const [withdraw, { loading, error }] = useWithdraw((plan) => {
    switch (plan.__typename) {
      case 'TransactionRequest':
        setStatus('Sending withdraw transaction…');
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
            setStatus('Insufficient supplied balance in this reserve');
            return;
          case 'CancelError':
            setStatus('Transaction cancelled');
            return;
          default:
            console.error(result.error);
            setStatus(result.error.message ?? 'Withdraw failed!');
            return;
        }
      }

      setStatus('Withdraw successful!');
    } catch (err) {
      console.error(err);
      setStatus(
        err instanceof Error
          ? err.message
          : 'Withdraw failed due to an unexpected error',
      );
    }
  };

  const currentWithdrawable =
    supply.withdrawable.amount.value.toDisplayString(2);
  const symbol = supply.withdrawable.token.info.symbol;

  return (
    <form onSubmit={submit}>
      <p>
        <small>
          Withdrawable balance for this reserve:{' '}
          <strong>
            {currentWithdrawable} {symbol}
          </strong>
        </small>
      </p>

      <label
        style={{
          marginBottom: '5px',
        }}
      >
        <strong style={{ display: 'block' }}>Amount to withdraw:</strong>
        <input
          name='amount'
          type='number'
          step='0.000000000000000001'
          disabled={loading}
          style={{ width: '100%', padding: '8px' }}
          placeholder={currentWithdrawable}
        />
        <small style={{ color: '#666' }}>
          Leave blank and check &quot;Max&quot; to withdraw the full
          withdrawable balance.
        </small>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input name='max' type='checkbox' disabled={loading} />
        <span>Withdraw maximum available</span>
      </label>

      <button type='submit' disabled={loading}>
        Withdraw
      </button>

      {status && <p style={{ marginBottom: '10px' }}>{status}</p>}

      {error && <p style={{ color: '#f44336' }}>Error: {error.toString()}</p>}
    </form>
  );
}
