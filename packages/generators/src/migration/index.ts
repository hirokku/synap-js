import type { Generator, GeneratorContext, GeneratorResult, GeneratedFile } from '@kodeai/core';
import type { SpecModel } from '@kodeai/core';
import { generatedHeader } from '../utils/naming.js';

export const MigrationGenerator: Generator = {
  name: 'migration',

  async generate(_specs: SpecModel[], context: GeneratorContext): Promise<GeneratorResult> {
    const files: GeneratedFile[] = [];
    files.push(generateDbFile(context));
    return { files, errors: [], warnings: [] };
  },
};

function generateDbFile(context: GeneratorContext): GeneratedFile {
  const content = `${generatedHeader('kodeai.config.ts')}import { drizzle } from 'drizzle-orm/node-postgres';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/kodeai';

export const db = drizzle(connectionString);
`;

  return { path: `${context.outputDir}/db.ts`, content };
}
