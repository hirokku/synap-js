import type { Command } from 'commander';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MCP_CONFIGS: Record<string, { dir: string; file: string; content: string; label: string }> = {
  claude: {
    dir: '.claude',
    file: 'mcp.json',
    label: 'Claude Code',
    content: JSON.stringify({
      mcpServers: {
        synap: {
          command: 'npx',
          args: ['@synap-js/mcp'],
        },
      },
    }, null, 2),
  },
  cursor: {
    dir: '.cursor',
    file: 'mcp.json',
    label: 'Cursor',
    content: JSON.stringify({
      mcpServers: {
        synap: {
          command: 'npx',
          args: ['@synap-js/mcp'],
        },
      },
    }, null, 2),
  },
  vscode: {
    dir: '.vscode',
    file: 'mcp.json',
    label: 'VS Code / Copilot',
    content: JSON.stringify({
      servers: {
        synap: {
          type: 'stdio',
          command: 'npx',
          args: ['@synap-js/mcp'],
        },
      },
    }, null, 2),
  },
  windsurf: {
    dir: '.windsurf',
    file: 'mcp.json',
    label: 'Windsurf',
    content: JSON.stringify({
      mcpServers: {
        synap: {
          command: 'npx',
          args: ['@synap-js/mcp'],
        },
      },
    }, null, 2),
  },
};

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
        const cfg = MCP_CONFIGS[t]!;
        const dirPath = join(cwd, cfg.dir);
        const filePath = join(dirPath, cfg.file);

        mkdirSync(dirPath, { recursive: true });
        writeFileSync(filePath, cfg.content + '\n', 'utf-8');
        console.log(`  \x1b[32m✓\x1b[0m ${cfg.dir}/${cfg.file}  (${cfg.label})`);
      }
      console.log(`\nDone. Your AI can now connect to this project via MCP.\n`);
    });
}
