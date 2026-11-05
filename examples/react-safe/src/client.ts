import { AaveClient, production } from '@aave/react';

export const client = AaveClient.create({
  environment: production,
});
