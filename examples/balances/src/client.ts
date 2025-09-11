import { AaveClient, staging } from '@aave/react-next';

export const client = AaveClient.create({
  environment: staging,
});
