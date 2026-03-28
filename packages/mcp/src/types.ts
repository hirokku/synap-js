import type { SpecModel, ParseError, ResolveResult } from '@synap-js/core';

export interface McpServerOptions {
  mode: 'local' | 'remote';
  port?: number;
  readOnly?: boolean;
  authToken?: string;
  projectRoot?: string;
}

export interface ServerContext {
  readonly projectRoot: string;
  readonly specsDir: string;
  readonly outputDir: string;
  readonly extensionsDir: string;
  loadSpecs(): { specs: SpecModel[]; errors: ParseError[] };
  resolveSpecs(): ResolveResult;
}

export interface ToolOptions {
  readOnly: boolean;
}
