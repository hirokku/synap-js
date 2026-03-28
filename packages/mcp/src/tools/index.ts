import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext, ToolOptions } from '../types.js';
import { registerValidateTool } from './validate.js';
import { registerGenerateTool } from './generate.js';
import { registerAddModelTool } from './add-model.js';
import { registerAddFieldTool } from './add-field.js';
import { registerAddRelationTool } from './add-relation.js';
import { registerInspectTool } from './inspect.js';
import { registerAddPageTool } from './add-page.js';
import { registerAddSectionTool } from './add-section.js';
import { registerSeedDataTool } from './seed-data.js';

export function registerAllTools(server: McpServer, ctx: ServerContext, options: ToolOptions): void {
  registerValidateTool(server, ctx);
  registerGenerateTool(server, ctx, options);
  registerAddModelTool(server, ctx, options);
  registerAddFieldTool(server, ctx, options);
  registerAddRelationTool(server, ctx, options);
  registerAddPageTool(server, ctx, options);
  registerAddSectionTool(server, ctx, options);
  registerSeedDataTool(server, ctx, options);
  registerInspectTool(server, ctx);
}
