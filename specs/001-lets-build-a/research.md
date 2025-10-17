# Technical Research: Charitable Donation Matching Platform

**Date**: 2025-10-15
**Feature**: 001-lets-build-a
**Purpose**: Resolve NEEDS CLARIFICATION items from Technical Context to inform architectural decisions

## Research Questions

1. Backend language/framework selection
2. Frontend framework selection
3. Database and storage solutions
4. Testing framework selections

---

## 1. Backend Language/Framework

**Decision**: Node.js 20 LTS with TypeScript 5.x and Express.js 4.x

**Rationale**:
- **OAuth Integration**: Excellent library support (Passport.js) for Google, Amazon, Facebook OAuth providers
- **Payment Processing**: Mature SDKs for Stripe (cards, digital wallets, cryptocurrency via Stripe Crypto), PayPal
- **Marketplace APIs**: Strong Node.js SDKs for Amazon Product Advertising API, affiliate tracking
- **JSON-first**: Native JSON handling aligns with REST API requirements and marketplace API responses
- **TypeScript**: Type safety across full stack (shared types with frontend), reduces bugs, improves maintainability
- **Async I/O**: Non-blocking I/O model handles multiple concurrent marketplace API calls efficiently
- **Deployment**: Excellent PaaS support (Vercel, Render, Railway) for rapid MVP deployment
- **Ecosystem**: npm has extensive packages for file uploads (multer), image processing (sharp), PDF generation (pdfkit for tax receipts)

**Alternatives Considered**:
- **Python/Django**: Strong for data processing but weaker OAuth/payment library ecosystem, slower JSON serialization
- **Ruby/Rails**: Convention-heavy, smaller ecosystem for marketplace integrations
- **Go**: Excellent performance but smaller ecosystem, steeper learning curve, fewer marketplace SDKs

**Dependencies**:
- Express.js 4.x (web framework)
- TypeScript 5.x (type safety)
- Passport.js (OAuth authentication)
- Stripe SDK (payment processing)
- Amazon Product Advertising API SDK (marketplace integration)
- Joi or Zod (request validation)
- Winston (logging)
- node-cron (scheduled jobs for price/inventory refresh)

---

## 2. Frontend Framework

**Decision**: Next.js 14 (React 18) with TypeScript and Tailwind CSS

**Rationale**:
- **SEO**: Server-side rendering critical for recipient profiles to be discoverable via search engines, increasing platform visibility
- **Performance**: Automatic code splitting, image optimization (Next/Image), and static generation for marketing pages meet <2s page load constraint
- **Developer Experience**: File-based routing, API routes (for BFF pattern if needed), built-in TypeScript support
- **Component Ecosystem**: Massive React ecosystem (Shadcn/ui, Radix UI for accessible components)
- **Payment Integration**: React components for Stripe Elements, Google Pay, Apple Pay well-supported
- **State Management**: Built-in React Context sufficient for MVP; can add Zustand/Redux if needed
- **Tailwind CSS**: Rapid UI development, responsive design utilities, consistent design system
- **Deployment**: Vercel (creators of Next.js) provides seamless deployment with preview URLs for testing

**Alternatives Considered**:
- **Vue/Nuxt**: Smaller ecosystem, fewer payment/marketplace component libraries
- **Angular**: Heavier bundle size, steeper learning curve, overkill for this use case
- **Plain React (CRA/Vite)**: Would require manual SSR setup for SEO, more configuration overhead

**Dependencies**:
- Next.js 14.x
- React 18.x
- TypeScript 5.x
- Tailwind CSS 3.x
- Shadcn/ui or Radix UI (accessible component library)
- React Hook Form (form handling with validation)
- Stripe React components
- SWR or React Query (data fetching, caching)
- Next-Auth (if client-side OAuth needed)

---

## 3. Database and Storage

**Decision**: PostgreSQL 15+ (primary database) + AWS S3-compatible storage (photos/documents)

**Rationale**:

### Primary Database: PostgreSQL
- **Relational Model**: Donation platform has clear relational structure (Donators → Donations → Needs ← Recipients)
- **ACID Compliance**: Financial transactions (donations) require strong consistency and transactional integrity
- **JSON Support**: Native JSONB type for storing flexible metadata (recipient profiles, marketplace product data, verification documents metadata)
- **Full-Text Search**: Built-in full-text search for recipient discovery without additional search infrastructure
- **Geospatial**: PostGIS extension supports location-based filtering (FR-004) if needed
- **Mature Ecosystem**: Excellent ORMs (Prisma, TypeORM, Sequelize), migration tools, connection pooling
- **Hosted Options**: Supabase (includes auth, storage), Neon, Railway, Render all offer managed PostgreSQL with free tiers for MVP

### Object Storage: AWS S3 / S3-Compatible
- **File Types**: Photos (recipient profiles), verification documents (IDs, 501c3 paperwork), tax receipts (PDFs)
- **CDN Integration**: CloudFront or equivalent for fast image delivery globally
- **Security**: Signed URLs for private document access (verification docs only visible to admin/recipient)
- **Scalability**: Handles growth from MVP (1k recipients) to scale (millions of recipients)
- **Cost**: Pay-per-use model, extremely cost-effective for MVP
- **S3-Compatible Alternatives**: Cloudflare R2 (zero egress fees), Backblaze B2 (lower cost)

**Alternatives Considered**:
- **MongoDB**: NoSQL flexibility unnecessary, weaker transaction support for financial data
- **MySQL**: Viable but weaker JSON support than PostgreSQL, less robust full-text search
- **Firebase/Firestore**: Vendor lock-in, limited SQL querying, not ideal for complex relational queries
- **Local File Storage**: Not scalable, no CDN integration, complicates deployment

