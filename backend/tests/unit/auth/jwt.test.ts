import { describe, it, expect, vi } from 'vitest';
import { generateToken, validateToken, authenticateJWT } from '../../../src/auth/jwt.js';

describe('JWT Authentication', () => {
  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    role: 'donator' as const,
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser.id, mockUser.role);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include userId and role in payload', () => {
      const token = generateToken(mockUser.id, mockUser.role);
      const payload = validateToken(token);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(mockUser.id);
      expect(payload?.role).toBe(mockUser.role);
    });

    it('should set expiration to 7 days by default', () => {
      const token = generateToken(mockUser.id, mockUser.role);
      const payload = validateToken(token);

      expect(payload).toBeDefined();
      expect(payload?.exp).toBeDefined();

      // Check that expiration is approximately 7 days from now
      const now = Math.floor(Date.now() / 1000);
      const sevenDays = 7 * 24 * 60 * 60;
      const expectedExp = now + sevenDays;

      // Allow 10 second tolerance for test execution time
      expect(payload?.exp).toBeGreaterThan(expectedExp - 10);
      expect(payload?.exp).toBeLessThan(expectedExp + 10);
    });

    it('should accept custom expiration parameter', () => {
      // Pass custom expiration directly to the function
      const token = generateToken(mockUser.id, mockUser.role, '1h');
      const payload = validateToken(token);

      expect(payload).toBeDefined();
      expect(payload?.exp).toBeDefined();

      const now = Math.floor(Date.now() / 1000);
      const oneHour = 60 * 60;
      const expectedExp = now + oneHour;

      // Allow 10 second tolerance for test execution time
      expect(payload?.exp).toBeGreaterThan(expectedExp - 10);
      expect(payload?.exp).toBeLessThan(expectedExp + 10);
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token', () => {
      const token = generateToken(mockUser.id, mockUser.role);
      const payload = validateToken(token);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(mockUser.id);
      expect(payload?.role).toBe(mockUser.role);
    });

    it('should return null for invalid token format', () => {
      const payload = validateToken('invalid-token');
      expect(payload).toBeNull();
    });

    it('should return null for malformed token', () => {
      expect(validateToken('')).toBeNull();
      expect(validateToken('a.b')).toBeNull();
      expect(validateToken('Bearer token')).toBeNull();
      expect(validateToken('not.a.jwt')).toBeNull();
    });
  });

  describe('authenticateJWT middleware', () => {
    it('should attach user to request for valid token', () => {
      const token = generateToken(mockUser.id, mockUser.role);

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      const next = vi.fn();

      authenticateJWT(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(mockUser.id);
      expect(req.user.role).toBe(mockUser.role);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no authorization header', () => {
      const req = {
        headers: {},
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      const next = vi.fn();

      authenticateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header is malformed', () => {
      const req = {
        headers: {
          authorization: 'InvalidFormat token',
        },
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      const next = vi.fn();

      authenticateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      const next = vi.fn();

      authenticateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid or expired token',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle tokens without Bearer prefix', () => {
      const token = generateToken(mockUser.id, mockUser.role);

      const req = {
        headers: {
          authorization: token, // Without "Bearer " prefix
        },
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      const next = vi.fn();

      authenticateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
