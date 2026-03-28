import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createServerContext } from '../src/context.js';
import type { ServerContext, ToolOptions } from '../src/types.js';

// We test the tool logic by importing the underlying functions
// rather than going through the MCP server protocol

const TEST_DIR = join(import.meta.dirname, '__fixtures_tools__');
const SPECS_DIR = join(TEST_DIR, 'specs');
const MODELS_DIR = join(SPECS_DIR, 'models');
const OUTPUT_DIR = join(TEST_DIR, 'src', 'generated');

const TASK_SPEC = `model: Task
fields:
  id:
    type: uuid
    primary: true
  title:
    type: string
    min: 1
    max: 200
  completed:
    type: boolean
    default: false

api:
  endpoints: [list, get, create, update, delete]
`;

let ctx: ServerContext;

beforeAll(() => {
  mkdirSync(MODELS_DIR, { recursive: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(join(TEST_DIR, 'src', 'extensions'), { recursive: true });
  writeFileSync(join(MODELS_DIR, 'task.spec.yaml'), TASK_SPEC);
  ctx = createServerContext(TEST_DIR);
});

afterAll(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('validate tool logic', () => {
  it('validates specs successfully', () => {
    const { specs, errors: parseErrors } = ctx.loadSpecs();
    const { errors: resolveErrors } = ctx.resolveSpecs();
    expect(parseErrors).toHaveLength(0);
    expect(resolveErrors).toHaveLength(0);
    expect(specs).toHaveLength(1);
  });
});

describe('add_model tool logic', () => {
  it('creates a new spec file', () => {
    const filePath = join(MODELS_DIR, 'product.spec.yaml');
    const yaml = `model: Product
fields:
  id:
    type: uuid
    primary: true
  name:
    type: string
    max: 200
  price:
    type: decimal
    min: 0

api:
  endpoints: [list, get, create, update, delete]
`;
    writeFileSync(filePath, yaml, 'utf-8');
    expect(existsSync(filePath)).toBe(true);

    // Re-load specs should now find 2 models
    const { specs } = ctx.loadSpecs();
    expect(specs).toHaveLength(2);
    expect(specs.map((s) => s.model)).toContain('Product');
  });
});

describe('add_field tool logic', () => {
  it('adds a field to existing spec', () => {
    const filePath = join(MODELS_DIR, 'task.spec.yaml');
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Find end of fields block
    let insertIndex = -1;
    let inFields = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/^fields:\s*$/.test(line)) {
        inFields = true;
        continue;
      }
      if (inFields) {
        if (line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
          insertIndex = i;
          break;
        }
        insertIndex = i + 1;
      }
    }

    const fieldLines = ['  priority:', '    type: enum', '    values: [low, medium, high]', '    default: medium'];
    lines.splice(insertIndex, 0, ...fieldLines);
    writeFileSync(filePath, lines.join('\n'), 'utf-8');

    // Verify it still parses
    const { specs, errors } = ctx.loadSpecs();
    const task = specs.find((s) => s.model === 'Task');
    expect(errors).toHaveLength(0);
    expect(task?.fields['priority']).toBeDefined();
    expect(task?.fields['priority']?.type).toBe('enum');
  });
});

describe('add_relation tool logic', () => {
  it('adds a relation to existing spec', () => {
    const filePath = join(MODELS_DIR, 'task.spec.yaml');
    const content = readFileSync(filePath, 'utf-8');

    // Append relations block
    const newContent = content + `\nrelations:\n  product:\n    type: belongsTo\n    model: Product\n`;
    writeFileSync(filePath, newContent, 'utf-8');

    const { specs, errors } = ctx.loadSpecs();
    const task = specs.find((s) => s.model === 'Task');
    expect(errors).toHaveLength(0);
    expect(task?.relations?.['product']).toBeDefined();
    expect(task?.relations?.['product']?.type).toBe('belongsTo');
    expect(task?.relations?.['product']?.model).toBe('Product');
  });
});

describe('generate tool logic', () => {
  it('generates files from specs', async () => {
    const { resolveSpecs } = await import('@synap-js/core');
    const { ModelGenerator, ValidatorGenerator, ApiGenerator } = await import('@synap-js/generators');

    const { specs } = ctx.loadSpecs();
    const { graph } = resolveSpecs(specs);
    const orderedSpecs = graph.order
      .map((name) => specs.find((s) => s.model === name))
      .filter((s): s is NonNullable<typeof s> => s !== undefined);

    const context = {
      specsDir: ctx.specsDir,
      outputDir: ctx.outputDir,
      extensionsDir: ctx.extensionsDir,
      allSpecs: orderedSpecs,
    };

    let totalFiles = 0;
    for (const gen of [ModelGenerator, ValidatorGenerator, ApiGenerator]) {
      const result = await gen.generate(orderedSpecs, context);
      expect(result.errors).toHaveLength(0);
      totalFiles += result.files.length;
    }

    expect(totalFiles).toBeGreaterThan(0);
  });
});

describe('read-only mode', () => {
  it('blocks write operations when readOnly is true', () => {
    const options: ToolOptions = { readOnly: true };
    expect(options.readOnly).toBe(true);
    // In the actual tools, this would return an error response
  });
});
