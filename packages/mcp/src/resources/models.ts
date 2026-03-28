import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from '../types.js';
import { formatModelList, formatModelDetail } from '../utils/format.js';

export function registerModelsResources(server: McpServer, ctx: ServerContext): void {
  // Static: list all models
  server.registerResource(
    'models',
    'project://models',
    {
      description: 'All models with fields and relations',
      mimeType: 'text/plain',
    },
    async (uri) => {
      try {
        const { specs } = ctx.loadSpecs();
        return { contents: [{ uri: uri.href, text: formatModelList(specs) }] };
      } catch (err) {
        return { contents: [{ uri: uri.href, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );

  // Dynamic: single model detail
  server.registerResource(
    'model-detail',
    new ResourceTemplate('project://models/{name}', {
      list: async () => {
        try {
          const { specs } = ctx.loadSpecs();
          return {
            resources: specs.map((s) => ({
              uri: `project://models/${s.model}`,
              name: s.model,
            })),
          };
        } catch {
          return { resources: [] };
        }
      },
    }),
    {
      description: 'Detail of a specific model',
      mimeType: 'text/plain',
    },
    async (uri, { name }) => {
      try {
        const { specs } = ctx.loadSpecs();
        const spec = specs.find(
          (s) => s.model.toLowerCase() === String(name).toLowerCase(),
        );
        if (!spec) {
          return { contents: [{ uri: uri.href, text: `Model "${name}" not found. Available: ${specs.map((s) => s.model).join(', ')}` }] };
        }
        return { contents: [{ uri: uri.href, text: formatModelDetail(spec) }] };
      } catch (err) {
        return { contents: [{ uri: uri.href, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );
}
