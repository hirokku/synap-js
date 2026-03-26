import type { Generator, GeneratorContext, GeneratorResult, GeneratedFile } from '@kodeai/core';
import type { SpecModel, SpecField } from '@kodeai/core';
import { generatedHeader, toKebabCase } from '../utils/naming.js';

export const ValidatorGenerator: Generator = {
  name: 'validator',

  async generate(specs: SpecModel[], context: GeneratorContext): Promise<GeneratorResult> {
    const files: GeneratedFile[] = [];

    for (const spec of specs) {
      files.push(generateValidator(spec, context));
    }

    files.push(generateValidatorIndex(specs, context));

    return { files, errors: [], warnings: [] };
  },
};

function fieldToZod(fieldName: string, field: SpecField): string {
  let chain: string;

  switch (field.type) {
    case 'string':
    case 'text':
    case 'email':
    case 'url':
    case 'slug':
    case 'password':
      chain = 'z.string()';
      if (field.min !== undefined) chain += `.min(${field.min})`;
      if (field.max !== undefined) chain += `.max(${field.max})`;
      if (field.type === 'email') chain += `.email()`;
      if (field.type === 'url') chain += `.url()`;
      if (field.pattern) chain += `.regex(/${field.pattern}/)`;
      break;
    case 'integer':
      chain = 'z.number().int()';
      if (field.min !== undefined) chain += `.min(${field.min})`;
      if (field.max !== undefined) chain += `.max(${field.max})`;
      break;
    case 'decimal':
      chain = 'z.number()';
      if (field.min !== undefined) chain += `.min(${field.min})`;
      if (field.max !== undefined) chain += `.max(${field.max})`;
      break;
    case 'boolean':
      chain = 'z.boolean()';
      break;
    case 'date':
    case 'timestamp':
      chain = 'z.coerce.date()';
      break;
    case 'uuid':
      chain = 'z.string().uuid()';
      break;
    case 'json':
      chain = 'z.record(z.unknown())';
      break;
    case 'enum':
      if (field.values && field.values.length > 0) {
        const vals = field.values.map((v) => `'${v}'`).join(', ');
        chain = `z.enum([${vals}])`;
      } else {
        chain = 'z.string()';
      }
      break;
    case 'file':
      chain = 'z.string()';
      break;
    default:
      chain = 'z.unknown()';
  }

  return chain;
}

function generateValidator(spec: SpecModel, context: GeneratorContext): GeneratedFile {
  const name = spec.model;
  const fileName = toKebabCase(name);
  const header = generatedHeader(`specs/models/${fileName}.spec.yaml`);

  // Create schema — exclude primary and auto fields
  const createFields = Object.entries(spec.fields)
    .filter(([, f]) => !f.primary && f.auto === undefined)
    .map(([fieldName, field]) => {
      let zodDef = fieldToZod(fieldName, field);
      const isOptional = field.default !== undefined || field.nullable;
      if (isOptional) {
        zodDef += '.optional()';
        if (field.default !== undefined && field.default !== null) {
          if (typeof field.default === 'string') zodDef += `.default('${field.default}')`;
          else zodDef += `.default(${field.default})`;
        }
      }
      return `  ${fieldName}: ${zodDef},`;
    })
    .join('\n');

  // Update schema — all optional
  const updateFields = Object.entries(spec.fields)
    .filter(([, f]) => !f.primary && f.auto === undefined && !f.immutable)
    .map(([fieldName, field]) => {
      const zodDef = fieldToZod(fieldName, field) + '.optional()';
      return `  ${fieldName}: ${zodDef},`;
    })
    .join('\n');

  // List query schema
  const sortableFields = spec.api?.sortable ?? Object.keys(spec.fields);
  const sortableEnum = sortableFields.map((f) => `'${f}'`).join(', ');

  const content = `${header}import { z } from 'zod';

export const Create${name}Schema = z.object({
${createFields}
});

export const Update${name}Schema = z.object({
${updateFields}
});

export const ${name}ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.enum([${sortableEnum}]).optional(),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type Create${name}Input = z.infer<typeof Create${name}Schema>;
export type Update${name}Input = z.infer<typeof Update${name}Schema>;
export type ${name}ListQuery = z.infer<typeof ${name}ListQuerySchema>;
`;

  return { path: `${context.outputDir}/validators/${fileName}.validator.ts`, content };
}

function generateValidatorIndex(specs: SpecModel[], context: GeneratorContext): GeneratedFile {
  const exports = specs.map((spec) => {
    const fileName = toKebabCase(spec.model);
    return `export * from './${fileName}.validator.js';`;
  }).join('\n');

  return {
    path: `${context.outputDir}/validators/index.ts`,
    content: generatedHeader('specs/models/') + exports + '\n',
  };
}
