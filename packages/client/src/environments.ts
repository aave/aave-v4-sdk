import type { EnvironmentConfig } from '@aave/core-next';

/**
 * The production environment configuration.
 */
export const production: EnvironmentConfig = {
  name: 'production',
  backend: 'https://api.v4.aave.com/graphql',
  indexingTimeout: 60_000,
  pollingInterval: 100,
  exchangeRateInterval: 10000,
};

/**
 * @internal
 */
export const staging: EnvironmentConfig = {
  name: 'staging',
  backend: 'https://api.v4.staging.aave.com/graphql',
  indexingTimeout: 60_000,
  pollingInterval: 500,
  exchangeRateInterval: 10000,
};

/**
 * @internal
 */
export const local: EnvironmentConfig = {
  name: 'local',
  backend: 'http://localhost:3007/graphql',
  indexingTimeout: 60_000,
  pollingInterval: 1000,
  exchangeRateInterval: 10000,
};
