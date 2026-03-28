import type { Generator, GeneratorContext, GeneratorResult } from '@synap-js/core';
import type { SpecModel } from '@synap-js/core';

const GENERATOR_NAME = 'ui';

export const UiGenerator: Generator = {
  name: GENERATOR_NAME,
  async generate(_specs: SpecModel[], _context: GeneratorContext): Promise<GeneratorResult> {
    // TODO: Implement in Phase 8
    return { files: [], errors: [], warnings: [] };
  },
};
