import type { SpecModel, ParseError, ResolveError } from '@synap-js/core';

export function formatManifest(specs: SpecModel[]): string {
  const modelCount = specs.length;
  const fieldCount = specs.reduce((sum, s) => sum + Object.keys(s.fields).length, 0);
  const relationCount = specs.reduce((sum, s) => sum + Object.keys(s.relations ?? {}).length, 0);
  const endpointCount = specs.reduce((sum, s) => sum + (s.api?.endpoints?.length ?? 0), 0);

  const lines = [
    `Synap Project`,
    `Models: ${modelCount} | Fields: ${fieldCount} | Relations: ${relationCount} | Endpoints: ${endpointCount}`,
    '',
    'Models:',
    ...specs.map((s) => {
      const fields = Object.keys(s.fields).length;
      const rels = Object.keys(s.relations ?? {}).length;
      const endpoints = s.api?.endpoints?.join(', ') ?? 'none';
      return `  ${s.model} (${fields} fields${rels > 0 ? `, ${rels} relations` : ''}) — endpoints: ${endpoints}`;
    }),
  ];

  return lines.join('\n');
}

export function formatModelList(specs: SpecModel[]): string {
  if (specs.length === 0) return 'No models defined.';

  return specs
    .map((s) => {
      const fieldNames = Object.keys(s.fields).join(', ');
      const rels = Object.entries(s.relations ?? {})
        .map(([name, rel]) => `${name} (${rel.type} ${rel.model})`)
        .join(', ');
      return [
        `## ${s.model}`,
        `Fields: ${fieldNames}`,
        rels ? `Relations: ${rels}` : null,
        s.api?.endpoints ? `Endpoints: ${s.api.endpoints.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');
}

export function formatModelDetail(spec: SpecModel): string {
  const lines: string[] = [`# ${spec.model}`];

  if (spec.description) lines.push(spec.description);
  if (spec.table) lines.push(`Table: ${spec.table}`);
  lines.push(`Timestamps: ${spec.timestamps !== false ? 'yes' : 'no'}`);
  if (spec.softDelete) lines.push('Soft delete: yes');

  lines.push('', '## Fields');
  for (const [name, field] of Object.entries(spec.fields)) {
    const attrs: string[] = [field.type];
    if (field.primary) attrs.push('primary');
    if (field.required) attrs.push('required');
    if (field.unique) attrs.push('unique');
    if (field.nullable) attrs.push('nullable');
    if (field.index) attrs.push('indexed');
    if (field.immutable) attrs.push('immutable');
    if (field.hidden) attrs.push('hidden');
    if (field.min !== undefined) attrs.push(`min:${field.min}`);
    if (field.max !== undefined) attrs.push(`max:${field.max}`);
    if (field.default !== undefined) attrs.push(`default:${field.default}`);
    if (field.values) attrs.push(`values:[${field.values.join(',')}]`);
    if (field.auto) attrs.push(`auto:${field.auto}`);
    lines.push(`  ${name}: ${attrs.join(', ')}`);
  }

  if (spec.relations && Object.keys(spec.relations).length > 0) {
    lines.push('', '## Relations');
    for (const [name, rel] of Object.entries(spec.relations)) {
      const attrs = [`${rel.type} ${rel.model}`];
      if (rel.foreignKey) attrs.push(`fk:${rel.foreignKey}`);
      if (rel.onDelete) attrs.push(`onDelete:${rel.onDelete}`);
      lines.push(`  ${name}: ${attrs.join(', ')}`);
    }
  }

  if (spec.api) {
    lines.push('', '## API');
    if (spec.api.endpoints) lines.push(`Endpoints: ${spec.api.endpoints.join(', ')}`);
    if (spec.api.auth) {
      const authEntries = Object.entries(spec.api.auth)
        .map(([op, level]) => `${op}:${level}`)
        .join(', ');
      lines.push(`Auth: ${authEntries}`);
    }
    if (spec.api.pagination) {
      lines.push(`Pagination: default=${spec.api.pagination.defaultLimit ?? 20}, max=${spec.api.pagination.maxLimit ?? 100}`);
    }
    if (spec.api.sortable) lines.push(`Sortable: ${spec.api.sortable.join(', ')}`);
  }

  return lines.join('\n');
}

export function formatRoutes(specs: SpecModel[]): string {
  const lines: string[] = ['# API Routes', ''];

  const apiSpecs = specs.filter((s) => s.api?.endpoints?.length);
  if (apiSpecs.length === 0) return 'No API routes defined.';

  for (const spec of apiSpecs) {
    const name = spec.model.toLowerCase() + 's';
    const endpoints = spec.api!.endpoints!;
    const auth = spec.api!.auth;

    lines.push(`## ${spec.model}`);
    for (const ep of endpoints) {
      const authLevel = auth?.[ep as keyof typeof auth] ?? 'public';
      switch (ep) {
        case 'list':
          lines.push(`  GET    /api/${name}        [${authLevel}]`);
          break;
        case 'get':
          lines.push(`  GET    /api/${name}/:id    [${authLevel}]`);
          break;
        case 'create':
          lines.push(`  POST   /api/${name}        [${authLevel}]`);
          break;
        case 'update':
          lines.push(`  PUT    /api/${name}/:id    [${authLevel}]`);
          break;
        case 'delete':
          lines.push(`  DELETE /api/${name}/:id    [${authLevel}]`);
          break;
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatErrors(parseErrors: ParseError[], resolveErrors: ResolveError[]): string {
  if (parseErrors.length === 0 && resolveErrors.length === 0) {
    return 'All specs valid. No errors found.';
  }

  const lines: string[] = [];

  if (parseErrors.length > 0) {
    lines.push('## Parse Errors');
    for (const err of parseErrors) {
      lines.push(`  ${err.file}: ${err.message}`);
      if (err.suggestion) lines.push(`    Suggestion: ${err.suggestion}`);
    }
  }

  if (resolveErrors.length > 0) {
    lines.push('## Resolution Errors');
    for (const err of resolveErrors) {
      lines.push(`  [${err.code}] ${err.message}`);
    }
  }

  return lines.join('\n');
}

export function formatConfig(projectRoot: string): string {
  return [
    '# Project Configuration',
    `Root: ${projectRoot}`,
    `Specs: specs/`,
    `Output: src/generated/`,
    `Extensions: src/extensions/`,
  ].join('\n');
}
