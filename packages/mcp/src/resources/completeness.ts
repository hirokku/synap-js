import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from '../types.js';

export function registerCompletenessResource(server: McpServer, ctx: ServerContext): void {
  server.registerResource(
    'completeness',
    'project://completeness',
    {
      description: 'Project completeness analysis with score, warnings, and next steps',
      mimeType: 'text/plain',
    },
    async (uri) => {
      try {
        const { specs } = ctx.loadSpecs();
        const { pages } = ctx.loadPageSpecs();
        const seedFiles = ctx.getSeedFiles();
        const { errors: resolveErrors } = ctx.resolveSpecs();

        const warnings: string[] = [];
        const suggestions: string[] = [];
        let score = 0;
        const maxScore = 10;

        // 1. Has models? (+2)
        if (specs.length > 0) {
          score += 2;
        } else {
          warnings.push('No models defined');
          suggestions.push('Create models with add_model (read project://patterns for blueprints)');
        }

        // 2. Models have API endpoints? (+1)
        const modelsWithApi = specs.filter((s) => s.api?.endpoints?.length);
        if (modelsWithApi.length === specs.length && specs.length > 0) {
          score += 1;
        } else {
          const noApi = specs.filter((s) => !s.api?.endpoints?.length).map((s) => s.model);
          if (noApi.length > 0) {
            warnings.push(`Models without API: ${noApi.join(', ')}`);
            suggestions.push(`Add api.endpoints to: ${noApi.join(', ')}`);
          }
        }

        // 3. Models have UI config? (+1)
        const modelsWithUi = specs.filter((s) => s.ui?.components?.length);
        if (modelsWithUi.length === specs.length && specs.length > 0) {
          score += 1;
        } else {
          const noUi = specs.filter((s) => !s.ui?.components?.length).map((s) => s.model);
          if (noUi.length > 0) {
            warnings.push(`Models without UI components: ${noUi.join(', ')}`);
            suggestions.push(`Add ui.components: [table, form, detail] to: ${noUi.join(', ')}`);
          }
        }

        // 4. Has home page? (+1)
        const homePage = pages.find((p) => p.route === '/');
        if (homePage) {
          score += 1;
        } else {
          warnings.push('No home page (route: /) found');
          suggestions.push('Create a Home page with add_page: route /, layout marketing, with hero + features + cta sections');
        }

        // 5. Has admin/app page with auth? (+1)
        const appPages = pages.filter((p) => p.layout === 'app');
        const protectedPages = appPages.filter((p) => p.auth);
        if (appPages.length > 0 && protectedPages.length === appPages.length) {
          score += 1;
        } else if (appPages.length === 0) {
          warnings.push('No admin/app page found');
          suggestions.push('Create an Admin page: route /app, layout app, auth admin');
        } else {
          const unprotected = appPages.filter((p) => !p.auth).map((p) => p.page);
          if (unprotected.length > 0) {
            warnings.push(`App pages without auth: ${unprotected.join(', ')}`);
            suggestions.push(`Add auth: authenticated or auth: admin to pages: ${unprotected.join(', ')}`);
          }
        }

        // 6. Relations defined? (+1)
        const modelsWithRelations = specs.filter((s) => s.relations && Object.keys(s.relations).length > 0);
        if (modelsWithRelations.length > 0 || specs.length <= 1) {
          score += 1;
        } else {
          warnings.push('No relations between models');
          suggestions.push('Add relations with add_relation (belongsTo, hasMany, etc.)');
        }

        // 7. Seed data exists? (+1)
        const modelsWithSeeds = specs.filter((s) => seedFiles.includes(s.model.toLowerCase()));
        if (modelsWithSeeds.length === specs.length && specs.length > 0) {
          score += 1;
        } else {
          const noSeeds = specs.filter((s) => !seedFiles.includes(s.model.toLowerCase())).map((s) => s.model);
          if (noSeeds.length > 0) {
            warnings.push(`Models without seed data: ${noSeeds.join(', ')}`);
            suggestions.push(`Create seed data with seed_data tool for: ${noSeeds.join(', ')}`);
          }
        }

        // 8. No validation errors? (+1)
        if (resolveErrors.length === 0) {
          score += 1;
        } else {
          warnings.push(`${resolveErrors.length} resolution error(s)`);
          suggestions.push('Run validate to see and fix errors');
        }

        // Build output
        const lines: string[] = [
          `# Project Completeness: ${score}/${maxScore}`,
          '',
        ];

        if (warnings.length > 0) {
          lines.push('## Warnings');
          for (const w of warnings) lines.push(`  - ${w}`);
          lines.push('');
        }

        if (suggestions.length > 0) {
          lines.push('## Next Steps');
          for (let i = 0; i < suggestions.length; i++) {
            lines.push(`  ${i + 1}. ${suggestions[i]}`);
          }
          lines.push('');
        }

        if (score === maxScore) {
          lines.push('Project looks complete! Consider adding more models, pages, or seed data to enrich it.');
        }

        return { contents: [{ uri: uri.href, text: lines.join('\n') }] };
      } catch (err) {
        return { contents: [{ uri: uri.href, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );
}
