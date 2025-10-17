# Developer Quickstart: Charitable Donation Matching Platform

**Date**: 2025-10-15
**Feature**: 001-lets-build-a
**Target Audience**: Developers implementing this feature
**Estimated Setup Time**: 30 minutes

---

## Prerequisites

- Node.js 20 LTS
- PostgreSQL 15+ (local or cloud)
- AWS account (or compatible S3 provider)
- Stripe account (test mode)
- Amazon Product Advertising API credentials

---

## Initial Setup

### 1. Clone and Install

```bash
# Clone repository
git clone <repo-url>
cd <repo-name>

# Checkout feature branch
git checkout 001-lets-build-a

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

#### Backend `.env`

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/charity_platform"

# JWT
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRATION="7d"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
AMAZON_CLIENT_ID="your-amazon-client-id"
AMAZON_CLIENT_SECRET="your-amazon-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Amazon Product Advertising API
AMAZON_ACCESS_KEY="your-access-key"
AMAZON_SECRET_KEY="your-secret-key"
AMAZON_PARTNER_TAG="your-affiliate-tag"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="charity-platform-uploads"
CLOUDFRONT_URL="https://d1234567890.cloudfront.net"

# App
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

#### Frontend `.env.local`

```bash
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 3. Database Setup

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (creates initial marketplace partners, causes)
npx prisma db seed
```

### 4. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev
# Runs on http://localhost:3001

# Terminal 2: Frontend
cd frontend
npm run dev
# Runs on http://localhost:3000
```

---

## Verification Checklist

After setup, verify:

- [ ] Backend API responds at `http://localhost:3001/api/v1/health`
- [ ] Frontend loads at `http://localhost:3000`
- [ ] Database connection works (check Prisma Studio: `npx prisma studio`)
- [ ] OAuth redirect URLs configured in provider dashboards
- [ ] Stripe webhook localhost forwarding (use Stripe CLI): `stripe listen --forward-to localhost:3001/api/v1/webhooks/stripe`
- [ ] S3 bucket created with CORS configured

---

## Development Workflow

### Running Tests

```bash
# Backend unit + integration tests
cd backend
npm test

# Backend contract tests
npm run test:contract

# Frontend component tests
cd frontend
npm test

# E2E tests (requires both servers running)
cd frontend
npm run test:e2e
```

### Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name add_new_field

# Reset database (caution: deletes all data)
npx prisma migrate reset

# View data in Prisma Studio
npx prisma studio
```

### Code Generation

```bash
# Generate TypeScript types from Prisma schema
npx prisma generate

# Generate OpenAPI spec from TypeScript types
npm run generate:openapi

# Generate frontend API client from OpenAPI spec
cd frontend
npm run generate:api-client
```

---

## User Story Implementation Order

Follow this sequence for TDD implementation:

1. **User Story 1 (P1)**: Donator Onboarding and First Donation
   - Start here - core MVP functionality
   - Write E2E test first (Playwright)
   - Implement backend API endpoints
   - Build frontend pages/components
   - Verify test passes

2. **User Story 2 (P2)**: Recipient Registration and Need Posting
   - Second priority - supply side
   - Follow same TDD cycle

3. **Continue P3-P7** in priority order

---

## Useful Commands

```bash
# Lint and format
npm run lint
npm run format

# Type check (TypeScript)
npm run type-check

# Build for production
npm run build

# Database commands
npx prisma studio           # Visual database browser
npx prisma db push          # Push schema changes without migration
npx prisma db pull          # Pull schema from existing database

# Stripe webhook testing
stripe listen --forward-to localhost:3001/api/v1/webhooks/stripe
stripe trigger payment_intent.succeeded

# Check API rate limits
curl http://localhost:3001/api/v1/marketplace/rate-limit
```

---

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running: `psql -U postgres`
- Check DATABASE_URL in `.env`
- Ensure database exists: `createdb charity_platform`

### OAuth Login Fails
- Verify redirect URIs in provider dashboards match `http://localhost:3001/api/v1/auth/oauth/{provider}/callback`
- Check client ID/secret in `.env`
- Enable localhost in provider settings

### File Upload Fails
- Verify S3 bucket permissions allow PutObject
- Check CORS configuration on bucket
- Ensure AWS credentials are valid

### Marketplace API Errors
- Verify Amazon Product Advertising API credentials
- Check daily rate limit (8,640 requests/day)
- Ensure partner tag (affiliate ID) is approved

---

## Next Steps

1. Review `data-model.md` for database schema
2. Review `contracts/api-overview.md` for API endpoints
3. Begin implementing User Story 1 (P1) following TDD workflow
4. Run `/sp.tasks` to generate detailed task breakdown
5. Implement tasks in priority order, marking complete as you go

---

## Support Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Stripe API**: https://stripe.com/docs/api
- **Amazon Product Advertising API**: https://webservices.amazon.com/paapi5/documentation/
- **Project Spec**: `specs/001-lets-build-a/spec.md`
- **Implementation Plan**: `specs/001-lets-build-a/plan.md`
