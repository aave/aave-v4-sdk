/**
 * The environment configuration type.
 */
export type EnvironmentConfig = {
  name: string;
  backend: string;
  indexingTimeout: number;
  pollingInterval: number;
  exchangeRateInterval?: number;
  // TODO: rename to orderQuoteInterval/orderStatusInterval when the deprecated
  // swap verbs are removed. Order is the umbrella concept now — these already
  // govern leverage polling, which is not a swap. Deferred so the rename lands
  // in that same major rather than costing one of its own.
  swapQuoteInterval: number;
  swapStatusInterval: number;
};

/**
 * A standardized data object.
 *
 * All GQL operations should alias their results to `value` to ensure interoperability
 * with this client interface.
 */
export type StandardData<T> = { value: T };