**Dependencies**:
- pg (PostgreSQL client)
- Prisma 5.x (ORM with excellent TypeScript support and migrations)
- AWS SDK v3 for S3 (or compatible storage provider)
- @aws-sdk/s3-request-presigner (signed URLs for private files)

---

## 4. Testing Frameworks

**Decision**: Vitest (unit/integration) + Playwright (E2E) + Supertest (API testing)

**Rationale**:

### Backend Testing: Vitest + Supertest
- **Vitest**: Modern, fast test runner with native ESM and TypeScript support, compatible with Jest API
- **Supertest**: HTTP assertion library for testing Express API endpoints (contract tests)
- **Speed**: Vitest is 10x faster than Jest for TypeScript projects
- **Coverage**: Built-in coverage reporting with c8/istanbul

### Frontend Testing: Vitest + Testing Library + Playwright
- **Vitest**: Same test runner for frontend consistency, supports React component testing
- **React Testing Library**: Component testing focused on user behavior, not implementation details
- **Playwright**: E2E testing for complete user journeys (P1-P7 user stories), cross-browser support
- **Visual Regression**: Playwright supports screenshot comparison for UI consistency

### Contract Testing Strategy
- OpenAPI spec generation from TypeScript types (ts-json-schema-generator)
- Contract tests verify API responses match OpenAPI spec
- Shared types between frontend/backend ensure compile-time contract validation

**Alternatives Considered**:
- **Jest**: Slower for TypeScript, requires additional configuration for ESM
- **Cypress**: E2E alternative but Playwright has better cross-browser support and faster execution
- **Mocha/Chai**: Older, more configuration required, smaller ecosystem

**Dependencies**:
- vitest (test runner)
- supertest (API testing)
- @testing-library/react (React component testing)
- playwright (E2E testing)
- @playwright/test (Playwright test runner)

---

## 5. Additional Technology Decisions

### Payment Processing

**Decision**: Stripe as primary payment processor

**Rationale**:
- **Unified Platform**: Handles credit/debit cards, Google Pay, Apple Pay, and cryptocurrency (Stripe Crypto) in one integration
- **Compliance**: PCI DSS compliant out-of-the-box, reduces compliance burden
- **Tax Receipts**: Stripe Tax can handle tax calculation; Stripe Invoicing generates receipts
- **Webhooks**: Reliable webhook system for payment confirmation, enabling automated order placement
- **Developer Experience**: Excellent documentation, TypeScript SDK, React components
- **Fees**: 2.9% + $0.30 per transaction (standard industry rate)

**Alternatives**: PayPal (backup option), Coinbase Commerce (crypto-only)

### Marketplace Integration

**Decision**: Amazon Product Advertising API 5.0 + Amazon Associates (affiliate program)

**Rationale**:
- **Inventory**: Broadest product catalog for diverse recipient needs
- **Affiliate Program**: Established Amazon Associates program with 1-10% commission rates
- **API**: Product Advertising API provides real-time pricing, availability, product details
- **Fulfillment**: Amazon handles shipping, tracking, delivery
- **API Limits**: 8,640 requests/day on free tier (sufficient for MVP with caching)

**Multi-Marketplace Strategy**:
- Phase 1: Amazon only (MVP)
- Phase 2: Add Walmart Affiliate Program API (broader reach, lower prices)
- Design abstraction layer (MarketplaceService interface) to support multiple providers

### OAuth Providers

**Decision**: Google OAuth 2.0, Amazon Login, Facebook Login via Passport.js

**Rationale**:
- **User Preference**: Google (dominant), Amazon (aligns with marketplace), Facebook (social sharing)
- **Passport.js Strategies**: passport-google-oauth20, passport-amazon, passport-facebook
- **Fallback**: Email/password with bcrypt for users without social accounts

### File Upload/Processing

**Decision**: Multer (upload) + Sharp (image processing) + PDFKit (tax receipts)

**Rationale**:
- **Multer**: Express middleware for multipart/form-data file uploads
- **Sharp**: Fast image resizing/optimization for recipient photos (reduce storage costs, improve page load)
- **PDFKit**: Generate tax receipt PDFs with donation details, QR codes, platform branding

---

## Summary of Resolved Technical Context

| Category | Decision |
|----------|----------|
| **Backend** | Node.js 20 LTS + TypeScript 5 + Express.js 4 |
| **Frontend** | Next.js 14 (React 18) + TypeScript 5 + Tailwind CSS 3 |
| **Database** | PostgreSQL 15+ (Prisma ORM) |
| **Storage** | AWS S3 or compatible (Cloudflare R2, Backblaze B2) |
| **Backend Testing** | Vitest + Supertest |
| **Frontend Testing** | Vitest + React Testing Library + Playwright |
| **Payments** | Stripe (cards, wallets, crypto) |
| **Marketplace** | Amazon Product Advertising API + Associates |
| **OAuth** | Passport.js (Google, Amazon, Facebook) |
| **File Handling** | Multer (upload) + Sharp (images) + PDFKit (PDFs) |

All NEEDS CLARIFICATION items from Technical Context have been resolved with justified decisions.

---

## Next Steps

1. Update `plan.md` Technical Context with resolved decisions
2. Proceed to Phase 1: Generate data-model.md
3. Proceed to Phase 1: Generate API contracts (OpenAPI spec)
4. Proceed to Phase 1: Generate quickstart.md
5. Update agent context with selected technologies
