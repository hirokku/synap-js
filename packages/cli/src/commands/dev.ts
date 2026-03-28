import type { Command } from 'commander';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { createClient } from '@libsql/client';
import { parseAllSpecs, resolveSpecs } from '@synap-js/core';
import type { SpecModel, SpecField } from '@synap-js/core';
import { startRepl } from '../ai/repl.js';

export function registerDevCommand(program: Command): void {
  program
    .command('dev')
    .description('Start development server')
    .option('--port <number>', 'Port number', '3000')
    .action(async (opts: { port: string }) => {
      const cwd = process.cwd();
      const specsDir = join(cwd, 'specs');

      if (!existsSync(specsDir)) {
        console.log('\x1b[31m✗\x1b[0m No specs/ directory found. Run "synap init" first.');
        process.exit(1);
      }

      const port = parseInt(opts.port, 10);
      console.log(`\n\x1b[36mSynap Dev Server\x1b[0m\n`);

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

      // Dev dashboard
      app.get('/', (c) => {
        const routes: { method: string; path: string }[] = [];
        for (const spec of specs) {
          if (!spec.api?.endpoints || spec.api.endpoints.length === 0) continue;
          const route = `/api/${toKebabCase(spec.model)}s`;
          for (const ep of spec.api.endpoints) {
            const method = ep === 'list' ? 'GET' : ep === 'get' ? 'GET' : ep === 'create' ? 'POST' : ep === 'update' ? 'PUT' : 'DELETE';
            const path = (ep === 'get' || ep === 'update' || ep === 'delete') ? `${route}/:id` : route;
            routes.push({ method, path });
          }
        }

        const models = specs.map((s) => ({
          name: s.model,
          fields: Object.keys(s.fields).length,
          endpoints: s.api?.endpoints?.length ?? 0,
          table: s.table ?? toTableName(s.model),
        }));

        return c.html(buildDashboardHTML({ port, models, routes, dbPath }));
      });

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
        console.log('');

        // Start interactive REPL
        startRepl(cwd);
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

interface DashboardData {
  port: number;
  models: { name: string; fields: number; endpoints: number; table: string }[];
  routes: { method: string; path: string }[];
  dbPath: string;
}

function buildDashboardHTML(data: DashboardData): string {
  const methodColor: Record<string, string> = {
    GET: '#10b981',
    POST: '#3b82f6',
    PUT: '#f59e0b',
    DELETE: '#ef4444',
  };

  const routeRows = data.routes
    .map((r) => {
      const color = methodColor[r.method] ?? '#888';
      const isClickable = r.method === 'GET' && !r.path.includes(':');
      const pathHtml = isClickable
        ? `<a href="${r.path}" target="_blank" style="color:#e2e8f0;text-decoration:underline">${r.path}</a>`
        : `<span style="color:#94a3b8">${r.path}</span>`;
      return `<tr><td><span style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600">${r.method}</span></td><td style="padding-left:12px">${pathHtml}</td></tr>`;
    })
    .join('');

  const modelCards = data.models
    .map(
      (m) => `
      <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:16px;min-width:200px">
        <div style="font-size:18px;font-weight:600;color:#f1f5f9;margin-bottom:8px">${m.name}</div>
        <div style="display:flex;gap:16px;font-size:13px;color:#94a3b8">
          <span>${m.fields} fields</span>
          <span>${m.endpoints} endpoints</span>
        </div>
        <div style="font-size:12px;color:#64748b;margin-top:8px">table: ${m.table}</div>
      </div>`
    )
    .join('');

  const curlModel = data.models[0];
  const curlRoute = curlModel ? `/api/${toKebabCase(curlModel.name)}s` : '/api/items';
  const curlField = curlModel
    ? Object.keys(data.models[0] ? {} : {}).length > 0
      ? 'name'
      : 'title'
    : 'title';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Synap Dev Server</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    a { color: #38bdf8; }
    code {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 12px 16px;
      display: block;
      font-size: 13px;
      color: #94a3b8;
      overflow-x: auto;
      white-space: pre;
    }
    .container { max-width: 720px; width: 100%; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo {
      font-size: 48px;
      font-weight: 800;
      background: linear-gradient(135deg, #38bdf8, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -2px;
    }
    .tagline { color: #64748b; font-size: 14px; margin-top: 8px; }
    .section { margin-bottom: 32px; }
    .section-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      margin-bottom: 12px;
    }
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }
    .status-item {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 14px;
      text-align: center;
    }
    .status-value { font-size: 20px; font-weight: 700; color: #10b981; }
    .status-label { font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; }
    .models-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px 0; font-size: 14px; font-family: monospace; }
    .pulse {
      display: inline-block;
      width: 8px; height: 8px;
      background: #10b981;
      border-radius: 50%;
      margin-right: 8px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .footer { margin-top: 48px; text-align: center; font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Synap</div>
      <div class="tagline">AI-first full-stack TypeScript framework</div>
    </div>

    <div class="section">
      <div class="section-title">Server Status</div>
      <div class="status-grid">
        <div class="status-item">
          <div class="status-value"><span class="pulse"></span>Live</div>
          <div class="status-label">Status</div>
        </div>
        <div class="status-item">
          <div class="status-value">${data.port}</div>
          <div class="status-label">Port</div>
        </div>
        <div class="status-item">
          <div class="status-value">${data.models.length}</div>
          <div class="status-label">Models</div>
        </div>
        <div class="status-item">
          <div class="status-value">${data.routes.length}</div>
          <div class="status-label">Routes</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Models</div>
      <div class="models-grid">${modelCards}</div>
    </div>

    <div class="section">
      <div class="section-title">API Routes</div>
      <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:16px">
        <table>${routeRows}</table>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Quick Start</div>
      <code>curl http://localhost:${data.port}${curlRoute}

curl -X POST http://localhost:${data.port}${curlRoute} \\
  -H "Content-Type: application/json" \\
  -d '{"${curlField}":"Hello from Synap"}'

curl http://localhost:${data.port}/health</code>
    </div>

    <div class="section">
      <div class="section-title">Database</div>
      <div style="font-size:13px;color:#94a3b8;font-family:monospace">${data.dbPath}</div>
    </div>

    <div class="footer">
      Synap v0.0.1 &middot; <a href="/health">/health</a> &middot; Dev mode
    </div>
  </div>
</body>
</html>`;
}
