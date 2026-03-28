import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface McpConfigEntry {
  dir: string;
  file: string;
  content: string;
  label: string;
}

export const MCP_CONFIGS: Record<string, McpConfigEntry> = {
  claude: {
    dir: '.',
    file: '.mcp.json',
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

export function writeMcpConfig(projectDir: string, key: string): { dir: string; file: string; label: string } {
  const cfg = MCP_CONFIGS[key]!;
  const dirPath = join(projectDir, cfg.dir);
  const filePath = join(dirPath, cfg.file);
  mkdirSync(dirPath, { recursive: true });
  writeFileSync(filePath, cfg.content + '\n', 'utf-8');
  return { dir: cfg.dir, file: cfg.file, label: cfg.label };
}
