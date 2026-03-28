import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  AuthenticationError,
  RateLimitError,
} from '../src/index.js';

describe('@synap-js/runtime errors', () => {
  it('NotFoundError has correct status and code', () => {
    const err = new NotFoundError('Product', '123');
    expect(err.status).toBe(404);
    expect(err.code).toBe('PRODUCT_NOT_FOUND');
    expect(err.message).toContain('123');
  });

  it('ConflictError generates correct code from model and field', () => {
    const err = new ConflictError('User', 'email', 'test@test.com');
    expect(err.status).toBe(409);
    expect(err.code).toBe('USER_EMAIL_CONFLICT');
  });

  it('ValidationError includes details', () => {
    const err = new ValidationError([
      { field: 'email', message: 'Invalid email', code: 'invalid_string' },
    ]);
    expect(err.status).toBe(400);
    expect(err.details).toHaveLength(1);
    expect(err.details[0]?.field).toBe('email');
  });

  it('AppError serializes to JSON', () => {
    const err = new AppError(400, 'TEST_ERROR', 'Test message');
    const json = err.toJSON();
    expect(json.status).toBe(400);
    expect(json.code).toBe('TEST_ERROR');
    expect(json.message).toBe('Test message');
  });

  it('all error classes have correct status codes', () => {
    expect(new AuthenticationError().status).toBe(401);
    expect(new ForbiddenError().status).toBe(403);
    expect(new RateLimitError().status).toBe(429);
  });
});
