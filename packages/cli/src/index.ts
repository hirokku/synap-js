import { Command } from 'commander';
import { registerInitCommand } from './commands/init.js';
import { registerValidateCommand } from './commands/validate.js';
import { registerGenerateCommand } from './commands/generate.js';
import { registerDevCommand } from './commands/dev.js';

export const program = new Command();

program
  .name('synap')
  .description('AI-first full-stack TypeScript framework')
  .version('0.0.1');

// Implemented commands
registerInitCommand(program);
registerValidateCommand(program);
registerGenerateCommand(program);
registerDevCommand(program);

// Stub commands — v2+
program.command('add <type> [name]').description('Add a new resource');
program.command('migrate').description('Manage database migrations');
