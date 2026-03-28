import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from '../types.js';

export function registerExtensionsResource(server: McpServer, ctx: ServerContext): void {
  server.registerResource(
    'extensions',
    'project://extensions',
    {
      description: 'Active hooks and overrides',
      mimeType: 'text/plain',
    },
    async (uri) => {
      try {
        const lines: string[] = ['# Extensions'];

        const apiDir = join(ctx.extensionsDir, 'api');
        if (existsSync(apiDir)) {
          const files = readdirSync(apiDir).filter((f) => f.endsWith('.ts'));
          if (files.length > 0) {
            lines.push('', '## API Extensions');
            for (const file of files) {
              lines.push(`  ${file}`);
            }
          }
        }

        if (lines.length === 1) {
          lines.push('', 'No extensions found.');
        }

        return { contents: [{ uri: uri.href, text: lines.join('\n') }] };
      } catch (err) {
        return { contents: [{ uri: uri.href, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );
}
