import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from '../types.js';
import { formatErrors } from '../utils/format.js';

export function registerValidateTool(server: McpServer, ctx: ServerContext): void {
  server.registerTool(
    'validate',
    {
      description: 'Validate all specs without generating code. Returns validation errors or success message.',
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const { specs, errors: parseErrors } = ctx.loadSpecs();
        const { errors: resolveErrors } = ctx.resolveSpecs();

        const text = parseErrors.length === 0 && resolveErrors.length === 0
          ? `All specs valid. ${specs.length} model(s) parsed successfully.`
          : formatErrors(parseErrors, resolveErrors);

        return {
          content: [{ type: 'text' as const, text }],
          isError: parseErrors.length > 0 || resolveErrors.length > 0,
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );
}
