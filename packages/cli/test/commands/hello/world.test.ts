import { runCommand } from '@oclif/test';
import { describe, expect, it } from 'vitest';

describe('hello world', () => {
  it('runs hello world cmd', async () => {
    const { stdout } = await runCommand('hello world');
    expect(stdout).to.contain('hello world!');
  });
});
