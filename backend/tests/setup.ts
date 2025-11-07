import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file for testing
dotenv.config({ path: resolve(__dirname, '../.env') });

// SECURITY: Ensure JWT_SECRET is set for tests
// If not in .env, use a test-specific secret
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
}

// Set other test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';
