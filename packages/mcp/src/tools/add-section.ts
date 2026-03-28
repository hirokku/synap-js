import { z } from 'zod';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { parsePageSpec } from '@synap-js/core';
import type { ServerContext, ToolOptions } from '../types.js';

export function registerAddSectionTool(server: McpServer, ctx: ServerContext, options: ToolOptions): void {
  server.registerTool(
    'add_section',
    {
      description: 'Add a section to an existing page spec. Appends to the sections array in the YAML file.',
      inputSchema: z.object({
        page: z.string().describe('Page name (e.g. Home)'),
        type: z.enum(['hero', 'features', 'pricing', 'cta', 'testimonials', 'faq', 'content', 'stats', 'team', 'contact']),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        yaml: z.string().optional().describe('Raw YAML for the section (indented, starting with "- type:"). Overrides other fields.'),
      }),
    },
    async ({ page, type: sectionType, title, subtitle, yaml }) => {
      if (options.readOnly) {
        return {
          content: [{ type: 'text' as const, text: 'Server is in read-only mode.' }],
          isError: true,
        };
      }

      try {
        const filePath = findPageFile(ctx.specsDir, page);
        if (!filePath) {
          return {
            content: [{ type: 'text' as const, text: `Page spec not found for "${page}".` }],
            isError: true,
          };
        }

        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        let sectionYaml: string;
        if (yaml) {
          sectionYaml = yaml;
        } else {
          const sectionLines = [`  - type: ${sectionType}`];
          if (title) sectionLines.push(`    title: "${title}"`);
          if (subtitle) sectionLines.push(`    subtitle: "${subtitle}"`);
          sectionYaml = sectionLines.join('\n');
        }

        // Find the sections block or create one
        const sectionsIndex = lines.findIndex((l) => /^sections:\s*$/.test(l));

        if (sectionsIndex === -1) {
          lines.push('sections:', sectionYaml);
        } else {
          // Append after the last section entry
          let insertIndex = sectionsIndex + 1;
          for (let i = sectionsIndex + 1; i < lines.length; i++) {
            const line = lines[i]!;
            if (line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
              insertIndex = i;
              break;
            }
            insertIndex = i + 1;
          }
          lines.splice(insertIndex, 0, sectionYaml);
        }

        writeFileSync(filePath, lines.join('\n'), 'utf-8');

        const result = parsePageSpec(filePath);
        if (!result.success) {
          const errors = result.errors.map((e) => e.message).join('\n');
          return {
            content: [{
              type: 'text' as const,
              text: `Section added but validation errors found:\n${errors}`,
            }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: `Section "${sectionType}" added to page "${page}". Run generate to update frontend.`,
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

function findPageFile(specsDir: string, page: string): string | null {
  const pagesDir = join(specsDir, 'pages');
  if (!existsSync(pagesDir)) return null;
  const files = readdirSync(pagesDir).filter((f) => f.endsWith('.page.yaml'));
  const lowerPage = page.toLowerCase();
  const exact = files.find((f) => f.replace('.page.yaml', '').toLowerCase() === lowerPage);
  return exact ? join(pagesDir, exact) : null;
}
