import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from '../types.js';
import { parseAllPageSpecs } from '@synap-js/core';

export function registerPagesResource(server: McpServer, ctx: ServerContext): void {
  server.registerResource(
    'pages',
    'project://pages',
    {
      description: 'All page specs (marketing and custom pages)',
      mimeType: 'text/plain',
    },
    async (uri) => {
      try {
        const { pages, errors } = parseAllPageSpecs(ctx.specsDir);

        if (pages.length === 0 && errors.length === 0) {
          return { contents: [{ uri: uri.href, text: 'No page specs found in specs/pages/.' }] };
        }

        const lines: string[] = ['# Pages', ''];
        for (const page of pages) {
          const sections = page.sections?.map((s) => s.type).join(', ') ?? 'none';
          lines.push(`## ${page.page}`);
          lines.push(`Route: ${page.route}`);
          lines.push(`Layout: ${page.layout ?? 'marketing'}`);
          lines.push(`Sections: ${sections}`);
          lines.push('');
        }

        if (errors.length > 0) {
          lines.push('## Errors');
          for (const err of errors) {
            lines.push(`  ${err.message}`);
          }
        }

        return { contents: [{ uri: uri.href, text: lines.join('\n') }] };
      } catch (err) {
        return { contents: [{ uri: uri.href, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );
}
