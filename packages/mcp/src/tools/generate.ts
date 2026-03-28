import { z } from 'zod';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { resolveSpecs } from '@synap-js/core';
import type { GeneratorContext } from '@synap-js/core';
import { ModelGenerator, ValidatorGenerator, ApiGenerator, MigrationGenerator } from '@synap-js/generators';
import type { ServerContext, ToolOptions } from '../types.js';

export function registerGenerateTool(server: McpServer, ctx: ServerContext, options: ToolOptions): void {
  server.registerTool(
    'generate',
    {
      description: 'Generate code from specs. Writes TypeScript types, Drizzle schemas, Zod validators, and Hono API routes.',
      inputSchema: z.object({
        target: z.enum(['models', 'api', 'all']).optional().describe('What to generate. Defaults to all.'),
      }),
    },
    async ({ target }) => {
      if (options.readOnly) {
        return {
          content: [{ type: 'text' as const, text: 'Server is in read-only mode. Generate is not permitted.' }],
          isError: true,
        };
      }

      try {
        const { specs, errors: parseErrors } = ctx.loadSpecs();
        if (parseErrors.length > 0) {
          const msgs = parseErrors.map((e) => `${e.file}: ${e.message}`).join('\n');
          return {
            content: [{ type: 'text' as const, text: `Spec errors found. Fix before generating:\n${msgs}` }],
            isError: true,
          };
        }

        if (specs.length === 0) {
          return {
            content: [{ type: 'text' as const, text: 'No specs found in specs/models/.' }],
            isError: true,
          };
        }

        const { graph, errors: resolveErrors } = resolveSpecs(specs);
        if (resolveErrors.length > 0) {
          const msgs = resolveErrors.map((e) => `[${e.code}] ${e.message}`).join('\n');
          return {
            content: [{ type: 'text' as const, text: `Resolution errors:\n${msgs}` }],
            isError: true,
          };
        }

        const orderedSpecs = graph.order
          .map((name) => specs.find((s) => s.model === name))
          .filter((s): s is NonNullable<typeof s> => s !== undefined);

        const context: GeneratorContext = {
          specsDir: ctx.specsDir,
          outputDir: ctx.outputDir,
          extensionsDir: ctx.extensionsDir,
          allSpecs: orderedSpecs,
        };

        const t = target ?? 'all';
        const generators = [];
        if (t === 'all' || t === 'models') generators.push(ModelGenerator, ValidatorGenerator);
        if (t === 'all' || t === 'api') generators.push(ApiGenerator);
        if (t === 'all') generators.push(MigrationGenerator);

        let totalFiles = 0;
        const filePaths: string[] = [];

        for (const generator of generators) {
          const result = await generator.generate(orderedSpecs, context);

          if (result.errors.length > 0) {
            const msgs = result.errors.map((e: { code?: string; message?: string }) =>
              `${e.code ?? 'ERROR'}: ${e.message ?? 'Unknown error'}`
            ).join('\n');
            return {
              content: [{ type: 'text' as const, text: `Generator errors:\n${msgs}` }],
              isError: true,
            };
          }

          for (const file of result.files) {
            const fullPath = file.path.startsWith('/')
              ? file.path
              : join(ctx.projectRoot, file.path);
            mkdirSync(dirname(fullPath), { recursive: true });
            writeFileSync(fullPath, file.content, 'utf-8');
            filePaths.push(file.path);
            totalFiles++;
          }
        }

        return {
          content: [{
            type: 'text' as const,
            text: `Generated ${totalFiles} file(s):\n${filePaths.map((f) => `  ${f}`).join('\n')}`,
          }],
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
