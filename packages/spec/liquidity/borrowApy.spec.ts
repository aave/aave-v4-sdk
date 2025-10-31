import { assertOk, TimeWindow } from '@aave/client-next';
import { borrowApyHistory, reserves } from '@aave/client-next/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKES,
  ETHEREUM_TOKENS,
} from '@aave/client-next/test-utils';
import { describe, it } from 'vitest';
import { assertNonEmptyArray } from '../test-utils';

describe('Borrow APY History on Aave V4', () => {
  describe('Given a reserve with borrow activity', () => {
    describe('When fetching borrow APY history with different time windows', () => {
      const timeWindowOptions = Object.values(TimeWindow);

      it.each(timeWindowOptions)(
        'Then it should return borrow APY history for %s time window',
        async (window) => {
          // Get a reserve to test with
          const usdcReserve = await reserves(client, {
            query: {
              spokeToken: {
                token: ETHEREUM_TOKENS.USDC,
                spoke: ETHEREUM_SPOKES.CORE_SPOKE,
                chainId: ETHEREUM_FORK_ID,
              },
            },
          });
          assertOk(usdcReserve);
          assertNonEmptyArray(usdcReserve.value);

          const result = await borrowApyHistory(client, {
            spoke: {
              address: usdcReserve.value[0].spoke.address,
              chainId: usdcReserve.value[0].spoke.chain.chainId,
            },
            reserve: usdcReserve.value[0].id,
            window: window,
          });

          assertOk(result);
        },
      );
    });
  });
});
