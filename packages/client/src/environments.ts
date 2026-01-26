import type { EnvironmentConfig } from '@aave/core';

/**
 * The production environment configuration.
 */
export const production: EnvironmentConfig = {
  name: 'production',
  backend: 'https://api.v4.aave.com/graphql',
  indexingTimeout: 60_000,
  pollingInterval: 100,
  exchangeRateInterval: 10_000,
  swapQuoteInterval: 30_000,
  swapStatusInterval: 5_000,
};

/**
 * @internal
 */
export const staging: EnvironmentConfig = {
  name: 'staging',
  backend: 'https://api.v4.staging.aave.com/graphql',
  indexingTimeout: 60_000,
  pollingInterval: 500,
  exchangeRateInterval: 10_000,
  swapQuoteInterval: 30_000,
  swapStatusInterval: 5_000,
};

/**
 * @internal
 */
export const local: EnvironmentConfig = {
  name: 'local',
  backend: 'http://localhost:3007/graphql',
  indexingTimeout: 60_000,
  pollingInterval: 1000,
  exchangeRateInterval: 10_000,
  swapQuoteInterval: 30_000,
  swapStatusInterval: 5_000,
};
