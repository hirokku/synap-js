import { z } from 'zod';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext, ToolOptions } from '../types.js';

export function registerSeedDataTool(server: McpServer, ctx: ServerContext, options: ToolOptions): void {
  server.registerTool(
    'seed_data',
    {
      description: `Create seed data for a model. Writes a YAML file at specs/seeds/{model}.seed.yaml.
Provide realistic, diverse data matching the model's field types and constraints.
Create parent records before children (Category before Product).
Include id fields (UUID format) so child records can reference them.
Read project://guidelines for data quality standards.`,
      inputSchema: z.object({
        model: z.string().describe('PascalCase model name (e.g. Product, Category)'),
        records: z.array(z.record(z.unknown())).describe(
          'Array of record objects. Each must include an id (UUID) and fields matching the model spec. Use realistic data, not test/placeholder values.',
        ),
      }),
    },
    async ({ model, records }) => {
      if (options.readOnly) {
        return {
          content: [{ type: 'text' as const, text: 'Server is in read-only mode.' }],
          isError: true,
        };
      }

      try {
        // Validate model exists
        const { specs } = ctx.loadSpecs();
        const spec = specs.find((s) => s.model.toLowerCase() === model.toLowerCase());
        if (!spec) {
          return {
            content: [{
              type: 'text' as const,
              text: `Model "${model}" not found. Available: ${specs.map((s) => s.model).join(', ')}`,
            }],
            isError: true,
          };
        }

        if (!records || records.length === 0) {
          return {
            content: [{ type: 'text' as const, text: 'No records provided. Include at least 1 record.' }],
            isError: true,
          };
        }

        // Build YAML
        const lines: string[] = [`model: ${spec.model}`, 'records:'];
        for (const record of records) {
          const entries = Object.entries(record);
          if (entries.length === 0) continue;
          lines.push(`  - ${entries[0]![0]}: ${formatValue(entries[0]![1])}`);
          for (let i = 1; i < entries.length; i++) {
            lines.push(`    ${entries[i]![0]}: ${formatValue(entries[i]![1])}`);
          }
        }

        const seedsDir = join(ctx.specsDir, 'seeds');
        mkdirSync(seedsDir, { recursive: true });
        const fileName = spec.model.charAt(0).toLowerCase() + spec.model.slice(1);
        const filePath = join(seedsDir, `${fileName}.seed.yaml`);
        writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');

        return {
          content: [{
            type: 'text' as const,
            text: `Seed data created: ${filePath}\n${records.length} record(s) for ${spec.model}.`,
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

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}
