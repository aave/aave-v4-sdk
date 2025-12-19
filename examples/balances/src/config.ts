import { chainId } from '@aave/react';

export const defaultChainId = chainId(Number(import.meta.env.VITE_CHAIN_ID));
