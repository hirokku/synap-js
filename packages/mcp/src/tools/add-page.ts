import { z } from 'zod';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { parsePageSpec } from '@synap-js/core';
import type { ServerContext, ToolOptions } from '../types.js';

export function registerAddPageTool(server: McpServer, ctx: ServerContext, options: ToolOptions): void {
  server.registerTool(
    'add_page',
    {
      description: 'Create a new page by writing a page spec YAML file. Supports marketing pages (with sections) and CRUD pages (linked to models).',
      inputSchema: z.object({
        name: z.string().describe('PascalCase page name (e.g. Home, Pricing, About)'),
        route: z.string().describe('URL path (e.g. /, /pricing, /about)'),
        layout: z.enum(['marketing', 'app', 'blank']).optional().describe('Layout type. Defaults to marketing.'),
        title: z.string().optional().describe('HTML page title'),
        yaml: z.string().optional().describe('Complete YAML content. If provided, other fields are ignored except name for filename.'),
        sections: z.array(z.object({
          type: z.enum(['hero', 'features', 'pricing', 'cta', 'testimonials', 'faq', 'content', 'stats', 'team', 'contact']),
          title: z.string().optional(),
          subtitle: z.string().optional(),
        })).optional().describe('Quick section definitions. For full control, use yaml parameter.'),
      }),
    },
    async ({ name, route, layout, title, yaml, sections }) => {
      if (options.readOnly) {
        return {
          content: [{ type: 'text' as const, text: 'Server is in read-only mode.' }],
          isError: true,
        };
      }

      try {
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
          return {
            content: [{ type: 'text' as const, text: `Invalid page name "${name}". Must be PascalCase.` }],
            isError: true,
          };
        }

        const fileName = name.charAt(0).toLowerCase() + name.slice(1);
        const filePath = join(ctx.specsDir, 'pages', `${fileName}.page.yaml`);

        if (existsSync(filePath)) {
          return {
            content: [{ type: 'text' as const, text: `Page spec already exists: ${filePath}` }],
            isError: true,
          };
        }

        let content: string;
        if (yaml) {
          content = yaml;
        } else {
          const lines: string[] = [
            `page: ${name}`,
            `route: ${route}`,
          ];
          if (layout) lines.push(`layout: ${layout}`);
          if (title) lines.push(`title: "${title}"`);

          if (sections && sections.length > 0) {
            lines.push('sections:');
            for (const section of sections) {
              lines.push(`  - type: ${section.type}`);
              if (section.title) lines.push(`    title: "${section.title}"`);
              if (section.subtitle) lines.push(`    subtitle: "${section.subtitle}"`);
            }
          }

          content = lines.join('\n') + '\n';
        }

        mkdirSync(join(ctx.specsDir, 'pages'), { recursive: true });
        writeFileSync(filePath, content, 'utf-8');

        const result = parsePageSpec(filePath);
        if (!result.success) {
          const errors = result.errors.map((e) => e.message).join('\n');
          return {
            content: [{
              type: 'text' as const,
              text: `Page created at ${filePath} but has validation errors:\n${errors}`,
            }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: `Page "${name}" created at ${filePath}.\nRun generate to produce the frontend code.`,
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
