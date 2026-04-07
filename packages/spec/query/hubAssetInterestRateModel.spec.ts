import { assertOk, type HubAsset } from '@aave/client';
import {
  hubAssetInterestRateModel,
  hubAssets,
  hubs,
} from '@aave/client/actions';
import { client, ETHEREUM_FORK_ID } from '@aave/client/testing';
import { describe, expect, it } from 'vitest';

import { assertNonEmptyArray } from '../test-utils';

async function getAnyHubAsset(): Promise<HubAsset> {
  const hubsResult = await hubs(client, {
    query: {
      chainIds: [ETHEREUM_FORK_ID],
    },
  });
  assertOk(hubsResult);
  assertNonEmptyArray(hubsResult.value);
  const randomHub =
    hubsResult.value[Math.floor(Math.random() * hubsResult.value.length)];

  const hubAssetsResult = await hubAssets(client, {
    query: { hubId: randomHub!.id },
  });
  assertOk(hubAssetsResult);
  assertNonEmptyArray(hubAssetsResult.value);

  return hubAssetsResult.value[
    Math.floor(Math.random() * hubAssetsResult.value.length)
  ]!;
}

describe('Given a user who wants to fetch a hub asset interest rate model', () => {
  describe('When fetching the interest rate curve points', () => {
    it('Then it should return a normalized and complete curve with consistent token metadata', async () => {
      const hubAsset = await getAnyHubAsset();

      const result = await hubAssetInterestRateModel(client, {
        query: { hubAssetId: hubAsset.id },
      });
      assertOk(result);
      assertNonEmptyArray(result.value);

      expect(result.value.length).toBeGreaterThanOrEqual(201);
      expect(result.value.length).toBeLessThanOrEqual(203);

      expect(result.value).toBeArrayWithElements(
        expect.objectContaining({
          utilizationRate: expect.any(Object),
          borrowRate: expect.any(Object),
          supplyRate: expect.any(Object),
          liquidityDistance: expect.any(Object),
        }),
      );

      const utilization = result.value.map(
        (point) => point.utilizationRate.normalized,
      );
      expect(utilization).toBeSortedNumerically('asc');

      // Backend builds the interest-rate curve across full utilization, from 0% to 100%.
      expect(utilization[0]).toBeBigDecimalEqualTo(0);
      expect(utilization.at(-1)).toBeBigDecimalEqualTo(100);

      for (const point of result.value) {
        expect(point.borrowRate.value.gte(0)).toBe(true);
        expect(point.supplyRate.value.gte(0)).toBe(true);
        expect(point.supplyRate.value.lte(point.borrowRate.value)).toBe(true);
        expect(point.liquidityDistance.amount.value.gte(0)).toBe(true);
        expect(point.liquidityDistance.token.address).toBe(
          hubAsset.underlying.address,
        );
        expect(point.liquidityDistance.token.info.decimals).toBe(
          hubAsset.underlying.info.decimals,
        );
        expect(point.liquidityDistance.token.chain.chainId).toBe(
          ETHEREUM_FORK_ID,
        );
      }

      expect(
        result.value.some((point) =>
          point.liquidityDistance.amount.value.eq(0),
        ),
      ).toBe(true);
    });
  });
});
