import { z } from 'zod';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { parseSpec } from '@synap-js/core';
import type { ServerContext, ToolOptions } from '../types.js';

export function registerAddRelationTool(server: McpServer, ctx: ServerContext, options: ToolOptions): void {
  server.registerTool(
    'add_relation',
    {
      description: 'Add a relation between two models. Modifies the source model spec YAML file.',
      inputSchema: z.object({
        from: z.string().describe('Source model name (e.g. Post)'),
        to: z.string().describe('Target model name (e.g. User)'),
        type: z.enum(['hasMany', 'belongsTo', 'hasOne', 'manyToMany']).describe('Relation type'),
        name: z.string().optional().describe('Relation name. Defaults to lowercase target model name.'),
        foreignKey: z.string().optional().describe('Foreign key field name'),
        onDelete: z.enum(['cascade', 'setNull', 'restrict', 'noAction']).optional(),
      }),
    },
    async ({ from, to, type: relType, name: relName, foreignKey, onDelete }) => {
      if (options.readOnly) {
        return {
          content: [{ type: 'text' as const, text: 'Server is in read-only mode. This operation is not permitted.' }],
          isError: true,
        };
      }

      try {
        const filePath = findSpecFile(ctx.specsDir, from);
        if (!filePath) {
          return {
            content: [{ type: 'text' as const, text: `Spec file not found for model "${from}".` }],
            isError: true,
          };
        }

        const content = readFileSync(filePath, 'utf-8');
        const relationName = relName ?? to.charAt(0).toLowerCase() + to.slice(1);

        // Build relation YAML
        const relLines: string[] = [
          `  ${relationName}:`,
          `    type: ${relType}`,
          `    model: ${to}`,
        ];
        if (foreignKey) relLines.push(`    foreignKey: ${foreignKey}`);
        if (onDelete) relLines.push(`    onDelete: ${onDelete}`);

        const lines = content.split('\n');

        // Find or create relations block
        let relationsIndex = lines.findIndex((l) => /^relations:\s*$/.test(l));

        if (relationsIndex === -1) {
          // Append relations block at end
          lines.push('', 'relations:');
          lines.push(...relLines);
        } else {
          // Find end of relations block
          let insertIndex = relationsIndex + 1;
          for (let i = relationsIndex + 1; i < lines.length; i++) {
            const line = lines[i]!;
            if (line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
              insertIndex = i;
              break;
            }
            insertIndex = i + 1;
          }
          lines.splice(insertIndex, 0, ...relLines);
        }

        writeFileSync(filePath, lines.join('\n'), 'utf-8');

        // Validate
        const result = parseSpec(filePath);
        if (!result.success) {
          const errors = result.errors.map((e) => e.message).join('\n');
          return {
            content: [{
              type: 'text' as const,
              text: `Relation added but validation errors found:\n${errors}`,
            }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: `Relation "${relationName}" (${relType} ${to}) added to model "${from}". Run generate to update code.`,
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

  const exact = files.find((f) => f.replace('.spec.yaml', '').toLowerCase() === lowerModel);
  if (exact) return join(modelsDir, exact);

  return null;
}
