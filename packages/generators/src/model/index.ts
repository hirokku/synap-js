import type { Generator, GeneratorContext, GeneratorResult, GeneratedFile } from '@kodeai/core';
import type { SpecModel } from '@kodeai/core';
import { specTypeToTS, specTypeToDrizzle } from '../utils/type-map.js';
import { toSnakeCase, toTableName, generatedHeader, toKebabCase } from '../utils/naming.js';

export const ModelGenerator: Generator = {
  name: 'model',

  async generate(specs: SpecModel[], context: GeneratorContext): Promise<GeneratorResult> {
    const files: GeneratedFile[] = [];

    for (const spec of specs) {
      files.push(generateTypes(spec, context));
      files.push(generateSchema(spec, context));
    }

    files.push(generateIndex(specs, context));

    return { files, errors: [], warnings: [] };
  },
};

function generateTypes(spec: SpecModel, context: GeneratorContext): GeneratedFile {
  const name = spec.model;
  const fileName = toKebabCase(name);
  const header = generatedHeader(`specs/models/${fileName}.spec.yaml`);
  const fields = spec.fields;

  const baseFields = Object.entries(fields)
    .map(([fieldName, field]) => {
      const tsType = field.type === 'enum' && field.values
        ? field.values.map((v) => `'${v}'`).join(' | ')
        : specTypeToTS(field.type);
      const optional = field.nullable ? '?' : '';
      return `  ${fieldName}${optional}: ${tsType};`;
    })
    .join('\n');

  let extra = '';
  if (spec.timestamps !== false) {
    extra += '\n  createdAt: Date;\n  updatedAt: Date;';
  }
  if (spec.softDelete) {
    extra += '\n  deletedAt: Date | null;';
  }

  // FK fields from belongsTo relations
  if (spec.relations) {
    for (const [, rel] of Object.entries(spec.relations)) {
      if (rel.type === 'belongsTo') {
        const fk = rel.foreignKey ?? `${rel.model.charAt(0).toLowerCase() + rel.model.slice(1)}Id`;
        if (!(fk in fields)) {
          extra += `\n  ${fk}: string;`;
        }
      }
    }
  }

  const createFields = Object.entries(fields)
    .filter(([, f]) => !f.primary && f.auto === undefined)
    .map(([fieldName, field]) => {
      const tsType = field.type === 'enum' && field.values
        ? field.values.map((v) => `'${v}'`).join(' | ')
        : specTypeToTS(field.type);
      const isOptional = field.default !== undefined || field.nullable;
      return `  ${fieldName}${isOptional ? '?' : ''}: ${tsType};`;
    })
    .join('\n');

  const updateFields = Object.entries(fields)
    .filter(([, f]) => !f.primary && f.auto === undefined && !f.immutable)
    .map(([fieldName, field]) => {
      const tsType = field.type === 'enum' && field.values
        ? field.values.map((v) => `'${v}'`).join(' | ')
        : specTypeToTS(field.type);
      return `  ${fieldName}?: ${tsType};`;
    })
    .join('\n');

  const content = `${header}export interface ${name} {
${baseFields}${extra}
}

export interface Create${name}Input {
${createFields}
}

export interface Update${name}Input {
${updateFields}
}

export interface ${name}Response {
  data: ${name};
}

export interface ${name}ListResponse {
  data: ${name}[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
`;

  return { path: `${context.outputDir}/models/${fileName}.types.ts`, content };
}

function generateSchema(spec: SpecModel, context: GeneratorContext): GeneratedFile {
  const name = spec.model;
  const fileName = toKebabCase(name);
  const tableName = spec.table ?? toTableName(name);
  const header = generatedHeader(`specs/models/${fileName}.spec.yaml`);

  const drizzleImports = new Set<string>();
  drizzleImports.add('pgTable');

  const columns: string[] = [];

  for (const [fieldName, field] of Object.entries(spec.fields)) {
    const colName = toSnakeCase(fieldName);
    let colDef = specTypeToDrizzle(field.type, field).replace(/__COL__/g, colName);
    drizzleImports.add(getDrizzleImport(field.type));

    if (field.primary && field.type === 'uuid') {
      colDef += '.defaultRandom().primaryKey()';
    } else if (field.primary) {
      colDef += '.primaryKey()';
    }

    if (!field.nullable && !field.primary && field.required !== false) {
      colDef += '.notNull()';
    }
    if (field.unique) colDef += '.unique()';
    if (field.default !== undefined && field.default !== null) {
      if (typeof field.default === 'string') colDef += `.default('${field.default}')`;
      else colDef += `.default(${field.default})`;
    }

    columns.push(`  ${fieldName}: ${colDef},`);
  }

  if (spec.relations) {
    for (const [, rel] of Object.entries(spec.relations)) {
      if (rel.type === 'belongsTo') {
        const fk = rel.foreignKey ?? `${rel.model.charAt(0).toLowerCase() + rel.model.slice(1)}Id`;
        if (!(fk in spec.fields)) {
          drizzleImports.add('uuid');
          columns.push(`  ${fk}: uuid('${toSnakeCase(fk)}').notNull(),`);
        }
      }
    }
  }

  if (spec.timestamps !== false) {
    drizzleImports.add('timestamp');
    columns.push(`  createdAt: timestamp('created_at').notNull().defaultNow(),`);
    columns.push(`  updatedAt: timestamp('updated_at').notNull().defaultNow(),`);
  }

  if (spec.softDelete) {
    drizzleImports.add('timestamp');
    columns.push(`  deletedAt: timestamp('deleted_at'),`);
  }

  const content = `${header}import { ${[...drizzleImports].sort().join(', ')} } from 'drizzle-orm/pg-core';

export const ${tableName} = pgTable('${tableName}', {
${columns.join('\n')}
});
`;

  return { path: `${context.outputDir}/models/${fileName}.schema.ts`, content };
}

function generateIndex(specs: SpecModel[], context: GeneratorContext): GeneratedFile {
  const exports = specs.map((spec) => {
    const fileName = toKebabCase(spec.model);
    return `export * from './${fileName}.types.js';\nexport * from './${fileName}.schema.js';`;
  }).join('\n');

  return {
    path: `${context.outputDir}/models/index.ts`,
    content: generatedHeader('specs/models/') + exports + '\n',
  };
}

function getDrizzleImport(type: string): string {
  const map: Record<string, string> = {
    string: 'varchar', text: 'text', integer: 'integer', decimal: 'decimal',
    boolean: 'boolean', date: 'date', timestamp: 'timestamp', uuid: 'uuid',
    json: 'jsonb', enum: 'varchar', email: 'varchar', url: 'varchar',
    slug: 'varchar', password: 'varchar', file: 'varchar',
  };
  return map[type] ?? 'varchar';
}
