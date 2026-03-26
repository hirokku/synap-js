import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { parseSpec, parseAllSpecs } from '../src/parser/index.js';
import { resolveSpecs } from '../src/resolver/index.js';

const TEST_DIR = join(import.meta.dirname, '__fixtures__');
const SPECS_DIR = join(TEST_DIR, 'specs');
const MODELS_DIR = join(SPECS_DIR, 'models');

beforeAll(() => {
  mkdirSync(MODELS_DIR, { recursive: true });

  writeFileSync(join(MODELS_DIR, 'user.spec.yaml'), `
model: User
fields:
  id:
    type: uuid
    primary: true
  email:
    type: email
    unique: true
  name:
    type: string
    min: 2
    max: 100
  role:
    type: enum
    values: [admin, user]
    default: user
relations:
  posts:
    type: hasMany
    model: Post
    foreignKey: authorId
api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public
    create: authenticated
    delete: admin
`);

  writeFileSync(join(MODELS_DIR, 'post.spec.yaml'), `
model: Post
fields:
  id:
    type: uuid
    primary: true
  title:
    type: string
    max: 200
  content:
    type: text
  published:
    type: boolean
    default: false
relations:
  author:
    type: belongsTo
    model: User
    foreignKey: authorId
`);

  writeFileSync(join(MODELS_DIR, 'invalid.spec.yaml'), `
model: product
fields:
  name:
    type: money
`);
});

afterAll(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('parseSpec', () => {
  it('parses a valid model spec', () => {
    const result = parseSpec(join(MODELS_DIR, 'user.spec.yaml'));
    expect(result.success).toBe(true);
    expect(result.spec?.model).toBe('User');
    expect(Object.keys(result.spec?.fields ?? {})).toContain('email');
  });

  it('rejects invalid field types', () => {
    const result = parseSpec(join(MODELS_DIR, 'invalid.spec.yaml'));
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.message.includes('type'))).toBe(true);
  });

  it('rejects non-PascalCase model names', () => {
    const result = parseSpec(join(MODELS_DIR, 'invalid.spec.yaml'));
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.message.includes('PascalCase'))).toBe(true);
  });

  it('returns error for non-existent file', () => {
    const result = parseSpec('/nonexistent/path.spec.yaml');
    expect(result.success).toBe(false);
    expect(result.errors[0]?.message).toContain('File not found');
  });
});

describe('parseAllSpecs', () => {
  it('parses all valid specs from a directory', () => {
    const { specs, errors } = parseAllSpecs(SPECS_DIR);
    // 2 valid (user, post) + 1 invalid
    expect(specs.length).toBe(2);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns error for non-existent directory', () => {
    const { specs, errors } = parseAllSpecs('/nonexistent');
    expect(specs).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });
});

describe('resolveSpecs', () => {
  it('resolves valid model dependencies', () => {
    const { specs } = parseAllSpecs(SPECS_DIR);
    const result = resolveSpecs(specs);
    expect(result.errors).toHaveLength(0);
    expect(result.graph.order).toContain('User');
    expect(result.graph.order).toContain('Post');
    // User should come before Post (Post belongsTo User)
    const userIdx = result.graph.order.indexOf('User');
    const postIdx = result.graph.order.indexOf('Post');
    expect(userIdx).toBeLessThan(postIdx);
  });

  it('detects references to non-existent models', () => {
    const result = resolveSpecs([
      {
        model: 'Order',
        fields: { id: { type: 'uuid', primary: true } },
        relations: {
          customer: { type: 'belongsTo', model: 'Customer' },
        },
      },
    ]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe('UNKNOWN_RELATION_MODEL');
  });
});
