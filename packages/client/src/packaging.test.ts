import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageDir = resolve(__dirname, '..');
const packagesDir = resolve(packageDir, '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe('Given the @aave/client package', () => {
  it('Then it does not depend on @safe-global/safe-apps-sdk', () => {
    const pkg = readFileSync(join(packageDir, 'package.json'), 'utf8');
    expect(pkg).not.toContain('safe-apps-sdk');
  });

  it('Then no package source references the Safe Apps SDK or safe.ts', () => {
    expect(existsSync(join(packageDir, 'src/safe.ts'))).toBe(false);

    const offenders = readdirSync(packagesDir)
      .map((name) => join(packagesDir, name, 'src'))
      .filter((dir) => existsSync(dir))
      .flatMap(sourceFiles)
      .filter((file) => !file.endsWith('packaging.test.ts'))
      .filter((file) => {
        const content = readFileSync(file, 'utf8');
        return (
          content.includes('safe-apps-sdk') || /from '\.\/safe'/.test(content)
        );
      });

    expect(offenders).toEqual([]);
  });
});
