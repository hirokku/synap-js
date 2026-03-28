import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from '../types.js';
import { formatConfig } from '../utils/format.js';

export function registerConfigResource(server: McpServer, ctx: ServerContext): void {
  server.registerResource(
    'config',
    'project://config',
    {
      description: 'Project configuration',
      mimeType: 'text/plain',
    },
    async (uri) => {
      try {
        return { contents: [{ uri: uri.href, text: formatConfig(ctx.projectRoot) }] };
      } catch (err) {
        return { contents: [{ uri: uri.href, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );
}
