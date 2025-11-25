import {
  Currency,
  chainId,
  type FiatAmount,
  useExchangeRate,
  useExchangeRateAction,
} from '@aave/react';
import { supportedChains } from '@aave/react/viem';
import { useState } from 'react';

export function App() {
  const { data, loading } = useExchangeRate({
    from: { native: chainId(supportedChains[0].id) },
    to: Currency.Usd,
  });

  const [getExchangeRate, { loading: asyncLoading }] = useExchangeRateAction();
  const [exchangeRate, setExchangeRate] = useState<FiatAmount | null>(null);

  const handleGetRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await getExchangeRate({
      from: { native: chainId(supportedChains[0].id) },
      to: Currency.Usd,
    });
    if (result.isOk()) {
      setExchangeRate(result.value);
    }
  };

  return (
    <div>
      <header>
        <h1>Exchange Rates</h1>
      </header>
      <header style={{ textAlign: 'center', padding: '20px' }}>
        <h1>Exchange Rates</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          <small>
            This example demonstrates how to get the ETH / USD exchange rate.
          </small>
        </p>
      </header>

      <div style={{ marginBottom: '40px' }}>
        <h2>Live Exchange Rate</h2>
        <div>
          <strong>
            ETH to USD:{' '}
            {loading
              ? 'Loading...'
              : data
                ? `$${data.value.toDisplayString(2)}`
                : 'No data'}
          </strong>
        </div>
      </div>

      <div>
        <h2>On-Demand Exchange Rate</h2>
        <form onSubmit={handleGetRate}>
          <button type='submit' disabled={asyncLoading}>
            {asyncLoading ? 'Loading...' : 'Get Current ETH to USD Rate'}
          </button>
        </form>
        {exchangeRate && (
          <div>
            <strong>
              Current Rate: ${exchangeRate.value.toDisplayString(2)}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}
