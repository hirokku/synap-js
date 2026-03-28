import type { Generator, GeneratorContext, GeneratorResult, GeneratedFile } from '@synap-js/core';
import type { SpecModel } from '@synap-js/core';
import { generatedHeader } from '../utils/naming.js';

export const AuthGenerator: Generator = {
  name: 'auth',
  async generate(_specs: SpecModel[], context: GeneratorContext): Promise<GeneratorResult> {
    const files: GeneratedFile[] = [];
    const dir = context.outputDir;
    const header = generatedHeader('synap:auth');

    // auth/auth.routes.ts
    files.push({
      path: `${dir}/auth/auth.routes.ts`,
      content: `${header}
import type { Hono } from 'hono';
import { z } from 'zod';
import { hashPassword, comparePassword, signToken, requireAuth } from '@synap-js/runtime';
import type { AuthUser } from '@synap-js/runtime';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

const RegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function registerAuthRoutes(app: Hono, db: any) {
  app.post('/api/auth/register', async (c) => {
    const body = await c.req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ status: 400, code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
    }

    const { email, name, password } = parsed.data;
    const hashedPassword = await hashPassword(password);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
      await db.execute({
        sql: 'INSERT INTO "users" ("id", "email", "name", "password", "role", "created_at", "updated_at") VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [id, email, name, hashedPassword, 'user', now, now],
      });
    } catch (err: any) {
      if (err?.message?.includes('UNIQUE')) {
        return c.json({ status: 409, code: 'EMAIL_CONFLICT', message: 'Email already registered' }, 409);
      }
      throw err;
    }

    const token = await signToken({ sub: id, email, name, role: 'user' }, JWT_SECRET);
    return c.json({ data: { token, user: { id, email, name, role: 'user' } } }, 201);
  });

  app.post('/api/auth/login', async (c) => {
    const body = await c.req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ status: 400, code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
    }

    const { email, password } = parsed.data;
    const result = await db.execute({ sql: 'SELECT * FROM "users" WHERE "email" = ?', args: [email] });
    const user = result.rows[0];

    if (!user || !(await comparePassword(password, user.password as string))) {
      return c.json({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }, 401);
    }

    const token = await signToken(
      { sub: user.id as string, email: user.email as string, name: user.name as string, role: user.role as string },
      JWT_SECRET,
    );
    return c.json({ data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } } });
  });

  app.get('/api/auth/me', requireAuth, async (c) => {
    const authUser = c.get('user') as AuthUser;
    const result = await db.execute({ sql: 'SELECT "id", "email", "name", "role", "created_at" FROM "users" WHERE "id" = ?', args: [authUser.id] });
    const user = result.rows[0];
    if (!user) {
      return c.json({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }, 404);
    }
    return c.json({ data: user });
  });
}
`,
    });

    // auth/auth.middleware.ts
    files.push({
      path: `${dir}/auth/auth.middleware.ts`,
      content: `${header}
import { extractUser } from '@synap-js/runtime';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export const authMiddleware = extractUser(JWT_SECRET);
`,
    });

    // auth/index.ts
    files.push({
      path: `${dir}/auth/index.ts`,
      content: `${header}
export { registerAuthRoutes } from './auth.routes.js';
export { authMiddleware } from './auth.middleware.js';
`,
    });

    return { files, errors: [], warnings: [] };
  },
};
