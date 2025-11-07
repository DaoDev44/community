import { z } from 'zod';

/**
 * Email validation schema
 * RFC 5322 compliant
 */
export const emailSchema = z.string().email('Invalid email format');

/**
 * Password validation schema
 * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * User role validation schema
 */
export const userRoleSchema = z.enum(['donator', 'recipient', 'admin']);

/**
 * OAuth provider validation schema
 */
export const oauthProviderSchema = z.enum(['google', 'amazon', 'facebook']);

/**
 * Need type validation schema
 */
export const needTypeSchema = z.enum(['housing', 'food', 'medical', 'education', 'other']);

/**
 * Urgency validation schema
 */
export const urgencySchema = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Payment method validation schema
 */
export const paymentMethodSchema = z.enum([
  'credit_card',
  'debit_card',
  'google_pay',
  'apple_pay',
  'cryptocurrency',
]);

/**
 * Recipient type validation schema
 */
export const recipientTypeSchema = z.enum(['individual', 'organization']);

/**
 * Verification status validation schema
 */
export const verificationStatusSchema = z.enum(['pending', 'verified', 'rejected', 'flagged']);

/**
 * Pagination parameters validation
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Validate email
 */
export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const result = passwordSchema.safeParse(password);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.errors.map(err => err.message);
  return { valid: false, errors };
}

/**
 * Validate UUID
 */
export function validateUUID(uuid: string): boolean {
  return uuidSchema.safeParse(uuid).success;
}

/**
 * Validate enum value
 */
export function validateEnum<T extends readonly [string, ...string[]]>(
  value: string,
  enumValues: T
): value is T[number] {
  return enumValues.includes(value);
}

/**
 * Sanitize string input (remove potentially harmful characters)
 */
export function sanitizeString(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Validate file size
 */
export function validateFileSize(sizeBytes: number, maxSizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= maxSizeBytes;
}

/**
 * Validate file type
 */
export function validateFileType(contentType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const prefix = type.slice(0, -2);
      return contentType.startsWith(prefix);
    }
    return contentType === type;
  });
}

/**
 * Constants for file validation
 */
export const FILE_VALIDATION = {
  // Max 5MB for profile photos
  PHOTO_MAX_SIZE: 5 * 1024 * 1024,
  PHOTO_ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],

  // Max 10MB for verification documents
  DOCUMENT_MAX_SIZE: 10 * 1024 * 1024,
  DOCUMENT_ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
};

/**
 * Validate URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number (basic validation)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Simple validation: allows digits, spaces, hyphens, parentheses, and plus sign
  const phoneRegex = /^[\d\s\-()+ ]{10,20}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate donation amount
 */
export function validateDonationAmount(amount: number): boolean {
  // Must be positive and no more than 2 decimal places
  return amount > 0 && Number.isFinite(amount) && amount * 100 % 1 === 0;
}

/**
 * Validate story length (for recipient profiles)
 */
export function validateStoryLength(story: string): boolean {
  const length = story.trim().length;
  return length >= 50 && length <= 5000;
}

/**
 * Express middleware for validating request body against Zod schema
 */
export function validateBody(schema: z.ZodType<any>) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: result.error.errors,
        },
      });
    }

    // Attach parsed data to request
    req.validatedBody = result.data;
    next();
  };
}

/**
 * Express middleware for validating query parameters against Zod schema
 */
export function validateQuery(schema: z.ZodType<any>) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: result.error.errors,
        },
      });
    }

    // Attach parsed data to request
    req.validatedQuery = result.data;
    next();
  };
}

/**
 * Express middleware for validating route parameters against Zod schema
 */
export function validateParams(schema: z.ZodType<any>) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: result.error.errors,
        },
      });
    }

    // Attach parsed data to request
    req.validatedParams = result.data;
    next();
  };
}
