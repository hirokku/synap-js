import { generateText, tool, stepCountIs } from 'ai';
import type { LanguageModel } from 'ai';
import { z } from 'zod';
import { join } from 'node:path';
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseSpec, parseAllSpecs, resolveSpecs } from '@synap-js/core';
import type { GeneratorContext } from '@synap-js/core';
import { ModelGenerator, ValidatorGenerator, ApiGenerator, MigrationGenerator } from '@synap-js/generators';

export interface AiConfig {
  provider: string;
  model: string;
  apiKey: string;
}

export function detectAiConfig(): AiConfig | null {
  const provider = process.env['AI_PROVIDER'];
  const model = process.env['AI_MODEL'];

  if (!provider) return null;

  const keyMap: Record<string, string> = {
    claude: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    gemini: 'GOOGLE_GENERATIVE_AI_API_KEY',
  };

  const envKey = keyMap[provider];
  const apiKey = envKey ? process.env[envKey] : undefined;

  if (!apiKey) return null;

  return { provider, model: model ?? 'auto', apiKey };
}

export async function createModel(config: AiConfig): Promise<LanguageModel> {
  switch (config.provider) {
    case 'claude': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      const anthropic = createAnthropic({ apiKey: config.apiKey });
      return anthropic(config.model === 'auto' ? 'claude-sonnet-4-20250514' : config.model);
    }
    case 'openai': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const openai = createOpenAI({ apiKey: config.apiKey });
      return openai(config.model === 'auto' ? 'gpt-4o' : config.model);
    }
    case 'gemini': {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      const google = createGoogleGenerativeAI({ apiKey: config.apiKey });
      return google(config.model === 'auto' ? 'gemini-2.0-flash' : config.model);
    }
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}

