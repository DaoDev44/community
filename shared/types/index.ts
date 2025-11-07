/**
 * CommUnity Platform - Shared TypeScript Types
 *
 * This module exports all shared types used across backend and frontend.
 * Types are generated from Prisma schema and extended with application-specific types.
 */

// Re-export Prisma types when generated
// export * from '@prisma/client'

// User roles
export enum UserRole {
  DONATOR = 'donator',
  RECIPIENT = 'recipient',
  ADMIN = 'admin',
}

// OAuth providers
export enum OAuthProvider {
  GOOGLE = 'google',
  AMAZON = 'amazon',
  FACEBOOK = 'facebook',
}

// Payment methods
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  GOOGLE_PAY = 'google_pay',
  APPLE_PAY = 'apple_pay',
  CRYPTOCURRENCY = 'cryptocurrency',
}

// Payment status
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// Verification status
export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

// Need types
export enum NeedType {
  HOUSING = 'housing',
  FOOD = 'food',
  MEDICAL = 'medical',
  EDUCATION = 'education',
  OTHER = 'other',
}

// Urgency levels
export enum Urgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Order status
export enum OrderStatus {
  PENDING = 'pending',
  PLACED = 'placed',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Fulfillment status
export enum FulfillmentStatus {
  PENDING = 'pending',
  ORDER_PLACED = 'order_placed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Array<{ field: string; message: string }>
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginationMeta
}

// JWT payload
export interface JWTPayload {
  userId: string
  role: UserRole
  iat?: number
  exp?: number
}

// Delivery address structure
export interface DeliveryAddress {
  type: 'standard' | 'shelter' | 'community_center' | 'partner_location' | 'general_delivery'
  street?: string
  city: string
  state: string
  zip: string
  country: string
  specialInstructions?: string
  contactPhone?: string
}

// Milestone types
export type MilestoneType =
  | 'first_donation'
  | '5_donations'
  | '10_donations'
  | '25_donations'
  | '50_donations'
  | '100_donations'
  | '100_total_donated'
  | '500_total_donated'
  | '1000_total_donated'
  | '10_families_helped'
  | '25_families_helped'
  | '50_families_helped'
