import type { Command } from 'commander';
import { MCP_CONFIGS, writeMcpConfig } from '../mcp-configs.js';

const VALID_TARGETS = [...Object.keys(MCP_CONFIGS), 'all'];

export function registerMcpCommand(program: Command): void {
  const mcp = program
    .command('mcp')
    .description('MCP server management');

  mcp
    .command('setup [target]')
    .description('Generate MCP config for an AI tool (claude, cursor, vscode, windsurf, all)')
    .action((target?: string) => {
      const cwd = process.cwd();

      if (!target) {
        console.log('\nUsage: synap mcp setup <target>\n');
        console.log('Available targets:');
        for (const [key, cfg] of Object.entries(MCP_CONFIGS)) {
          console.log(`  ${key.padEnd(10)} → ${cfg.dir}/${cfg.file}  (${cfg.label})`);
        }
        console.log(`  ${'all'.padEnd(10)} → Generate all configs`);
        console.log('');
        return;
      }

      if (!VALID_TARGETS.includes(target)) {
        console.log(`\x1b[31m✗\x1b[0m Unknown target "${target}". Valid: ${VALID_TARGETS.join(', ')}`);
        process.exit(1);
      }

      const targets = target === 'all' ? Object.keys(MCP_CONFIGS) : [target];

      console.log('');
      for (const t of targets) {
        const result = writeMcpConfig(cwd, t);
        console.log(`  \x1b[32m✓\x1b[0m ${result.dir}/${result.file}  (${result.label})`);
      }
      console.log(`\nDone. Your AI can now connect to this project via MCP.\n`);
    });
}
