import type { Generator, GeneratorContext, GeneratorResult } from '@synap-js/core';
import type { SpecModel } from '@synap-js/core';
import { generateBaseComponents } from './base-components.js';
import { generateAppEntry } from './app-entry.js';
import { generateLayouts } from './layouts.js';
import { generateHooks } from './hooks.js';
import { generateModelComponents } from './model-components.js';
import { generateSectionComponents } from './section-components.js';
import { generatePages } from './pages.js';
import { generateRouter } from './router.js';
import { generateAuthComponents } from './auth-components.js';

export const UiGenerator: Generator = {
  name: 'ui',
  async generate(specs: SpecModel[], context: GeneratorContext): Promise<GeneratorResult> {
    const files = [
      ...generateBaseComponents(context),
      ...generateLayouts(context),
      ...generateAuthComponents(context),
      ...generateHooks(specs, context),
      ...generateModelComponents(specs, context),
      ...generateSectionComponents(context),
      ...generatePages(specs, context),
      ...generateRouter(specs, context),
      ...generateAppEntry(context),
    ];

    return { files, errors: [], warnings: [] };
  },
};
