import { resolve } from 'node:path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  root: './',
  test: {
    fileParallelism: false,
    setupFiles: [resolve(__dirname, './vitest.setup.ts')],
    env: loadEnv('', process.cwd(), ''),
    testTimeout: 30_000,
    hookTimeout: 30_000,
    reporters: isCI
      ? ['json', 'github-actions', 'default', 'html']
      : ['default', 'html'],
    outputFile: {
      json: 'reports/test-results.json',
      html: 'reports/index.html',
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'spec',
          include: ['packages/spec/**/*.spec.ts'],
          environment: 'node',
          typecheck: {
            enabled: true,
            include: ['packages/spec/**/*.spec.ts'],
            tsconfig: 'packages/spec/tsconfig.json',
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'react',
          environment: 'happy-dom',
          include: ['packages/react/**/*.test.{ts,tsx}'],
          typecheck: {
            enabled: true,
            include: ['packages/react/**/*.test-d.ts'],
            tsconfig: 'packages/react/tsconfig.json',
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'client',
          include: ['packages/client/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
