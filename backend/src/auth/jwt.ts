import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import type { StringValue } from 'ms';

// SECURITY: JWT_SECRET is required - fail fast if not configured
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    'SECURITY ERROR: JWT_SECRET environment variable is required. ' +
    'Set a strong, random secret in your .env file.'
  );
}
// Type assertion: we've verified JWT_SECRET is not undefined above
const JWT_SECRET_VERIFIED = JWT_SECRET as string;

const JWT_EXPIRATION = (process.env.JWT_EXPIRATION || '7d') as StringValue;

export interface JWTPayload {
  userId: string;
  role: 'donator' | 'recipient' | 'admin';
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token
 * @param userId - User ID
 * @param role - User role
 * @param expiresIn - Optional custom token expiration (default: from JWT_EXPIRATION env or 7d)
 * @returns JWT token string
 */
export function generateToken(
  userId: string,
  role: 'donator' | 'recipient' | 'admin',
  expiresIn?: StringValue
): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId,
    role,
  };

  const options: jwt.SignOptions = {
    expiresIn: expiresIn || JWT_EXPIRATION,
  };
  
  return jwt.sign(payload, JWT_SECRET_VERIFIED, options);
}

/**
 * Validate and decode JWT token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function validateToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET_VERIFIED) as JWTPayload;
    return decoded;
  } catch (error) {
    // Token is invalid, expired, or malformed
    return null;
  }
}

/**
 * Express middleware to authenticate requests using JWT
 * Expects token in Authorization header: "Bearer <token>"
 */
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication required',
      },
    });
    return;
  }

  // Extract token from "Bearer <token>" format
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid authorization header format',
      },
    });
    return;
  }

  const token = parts[1];
  const payload = validateToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid or expired token',
      },
    });
    return;
  }

  // Attach user info to request object
  (req as any).user = payload;

  next();
}

/**
 * Middleware to require specific role(s)
 * Must be used after authenticateJWT middleware
 */
export function requireRole(...roles: Array<'donator' | 'recipient' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as JWTPayload | undefined;

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions',
        },
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is present and valid, but doesn't require it
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const parts = authHeader.split(' ');

  if (parts.length === 2 && parts[0] === 'Bearer') {
    const token = parts[1];
    const payload = validateToken(token);

    if (payload) {
      (req as any).user = payload;
    }
  }

  next();
}
