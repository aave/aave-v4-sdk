import { chainId as toChainId } from '@aave/react';

export const chainId = toChainId(Number(import.meta.env.VITE_CHAIN_ID));
