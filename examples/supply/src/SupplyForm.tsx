import {
  bigDecimal,
  evmAddress,
  type Reserve,
  useSupply,
} from '@aave/react-next';
import { useSendTransaction } from '@aave/react-next/viem';
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
        setStatus('Sending transaction...');

        return sendTransaction(plan);

      case 'ApprovalRequired':
        setStatus('Approval required. Sending approval transaction...');

        return sendTransaction(plan.approval).andThen(() => {
          setStatus('Approval sent. Now sending supply transaction...');

          return sendTransaction(plan.originalTransaction);
        });
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
      reserve: {
        reserveId: reserve.id,
        chainId: reserve.chain.chainId,
        spoke: reserve.spoke.address,
      },
      amount: {
        erc20: {
          value: bigDecimal(amount),
        },
      },
      sender: evmAddress(walletClient.account!.address),
    });

    if (result.isOk()) {
      setStatus('Supply successful!');
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
