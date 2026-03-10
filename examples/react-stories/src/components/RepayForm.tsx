import {
  bigDecimal,
  evmAddress,
  type UserBorrowItem,
  useRepay,
} from '@aave/react';
import { useSendTransaction } from '@aave/react/viem';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { Checkbox } from 'baseui/checkbox';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { KIND, Notification } from 'baseui/notification';
import { useState } from 'react';
import type { WalletClient } from 'viem';

interface RepayFormProps {
  borrow: UserBorrowItem;
  walletClient: WalletClient;
}

export function RepayForm({ borrow, walletClient }: RepayFormProps) {
  const [status, setStatus] = useState<{
    kind: keyof typeof KIND;
    message: string;
  } | null>(null);
  const [useMax, setUseMax] = useState(false);

  const [sendTransaction] = useSendTransaction(walletClient);
  const [repay, { loading }] = useRepay((plan) => {
    switch (plan.__typename) {
      case 'TransactionRequest':
        setStatus({
          kind: KIND.info,
          message: 'Sign the Repay Transaction in your wallet',
        });
        return sendTransaction(plan).andTee(() =>
          setStatus({
            kind: KIND.info,
            message: 'Sending Repay Transaction…',
          }),
        );

      case 'Erc20ApprovalRequired':
      case 'PreContractActionRequired':
        setStatus({
          kind: KIND.info,
          message: 'Sign the Approval Transaction in your wallet',
        });
        return sendTransaction(plan.transaction).andTee(() =>
          setStatus({
            kind: KIND.info,
            message: 'Sending Approval Transaction…',
          }),
        );
    }
  });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const amount = form.amount.value as string;

    if (!useMax && !amount) {
      setStatus({
        kind: KIND.info,
        message: 'Please enter an amount or enable Max',
      });
      return;
    }

    const result = await repay({
      reserve: borrow.reserve.id,
      amount: {
        erc20: {
          value: useMax ? { max: true } : { exact: bigDecimal(amount) },
        },
      },
      sender: evmAddress(walletClient.account!.address),
    });

    if (result.isErr()) {
      switch (result.error.name) {
        case 'ValidationError':
          setStatus({
            kind: KIND.warning,
            message: 'Insufficient balance to repay this amount',
          });
          return;
        case 'CancelError':
          setStatus({ kind: KIND.info, message: 'Transaction cancelled' });
          return;
        default:
          setStatus({ kind: KIND.negative, message: result.error.message });
          return;
      }
    }

    setStatus({ kind: KIND.info, message: 'Repay successful!' });
  };

  const currentDebt = borrow.debt.amount.value.toDisplayString(2);

  return (
    <Block as='form' onSubmit={submit} marginTop='scale600'>
      <FormControl
        label='Amount'
        caption={
          useMax
            ? 'Repaying maximum available balance'
            : `Current debt: ${currentDebt} ${borrow.debt.token.info.symbol}`
        }
      >
        <Input
          name='amount'
          type='number'
          step={0.000000000000000001}
          disabled={loading || useMax}
          placeholder={currentDebt}
        />
      </FormControl>

      <FormControl>
        <Checkbox
          checked={useMax}
          onChange={(e) => setUseMax(e.target.checked)}
          disabled={loading}
        >
          Repay maximum available
        </Checkbox>
      </FormControl>

      <Button type='submit' disabled={loading} isLoading={loading}>
        Repay
      </Button>

      {status && (
        <Notification
          kind={status.kind}
          overrides={{ Body: { style: { width: 'auto' } } }}
        >
          {status.message}
        </Notification>
      )}
    </Block>
  );
}
