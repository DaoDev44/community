import { Request, Response, NextFunction } from 'express';

/**
 * Base API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Validation errors
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(401, 'AUTHENTICATION_ERROR', message);
  }
}

/**
 * 403 Forbidden - Insufficient permissions
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, 'AUTHORIZATION_ERROR', message);
  }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

/**
 * 409 Conflict - Resource conflict (e.g., duplicate email)
 */
export class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(409, 'CONFLICT', message, details);
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(429, 'RATE_LIMIT_EXCEEDED', message);
  }
}

/**
 * 500 Internal Server Error - Unexpected errors
 */
export class InternalError extends ApiError {
  constructor(message: string = 'An unexpected error occurred') {
    super(500, 'INTERNAL_SERVER_ERROR', message);
  }
}

/**
 * Format error response according to API contract
 */
function formatErrorResponse(error: ApiError) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  };
}

/**
 * Global error handler middleware
 * Must be registered as the last middleware in the app
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error (in production, use proper logging service like Winston)
  const logData = {
    message: err.message,
    name: err.name,
    ...(err instanceof ApiError && { code: err.code }),
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id, // If user is attached by auth middleware
    timestamp: new Date().toISOString(),
  };

  if (err instanceof ApiError && err.statusCode < 500) {
    // Client errors (4xx) - log as warnings
    console.warn('Client error:', logData);
  } else {
    // Server errors (5xx) or unknown errors - log as errors
    console.error('Server error:', {
      ...logData,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }

  // Handle ApiError instances
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(formatErrorResponse(err));
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;

    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] || 'field';
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: `${field} already exists`,
          details: { field },
        },
      });
      return;
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
        },
      });
      return;
    }
  }

  // Handle validation errors from Zod or similar
  if (err.name === 'ZodError') {
    const zodError = err as any;
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: zodError.errors,
      },
    });
    return;
  }

  // Handle unknown errors as 500 Internal Server Error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

/**
 * 404 Not Found handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

/**
 * Async error wrapper to catch errors in async route handlers
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
