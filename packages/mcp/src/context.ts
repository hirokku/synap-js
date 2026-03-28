import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { parseAllSpecs, resolveSpecs } from '@synap-js/core';
import type { ServerContext } from './types.js';

export function resolveProjectRoot(startDir?: string): string {
  let dir = resolve(startDir ?? process.cwd());
  const root = dirname(dir) === dir ? dir : '/';

  while (dir !== root) {
    if (existsSync(join(dir, 'specs', 'models'))) {
      return dir;
    }
    if (existsSync(join(dir, 'synap.config.ts'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // Check the last directory (root)
  if (existsSync(join(dir, 'specs', 'models'))) {
    return dir;
  }

  throw new Error(
    'Could not find a Synap project. Make sure you are inside a project directory with a specs/models/ folder, or pass --project-root.',
  );
}

export function createServerContext(projectRoot: string): ServerContext {
  const specsDir = join(projectRoot, 'specs');
  const outputDir = join(projectRoot, 'src', 'generated');
  const extensionsDir = join(projectRoot, 'src', 'extensions');

  return {
    projectRoot,
    specsDir,
    outputDir,
    extensionsDir,

    loadSpecs() {
      return parseAllSpecs(specsDir);
    },

    resolveSpecs() {
      const { specs } = parseAllSpecs(specsDir);
      return resolveSpecs(specs);
    },
  };
}
