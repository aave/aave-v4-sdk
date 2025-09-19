import {
  Currency,
  chainId,
  type FiatAmount,
  useExchangeRate,
  useLiveExchangeRate,
} from '@aave/react-next';
import { useState } from 'react';

export function App() {
  const { data, loading } = useLiveExchangeRate({
    from: { native: chainId(1) },
    to: Currency.Usd,
  });

  const [getExchangeRate, { loading: asyncLoading }] = useExchangeRate();
  const [exchangeRate, setExchangeRate] = useState<FiatAmount | null>(null);

  const handleGetRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await getExchangeRate({
      from: { native: chainId(1) },
      to: Currency.Usd,
    });
    if (result.isOk()) {
      setExchangeRate(result.value);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <header>
        <h1>Exchange Rates</h1>
      </header>

      <div style={{ marginBottom: '40px' }}>
        <h2>Live Exchange Rate</h2>
        {data && (
          <div>
            <strong>ETH to USD: ${data.value}</strong>
          </div>
        )}
      </div>

      <div>
        <h2>On-Demand Exchange Rate</h2>
        <form onSubmit={handleGetRate}>
          <button type='submit' disabled={asyncLoading}>
            {asyncLoading ? 'Loading...' : 'Get Current ETH to USD Rate'}
          </button>
        </form>
        {exchangeRate && (
          <div style={{ marginTop: '10px' }}>
            <strong>Current Rate: ${exchangeRate.value}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
