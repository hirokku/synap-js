/**
 * Generator interfaces for the Kodeai framework.
 */

import type { SpecModel } from './spec.js';

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GeneratorContext {
  specsDir: string;
  outputDir: string;
  extensionsDir: string;
  allSpecs: SpecModel[];
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
