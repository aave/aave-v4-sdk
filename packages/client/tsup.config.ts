/* eslint-disable import/no-default-export */

import { pnpmWorkspaceRootSync } from '@node-kit/pnpm-workspace-root';
import dotenv from 'dotenv';
import { defineConfig } from 'tsup';

dotenv.config({ path: `${pnpmWorkspaceRootSync()}/.env` });

export default defineConfig(() => ({
  entry: [
    'src/index.ts',
    'src/actions/index.ts',
    'src/utils/index.ts',
    'src/ethers.ts',
    'src/privy.ts',
    'src/thirdweb.ts',
    'src/viem.ts',
    'src/test-utils.ts',
  ],
  outDir: 'dist',
  sourcemap: true,
  treeshake: true,
  clean: true,
  tsconfig: 'tsconfig.build.json',
  bundle: true,
  minify: true,
  dts: true,
  platform: 'neutral',
  format: ['esm', 'cjs'],
  define: {
    'import.meta.env.ETHEREUM_TENDERLY_FORK_ID': JSON.stringify(
      process.env.ETHEREUM_TENDERLY_FORK_ID,
    ),
    'import.meta.env.ETHEREUM_TENDERLY_PUBLIC_RPC': JSON.stringify(
      process.env.ETHEREUM_TENDERLY_PUBLIC_RPC,
    ),
    'import.meta.env.ETHEREUM_TENDERLY_BLOCKEXPLORER': JSON.stringify(
      process.env.ETHEREUM_TENDERLY_BLOCKEXPLORER,
    ),
  },
}));
