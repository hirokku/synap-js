/**
 * Generator interfaces for the Synap framework.
 */

import type { SpecModel, SpecPage } from './spec.js';

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GeneratorContext {
  specsDir: string;
  outputDir: string;
  extensionsDir: string;
  allSpecs: SpecModel[];
  pageSpecs?: SpecPage[];
}

export interface GeneratorResult {
  files: GeneratedFile[];
  errors: GeneratorError[];
  warnings: string[];
}

export interface GeneratorError {
  code: string;
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface Generator {
  name: string;
  generate(specs: SpecModel[], context: GeneratorContext): Promise<GeneratorResult>;
  validate?(specs: SpecModel[]): Promise<GeneratorError[]>;
}
