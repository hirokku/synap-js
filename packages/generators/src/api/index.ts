import type { Generator, GeneratorContext, GeneratorResult, GeneratedFile } from '@synap-js/core';
import type { SpecModel } from '@synap-js/core';
import { toKebabCase, toTableName, toSnakeCase, generatedHeader } from '../utils/naming.js';

export const ApiGenerator: Generator = {
  name: 'api',

  async generate(specs: SpecModel[], context: GeneratorContext): Promise<GeneratorResult> {
    const files: GeneratedFile[] = [];

    for (const spec of specs) {
      if (!spec.api?.endpoints || spec.api.endpoints.length === 0) continue;
      files.push(generateController(spec, context));
      files.push(generateRoutes(spec, context));
    }

    if (files.length > 0) {
      files.push(generateApiIndex(specs, context));
      files.push(generateAppEntry(specs, context));
    }

    return { files, errors: [], warnings: [] };
  },
};

function generateController(spec: SpecModel, context: GeneratorContext): GeneratedFile {
  const name = spec.model;
  const fileName = toKebabCase(name);
  const tableName = spec.table ?? toTableName(name);
  const header = generatedHeader(`specs/models/${fileName}.spec.yaml`);
  const endpoints = spec.api?.endpoints ?? [];
  const lowerName = name.charAt(0).toLowerCase() + name.slice(1);

  const methods: string[] = [];

  if (endpoints.includes('list')) {
    methods.push(`
  async list(c: Context) {
    const query = ${name}ListQuerySchema.parse(c.req.query());
    const limit = Math.min(query.limit ?? 20, ${spec.api?.pagination?.maxLimit ?? 100});
    const offset = ((query.page ?? 1) - 1) * limit;

    const data = await db.select().from(${tableName}).limit(limit).offset(offset);
    const countResult = await db.select({ count: sql\`count(*)\` }).from(${tableName});
    const total = Number(countResult[0]?.count ?? 0);

    return c.json({
      data,
      meta: { page: query.page ?? 1, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }`);
  }

  if (endpoints.includes('get')) {
    methods.push(`
  async get(c: Context) {
    const id = c.req.param('id');
    const record = await db.select().from(${tableName}).where(eq(${tableName}.id, id)).limit(1);
    if (record.length === 0) {
      throw new NotFoundError('${name}', id);
    }
    return c.json({ data: record[0] });
  }`);
  }

  if (endpoints.includes('create')) {
    methods.push(`
  async create(c: Context) {
    const input = Create${name}Schema.parse(await c.req.json());
    const result = await db.insert(${tableName}).values(input).returning();
    return c.json({ data: result[0] }, 201);
  }`);
  }

  if (endpoints.includes('update')) {
    methods.push(`
  async update(c: Context) {
    const id = c.req.param('id');
    const input = Update${name}Schema.parse(await c.req.json());
    const result = await db.update(${tableName}).set(input).where(eq(${tableName}.id, id)).returning();
    if (result.length === 0) {
      throw new NotFoundError('${name}', id);
    }
    return c.json({ data: result[0] });
  }`);
  }

  if (endpoints.includes('delete')) {
    methods.push(`
  async delete(c: Context) {
    const id = c.req.param('id');
    const result = await db.delete(${tableName}).where(eq(${tableName}.id, id)).returning();
    if (result.length === 0) {
      throw new NotFoundError('${name}', id);
    }
    return c.json({ success: true });
  }`);
  }

  const content = `${header}import type { Context } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../db.js';
import { ${tableName} } from '../models/${fileName}.schema.js';
import { Create${name}Schema, Update${name}Schema, ${name}ListQuerySchema } from '../validators/${fileName}.validator.js';
import { NotFoundError } from '@synap-js/runtime';

export const ${lowerName}Controller = {
${methods.join(',\n')}
};
`;

  return { path: `${context.outputDir}/api/${fileName}.controller.ts`, content };
}

