import { describe, it, expect } from 'vitest';
import { program } from '../src/index.js';

describe('@kodeai/cli', () => {
  it('has the correct name', () => {
    expect(program.name()).toBe('kodeai');
  });

  it('registers core commands', () => {
    const commandNames = program.commands.map((cmd) => cmd.name());
    expect(commandNames).toContain('init');
    expect(commandNames).toContain('generate');
    expect(commandNames).toContain('validate');
    expect(commandNames).toContain('dev');
  });
});
