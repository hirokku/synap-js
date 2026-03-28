/**
 * Plugin interfaces for the Synap framework.
 */

import type { Generator, GeneratedFile, GeneratorError } from './generator.js';
import type { Spec } from './spec.js';

export interface GeneratorPlugin {
  name: string;
  version: string;
  specTypes: string[];
  generate(specs: Spec[], context: unknown): Promise<GeneratedFile[]>;
  validate?(specs: Spec[]): Promise<GeneratorError[]>;
}

export interface RuntimePluginServices {
  [key: string]: () => unknown;
}

export interface RuntimePlugin {
  name: string;
  version: string;
  middleware?: (app: unknown) => void;
  services?: RuntimePluginServices;
  hooks?: Record<string, (...args: unknown[]) => Promise<void>>;
  mcp?: {
    resources?: Record<string, () => Promise<unknown>>;
    tools?: Record<string, (...args: unknown[]) => Promise<unknown>>;
  };
}

export interface SpecPlugin {
  name: string;
  version: string;
  specSchema: Record<string, unknown>;
  generate(spec: unknown, context: unknown): Promise<GeneratedFile[]>;
}

export type Plugin = GeneratorPlugin | RuntimePlugin | SpecPlugin;
