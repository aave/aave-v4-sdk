import {
  createNewWallet,
  ETHEREUM_FORK_ID,
  environment,
  fundNativeAddress,
} from '@aave/client/testing';
import { makeTransactionRequest } from '@aave/graphql/testing';
import { evmAddress } from '@aave/types';
import * as msw from 'msw';
import { setupServer } from 'msw/node';

export const walletClient = await createNewWallet();
await fundNativeAddress(evmAddress(walletClient.account.address));

export const dummyTransactionRequest = makeTransactionRequest({
  chainId: ETHEREUM_FORK_ID,
  from: evmAddress(walletClient.account.address),
});

export const api = msw.graphql.link(environment.backend);
export const server = setupServer(
  msw.http.all('*', async () => msw.passthrough()),
);
