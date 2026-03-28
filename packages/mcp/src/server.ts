import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { resolveProjectRoot, createServerContext } from './context.js';
import { registerAllResources } from './resources/index.js';
import { registerAllTools } from './tools/index.js';
import type { McpServerOptions } from './types.js';

export const MCP_VERSION = '0.0.2';

export async function createMcpServer(options: McpServerOptions = { mode: 'local' }): Promise<McpServer> {
  const projectRoot = options.projectRoot ?? resolveProjectRoot();
  const ctx = createServerContext(projectRoot);

  const server = new McpServer(
    { name: 'synap', version: MCP_VERSION },
    { capabilities: { logging: {} } },
  );

  registerAllResources(server, ctx);
  registerAllTools(server, ctx, { readOnly: options.readOnly ?? false });

  return server;
}
