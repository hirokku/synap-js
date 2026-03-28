import { describe, it, expect } from 'vitest';
import { ModelGenerator, ApiGenerator, ValidatorGenerator } from '../src/index.js';
import type { SpecModel } from '@synap-js/core';

describe('@synap-js/generators', () => {
  const emptyContext = {
    specsDir: 'specs',
    outputDir: 'src/generated',
    extensionsDir: 'src/extensions',
    allSpecs: [],
  };

  const productSpec: SpecModel = {
    model: 'Product',
    fields: {
      id: { type: 'uuid', primary: true },
      name: { type: 'string', min: 1, max: 200 },
      price: { type: 'decimal', precision: 10, scale: 2, min: 0 },
      active: { type: 'boolean', default: true },
    },
    timestamps: true,
    api: {
      endpoints: ['list', 'get', 'create', 'update', 'delete'],
    },
  };

  it('ModelGenerator generates types and schema for a spec', async () => {
    const result = await ModelGenerator.generate([productSpec], emptyContext);
    expect(result.errors).toHaveLength(0);
    // types + schema + index = 3 files
    expect(result.files.length).toBe(3);
    const typesFile = result.files.find((f) => f.path.includes('.types.ts'));
    expect(typesFile?.content).toContain('export interface Product');
    expect(typesFile?.content).toContain('export interface CreateProductInput');
    const schemaFile = result.files.find((f) => f.path.includes('.schema.ts'));
    expect(schemaFile?.content).toContain("pgTable('products'");
  });

  it('ValidatorGenerator generates Zod schemas', async () => {
    const result = await ValidatorGenerator.generate([productSpec], emptyContext);
    expect(result.errors).toHaveLength(0);
    const validatorFile = result.files.find((f) => f.path.includes('.validator.ts'));
    expect(validatorFile?.content).toContain('CreateProductSchema');
    expect(validatorFile?.content).toContain('z.string().min(1).max(200)');
  });

  it('ApiGenerator generates controller and routes', async () => {
    const result = await ApiGenerator.generate([productSpec], emptyContext);
    expect(result.errors).toHaveLength(0);
    const controllerFile = result.files.find((f) => f.path.includes('.controller.ts'));
    expect(controllerFile?.content).toContain('async list');
    expect(controllerFile?.content).toContain('async create');
    expect(controllerFile?.content).toContain('async delete');
    const routesFile = result.files.find((f) => f.path.includes('.routes.ts'));
    expect(routesFile?.content).toContain("app.get('/products'");
  });

  it('ApiGenerator skips models without API config', async () => {
    const noApiSpec: SpecModel = {
      model: 'Setting',
      fields: { id: { type: 'uuid', primary: true }, key: { type: 'string' } },
    };
    const result = await ApiGenerator.generate([noApiSpec], emptyContext);
    expect(result.files).toHaveLength(0);
  });
});
