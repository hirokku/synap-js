import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from '../types.js';
import { registerManifestResource } from './manifest.js';
import { registerModelsResources } from './models.js';
import { registerRoutesResource } from './routes.js';
import { registerExtensionsResource } from './extensions.js';
import { registerErrorsResource } from './errors.js';
import { registerConfigResource } from './config.js';
import { registerPagesResource } from './pages.js';
import { registerGuidelinesResource } from './guidelines.js';
import { registerPatternsResource } from './patterns.js';
import { registerCompletenessResource } from './completeness.js';

export function registerAllResources(server: McpServer, ctx: ServerContext): void {
  registerGuidelinesResource(server, ctx);
  registerPatternsResource(server, ctx);
  registerManifestResource(server, ctx);
  registerCompletenessResource(server, ctx);
  registerModelsResources(server, ctx);
  registerPagesResource(server, ctx);
  registerRoutesResource(server, ctx);
  registerExtensionsResource(server, ctx);
  registerErrorsResource(server, ctx);
  registerConfigResource(server, ctx);
}