function generateRoutes(spec: SpecModel, context: GeneratorContext): GeneratedFile {
  const name = spec.model;
  const fileName = toKebabCase(name);
  const routePath = `/${toKebabCase(name)}s`;
  const header = generatedHeader(`specs/models/${fileName}.spec.yaml`);
  const endpoints = spec.api?.endpoints ?? [];
  const lowerName = name.charAt(0).toLowerCase() + name.slice(1);

  const auth = spec.api?.auth;
  const routes: string[] = [];
  let needsAuthImport = false;

  const guard = (endpoint: string): string => {
    const level = auth?.[endpoint as keyof typeof auth];
    if (!level || level === 'public') return '';
    needsAuthImport = true;
    if (level === 'authenticated') return 'requireAuth, ';
    if (level === 'admin') return "requireAuth, requireRole('admin'), ";
    if (level === 'owner') return "requireAuth, ";
    return '';
  };

  if (endpoints.includes('list')) {
    routes.push(`app.get('${routePath}', ${guard('list')}(c) => ${lowerName}Controller.list(c));`);
  }
  if (endpoints.includes('get')) {
    routes.push(`app.get('${routePath}/:id', ${guard('get')}(c) => ${lowerName}Controller.get(c));`);
  }
  if (endpoints.includes('create')) {
    routes.push(`app.post('${routePath}', ${guard('create')}(c) => ${lowerName}Controller.create(c));`);
  }
  if (endpoints.includes('update')) {
    routes.push(`app.put('${routePath}/:id', ${guard('update')}(c) => ${lowerName}Controller.update(c));`);
  }
  if (endpoints.includes('delete')) {
    routes.push(`app.delete('${routePath}/:id', ${guard('delete')}(c) => ${lowerName}Controller.delete(c));`);
  }

  const authImport = needsAuthImport ? `\nimport { requireAuth, requireRole } from '@synap-js/runtime';` : '';

  const content = `${header}import { Hono } from 'hono';
import { ${lowerName}Controller } from './${fileName}.controller.js';${authImport}

export function register${name}Routes(app: Hono) {
  ${routes.join('\n  ')}
}
`;

  return { path: `${context.outputDir}/api/${fileName}.routes.ts`, content };
}

function generateApiIndex(specs: SpecModel[], context: GeneratorContext): GeneratedFile {
  const apiSpecs = specs.filter((s) => s.api?.endpoints && s.api.endpoints.length > 0);
  const imports = apiSpecs.map((s) => {
    const fileName = toKebabCase(s.model);
    return `import { register${s.model}Routes } from './${fileName}.routes.js';`;
  }).join('\n');

  const registrations = apiSpecs.map((s) => `  register${s.model}Routes(api);`).join('\n');

  const content = `${generatedHeader('specs/models/')}import { Hono } from 'hono';
${imports}

export function registerAllRoutes(api: Hono) {
${registrations}
}
`;

  return { path: `${context.outputDir}/api/index.ts`, content };
}

function generateAppEntry(_specs: SpecModel[], context: GeneratorContext): GeneratedFile {
  const content = `${generatedHeader('specs/')}import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { registerAllRoutes } from './api/index.js';
import { authMiddleware } from './auth/auth.middleware.js';
import { registerAuthRoutes } from './auth/auth.routes.js';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', authMiddleware);

// Error handler
app.onError((err, c) => {
  const status = (err as any).status ?? 500;
  const code = (err as any).code ?? 'INTERNAL_ERROR';
  const message = err.message ?? 'Internal server error';
  console.error(\`[\${code}] \${message}\`);
  return c.json({ status, code, message }, status);
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', uptime: process.uptime() }));

// Auth routes
registerAuthRoutes(app, null); // Pass db instance in production

// API routes
const api = new Hono();
registerAllRoutes(api);
app.route('/api', api);

export { app };
`;

  return { path: `${context.outputDir}/app.ts`, content };
}
