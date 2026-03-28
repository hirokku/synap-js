import { z } from 'zod';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { parseSpec } from '@synap-js/core';
import type { ServerContext, ToolOptions } from '../types.js';

export function registerAddModelTool(server: McpServer, ctx: ServerContext, options: ToolOptions): void {
  server.registerTool(
    'add_model',
    {
      description: 'Add a new model by creating a spec YAML file. Provide either raw YAML content or a structured name + fields definition.',
      inputSchema: z.object({
        name: z.string().describe('PascalCase model name (e.g. Product, UserProfile)'),
        yaml: z.string().optional().describe('Complete YAML spec content. If provided, name is used only for the filename.'),
        fields: z
          .record(
            z.object({
              type: z.string().describe('Field type: string, text, integer, decimal, boolean, uuid, enum, email, etc.'),
              primary: z.boolean().optional(),
              nullable: z.boolean().optional(),
              unique: z.boolean().optional(),
              default: z.unknown().optional(),
              min: z.number().optional(),
              max: z.number().optional(),
              values: z.array(z.string()).optional().describe('Required for enum type'),
            }),
          )
          .optional()
          .describe('Field definitions. Ignored if yaml is provided.'),
        endpoints: z
          .array(z.enum(['list', 'get', 'create', 'update', 'delete']))
          .optional()
          .describe('API endpoints to generate. Defaults to all CRUD.'),
      }),
    },
    async ({ name, yaml, fields, endpoints }) => {
      if (options.readOnly) {
        return {
          content: [{ type: 'text' as const, text: 'Server is in read-only mode. This operation is not permitted.' }],
          isError: true,
        };
      }

      try {
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
          return {
            content: [{ type: 'text' as const, text: `Invalid model name "${name}". Must be PascalCase (e.g. Product, UserProfile).` }],
            isError: true,
          };
        }

        const fileName = name.charAt(0).toLowerCase() + name.slice(1);
        const filePath = join(ctx.specsDir, 'models', `${fileName}.spec.yaml`);

        if (existsSync(filePath)) {
          return {
            content: [{ type: 'text' as const, text: `Spec file already exists: ${filePath}` }],
            isError: true,
          };
        }

        let content: string;
        if (yaml) {
          content = yaml;
        } else {
          content = buildYaml(name, fields, endpoints);
        }

        mkdirSync(join(ctx.specsDir, 'models'), { recursive: true });
        writeFileSync(filePath, content, 'utf-8');

        // Validate
        const result = parseSpec(filePath);
        if (!result.success) {
          const errors = result.errors.map((e) => e.message).join('\n');
          return {
            content: [{
              type: 'text' as const,
              text: `File created at ${filePath} but has validation errors:\n${errors}\n\nFix the spec and run validate again.`,
            }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: `Model "${name}" created at ${filePath}.\nRun generate to produce code.`,
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

function buildYaml(
  name: string,
  fields?: Record<string, { type: string; primary?: boolean; nullable?: boolean; unique?: boolean; default?: unknown; min?: number; max?: number; values?: string[] }>,
  endpoints?: string[],
): string {
  const lines: string[] = [`model: ${name}`, 'fields:'];

  const fieldDefs = fields ?? {
    id: { type: 'uuid', primary: true },
  };

  for (const [fieldName, field] of Object.entries(fieldDefs)) {
    lines.push(`  ${fieldName}:`);
    lines.push(`    type: ${field.type}`);
    if (field.primary) lines.push('    primary: true');
    if (field.nullable) lines.push('    nullable: true');
    if (field.unique) lines.push('    unique: true');
    if (field.default !== undefined) lines.push(`    default: ${field.default}`);
    if (field.min !== undefined) lines.push(`    min: ${field.min}`);
    if (field.max !== undefined) lines.push(`    max: ${field.max}`);
    if (field.values) lines.push(`    values: [${field.values.join(', ')}]`);
  }

  const eps = endpoints ?? ['list', 'get', 'create', 'update', 'delete'];
  lines.push('', 'api:');
  lines.push(`  endpoints: [${eps.join(', ')}]`);

  return lines.join('\n') + '\n';
}
