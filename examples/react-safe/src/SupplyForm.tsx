import { bigDecimal, evmAddress, reserveId, useSupply } from '@aave/react';
import { useSendTransaction } from '@aave/react/viem';
import { type FormEvent, useState } from 'react';
import type { WalletClient } from 'viem';

const MAINNET_WETH_MAIN_RESERVE = reserveId(
  'MTo6MHg5NGU3QTVkQ2JFODE2ZTQ5OGI4OWFCNzUyNjYxOTA0RTJGNTZjNDg1Ojow',
);

interface SupplyFormProps {
  walletClient: WalletClient;
  safeAddress: string;
  readOnly: boolean;
}

export function SupplyForm({
  walletClient,
  safeAddress,
  readOnly,
}: SupplyFormProps) {
  const [status, setStatus] = useState('');

  const [sendTransaction] = useSendTransaction(walletClient);
  const [supply, { loading, error }] = useSupply((plan) => {
    switch (plan.__typename) {
      case 'TransactionRequest':
        setStatus('Submitting transaction through Safe…');
        return sendTransaction(plan);

      case 'Erc20Approval':
        setStatus('Submitting approval transaction through Safe…');
        return sendTransaction(plan.byTransaction);

      case 'PreContractActionRequired':
        setStatus('Submitting setup transaction through Safe…');
        return sendTransaction(plan.transaction);
    }
  });

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (readOnly) {
      setStatus('This Safe is in read-only mode.');
      return;
    }

    const form = e.currentTarget;
    const amount = form.amount.value as string;

    if (!amount) {
      setStatus('Please enter an amount');
      return;
    }

    const result = await supply({
      reserve: MAINNET_WETH_MAIN_RESERVE,
      amount: {
        native: bigDecimal(amount),
      },
      enableCollateral: true,
      sender: evmAddress(safeAddress),
    });

    if (result.isErr()) {
      if (result.error.name === 'ValidationError') {
        setStatus('Not enough ETH in this Safe for that amount.');
        return;
      }

      if (result.error.name === 'CancelError') {
        setStatus('Transaction cancelled.');
        return;
      }

      setStatus('Supply failed.');
      return;
    }

    setStatus(`Supply confirmed on-chain: ${result.value.txHash}`);
  };

  return (
    <form onSubmit={submit}>
      <p>
        This uses the Ethereum mainnet wrapped native reserve on the `Main`
        spoke / `Core` hub and sends native ETH from the Safe.
      </p>

      <label style={{ marginBottom: '5px' }}>
        <strong style={{ display: 'block' }}>ETH amount</strong>
        <input
          name='amount'
          type='number'
          step='0.000000000000000001'
          min='0'
          disabled={loading || readOnly}
          style={{ width: '100%', padding: '8px' }}
          placeholder='0.01'
        />
        <small style={{ color: '#666' }}>
          The SDK will wait for the final on-chain hash, not just the
          intermediate Safe transaction hash.
        </small>
      </label>

      <button type='submit' disabled={loading || readOnly}>
        Supply ETH from Safe
      </button>

      {status && <p style={{ marginBottom: '10px' }}>{status}</p>}

      {error && <p style={{ color: '#f44336' }}>Error: {error.toString()}</p>}
    </form>
  );
}
