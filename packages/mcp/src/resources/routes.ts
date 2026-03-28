import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from '../types.js';
import { formatRoutes } from '../utils/format.js';

export function registerRoutesResource(server: McpServer, ctx: ServerContext): void {
  server.registerResource(
    'routes',
    'project://routes',
    {
      description: 'Endpoint map with auth levels',
      mimeType: 'text/plain',
    },
    async (uri) => {
      try {
        const { specs } = ctx.loadSpecs();
        return { contents: [{ uri: uri.href, text: formatRoutes(specs) }] };
      } catch (err) {
        return { contents: [{ uri: uri.href, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );
}
