import { chainId, evmAddress, useUserSupplies } from '@aave/react';
import { supportedChains } from '@aave/react/viem';
import { useState } from 'react';
import { WithdrawForm } from './WithdrawForm';
import { address, walletClient } from './wallet';

const defaultChainId = chainId(supportedChains[0]!.id);

export function App() {
  const {
    data: supplies,
    loading,
    error,
  } = useUserSupplies({
    query: {
      userChains: {
        user: evmAddress(address),
        chainIds: [defaultChainId],
      },
    },
  });

  const [selectedSupplyId, setSelectedSupplyId] = useState<string | ''>('');

  const selectedSupply =
    supplies?.find((item) => item.id === selectedSupplyId) ?? null;

  return (
    <div>
      <header>
        <h1>Aave Withdraw Example</h1>
      </header>
      <p>
        <small>
          This example demonstrates how to withdraw previously supplied assets
          from an Aave reserve using the Aave React SDK.
        </small>
      </p>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: '#f44336' }}>Error: {error.toString()}</p>}

      {!loading && !error && (!supplies || supplies.length === 0) && (
        <p>You have no supplied positions to withdraw from.</p>
      )}

      {supplies && supplies.length > 0 && (
        <>
          <label
            style={{
              marginBottom: '10px',
              display: 'block',
            }}
          >
            <strong style={{ display: 'block' }}>Supply position:</strong>
            <select
              value={selectedSupplyId}
              onChange={(e) => setSelectedSupplyId(e.target.value)}
              style={{ padding: '8px', width: '100%' }}
            >
              <option value=''>Select a supply position</option>
              {supplies.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.reserve.asset.underlying.info.symbol} —{' '}
                  {item.withdrawable.amount.value.toDisplayString(2)}
                </option>
              ))}
            </select>
            <small style={{ color: '#666' }}>
              Select the supply position you want to withdraw from.
            </small>
          </label>

          {selectedSupply && (
            <WithdrawForm supply={selectedSupply} walletClient={walletClient} />
          )}
        </>
      )}
    </div>
  );
}
