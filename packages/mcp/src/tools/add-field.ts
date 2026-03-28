import { z } from 'zod';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { parseSpec } from '@synap-js/core';
import type { ServerContext, ToolOptions } from '../types.js';

export function registerAddFieldTool(server: McpServer, ctx: ServerContext, options: ToolOptions): void {
  server.registerTool(
    'add_field',
    {
      description: 'Add a field to an existing model spec. Modifies the YAML file and validates.',
      inputSchema: z.object({
        model: z.string().describe('Model name (e.g. Product)'),
        field: z.string().describe('Field name (e.g. price)'),
        type: z.string().describe('Field type: string, text, integer, decimal, boolean, uuid, enum, email, url, etc.'),
        nullable: z.boolean().optional(),
        unique: z.boolean().optional(),
        default: z.unknown().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        values: z.array(z.string()).optional().describe('Required for enum type'),
      }),
    },
    async ({ model, field, type, nullable, unique, default: defaultVal, min, max, values }) => {
      if (options.readOnly) {
        return {
          content: [{ type: 'text' as const, text: 'Server is in read-only mode. This operation is not permitted.' }],
          isError: true,
        };
      }

      try {
        const filePath = findSpecFile(ctx.specsDir, model);
        if (!filePath) {
          return {
            content: [{ type: 'text' as const, text: `Spec file not found for model "${model}".` }],
            isError: true,
          };
        }

        const content = readFileSync(filePath, 'utf-8');

        // Build field YAML lines
        const fieldLines: string[] = [`  ${field}:`, `    type: ${type}`];
        if (nullable) fieldLines.push('    nullable: true');
        if (unique) fieldLines.push('    unique: true');
        if (defaultVal !== undefined) fieldLines.push(`    default: ${defaultVal}`);
        if (min !== undefined) fieldLines.push(`    min: ${min}`);
        if (max !== undefined) fieldLines.push(`    max: ${max}`);
        if (values) fieldLines.push(`    values: [${values.join(', ')}]`);

        // Find insertion point: after the last field in the fields block
        const lines = content.split('\n');
        let insertIndex = -1;
        let inFields = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!;
          if (/^fields:\s*$/.test(line)) {
            inFields = true;
            continue;
          }
          if (inFields) {
            if (line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
              insertIndex = i;
              inFields = false;
              break;
            }
            insertIndex = i + 1;
          }
        }

        if (insertIndex === -1) {
          return {
            content: [{ type: 'text' as const, text: `Could not find "fields:" block in ${filePath}.` }],
            isError: true,
          };
        }

        lines.splice(insertIndex, 0, ...fieldLines);
        writeFileSync(filePath, lines.join('\n'), 'utf-8');

        // Validate
        const result = parseSpec(filePath);
        if (!result.success) {
          const errors = result.errors.map((e) => e.message).join('\n');
          return {
            content: [{
              type: 'text' as const,
              text: `Field "${field}" added to ${model} but validation errors found:\n${errors}`,
            }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: `Field "${field}" (${type}) added to model "${model}". Run generate to update code.`,
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

function findSpecFile(specsDir: string, model: string): string | null {
  const modelsDir = join(specsDir, 'models');
  if (!existsSync(modelsDir)) return null;

  const files = readdirSync(modelsDir).filter((f) => f.endsWith('.spec.yaml'));
  const lowerModel = model.toLowerCase();

  // Try exact match first
  const exact = files.find((f) => f.replace('.spec.yaml', '').toLowerCase() === lowerModel);
  if (exact) return join(modelsDir, exact);

  return null;
}
