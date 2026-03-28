import { describe, it, expect } from 'vitest';
import type { SpecModel, SpecField, SynapConfig } from '../src/index.js';
import { defineConfig, resolveSpecs, parseSpec } from '../src/index.js';

describe('@synap-js/core types', () => {
  it('SpecModel is structurally valid', () => {
    const spec: SpecModel = {
      model: 'Product',
      fields: {
        id: { type: 'uuid', primary: true },
        name: { type: 'string', min: 1, max: 200 },
        price: { type: 'decimal', precision: 10, scale: 2, min: 0 },
        active: { type: 'boolean', default: true },
      },
      timestamps: true,
    };
    expect(spec.model).toBe('Product');
    expect(Object.keys(spec.fields)).toHaveLength(4);
  });

  it('SpecField supports all field types', () => {
    const fields: Record<string, SpecField> = {
      str: { type: 'string' },
      txt: { type: 'text' },
      int: { type: 'integer' },
      dec: { type: 'decimal' },
      bool: { type: 'boolean' },
      dt: { type: 'date' },
      ts: { type: 'timestamp' },
      uid: { type: 'uuid' },
      js: { type: 'json' },
      en: { type: 'enum', values: ['a', 'b'] },
      em: { type: 'email' },
      ur: { type: 'url' },
      sl: { type: 'slug', from: 'name' },
      pw: { type: 'password', min: 8, hidden: true },
      fl: { type: 'file' },
    };
    expect(Object.keys(fields)).toHaveLength(15);
  });

  it('defineConfig returns the config', () => {
    const config: SynapConfig = defineConfig({
      database: {
        provider: 'postgresql',
        url: 'postgresql://localhost/test',
      },
    });
    expect(config.database.provider).toBe('postgresql');
  });

  it('resolveSpecs returns empty result for empty input', () => {
    const result = resolveSpecs([]);
    expect(result.errors).toHaveLength(0);
    expect(result.graph.nodes).toHaveLength(0);
  });

  it('parseSpec returns not-implemented error', async () => {
    const result = await parseSpec('test.spec.yaml');
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});
