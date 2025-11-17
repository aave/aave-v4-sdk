import type { Reserve } from '@aave/graphql-next';
import { isNonEmptyArray } from '@aave/types-next';

/**
 * Picks the highest supply APY reserve from the given reserves.
 *
 * @param reserves - The reserves to pick the highest supply apy reserve from.
 * @returns The highest supply APY reserve or null if not found.
 */
export function pickHighestSupplyApyReserve(
  reserves: Reserve[],
): Reserve | null {
  if (!isNonEmptyArray(reserves)) {
    return null;
  }

  return reserves.reduce((max, reserve) => {
    return reserve.summary.supplyApy.value.gt(max.summary.supplyApy.value)
      ? reserve
      : max;
  }, reserves[0]);
}

/**
 * Picks the lowest borrow APY reserve from the given reserves.
 *
 * @param reserves - The reserves to pick the lowest borrow apy reserve from.
 * @returns The lowest borrow APY reserve or null if not found.
 */
export function pickLowestBorrowApyReserve(
  reserves: Reserve[],
): Reserve | null {
  if (!isNonEmptyArray(reserves)) {
    return null;
  }

  return reserves.reduce((min, reserve) => {
    return reserve.summary.borrowApy.value.lt(min.summary.borrowApy.value)
      ? reserve
      : min;
  }, reserves[0]);
}
