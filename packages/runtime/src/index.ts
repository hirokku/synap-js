// Errors
export {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalError,
} from './errors/index.js';

// Hooks
export { defineHooks } from './hooks/index.js';
export type { HookDefinition } from './hooks/index.js';

// Re-exports for convenience
export { Hono } from 'hono';
export { z } from 'zod';
