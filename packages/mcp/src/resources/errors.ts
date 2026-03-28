import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from '../types.js';
import { formatErrors } from '../utils/format.js';

export function registerErrorsResource(server: McpServer, ctx: ServerContext): void {
  server.registerResource(
    'errors',
    'project://errors',
    {
      description: 'Current validation errors',
      mimeType: 'text/plain',
    },
    async (uri) => {
      try {
        const { errors: parseErrors } = ctx.loadSpecs();
        const { errors: resolveErrors } = ctx.resolveSpecs();
        // Avoid double-reporting: if there are parse errors, resolveSpecs
        // was called with whatever specs did parse successfully
        return { contents: [{ uri: uri.href, text: formatErrors(parseErrors, resolveErrors) }] };
      } catch (err) {
        return { contents: [{ uri: uri.href, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );
}
