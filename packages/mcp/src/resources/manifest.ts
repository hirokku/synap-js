import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from '../types.js';
import { formatManifest } from '../utils/format.js';

export function registerManifestResource(server: McpServer, ctx: ServerContext): void {
  server.registerResource(
    'manifest',
    'project://manifest',
    {
      description: 'Complete project summary',
      mimeType: 'text/plain',
    },
    async (uri) => {
      try {
        const { specs } = ctx.loadSpecs();
        const { pages } = ctx.loadPageSpecs();
        const seedFiles = ctx.getSeedFiles();
        return { contents: [{ uri: uri.href, text: formatManifest(specs, pages, seedFiles) }] };
      } catch (err) {
        return { contents: [{ uri: uri.href, text: `Error loading manifest: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );
}
