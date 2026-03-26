import type { Generator, GeneratorContext, GeneratorResult } from '@kodeai/core';
import type { SpecModel } from '@kodeai/core';

const GENERATOR_NAME = 'test';

export const TestGenerator: Generator = {
  name: GENERATOR_NAME,
  async generate(_specs: SpecModel[], _context: GeneratorContext): Promise<GeneratorResult> {
    // TODO: Implement in Phase 7
    return { files: [], errors: [], warnings: [] };
  },
};
