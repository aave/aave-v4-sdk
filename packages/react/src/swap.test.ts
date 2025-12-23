import {
  type PrepareSupplySwapRequest,
  SupplySwapQuoteQuery,
  type SwapQuote,
} from '@aave/graphql';
import { assertOk, never } from '@aave/types';
import * as msw from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';
import { useSupplySwap } from './swap';
import { renderHookWithinContext } from './test-utils';

const server = setupServer();

describe('Given the swap hooks', () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe(`When using the ${useSupplySwap.name} hook`, () => {
    beforeAll(() => {
      server.use(
        msw.graphql.query(SupplySwapQuoteQuery, () =>
          msw.HttpResponse.json({
            data: {
              value: {
                __typename: 'PositionSwapByIntentApprovalsRequired',
                quote: {} as SwapQuote,
                approvals: [],
              },
            },
          }),
        ),
      );
    });

    it('Then it should help', async () => {
      const { result } = renderHookWithinContext(() =>
        useSupplySwap((_plan) => {
          never('not implemented');
        }),
      );

      const r = await result.current[0]({} as PrepareSupplySwapRequest);

      assertOk(r);
    });
  });
});
