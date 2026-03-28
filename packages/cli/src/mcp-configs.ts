import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface McpConfigEntry {
  dir: string;
  file: string;
  content: string;
  label: string;
  global?: boolean;
  globalPath?: string;
}

const SYNAP_SERVER = {
  command: 'npx',
  args: ['-y', '@synap-js/mcp'],
};

export const MCP_CONFIGS: Record<string, McpConfigEntry> = {
  claude: {
    dir: '.',
    file: '.mcp.json',
    label: 'Claude Code',
    content: JSON.stringify({
      mcpServers: {
        synap: SYNAP_SERVER,
      },
    }, null, 2),
  },
  cursor: {
    dir: '.cursor',
    file: 'mcp.json',
    label: 'Cursor',
    content: JSON.stringify({
      mcpServers: {
        synap: SYNAP_SERVER,
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
          command: 'npx',
          args: ['-y', '@synap-js/mcp'],
        },
      },
    }, null, 2),
  },
  windsurf: {
    dir: '',
    file: '',
    label: 'Windsurf',
    global: true,
    globalPath: join(homedir(), '.codeium', 'windsurf', 'mcp_config.json'),
    content: '', // handled specially
  },
};

export function writeMcpConfig(projectDir: string, key: string): { dir: string; file: string; label: string } {
  const cfg = MCP_CONFIGS[key]!;

  if (key === 'windsurf') {
    return writeWindsurfConfig(cfg);
  }

  const dirPath = cfg.dir === '.' ? projectDir : join(projectDir, cfg.dir);
  const filePath = join(dirPath, cfg.file);
  mkdirSync(dirPath, { recursive: true });
  writeFileSync(filePath, cfg.content + '\n', 'utf-8');

  const displayPath = cfg.dir === '.' ? cfg.file : `${cfg.dir}/${cfg.file}`;
  return { dir: cfg.dir, file: cfg.file, label: `${cfg.label} → ${displayPath}` };
}

function writeWindsurfConfig(cfg: McpConfigEntry): { dir: string; file: string; label: string } {
  const globalPath = cfg.globalPath!;
  const globalDir = join(globalPath, '..');
  mkdirSync(globalDir, { recursive: true });

  let existing: Record<string, unknown> = {};
  if (existsSync(globalPath)) {
    try {
      existing = JSON.parse(readFileSync(globalPath, 'utf-8'));
    } catch {
      // invalid JSON, overwrite
    }
  }

  const mcpServers = (existing['mcpServers'] as Record<string, unknown>) ?? {};
  mcpServers['synap'] = SYNAP_SERVER;
  existing['mcpServers'] = mcpServers;

  writeFileSync(globalPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
  return { dir: '~/.codeium/windsurf', file: 'mcp_config.json', label: `${cfg.label} → ${globalPath}` };
}
