import { assertOk, ChainsFilter } from '@aave/client';
import { chain, chains } from '@aave/client/actions';
import { client, ETHEREUM_FORK_ID } from '@aave/client/testing';
import { describe, expect, it } from 'vitest';

describe('Querying Chains on Aave V4', () => {
  describe('Given a user who wants to list available chains', () => {
    describe('When listing supported chains with a filter', () => {
      const filter = Object.values(ChainsFilter);
      it.each(filter)(
        'Then it should return the expected list chains with filter %s',
        async (filter) => {
          const result = await chains(client, { query: { filter } });
          assertOk(result);
          // Staging environment has only testnet chains for the moment
          switch (filter) {
            case ChainsFilter.MAINNET_ONLY:
              // NOTE: Enable when Aave V4 is deployed to mainnet
              // expect(result.value).toBeArrayWithElements(
              //   expect.objectContaining({
              //     isTestnet: false,
              //   }),
              // );
              break;
            case ChainsFilter.TESTNET_ONLY:
              expect(result.value).toBeArrayWithElements(
                expect.objectContaining({
                  isTestnet: true,
                }),
              );
              break;
            case ChainsFilter.ALL:
              expect(result.value).toBeArrayWithElements(
                expect.objectContaining({
                  isTestnet: expect.any(Boolean),
                }),
              );
              break;
          }
        },
      );
    });

    describe('When listing supported chains by chain IDs', () => {
      it('Then it should return the expected chains', async () => {
        // NOTE: Add more chainsIds when Aave V4 extend to more chains
        const result = await chains(client, {
          query: { chainIds: [ETHEREUM_FORK_ID] },
        });
        assertOk(result);
        expect(result.value).toBeArrayWithElements(
          expect.objectContaining({
            chainId: ETHEREUM_FORK_ID,
          }),
        );
      });
    });
  });

  describe('Given a user who wants to fetch a single chain', () => {
    describe('When fetching a single chain', () => {
      it('Then it should return the expected data for the chain', async () => {
        const result = await chain(client, { chainId: ETHEREUM_FORK_ID });
        assertOk(result);
        expect(result.value).toMatchObject({
          chainId: ETHEREUM_FORK_ID,
        });
      });
    });
  });
});
