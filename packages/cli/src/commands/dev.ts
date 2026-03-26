import type { Command } from 'commander';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { createClient } from '@libsql/client';
import { parseAllSpecs, resolveSpecs } from '@kodeai/core';
import type { SpecModel, SpecField } from '@kodeai/core';

export function registerDevCommand(program: Command): void {
  program
    .command('dev')
    .description('Start development server')
    .option('--port <number>', 'Port number', '3000')
    .action(async (opts: { port: string }) => {
      const cwd = process.cwd();
      const specsDir = join(cwd, 'specs');

      if (!existsSync(specsDir)) {
        console.log('\x1b[31m✗\x1b[0m No specs/ directory found. Run "kodeai init" first.');
        process.exit(1);
      }

      const port = parseInt(opts.port, 10);
      console.log(`\n\x1b[36mKodeai Dev Server\x1b[0m\n`);

      // Parse specs
      const { specs, errors: parseErrors } = parseAllSpecs(specsDir);
      if (parseErrors.length > 0) {
        for (const err of parseErrors) {
          console.log(`\x1b[31m✗\x1b[0m ${err.message}`);
        }
        process.exit(1);
      }

      if (specs.length === 0) {
        console.log('\x1b[31m✗\x1b[0m No model specs found in specs/models/');
        process.exit(1);
      }

      const { errors: resolveErrors } = resolveSpecs(specs);
      if (resolveErrors.length > 0) {
        for (const err of resolveErrors) {
          console.log(`\x1b[31m✗\x1b[0m ${err.message}`);
        }
        process.exit(1);
      }

      // Setup SQLite database via libsql
      const dbPath = join(cwd, 'dev.db');
      const client = createClient({ url: `file:${dbPath}` });

      console.log(`  \x1b[32m✓\x1b[0m Database: ${dbPath}`);

      // Auto-migrate: create tables from specs
      for (const spec of specs) {
        const tableName = spec.table ?? toTableName(spec.model);
        const columns = buildColumns(spec);
        const createSQL = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columns})`;
        await client.execute(createSQL);
        console.log(`  \x1b[32m✓\x1b[0m Table: ${tableName}`);
      }

      // Build Hono app
      const app = new Hono();
      app.use('*', cors());

      // Error handler
      app.onError((err, c) => {
        const status = (err as any).status ?? 500;
        const code = (err as any).code ?? 'INTERNAL_ERROR';
        console.error(`  \x1b[31m[${code}]\x1b[0m ${err.message}`);
        return c.json({ status, code, message: err.message }, status);
      });

      // Health check
      app.get('/health', (c) => c.json({ status: 'ok', uptime: process.uptime() }));

      // Register CRUD routes for each model
      for (const spec of specs) {
        if (!spec.api?.endpoints || spec.api.endpoints.length === 0) continue;
        registerModelRoutes(app, spec, client);
      }

      // Start server
      serve({ fetch: app.fetch, port }, () => {
        console.log(`\n  \x1b[32m✓\x1b[0m Server running at \x1b[36mhttp://localhost:${port}\x1b[0m`);
        console.log(`  \x1b[32m✓\x1b[0m Health: http://localhost:${port}/health`);
        console.log(`\n  Routes:`);
        for (const spec of specs) {
          if (!spec.api?.endpoints || spec.api.endpoints.length === 0) continue;
          const route = `/api/${toKebabCase(spec.model)}s`;
          for (const ep of spec.api.endpoints) {
            const method = ep === 'list' ? 'GET' : ep === 'get' ? 'GET' : ep === 'create' ? 'POST' : ep === 'update' ? 'PUT' : 'DELETE';
            const path = (ep === 'get' || ep === 'update' || ep === 'delete') ? `${route}/:id` : route;
            console.log(`    ${method.padEnd(6)} ${path}`);
          }
        }
        console.log(`\n  Press Ctrl+C to stop.\n`);
      });
    });
}

function registerModelRoutes(app: Hono, spec: SpecModel, client: any): void {
  const tableName = spec.table ?? toTableName(spec.model);
  const route = `/api/${toKebabCase(spec.model)}s`;
  const endpoints = spec.api?.endpoints ?? [];
  const maxLimit = spec.api?.pagination?.maxLimit ?? 100;
  const defaultLimit = spec.api?.pagination?.defaultLimit ?? 20;

  if (endpoints.includes('list')) {
    app.get(route, async (c) => {
      const page = Math.max(1, parseInt(c.req.query('page') ?? '1', 10));
      const limit = Math.min(maxLimit, Math.max(1, parseInt(c.req.query('limit') ?? String(defaultLimit), 10)));
      const offset = (page - 1) * limit;

      const data = await client.execute({ sql: `SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`, args: [limit, offset] });
      const countResult = await client.execute({ sql: `SELECT COUNT(*) as count FROM "${tableName}"`, args: [] });
      const total = Number(countResult.rows[0]?.count ?? 0);

      return c.json({
        data: data.rows,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    });
  }

  if (endpoints.includes('get')) {
    app.get(`${route}/:id`, async (c) => {
      const id = c.req.param('id');
      const result = await client.execute({ sql: `SELECT * FROM "${tableName}" WHERE id = ?`, args: [id] });
      if (result.rows.length === 0) {
        return c.json({ status: 404, code: `${spec.model.toUpperCase()}_NOT_FOUND`, message: `${spec.model} not found` }, 404);
      }
      return c.json({ data: result.rows[0] });
    });
  }

  if (endpoints.includes('create')) {
    app.post(route, async (c) => {
      const body = await c.req.json();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const colNames: string[] = ['"id"'];
      const placeholders: string[] = ['?'];
      const values: any[] = [id];

      for (const [field, fieldDef] of Object.entries(spec.fields)) {
        if (fieldDef.primary) continue;
        colNames.push(`"${toSnakeCase(field)}"`);
        placeholders.push('?');
        let value = body[field];
        if (value === undefined && fieldDef.default !== undefined) {
          value = fieldDef.default;
        }
        values.push(value ?? null);
      }

      if (spec.timestamps !== false) {
        colNames.push('"created_at"', '"updated_at"');
        placeholders.push('?', '?');
        values.push(now, now);
      }

      await client.execute({
        sql: `INSERT INTO "${tableName}" (${colNames.join(', ')}) VALUES (${placeholders.join(', ')})`,
        args: values,
      });

      const created = await client.execute({ sql: `SELECT * FROM "${tableName}" WHERE id = ?`, args: [id] });
      return c.json({ data: created.rows[0] }, 201);
    });
  }

  if (endpoints.includes('update')) {
    app.put(`${route}/:id`, async (c) => {
      const id = c.req.param('id');
      const body = await c.req.json();

      const existing = await client.execute({ sql: `SELECT * FROM "${tableName}" WHERE id = ?`, args: [id] });
      if (existing.rows.length === 0) {
        return c.json({ status: 404, code: `${spec.model.toUpperCase()}_NOT_FOUND`, message: `${spec.model} not found` }, 404);
      }

      const setClauses: string[] = [];
      const setValues: any[] = [];

      for (const [field, value] of Object.entries(body)) {
        if (field === 'id') continue;
        setClauses.push(`"${toSnakeCase(field)}" = ?`);
        setValues.push(value);
      }

      if (spec.timestamps !== false) {
        setClauses.push('"updated_at" = ?');
        setValues.push(new Date().toISOString());
      }

      if (setClauses.length > 0) {
        setValues.push(id);
        await client.execute({
          sql: `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE id = ?`,
          args: setValues,
        });
      }

      const updated = await client.execute({ sql: `SELECT * FROM "${tableName}" WHERE id = ?`, args: [id] });
      return c.json({ data: updated.rows[0] });
    });
  }

  if (endpoints.includes('delete')) {
    app.delete(`${route}/:id`, async (c) => {
      const id = c.req.param('id');
      const existing = await client.execute({ sql: `SELECT * FROM "${tableName}" WHERE id = ?`, args: [id] });
      if (existing.rows.length === 0) {
        return c.json({ status: 404, code: `${spec.model.toUpperCase()}_NOT_FOUND`, message: `${spec.model} not found` }, 404);
      }
      await client.execute({ sql: `DELETE FROM "${tableName}" WHERE id = ?`, args: [id] });
      return c.json({ success: true });
    });
  }
}

// SQL column generation from spec fields
function buildColumns(spec: SpecModel): string {
  const cols: string[] = [];

  for (const [fieldName, field] of Object.entries(spec.fields)) {
    const colName = toSnakeCase(fieldName);
    let colDef = `"${colName}" ${fieldToSQLite(field)}`;

    if (field.primary) colDef += ' PRIMARY KEY';
    if (!field.nullable && !field.primary) colDef += ' NOT NULL';
    if (field.unique) colDef += ' UNIQUE';
    if (field.default !== undefined && field.default !== null) {
      if (typeof field.default === 'string') colDef += ` DEFAULT '${field.default}'`;
      else colDef += ` DEFAULT ${field.default}`;
    }

    cols.push(colDef);
  }

  // FK fields from belongsTo
  if (spec.relations) {
    for (const [, rel] of Object.entries(spec.relations)) {
      if (rel.type === 'belongsTo') {
        const fk = rel.foreignKey ?? `${rel.model.charAt(0).toLowerCase() + rel.model.slice(1)}Id`;
        if (!(fk in spec.fields)) {
          cols.push(`"${toSnakeCase(fk)}" TEXT NOT NULL`);
        }
      }
    }
  }

  // Timestamps
  if (spec.timestamps !== false) {
    cols.push(`"created_at" TEXT NOT NULL DEFAULT (datetime('now'))`);
    cols.push(`"updated_at" TEXT NOT NULL DEFAULT (datetime('now'))`);
  }

  if (spec.softDelete) {
    cols.push(`"deleted_at" TEXT`);
  }

  return cols.join(', ');
}

function fieldToSQLite(field: SpecField): string {
  switch (field.type) {
    case 'integer': return 'INTEGER';
    case 'decimal': return 'REAL';
    case 'boolean': return 'INTEGER';
    case 'json': return 'TEXT';
    default: return 'TEXT';
  }
}

function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

function toKebabCase(str: string): string {
  return toSnakeCase(str).replace(/_/g, '-');
}

function toTableName(model: string): string {
  const snake = toSnakeCase(model);
  return snake.endsWith('s') ? snake : snake + 's';
}
