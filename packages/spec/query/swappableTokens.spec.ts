import { assertOk } from '@aave/client';
import { swappableTokens } from '@aave/client/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
} from '@aave/client/testing';
import { describe, expect, it } from 'vitest';
import { assertNonEmptyArray } from '../test-utils';

describe('Querying Swappable Tokens on Aave V4', () => {
  describe('Given a user who wants to list swappable tokens', () => {
    describe('When fetching swappable tokens by chain IDs', () => {
      it('Then it should return the list of swappable tokens for the chain', async () => {
        const result = await swappableTokens(client, {
          query: { chainIds: [ETHEREUM_FORK_ID] },
        });
        assertOk(result);

        assertNonEmptyArray(result.value);
        expect(result.value).toBeArrayWithElements(
          expect.objectContaining({
            __typename: expect.toBeOneOf(['Erc20Token', 'NativeToken']),
            info: expect.objectContaining({
              name: expect.any(String),
              symbol: expect.any(String),
            }),
            chain: expect.objectContaining({
              chainId: ETHEREUM_FORK_ID,
            }),
          }),
        );
      });
    });

    describe('When fetching tokens that can be swapped from USDC', () => {
      it('Then it should return the list of tokens swappable from USDC', async () => {
        const result = await swappableTokens(client, {
          query: {
            from: {
              erc20: {
                chainId: ETHEREUM_FORK_ID,
                address: ETHEREUM_USDC_ADDRESS,
              },
            },
          },
        });
        assertOk(result);

        assertNonEmptyArray(result.value);
        expect(result.value).toBeArrayWithElements(
          expect.objectContaining({
            __typename: expect.toBeOneOf(['Erc20Token', 'NativeToken']),
            info: expect.objectContaining({
              name: expect.any(String),
              symbol: expect.any(String),
            }),
          }),
        );
      });
    });

    describe('When fetching tokens that can be swapped from a native token', () => {
      it('Then it should return the list of tokens swappable from ETH', async () => {
        const result = await swappableTokens(client, {
          query: {
            from: {
              native: ETHEREUM_FORK_ID,
            },
          },
        });
        assertOk(result);

        assertNonEmptyArray(result.value);
        expect(result.value).toBeArrayWithElements(
          expect.objectContaining({
            __typename: expect.toBeOneOf(['Erc20Token', 'NativeToken']),
            info: expect.objectContaining({
              name: expect.any(String),
              symbol: expect.any(String),
            }),
          }),
        );
      });
    });

    describe('When fetching tokens that can be swapped to WETH', () => {
      it('Then it should return the list of tokens swappable to WETH', async () => {
        const result = await swappableTokens(client, {
          query: {
            to: {
              erc20: {
                chainId: ETHEREUM_FORK_ID,
                address: ETHEREUM_WETH_ADDRESS,
              },
            },
          },
        });
        assertOk(result);

        assertNonEmptyArray(result.value);
        expect(result.value).toBeArrayWithElements(
          expect.objectContaining({
            __typename: expect.toBeOneOf(['Erc20Token', 'NativeToken']),
            info: expect.objectContaining({
              name: expect.any(String),
              symbol: expect.any(String),
            }),
          }),
        );
      });
    });

    describe('When fetching tokens that can be swapped to a native token', () => {
      it('Then it should return the list of tokens swappable to ETH', async () => {
        const result = await swappableTokens(client, {
          query: {
            to: {
              native: ETHEREUM_FORK_ID,
            },
          },
        });
        assertOk(result);

        assertNonEmptyArray(result.value);
        expect(result.value).toBeArrayWithElements(
          expect.objectContaining({
            __typename: expect.toBeOneOf(['Erc20Token', 'NativeToken']),
            info: expect.objectContaining({
              name: expect.any(String),
              symbol: expect.any(String),
            }),
          }),
        );
      });
    });
  });
});
