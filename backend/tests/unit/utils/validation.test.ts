import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateUUID,
  validateEnum,
  sanitizeString,
  validateFileSize,
  validateFileType,
  validateUrl,
  validatePhoneNumber,
  validateDonationAmount,
  validateStoryLength,
  FILE_VALIDATION,
} from '../../../src/utils/validation.js';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('user_name@sub.domain.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate passwords that meet all requirements', () => {
      const result = validatePassword('Password123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject passwords that are too short', () => {
      const result = validatePassword('Pass1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validatePassword('PASSWORD123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('Password');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return all applicable error messages', () => {
      const result = validatePassword('pass');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateUUID', () => {
    it('should validate correct UUID formats', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(validateUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      expect(validateUUID('not-a-uuid')).toBe(false);
      expect(validateUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(validateUUID('')).toBe(false);
      expect(validateUUID('123456789')).toBe(false);
    });
  });

  describe('validateEnum', () => {
    const roles = ['donator', 'recipient', 'admin'] as const;

    it('should validate values that exist in enum', () => {
      expect(validateEnum('donator', roles)).toBe(true);
      expect(validateEnum('recipient', roles)).toBe(true);
      expect(validateEnum('admin', roles)).toBe(true);
    });

    it('should reject values not in enum', () => {
      expect(validateEnum('invalid', roles)).toBe(false);
      expect(validateEnum('', roles)).toBe(false);
      expect(validateEnum('DONATOR', roles)).toBe(false); // case sensitive
    });
  });

  describe('sanitizeString', () => {
    it('should remove null bytes', () => {
      expect(sanitizeString('hello\0world')).toBe('helloworld');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('\thello\n')).toBe('hello');
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString('   ')).toBe('');
    });

    it('should preserve normal characters', () => {
      expect(sanitizeString('Hello, World!')).toBe('Hello, World!');
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      expect(validateFileSize(1000, 5000)).toBe(true);
      expect(validateFileSize(5000, 5000)).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      expect(validateFileSize(6000, 5000)).toBe(false);
    });

    it('should reject zero or negative sizes', () => {
      expect(validateFileSize(0, 5000)).toBe(false);
      expect(validateFileSize(-100, 5000)).toBe(false);
    });
  });

  describe('validateFileType', () => {
    it('should validate exact content type matches', () => {
      expect(validateFileType('image/jpeg', ['image/jpeg', 'image/png'])).toBe(true);
      expect(validateFileType('image/png', ['image/jpeg', 'image/png'])).toBe(true);
    });

    it('should validate wildcard content types', () => {
      expect(validateFileType('image/jpeg', ['image/*'])).toBe(true);
      expect(validateFileType('image/png', ['image/*'])).toBe(true);
      expect(validateFileType('image/webp', ['image/*'])).toBe(true);
    });

    it('should reject non-matching content types', () => {
      expect(validateFileType('video/mp4', ['image/jpeg', 'image/png'])).toBe(false);
      expect(validateFileType('application/pdf', ['image/*'])).toBe(false);
    });

    it('should work with FILE_VALIDATION constants', () => {
      expect(validateFileType('image/jpeg', FILE_VALIDATION.PHOTO_ALLOWED_TYPES)).toBe(true);
      expect(validateFileType('application/pdf', FILE_VALIDATION.DOCUMENT_ALLOWED_TYPES)).toBe(true);
      expect(validateFileType('video/mp4', FILE_VALIDATION.PHOTO_ALLOWED_TYPES)).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://localhost:3000')).toBe(true);
      expect(validateUrl('https://sub.domain.com/path?query=value')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('example.com')).toBe(false); // missing protocol
      expect(validateUrl('')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correctly formatted phone numbers', () => {
      expect(validatePhoneNumber('1234567890')).toBe(true);
      expect(validatePhoneNumber('(555) 123-4567')).toBe(true);
      expect(validatePhoneNumber('+1-555-123-4567')).toBe(true);
      expect(validatePhoneNumber('+44 20 1234 5678')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false); // too short
      expect(validatePhoneNumber('abc-def-ghij')).toBe(false); // contains letters
      expect(validatePhoneNumber('')).toBe(false);
    });
  });

  describe('validateDonationAmount', () => {
    it('should validate positive amounts with up to 2 decimal places', () => {
      expect(validateDonationAmount(10)).toBe(true);
      expect(validateDonationAmount(10.5)).toBe(true);
      expect(validateDonationAmount(10.99)).toBe(true);
      expect(validateDonationAmount(0.01)).toBe(true);
    });

    it('should reject zero or negative amounts', () => {
      expect(validateDonationAmount(0)).toBe(false);
      expect(validateDonationAmount(-10)).toBe(false);
    });

    it('should reject amounts with more than 2 decimal places', () => {
      expect(validateDonationAmount(10.999)).toBe(false);
      expect(validateDonationAmount(10.123)).toBe(false);
    });

    it('should reject non-finite numbers', () => {
      expect(validateDonationAmount(Infinity)).toBe(false);
      expect(validateDonationAmount(NaN)).toBe(false);
    });
  });

  describe('validateStoryLength', () => {
    it('should validate stories within length range (50-5000 chars)', () => {
      const validStory = 'A'.repeat(50);
      expect(validateStoryLength(validStory)).toBe(true);

      const longStory = 'A'.repeat(5000);
      expect(validateStoryLength(longStory)).toBe(true);

      const mediumStory = 'A'.repeat(500);
      expect(validateStoryLength(mediumStory)).toBe(true);
    });

    it('should reject stories that are too short', () => {
      const shortStory = 'A'.repeat(49);
      expect(validateStoryLength(shortStory)).toBe(false);
    });

    it('should reject stories that are too long', () => {
      const tooLongStory = 'A'.repeat(5001);
      expect(validateStoryLength(tooLongStory)).toBe(false);
    });

    it('should trim whitespace before checking length', () => {
      const storyWithWhitespace = '  ' + 'A'.repeat(50) + '  ';
      expect(validateStoryLength(storyWithWhitespace)).toBe(true);

      const tooShortWithWhitespace = '  ' + 'A'.repeat(40) + '  ';
      expect(validateStoryLength(tooShortWithWhitespace)).toBe(false);
    });
  });
});
