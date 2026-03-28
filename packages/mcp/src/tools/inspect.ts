import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from '../types.js';
import { formatModelDetail, formatManifest } from '../utils/format.js';

export function registerInspectTool(server: McpServer, ctx: ServerContext): void {
  server.registerTool(
    'inspect',
    {
      description: 'Diagnostic inspection of a model or the project. Returns detailed information.',
      inputSchema: z.object({
        target: z.string().describe('Model name to inspect, or "project" for full project diagnostic'),
      }),
    },
    async ({ target }) => {
      try {
        const { specs, errors: parseErrors } = ctx.loadSpecs();

        if (target.toLowerCase() === 'project') {
          const { errors: resolveErrors } = ctx.resolveSpecs();
          const lines = [
            formatManifest(specs),
            '',
            `Parse errors: ${parseErrors.length}`,
            `Resolution errors: ${resolveErrors.length}`,
            '',
            '## Dependency Order',
            ...ctx.resolveSpecs().graph.order.map((n, i) => `  ${i + 1}. ${n}`),
          ];
          return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
        }

        const spec = specs.find(
          (s) => s.model.toLowerCase() === target.toLowerCase(),
        );
        if (!spec) {
          return {
            content: [{
              type: 'text' as const,
              text: `Model "${target}" not found. Available: ${specs.map((s) => s.model).join(', ')}`,
            }],
            isError: true,
          };
        }

        return { content: [{ type: 'text' as const, text: formatModelDetail(spec) }] };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );
}
