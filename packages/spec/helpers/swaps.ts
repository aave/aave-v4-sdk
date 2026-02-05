import {
  assertOk,
  delay,
  type SwapFulfilled,
  type SwapId,
  TimeoutError,
} from '@aave/client';
import { swapStatus } from '@aave/client/actions';
import {
  client,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_USDT_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
} from '@aave/client/testing';

export const availableSwappableTokens = [
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_USDT_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
];

export async function waitForSwapToFulfill(
  swapId: SwapId,
  timeout: number,
): Promise<SwapFulfilled> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    const result = await swapStatus(
      client,
      { id: swapId },
      { requestPolicy: 'network-only' },
    );
    assertOk(result);

    if (result.value.__typename === 'SwapFulfilled') {
      return result.value;
    }
    if (
      result.value.__typename === 'SwapCancelled' ||
      result.value.__typename === 'SwapExpired'
    ) {
      throw new Error(`Swap ${result.value.__typename} - ${swapId}`);
    }

    await delay(client.context.environment.pollingInterval);
  }
  throw TimeoutError.from(`Timeout waiting for swap ${swapId} to fulfill.`);
}
