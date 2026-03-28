#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.js';
import type { McpServerOptions } from './types.js';

function parseArgs(args: string[]): McpServerOptions {
  const options: McpServerOptions = { mode: 'local' };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--read-only') {
      options.readOnly = true;
    } else if (arg === '--project-root' && args[i + 1]) {
      options.projectRoot = args[++i];
    }
  }

  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const server = await createMcpServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
} catch (err) {
  process.stderr.write(`Synap MCP server error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
}
