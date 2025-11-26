import { chainId, evmAddress, useUserBorrows } from '@aave/react';
import { supportedChains } from '@aave/react/viem';
import { useState } from 'react';
import { RepayForm } from './RepayForm';
import { address, walletClient } from './wallet';

const defaultChainId = chainId(supportedChains[0]!.id);

export function App() {
  const {
    data: borrows,
    loading,
    error,
  } = useUserBorrows({
    query: {
      userChains: {
        user: evmAddress(address),
        chainIds: [defaultChainId],
      },
    },
  });

  const [selectedBorrowId, setSelectedBorrowId] = useState<string | ''>('');

  const selectedBorrow =
    borrows?.find((item) => item.id === selectedBorrowId) ?? null;

  return (
    <div>
      <header style={{ textAlign: 'center', padding: '20px' }}>
        <h1>Aave Repay Example</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          <small>
            This example demonstrates how to repay an active borrow position
            using the Aave React SDK.
          </small>
        </p>
      </header>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: '#f44336' }}>Error: {error.toString()}</p>}

      {!loading && !error && (!borrows || borrows.length === 0) && (
        <p>You have no active borrows to repay.</p>
      )}

      {borrows && borrows.length > 0 && (
        <>
          <label
            style={{
              marginBottom: '10px',
              display: 'block',
            }}
          >
            <strong style={{ display: 'block' }}>Borrow position:</strong>
            <select
              value={selectedBorrowId}
              onChange={(e) => setSelectedBorrowId(e.target.value)}
              style={{ padding: '8px', width: '100%' }}
            >
              <option value=''>Select a borrow position</option>
              {borrows.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.reserve.asset.underlying.info.symbol} —{' '}
                  {item.debt.amount.value.toDisplayString(2)}
                </option>
              ))}
            </select>
            <small style={{ color: '#666' }}>
              Select the borrow position you want to repay.
            </small>
          </label>

          {selectedBorrow && (
            <RepayForm borrow={selectedBorrow} walletClient={walletClient} />
          )}
        </>
      )}
    </div>
  );
}
