import { assertOk, type SwapId, TimeoutError } from '@aave/client';
import { swapStatus } from '@aave/client/actions';
import { client } from '@aave/client/testing';

export async function waitForSwap(swapId: SwapId, timeout: number) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    const result = await swapStatus(
      client,
      { id: swapId },
      { requestPolicy: 'network-only' },
    );
    assertOk(result);

    if (
      ['SwapCancelled', 'SwapExpired', 'SwapFulfilled'].includes(
        result.value.__typename as string,
      )
    ) {
      return result.value;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw TimeoutError.from(`Timeout waiting for swap ${swapId} to complete.`);
}
