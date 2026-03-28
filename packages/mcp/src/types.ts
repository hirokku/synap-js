import type { SpecModel, SpecPage, ParseError, ResolveResult } from '@synap-js/core';

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
  loadPageSpecs(): { pages: SpecPage[]; errors: ParseError[] };
  resolveSpecs(): ResolveResult;
  getSeedFiles(): string[];
}

export interface ToolOptions {
  readOnly: boolean;
}
