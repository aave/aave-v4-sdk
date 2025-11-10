import { chainId, evmAddress, useUserBalances } from '@aave/react-next';

export function App() {
  const { data, loading } = useUserBalances({
    chainIds: [chainId(1)],
    user: evmAddress('0x26D595DDDBAD81BF976EF6F24686A12A800B141F'),
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <header>
        <h1>User Balances</h1>
      </header>
      <div>
        {data?.map((balance) => (
          <div key={balance.info.name}>
            {balance.totalAmount.value.toDisplayString(2)} {balance.info.symbol}
          </div>
        ))}
      </div>
    </div>
  );
}
