/**
 * Standardized error hierarchy for Kodeai applications.
 */

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }

  toJSON() {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
    };
  }
}

export class ValidationError extends AppError {
  public readonly details: Array<{ field: string; message: string; code: string }>;

  constructor(
    details: Array<{ field: string; message: string; code: string }>,
    message = 'Invalid input',
  ) {
    super(400, 'VALIDATION_ERROR', message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'AUTHENTICATION_REQUIRED', message);
    this.name = 'AuthenticationError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(model: string, id?: string) {
    const msg = id ? `${model} with id '${id}' not found` : `${model} not found`;
    super(404, `${model.toUpperCase()}_NOT_FOUND`, msg);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(model: string, field?: string, value?: string) {
    const msg = field
      ? `${model} with ${field} '${value}' already exists`
      : `${model} conflict`;
    const code = field
      ? `${model.toUpperCase()}_${field.toUpperCase()}_CONFLICT`
      : `${model.toUpperCase()}_CONFLICT`;
    super(409, code, msg);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, 'RATE_LIMIT_EXCEEDED', message);
    this.name = 'RateLimitError';
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(500, 'INTERNAL_ERROR', message);
    this.name = 'InternalError';
  }
}
