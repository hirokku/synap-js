import type { MiddlewareHandler } from 'hono';
import { verifyToken } from './jwt.js';
import type { AuthUser } from './types.js';
import { AuthenticationError, ForbiddenError } from '../errors/index.js';

export function extractUser(secret: string): MiddlewareHandler {
  return async (c, next) => {
    const header = c.req.header('Authorization');
    if (header?.startsWith('Bearer ')) {
      try {
        const token = header.slice(7);
        const payload = await verifyToken(token, secret);
        c.set('user', {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        } satisfies AuthUser);
      } catch {
        c.set('user', null);
      }
    } else {
      c.set('user', null);
    }
    await next();
  };
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const user = c.get('user') as AuthUser | null;
  if (!user) {
    throw new AuthenticationError();
  }
  await next();
};

export function requireRole(role: string): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user') as AuthUser | null;
    if (!user) throw new AuthenticationError();
    if (user.role !== role) throw new ForbiddenError();
    await next();
  };
}

export function requireOwner(ownerField = 'userId'): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user') as AuthUser | null;
    if (!user) throw new AuthenticationError();
    // Owner check is done in the controller after fetching the resource
    // This middleware just ensures auth and sets the owner field name
    c.set('ownerField', ownerField);
    c.set('ownerId', user.id);
    await next();
  };
}