export function buildTools(cwd: string) {
  const specsDir = join(cwd, 'specs');
  const outputDir = join(cwd, 'src', 'generated');
  const extensionsDir = join(cwd, 'src', 'extensions');

  return {
    validate: tool({
      description: 'Validate all YAML specs in the project. Returns errors or success message.',
      inputSchema: z.object({}),
      execute: async () => {
        const { specs, errors: parseErrors } = parseAllSpecs(specsDir);
        const { errors: resolveErrors } = resolveSpecs(specs);

        if (parseErrors.length === 0 && resolveErrors.length === 0) {
          return { success: true, message: `All specs valid. ${specs.length} model(s).` };
        }
        return {
          success: false,
          parseErrors: parseErrors.map((e) => e.message),
          resolveErrors: resolveErrors.map((e) => e.message),
        };
      },
    }),

    generate: tool({
      description: 'Generate TypeScript code from specs (types, schemas, validators, API routes). Run after adding or modifying models.',
      inputSchema: z.object({
        target: z.enum(['models', 'api', 'all']).optional().describe('What to generate. Defaults to all.'),
      }),
      execute: async ({ target }) => {
        const { specs, errors: parseErrors } = parseAllSpecs(specsDir);
        if (parseErrors.length > 0) {
          return { success: false, errors: parseErrors.map((e) => e.message) };
        }

        const { graph, errors: resolveErrors } = resolveSpecs(specs);
        if (resolveErrors.length > 0) {
          return { success: false, errors: resolveErrors.map((e) => e.message) };
        }

        const orderedSpecs = graph.order
          .map((name) => specs.find((s) => s.model === name))
          .filter((s): s is NonNullable<typeof s> => s !== undefined);

        const context: GeneratorContext = { specsDir, outputDir, extensionsDir, allSpecs: orderedSpecs };
        const t = target ?? 'all';
        const generators = [];
        if (t === 'all' || t === 'models') generators.push(ModelGenerator, ValidatorGenerator);
        if (t === 'all' || t === 'api') generators.push(ApiGenerator);
        if (t === 'all') generators.push(MigrationGenerator);

        let totalFiles = 0;
        for (const gen of generators) {
          const result = await gen.generate(orderedSpecs, context);
          for (const file of result.files) {
            const fullPath = file.path.startsWith('/') ? file.path : join(cwd, file.path);
            mkdirSync(dirname(fullPath), { recursive: true });
            writeFileSync(fullPath, file.content, 'utf-8');
            totalFiles++;
          }
        }

        return { success: true, filesGenerated: totalFiles };
      },
    }),

    add_model: tool({
      description: 'Create a new model by writing a YAML spec file. After creating, call generate to produce code.',
      inputSchema: z.object({
        name: z.string().describe('PascalCase model name (e.g. Product, UserProfile)'),
        fields: z.record(z.object({
          type: z.string().describe('Field type: string, text, integer, decimal, boolean, uuid, enum, email, etc.'),
          primary: z.boolean().optional(),
          nullable: z.boolean().optional(),
          unique: z.boolean().optional(),
          default: z.unknown().optional(),
          min: z.number().optional(),
          max: z.number().optional(),
          values: z.array(z.string()).optional().describe('Required for enum type'),
        })).describe('Field definitions'),
        endpoints: z.array(z.string()).optional().describe('API endpoints. Defaults to all CRUD.'),
      }),
      execute: async ({ name, fields, endpoints }) => {
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
          return { success: false, error: `Invalid model name "${name}". Must be PascalCase.` };
        }

        const fileName = name.charAt(0).toLowerCase() + name.slice(1);
        const filePath = join(specsDir, 'models', `${fileName}.spec.yaml`);

        if (existsSync(filePath)) {
          return { success: false, error: `Model "${name}" already exists.` };
        }

        const lines: string[] = [`model: ${name}`, 'fields:'];
        for (const [fieldName, field] of Object.entries(fields)) {
          lines.push(`  ${fieldName}:`);
          lines.push(`    type: ${field.type}`);
          if (field.primary) lines.push('    primary: true');
          if (field.nullable) lines.push('    nullable: true');
          if (field.unique) lines.push('    unique: true');
          if (field.default !== undefined) lines.push(`    default: ${field.default}`);
          if (field.min !== undefined) lines.push(`    min: ${field.min}`);
          if (field.max !== undefined) lines.push(`    max: ${field.max}`);
          if (field.values) lines.push(`    values: [${field.values.join(', ')}]`);
        }

        const eps = endpoints ?? ['list', 'get', 'create', 'update', 'delete'];
        lines.push('', 'api:', `  endpoints: [${eps.join(', ')}]`);

        mkdirSync(join(specsDir, 'models'), { recursive: true });
        writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');

        const result = parseSpec(filePath);
        if (!result.success) {
          return { success: false, error: 'Validation failed', errors: result.errors.map((e) => e.message) };
        }

        return { success: true, message: `Model "${name}" created at ${filePath}` };
      },
    }),

    add_field: tool({
      description: 'Add a field to an existing model spec YAML file.',
      inputSchema: z.object({
        model: z.string().describe('Model name (e.g. Product)'),
        field: z.string().describe('Field name (e.g. price)'),
        type: z.string().describe('Field type'),
        nullable: z.boolean().optional(),
        unique: z.boolean().optional(),
        default: z.unknown().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        values: z.array(z.string()).optional(),
      }),
      execute: async ({ model, field, type, nullable, unique, default: defaultVal, min, max, values }) => {
        const filePath = findSpecFile(specsDir, model);
        if (!filePath) return { success: false, error: `Spec not found for "${model}".` };

        const content = readFileSync(filePath, 'utf-8');
        const fieldLines: string[] = [`  ${field}:`, `    type: ${type}`];
        if (nullable) fieldLines.push('    nullable: true');
        if (unique) fieldLines.push('    unique: true');
        if (defaultVal !== undefined) fieldLines.push(`    default: ${defaultVal}`);
        if (min !== undefined) fieldLines.push(`    min: ${min}`);
        if (max !== undefined) fieldLines.push(`    max: ${max}`);
        if (values) fieldLines.push(`    values: [${values.join(', ')}]`);

        const lines = content.split('\n');
        let insertIndex = -1;
        let inFields = false;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!;
          if (/^fields:\s*$/.test(line)) { inFields = true; continue; }
          if (inFields) {
            if (line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
              insertIndex = i; break;
            }
            insertIndex = i + 1;
          }
        }
        if (insertIndex === -1) return { success: false, error: 'Could not find fields block.' };

        lines.splice(insertIndex, 0, ...fieldLines);
        writeFileSync(filePath, lines.join('\n'), 'utf-8');

        return { success: true, message: `Field "${field}" added to "${model}".` };
      },
    }),

    add_relation: tool({
      description: 'Add a relation between two models in the source model spec.',
      inputSchema: z.object({
        from: z.string().describe('Source model (e.g. Post)'),
        to: z.string().describe('Target model (e.g. User)'),
        type: z.enum(['hasMany', 'belongsTo', 'hasOne', 'manyToMany']),
        name: z.string().optional().describe('Relation name. Defaults to lowercase target.'),
      }),
      execute: async ({ from, to, type: relType, name: relName }) => {
        const filePath = findSpecFile(specsDir, from);
        if (!filePath) return { success: false, error: `Spec not found for "${from}".` };

        const content = readFileSync(filePath, 'utf-8');
        const relationName = relName ?? to.charAt(0).toLowerCase() + to.slice(1);
        const relLines = [`  ${relationName}:`, `    type: ${relType}`, `    model: ${to}`];

        const lines = content.split('\n');
        const relationsIndex = lines.findIndex((l) => /^relations:\s*$/.test(l));

        if (relationsIndex === -1) {
          lines.push('', 'relations:', ...relLines);
        } else {
          let insertIndex = relationsIndex + 1;
          for (let i = relationsIndex + 1; i < lines.length; i++) {
            const line = lines[i]!;
            if (line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) { insertIndex = i; break; }
            insertIndex = i + 1;
          }
          lines.splice(insertIndex, 0, ...relLines);
        }

        writeFileSync(filePath, lines.join('\n'), 'utf-8');
        return { success: true, message: `Relation "${relationName}" (${relType} ${to}) added to "${from}".` };
      },
    }),

    inspect: tool({
      description: 'Inspect a model or the whole project. Returns detailed diagnostic info.',
      inputSchema: z.object({
        target: z.string().describe('Model name or "project"'),
      }),
      execute: async ({ target }) => {
        const { specs, errors } = parseAllSpecs(specsDir);
        if (target.toLowerCase() === 'project') {
          return { models: specs.map((s) => s.model), totalFields: specs.reduce((sum, s) => sum + Object.keys(s.fields).length, 0), errors: errors.length };
        }
        const spec = specs.find((s) => s.model.toLowerCase() === target.toLowerCase());
        if (!spec) return { error: `Model "${target}" not found. Available: ${specs.map((s) => s.model).join(', ')}` };
        return { model: spec.model, fields: Object.keys(spec.fields), relations: Object.keys(spec.relations ?? {}), endpoints: spec.api?.endpoints ?? [] };
      },
    }),
  };
}

