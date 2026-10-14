import { AaveClient } from '@aave/client';
import { environment } from '@aave/client/testing';
import {
  PageSize,
  SpokeUserPositionManagersQuery,
  spokeId,
} from '@aave/graphql';
import { evmAddress } from '@aave/types';
import * as msw from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { refreshSpokePositionManagers } from './cache';

const api = msw.graphql.link(environment.backend);
const server = setupServer(msw.http.all('*', async () => msw.passthrough()));

const spoke = spokeId('SGVsbG8h');
const user = evmAddress('0x0000000000000000000000000000000000000001');
const request = {
  spoke,
  user,
  pageSize: PageSize.Fifty,
};

describe('refreshSpokePositionManagers', () => {
  let requestCount = 0;

  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    requestCount = 0;
    server.use(
      api.query(SpokeUserPositionManagersQuery, () => {
        requestCount++;
        return msw.HttpResponse.json({
          data: {
            value: {
              __typename: 'PaginatedSpokeUserPositionManagerResult',
              items: [],
              pageInfo: {
                __typename: 'PaginatedResultInfo',
                prev: null,
                next: null,
              },
            },
          },
        });
      }),
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('refreshes the watched user-specific manager query', async () => {
    const client = AaveClient.create({ environment });
    const subscription = client.urql
      .query(SpokeUserPositionManagersQuery, { request })
      .subscribe(() => {});

    await vi.waitFor(() => expect(requestCount).toBe(1));

    const result = await refreshSpokePositionManagers(client, spoke, user);

    expect(result.isOk()).toBe(true);
    await vi.waitFor(() => expect(requestCount).toBe(2));

    subscription.unsubscribe();
  });
});
