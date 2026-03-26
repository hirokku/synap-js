import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ModelSpecSchema, VALID_FIELD_TYPES } from '../schemas/model.schema.js';
import type { SpecModel } from '../types/spec.js';
import type { ZodError } from 'zod';

export interface ParseError {
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
}

export interface ParseResult {
  success: boolean;
  spec?: SpecModel;
  errors: ParseError[];
}

function formatZodErrors(zodError: ZodError, filePath: string): ParseError[] {
  return zodError.issues.map((issue) => {
    const path = issue.path.join('.');
    const error: ParseError = {
      file: filePath,
      message: `${path}: ${issue.message}`,
    };

    if (issue.code === 'invalid_enum_value' && path.endsWith('.type')) {
      error.suggestion = `Valid types: ${VALID_FIELD_TYPES.join(', ')}`;
    }

    return error;
  });
}

export function parseSpec(filePath: string): ParseResult {
  const absolutePath = resolve(filePath);

  let raw: string;
  try {
    raw = readFileSync(absolutePath, 'utf-8');
  } catch {
    return {
      success: false,
      errors: [{ file: filePath, message: `File not found: ${absolutePath}` }],
    };
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid YAML syntax';
    return {
      success: false,
      errors: [{ file: filePath, message: `YAML parse error: ${message}` }],
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      success: false,
      errors: [{ file: filePath, message: 'Spec file is empty or not an object' }],
    };
  }

  const result = ModelSpecSchema.safeParse(parsed);

  if (!result.success) {
    return {
      success: false,
      errors: formatZodErrors(result.error, filePath),
    };
  }

  const spec = result.data as unknown as SpecModel;
  return { success: true, spec, errors: [] };
}

export function parseAllSpecs(specsDir: string): {
  specs: SpecModel[];
  errors: ParseError[];
} {
  const absoluteDir = resolve(specsDir);
  const specs: SpecModel[] = [];
  const errors: ParseError[] = [];

  const modelsDir = join(absoluteDir, 'models');

  let files: string[];
  try {
    files = readdirSync(modelsDir).filter((f) => f.endsWith('.spec.yaml'));
  } catch {
    return { specs: [], errors: [{ file: modelsDir, message: `Directory not found: ${modelsDir}` }] };
  }

  for (const file of files) {
    const filePath = join(modelsDir, file);
    if (!statSync(filePath).isFile()) continue;

    const result = parseSpec(filePath);
    if (result.success && result.spec) {
      specs.push(result.spec);
    } else {
      errors.push(...result.errors);
    }
  }

  return { specs, errors };
}
