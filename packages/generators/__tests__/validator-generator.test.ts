import { describe, it, expect } from 'vitest';
import { ValidatorGenerator } from '../src/validator/index.js';
import type { SpecModel, GeneratorContext } from '@kodeai/core';

const ctx: GeneratorContext = {
  specsDir: 'specs',
  outputDir: 'src/generated',
  extensionsDir: 'src/extensions',
  allSpecs: [],
};

describe('ValidatorGenerator', () => {
  it('generates CreateSchema with string constraints', async () => {
    const spec: SpecModel = {
      model: 'Product',
      fields: {
        id: { type: 'uuid', primary: true },
        name: { type: 'string', min: 1, max: 200 },
      },
    };
    const result = await ValidatorGenerator.generate([spec], ctx);
    const file = result.files.find((f) => f.path.includes('.validator.ts'))!;
    expect(file.content).toContain('CreateProductSchema');
    expect(file.content).toContain('z.string().min(1).max(200)');
  });

  it('generates integer validation with min/max', async () => {
    const spec: SpecModel = {
      model: 'Item',
      fields: {
        id: { type: 'uuid', primary: true },
        quantity: { type: 'integer', min: 0, max: 1000 },
      },
    };
    const result = await ValidatorGenerator.generate([spec], ctx);
    const file = result.files.find((f) => f.path.includes('.validator.ts'))!;
    expect(file.content).toContain('z.number().int().min(0).max(1000)');
  });

  it('generates decimal validation', async () => {
    const spec: SpecModel = {
      model: 'Product',
      fields: {
        id: { type: 'uuid', primary: true },
        price: { type: 'decimal', min: 0 },
      },
    };
    const result = await ValidatorGenerator.generate([spec], ctx);
    const file = result.files.find((f) => f.path.includes('.validator.ts'))!;
    expect(file.content).toContain('z.number().min(0)');
  });

  it('generates boolean validation', async () => {
    const spec: SpecModel = {
      model: 'Task',
      fields: {
        id: { type: 'uuid', primary: true },
        done: { type: 'boolean', default: false },
      },
    };
    const result = await ValidatorGenerator.generate([spec], ctx);
    const file = result.files.find((f) => f.path.includes('.validator.ts'))!;
    expect(file.content).toContain('z.boolean()');
    expect(file.content).toContain('.optional().default(false)');
  });

  it('generates email validation', async () => {
    const spec: SpecModel = {
      model: 'User',
      fields: {
        id: { type: 'uuid', primary: true },
        email: { type: 'email' },
      },
    };
    const result = await ValidatorGenerator.generate([spec], ctx);
    const file = result.files.find((f) => f.path.includes('.validator.ts'))!;
    expect(file.content).toContain('z.string().email()');
  });

  it('generates enum validation', async () => {
    const spec: SpecModel = {
      model: 'Task',
      fields: {
        id: { type: 'uuid', primary: true },
        priority: { type: 'enum', values: ['low', 'medium', 'high'], default: 'medium' },
      },
    };
    const result = await ValidatorGenerator.generate([spec], ctx);
    const file = result.files.find((f) => f.path.includes('.validator.ts'))!;
    expect(file.content).toContain("z.enum(['low', 'medium', 'high'])");
  });

  it('generates uuid validation', async () => {
    const spec: SpecModel = {
      model: 'Ref',
      fields: {
        id: { type: 'uuid', primary: true },
        parentId: { type: 'uuid' },
      },
    };
    const result = await ValidatorGenerator.generate([spec], ctx);
    const file = result.files.find((f) => f.path.includes('.validator.ts'))!;
    expect(file.content).toContain('z.string().uuid()');
  });

  it('generates date validation', async () => {
    const spec: SpecModel = {
      model: 'Event',
      fields: {
        id: { type: 'uuid', primary: true },
        startDate: { type: 'date' },
      },
    };
    const result = await ValidatorGenerator.generate([spec], ctx);
    const file = result.files.find((f) => f.path.includes('.validator.ts'))!;
    expect(file.content).toContain('z.coerce.date()');
  });

  it('generates UpdateSchema with all optional fields', async () => {
    const spec: SpecModel = {
      model: 'Product',
      fields: {
        id: { type: 'uuid', primary: true },
        name: { type: 'string' },
        price: { type: 'decimal' },
      },
    };
    const result = await ValidatorGenerator.generate([spec], ctx);
    const file = result.files.find((f) => f.path.includes('.validator.ts'))!;
    expect(file.content).toContain('UpdateProductSchema');
    // All fields should be optional in update
    const updateSection = file.content.split('UpdateProductSchema')[1]!;
    expect(updateSection).toContain('.optional()');
  });

  it('excludes primary key from Create/Update schemas', async () => {
    const spec: SpecModel = {
      model: 'Product',
      fields: {
        id: { type: 'uuid', primary: true },
        name: { type: 'string' },
      },
    };
    const result = await ValidatorGenerator.generate([spec], ctx);
    const file = result.files.find((f) => f.path.includes('.validator.ts'))!;
    const createSection = file.content.split('CreateProductSchema')[1]!.split('UpdateProductSchema')[0]!;
    expect(createSection).not.toContain('id:');
  });

  it('generates ListQuerySchema with sortable fields', async () => {
    const spec: SpecModel = {
      model: 'Product',
      fields: {
        id: { type: 'uuid', primary: true },
        name: { type: 'string' },
      },
      api: { sortable: ['name', 'createdAt'] },
    };
    const result = await ValidatorGenerator.generate([spec], ctx);
    const file = result.files.find((f) => f.path.includes('.validator.ts'))!;
    expect(file.content).toContain("z.enum(['name', 'createdAt'])");
    expect(file.content).toContain('ProductListQuerySchema');
  });

  it('generates type exports', async () => {
    const spec: SpecModel = {
      model: 'Product',
      fields: { id: { type: 'uuid', primary: true }, name: { type: 'string' } },
    };
    const result = await ValidatorGenerator.generate([spec], ctx);
    const file = result.files.find((f) => f.path.includes('.validator.ts'))!;
    expect(file.content).toContain('export type CreateProductInput');
    expect(file.content).toContain('export type UpdateProductInput');
    expect(file.content).toContain('export type ProductListQuery');
    expect(file.content).toContain('z.infer<typeof CreateProductSchema>');
  });

  it('generates index file', async () => {
    const spec: SpecModel = {
      model: 'Product',
      fields: { id: { type: 'uuid', primary: true } },
    };
    const result = await ValidatorGenerator.generate([spec], ctx);
    const index = result.files.find((f) => f.path.endsWith('validators/index.ts'))!;
    expect(index.content).toContain("from './product.validator.js'");
  });
});
