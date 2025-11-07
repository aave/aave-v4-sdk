/* eslint-disable import/no-default-export */
import { defineConfig } from 'tsup';

export default defineConfig(() => ({
  entry: [
    'src/index.ts',
    'src/utils.ts',
    'src/ethers.ts',
    'src/privy.ts',
    'src/thirdweb.ts',
    'src/viem/index.ts',
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
  banner: {
    js: '"use client"',
  },
}));
