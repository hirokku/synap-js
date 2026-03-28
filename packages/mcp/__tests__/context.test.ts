import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { resolveProjectRoot, createServerContext } from '../src/context.js';

const TEST_DIR = join(import.meta.dirname, '__fixtures_context__');
const PROJECT_DIR = join(TEST_DIR, 'my-project');
const NESTED_DIR = join(PROJECT_DIR, 'src', 'deep');

const VALID_SPEC = `model: Task
fields:
  id:
    type: uuid
    primary: true
  title:
    type: string
    min: 1
    max: 200
api:
  endpoints: [list, get, create, update, delete]
`;

beforeAll(() => {
  mkdirSync(join(PROJECT_DIR, 'specs', 'models'), { recursive: true });
  mkdirSync(NESTED_DIR, { recursive: true });
  writeFileSync(join(PROJECT_DIR, 'specs', 'models', 'task.spec.yaml'), VALID_SPEC);
});

afterAll(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('resolveProjectRoot', () => {
  it('finds project root from project directory', () => {
    const root = resolveProjectRoot(PROJECT_DIR);
    expect(root).toBe(PROJECT_DIR);
  });

  it('finds project root from nested directory', () => {
    const root = resolveProjectRoot(NESTED_DIR);
    expect(root).toBe(PROJECT_DIR);
  });

  it('throws when no project found', () => {
    expect(() => resolveProjectRoot('/tmp')).toThrow('Could not find a Synap project');
  });
});

describe('createServerContext', () => {
  it('creates context with correct paths', () => {
    const ctx = createServerContext(PROJECT_DIR);
    expect(ctx.projectRoot).toBe(PROJECT_DIR);
    expect(ctx.specsDir).toBe(join(PROJECT_DIR, 'specs'));
    expect(ctx.outputDir).toBe(join(PROJECT_DIR, 'src', 'generated'));
    expect(ctx.extensionsDir).toBe(join(PROJECT_DIR, 'src', 'extensions'));
  });

  it('loadSpecs returns parsed specs', () => {
    const ctx = createServerContext(PROJECT_DIR);
    const { specs, errors } = ctx.loadSpecs();
    expect(errors).toHaveLength(0);
    expect(specs).toHaveLength(1);
    expect(specs[0]!.model).toBe('Task');
  });

  it('resolveSpecs returns dependency graph', () => {
    const ctx = createServerContext(PROJECT_DIR);
    const result = ctx.resolveSpecs();
    expect(result.errors).toHaveLength(0);
    expect(result.graph.nodes).toContain('Task');
  });
});
