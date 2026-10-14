import {
  bigDecimal,
  chainId,
  evmAddress,
  ReservesRequestFilter,
  useReserves,
  useSupply,
} from '@aave/react';
import { useSendTransaction } from '@aave/react/viem';
import { useMemo, useState } from 'react';
import type { Address, WalletClient } from 'viem';
import { mainnet } from 'viem/chains';

type StatusKind = 'info' | 'success' | 'error';

interface SupplyFormProps {
  safeAddress: Address;
  walletClient: WalletClient;
}

export function SupplyForm({ safeAddress, walletClient }: SupplyFormProps) {
  const [status, setStatus] = useState<{
    kind: StatusKind;
    message: string;
  } | null>(null);

  const {
    data: reserves,
    error: reservesError,
    loading: loadingReserves,
  } = useReserves({
    query: {
      chainIds: [chainId(mainnet.id)],
    },
    filter: ReservesRequestFilter.Supply,
    user: evmAddress(safeAddress),
  });

  const reserve = useMemo(
    () =>
      reserves?.find(
        (item) =>
          item.asset.underlying.info.symbol === 'GHO' &&
          item.canSupply &&
          item.status.active &&
          !item.status.frozen &&
          !item.status.paused,
      ),
    [reserves],
  );

  const [sendTransaction] = useSendTransaction(walletClient);
  const [supply, { loading, error }] = useSupply((plan) => {
    switch (plan.__typename) {
      case 'TransactionRequest':
        setStatus({ kind: 'info', message: 'Queue the supply transaction.' });
        return sendTransaction(plan).andTee(() =>
          setStatus({
            kind: 'info',
            message: 'Supply transaction queued. Waiting for Safe execution.',
          }),
        );

      case 'Erc20Approval':
        setStatus({ kind: 'info', message: 'Queue the ERC-20 approval.' });
        return sendTransaction(plan.byTransaction).andTee(() =>
          setStatus({
            kind: 'info',
            message: 'Approval queued. Waiting for Safe execution.',
          }),
        );

      case 'PreContractActionRequired':
        setStatus({
          kind: 'info',
          message: 'Queue the pre-contract action transaction.',
        });
        return sendTransaction(plan.transaction).andTee(() =>
          setStatus({
            kind: 'info',
            message: 'Pre-contract action queued. Waiting for Safe execution.',
          }),
        );
    }
  });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reserve) {
      setStatus({ kind: 'error', message: 'No active GHO reserve found.' });
      return;
    }

    const amount = event.currentTarget.amount.value as string;
    if (!amount) {
      setStatus({ kind: 'info', message: 'Enter an amount first.' });
      return;
    }

    const result = await supply({
      reserve: reserve.id,
      amount: {
        erc20: {
          value: bigDecimal(amount),
        },
      },
      sender: evmAddress(safeAddress),
    });

    if (result.isErr()) {
      switch (result.error.name) {
        case 'ValidationError':
          setStatus({
            kind: 'error',
            message: 'The Safe does not have enough GHO for this supply.',
          });
          return;
        case 'CancelError':
          setStatus({ kind: 'info', message: 'Safe transaction cancelled.' });
          return;
        default:
          setStatus({ kind: 'error', message: result.error.message });
          return;
      }
    }

    setStatus({
      kind: 'success',
      message: `Supply confirmed: ${result.value.txHash}`,
    });
  };

  const tokenLabel = reserve
    ? `${reserve.asset.underlying.info.symbol} on ${reserve.chain.name}`
    : 'GHO on Ethereum mainnet';

  return (
    <form onSubmit={submit}>
      <label>
        <strong>Reserve</strong>
        <span>{loadingReserves ? 'Loading reserves...' : tokenLabel}</span>
      </label>

      <label>
        <strong>Amount</strong>
        <input
          name='amount'
          type='number'
          step='0.000000000000000001'
          disabled={loading || loadingReserves || !reserve}
          placeholder='Amount to supply'
        />
      </label>

      <button type='submit' disabled={loading || loadingReserves || !reserve}>
        Queue Safe transaction
      </button>

      {reservesError && <p role='alert'>{reservesError.message}</p>}
      {error && <p role='alert'>{error.message}</p>}
      {status && <p data-kind={status.kind}>{status.message}</p>}
    </form>
  );
}