export async function askAi(model: LanguageModel, tools: ReturnType<typeof buildTools>, prompt: string): Promise<string> {
  const systemPrompt = `You are Synap AI, an assistant for the Synap framework. You help developers create and manage their API by operating on YAML spec files.

When the user asks to create a model, add fields, or make changes:
1. Use the appropriate tools (add_model, add_field, add_relation)
2. After making changes, call generate to produce the code
3. Report what you did concisely

Always use the tools — never just describe what to do.`;

  const result = await generateText({
    model,
    tools,
    system: systemPrompt,
    stopWhen: stepCountIs(10),
    prompt,
  });

  return result.text || summarizeSteps(result.steps);
}

function summarizeSteps(steps: any[]): string {
  const actions: string[] = [];
  for (const step of steps) {
    if (step.toolCalls) {
      for (const call of step.toolCalls) {
        const result = step.toolResults?.find((r: any) => r.toolCallId === call.toolCallId);
        const resultText = result?.result?.message ?? result?.result?.success ? 'done' : 'error';
        actions.push(`${call.toolName}: ${resultText}`);
      }
    }
  }
  return actions.length > 0 ? actions.join('\n') : 'Done.';
}

function findSpecFile(specsDir: string, model: string): string | null {
  const modelsDir = join(specsDir, 'models');
  if (!existsSync(modelsDir)) return null;
  const files = readdirSync(modelsDir).filter((f) => f.endsWith('.spec.yaml'));
  const lowerModel = model.toLowerCase();
  const exact = files.find((f) => f.replace('.spec.yaml', '').toLowerCase() === lowerModel);
  return exact ? join(modelsDir, exact) : null;
}
