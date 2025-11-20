import {
  chainId,
  evmAddress,
  ReservesRequestFilter,
  useUserBalances,
} from '@aave/react';
import { supportedChains } from '@aave/react/viem';

const defaultChain = chainId(supportedChains[0].id);

export function App() {
  const { data, loading } = useUserBalances({
    user: evmAddress('0x26D595DDDBAD81BF976EF6F24686A12A800B141F'),
    filter: {
      chains: {
        chainIds: [defaultChain],
        byReservesType: ReservesRequestFilter.All,
      },
    },
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
